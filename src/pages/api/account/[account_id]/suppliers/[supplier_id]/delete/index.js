import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

/**
 * @route DELETE /api/account/[account_id]/suppliers/[supplier_id]/Delete
 * @desc Delete a supplier
 * @access Private (Only authenticated users)
 */

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        const { account_id, supplier_id } = req.query;

        // Validate account_id
        if (!account_id || isNaN(account_id)) {
            return res.status(400).json({ error: "Valid account_id is required" });
        }

        // Validate supplier_id
        if (!supplier_id || isNaN(supplier_id)) {
            return res.status(400).json({ error: "Valid supplier_id is required" });
        }

        let connection;
        try {

            // Check if the user is authorized to delete the supplier
            if (req.user.account_id !== Number(account_id)) {
                return res.status(403).json({ error: "Forbidden: You can only delete suppliers from your own account" });
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