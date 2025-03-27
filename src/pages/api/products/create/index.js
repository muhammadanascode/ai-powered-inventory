import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Authenticate the user
    authenticate(req, res, async () => { 
        // Extract data from request body and query parameters
        const { name, price, quantity, supplier_id } = req.body;
        let { account_id, sub_account_id } = req.query;

        // Ensure either account_id or sub_account_id is provided
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
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
            if (account_id) {
                // If an account ID is provided, it must match the logged-in user's account
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only add products to your own account" });
                }
            } else {
                // If a sub-account ID is provided, it must match the logged-in user's sub-account
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only add products to your own sub-account" });
                }
                // Only account owners and managers can add products
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can add new products" });
                }
                // Assign the account_id from the authenticated user
                account_id = req.user.account_id;
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
