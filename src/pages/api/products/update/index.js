import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @description Handles updating a product in the database using PUT (full update).
 * @param {import('next').NextApiRequest} req - The API request object.
 * @param {import('next').NextApiResponse} res - The API response object.
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
    // Only allow PUT method for full updates
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Authenticate the user
    authenticate(req, res, async () => {
        let { account_id, sub_account_id } = req.user;
        let { product_id } = req.query
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
         * Validate request body - All fields must be provided for PUT
         */
        if (!name || !price || !quantity) {
            return res.status(400).json({ error: "All fields (name, price, quantity) are required" });
        }

        let connection;
        try {
            /**
             * Authorization - Ensure only managers and owners can update the products
             */
            if (sub_account_id) {
                if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only managers of sub-accounts can update products" });
                }
            }

            /**
             * Establish database connection
             */
            connection = await db.getConnection();

            /**
             * Check if the product exists in the database
             */
            const [product] = await connection.execute(
                "SELECT * FROM products WHERE product_id = ? AND account_id = ?",
                [product_id, account_id]
            );

            if (product.length === 0) {
                return res.status(404).json({ error: "product not found" });
            }

            /**
             * Ensure the product belongs to the authenticated user's account
             */
            if (product[0].account_id !== account_id) {
                return res.status(403).json({ error: "You are not authorized to update this product" });
            }

            /**
             * Validate individual fields
             */
            if (name.trim().length < 3) {
                return res.status(400).json({ error: "product name must be at least 3 characters long" });
            }

            // Validate price (must be greater than 0)
            if (!price || price < 0) {
                return res.status(400).json({ error: "Price must be greater than 0" });
            }

            // Validate quantity (must be at least 0)
            if (quantity === undefined || quantity < 0) {
                return res.status(400).json({ error: "Quantity must be 0 or greater" });
            }

            /**
             * Perform the full update using PUT
             */
            await connection.execute(
                `UPDATE products 
                 SET name = ?, price = ?, quantity = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE product_id = ? AND account_id = ?`,
                [name.trim(), price, quantity, supplier_id ? supplier_id : null, product_id, account_id]
            );

            // Return success response
            return res.status(200).json({ message: "product updated successfully" });
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
