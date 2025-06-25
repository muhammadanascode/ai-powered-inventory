import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

/**
 * @route DELETE /api/products/delete
 * @desc Delete a Product
 * @access Private (Only authenticated users)
 *
 * @param {number} product_id - The ID of the product to delete (required, sent in query params)
 * @param {number} account_id - The ID of the account (optional, sent in query params)
 * @param {number} sub_account_id - The ID of the sub-account (optional, sent in query params)
 * @returns {object} - Success message or error response
 */

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        let { account_id, sub_account_id } = req.user;
        const { product_id } = req.query;

        // Validate account_id
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
        }

        // Validate product_id
        if (!product_id || isNaN(product_id)) {
            return res.status(400).json({ error: "Valid product_id is required" });
        }

        let connection;
        try {

            // authorizing user
            if (sub_account_id) {
                if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can delete products" })
                }
            }

            connection = await db.getConnection();

            // Check if the supplier exists
            const [product] = await connection.execute(
                "SELECT * FROM Products WHERE product_id = ? AND account_id = ?",
                [product_id, account_id]
            );

            if (product.length === 0) {
                return res.status(404).json({ error: "Product not found" });
            }

            // Delete the supplier
            await connection.execute(
                "DELETE FROM Products WHERE product_id = ?",
                [product_id]
            );

            return res.status(200).json({ message: "Product deleted successfully" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });
}