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
        let { account_id, sub_account_id, supplier_id } = req.query;

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
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view suppliers from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view suppliers from your own sub-account" });
                }
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can add new suppliers" })
                }
            }

            //assigning of in case it is null

            account_id = req.user.account_id;

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