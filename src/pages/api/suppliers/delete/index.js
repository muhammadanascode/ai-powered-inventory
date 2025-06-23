import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

/**
 * @route DELETE /api/suppliers/delete
 * @desc Delete a supplier
 * @access Private (Only authenticated users)
 */

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        const { account_id, sub_account_id, } = req.user;
        const { supplier_id } = req.query

        // Validate account_id
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
        }

        // Validate supplier_id
        if (!supplier_id || isNaN(supplier_id)) {
            return res.status(400).json({ error: "Valid supplier_id is required" });
        }

        let connection;
        try {

            // authorizing user
            if (sub_account_id) {
                if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can delete suppliers" })
                }
            }

            connection = await db.getConnection();

            // Check if the supplier exists
            const [supplier] = await connection.execute(
                "SELECT * FROM Suppliers WHERE supplier_id = ? AND account_id = ?",
                [supplier_id, account_id]
            );

            if (supplier.length === 0) {
                return res.status(404).json({ error: "Supplier not found" });
            }

            // Delete the supplier
            await connection.execute(
                "DELETE FROM Suppliers WHERE supplier_id = ?",
                [supplier_id]
            );

            return res.status(200).json({ message: "Supplier deleted successfully" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });
}