import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

/**
 * @route DELETE /api/customers/delete
 * @desc Delete a customer
 * @access Private (Only authenticated users)
 *
 * @param {number} customer_id - The ID of the customer to delete (required, sent in query params)
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
        let { customer_id } = req.query;

        // Validate account_id
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
        }

        // Validate customer_id
        if (!customer_id || isNaN(customer_id)) {
            return res.status(400).json({ error: "Valid customer_id is required" });
        }

        let connection;
        try {

            // authorizing user
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only delete customers from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only delete customers from your own sub-account" });
                }
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can delete customers" })
                }
                //assigning of in case it is null
                account_id = req.user.account_id;
            }

            connection = await db.getConnection();

            // Check if the customer exists
            const [customer] = await connection.execute(
                "SELECT * FROM customers WHERE customer_id = ? AND account_id = ?",
                [customer_id, account_id]
            );

            if (customer.length === 0) {
                return res.status(404).json({ error: "customer not found" });
            }

            // Delete the supplier
            await connection.execute(
                "DELETE FROM customers WHERE customer_id = ?",
                [customer_id]
            );

            return res.status(200).json({ message: "customer deleted successfully" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });
}