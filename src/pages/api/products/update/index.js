import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @description Handles updating a product in the database.
 * @param {import('next').NextApiRequest} req - The API request object.
 * @param {import('next').NextApiResponse} res - The API response object.
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    authenticate(req, res, async () => {
        let { account_id, sub_account_id, product_id } = req.query;
        const { name, price, quantity, supplier_id } = req.body;

        /**
         * Validate query parameters
         */
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
        }

        if (!product_id || isNaN(product_id)) {
            return res.status(400).json({ error: "Valid product_id is required" });
        }

        /**
         * Validate request body - At least one field must be updated
         */
        if (!name && !supplier_id && !price && !quantity) {
            return res.status(400).json({ error: "At least one of name, supplier_id, price, or quantity should be updated" });
        }

        let connection;
        try {
            /**
             * Authorization - Ensure user can only update their own products
             */
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only update products from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only update products from your own sub-account" });
                }
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can update products" });
                }
                account_id = req.user.account_id; // Assign account_id for sub-accounts
            }

            /**
             * Establish database connection
             */
            connection = await db.getConnection();

            /**
             * Check if the product exists in the database
             */
            const [product] = await connection.execute(
                "SELECT * FROM Products WHERE product_id = ? AND account_id = ?",
                [product_id, account_id]
            );

            if (product.length === 0) {
                return res.status(404).json({ error: "Product not found" });
            }

            /**
             * Validate product name length
             */
            if (name && name.trim().length < 3) {
                return res.status(400).json({ error: "Product name must be at least 3 characters long" });
            }

            //price validation
            if (price && (isNaN(price) || price < 0)) {
                return res.status(400).json({ error: "Price must be a valid number" });
            }

            //quantity validation
            if (quantity && (isNaN(quantity) || quantity < 0)) {
                return res.status(400).json({ error: "Quantity must be a valid number" });
            }

            //supplier_id validation
            if (supplier_id) {
                const [supplier] = await connection.execute("SELECT supplier_id FROM Suppliers WHERE supplier_id = ?", [supplier_id])
                if (supplier.length === 0) {
                    return res.status(404).json({ error: "Supplier not found" });
                }
            }

            /**
             * Construct dynamic update query
             */
            const updates = [];
            const params = [];

            if (name) {
                updates.push("name = ?");
                params.push(name.trim());
            }
            if (price) {
                updates.push("price = ?");
                params.push(price);
            }
            if (quantity) {
                updates.push("quantity = ?");
                params.push(quantity);
            }
            if (supplier_id) {
                updates.push("supplier_id = ?");
                params.push(supplier_id);
            }

            /**
             * Track last update time
             */
            updates.push("updated_at = CURRENT_TIMESTAMP");

            // Add product_id and account_id for WHERE clause
            params.push(product_id, account_id);

            /**
             * Execute the update query
             */
            const query = `UPDATE Products SET ${updates.join(", ")} WHERE product_id = ? AND account_id = ?`;
            const [result] = await connection.execute(query, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Failed to made changes" });
            }

            return res.status(200).json({ message: "Product updated successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            /**
             * Ensure the database connection is released
             */
            if (connection) {
                connection.release();
            }
        }
    });
}
