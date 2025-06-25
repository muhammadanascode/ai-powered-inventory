import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route POST /api/Products/create
 * @desc Add a new product to the database
 * @access Private (Only account owners and managers can add products)
 *
 * @param {string} name - The name of the product (must be at least 3 characters long)
 * @param {number} price - The price of the product (must be greater than 0)
 * @param {number} quantity - The available quantity of the product (must be 0 or greater)
 * @param {number} [supplier_id] - The optional ID of the supplier
 * @param {string} account_id - The ID of the account (optional, sent in query params)
 * @param {string} sub_account_id - The ID of the sub-account (optional, sent in query params)
 * 
 * @returns {object} - A success message and the ID of the newly created product
 */

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Authenticate the user
    authenticate(req, res, async () => { 
        // Extract data from request body and query parameters
        const { name, price, quantity, supplier_id } = req.body;
        let { account_id, sub_account_id } = req.user;

        // Ensure either account_id or sub_account_id is provided
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        // Validate product name
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ error: "Name must be at least 3 characters" });
        }

        // Validate price (must be greater than 0)
        if (!price || price < 0) {
            return res.status(400).json({ error: "Price must be greater than 0" });
        }

        // Validate quantity (must be at least 0)
        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: "Quantity must be 0 or greater" });
        }

        let connection;
        try {
            // Authorization check: Ensure the user is allowed to add products
            if (sub_account_id) {
                 // Only account owners and managers can add products
                 if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can add new products" });
                }
            } 
            // Get a database connection
            connection = await db.getConnection();

            // If supplier_id is provided, check if it exists in the Suppliers table
            if (supplier_id) {
                const [supplierCheck] = await connection.execute(
                    "SELECT supplier_id FROM Suppliers WHERE supplier_id = ?",
                    [supplier_id]
                );

                // If supplier_id does not exist, return an error
                if (supplierCheck.length === 0) {
                    return res.status(404).json({ error: "Supplier not found" });
                }
            }

            // Insert the product into the Products table
            const [product] = await connection.execute(
                "INSERT INTO Products (name, price, quantity, supplier_id, account_id) VALUES (?, ?, ?, ?, ?)",
                [name.trim(), price, quantity, supplier_id || null, account_id]
            );

            // If no rows were affected, insertion failed
            if (product.affectedRows === 0) {
                return res.status(500).json({ error: "Failed to create product" });
            }

            // Successfully created the product
            return res.status(201).json({ message: "Product created successfully", product_id: product.insertId });

        } catch (error) {
            // Log database errors for debugging
            console.error("Database error:", error);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            // Release the database connection
            if (connection) connection.release();
        }
    });
}
