import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * Handles the creation of an order. The function validates inputs, checks account 
 * and product details, processes the order, and updates the database.
 * 
 * @param {Object} req - The request object containing the HTTP request data.
 * @param {Object} res - The response object to send back the HTTP response.
 * 
 * @returns {void} Returns JSON responses based on success or failure of the process.it status
 */
export default async function handler(req, res) {
    // Only allow POST method for this route, otherwise return 405 Method Not Allowed
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Authenticate the user
    authenticate(req, res, async () => {
        const { products } = req.body;  // Extract products from request body
        let { account_id, sub_account_id, customer_id } = req.query;  // Extract query params

        // Validate that either account_id or sub_account_id is provided
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        // Validate that customer_id is provided
        if (!customer_id) {
            return res.status(400).json({ error: "Customer ID is required" });
        }

        let connection;
        try {
            // Validate if the account_id or sub_account_id matches the logged-in user
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden" });
                }
                account_id = req.user.account_id; // Set account_id from user info if sub_account_id is used
            }

            // Establish a database connection
            connection = await db.getConnection();
            await connection.beginTransaction();  // Start a database transaction

            // Check if the customer exists in the database
            const [customer] = await connection.query("SELECT * FROM Customers WHERE customer_id = ? AND account_id = ? FOR UPDATE", [customer_id, account_id]);
            if (customer.length === 0) {
                if (connection) await connection.rollback();
                return res.status(404).json({ error: "Customer not found" });
            }


            // Ensure products are provided in the request
            if (!products || products.length === 0) {
                if (connection) await connection.rollback();
                return res.status(400).json({ error: "Products are required" });
            }

            // Validate product information (product_id, quantity, price)
            for (const product of products) {
                if (!product.product_id || !product.quantity || !product.price) {
                    if (connection) await connection.rollback();
                    return res.status(400).json({ error: "Product ID, quantity, and price are required" });
                }
                if (product.quantity <= 0 || product.price <= 0) {
                    if (connection) await connection.rollback();
                    return res.status(400).json({ error: "Invalid quantity or price" });
                }
            }


            // Fetch product details to verify the products exist in the inventory
            const productIds = products.map(p => p.product_id);
            const [existingProducts] = await connection.query("SELECT * FROM Products WHERE product_id IN (?) AND account_id = ? FOR UPDATE", [productIds, account_id]);
            const existingProductIds = existingProducts.map(p => p.product_id);
            const missingProductIds = productIds.filter(id => !existingProductIds.includes(id));

            // If any products are missing, return an error
            if (missingProductIds.length > 0) {
                if (connection) await connection.rollback();
                return res.status(404).json({ error: `Products not found: ${missingProductIds.join(", ")}` });
            }

            // Check if there is sufficient quantity for each product
            for (const product of products) {
                const existingProduct = existingProducts.find(p => p.product_id === product.product_id);
                if (existingProduct.quantity < product.quantity) {
                    if (connection) await connection.rollback();
                    return res.status(400).json({ error: `Insufficient quantity for product ID ${product.product_id}` });
                }
            }

            // Calculate the total price of the order
            const totalPrice = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

            // Insert a new order into the Orders table
            const [order] = await connection.query("INSERT INTO Orders (account_id, customer_id, total_price) VALUES (?, ?, ?)", [account_id, customer_id, totalPrice]);
            if (order.affectedRows === 0) {
                if (connection) await connection.rollback();
                return res.status(500).json({ error: "Failed to create order" });
            }

            // Insert the order items into the Order_Items table
            const orderItemsQuery = `
                INSERT INTO Order_Items (order_id, product_id, quantity, price)
                VALUES ${products.map(() => "(?, ?, ?, ?)").join(", ")}`;
            const orderItemsValues = products.flatMap(({ product_id, quantity, price }) => [order.insertId, product_id, quantity, price]);
            await connection.query(orderItemsQuery, orderItemsValues);

            // Update the quantity of products in the Products table
            let updateQuery = "UPDATE Products SET quantity = CASE ";
            const updateValues = [];
            for (const product of products) {
                updateQuery += `WHEN product_id = ? THEN quantity - ? `;
                updateValues.push(product.product_id, product.quantity);
            }
            updateQuery += "ELSE quantity END WHERE product_id IN (?) AND account_id = ?";
            updateValues.push(productIds, account_id);
            await connection.query(updateQuery, updateValues);

            // Commit the transaction if all queries succeed
            await connection.commit();

            // Delay the response by 3 seconds using setTimeout
            await new Promise(resolve => setTimeout(resolve, 3000));
            // Return success response with the created order's ID
            return res.status(201).json({ message: "Order created successfully", order_id: order.insertId });

        } catch (err) {
            // Rollback the transaction in case of an error
            if (connection) await connection.rollback();
            console.error("Error in creating order", err);
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            // Release the database connection
            if (connection) connection.release();
        }
    });
}
