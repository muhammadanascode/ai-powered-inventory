import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route GET /api/customer/getAll
 * @desc Get customers for an account or sub_account
 * @access Private (Only logged-in users can access)
 *
 * @param {string} account_id - The ID of the account (optional, sent in query params)
 * @param {string} sub_account_id - The ID of the sub_account (optional, sent in query params)
 * @returns {object} - List of customers
 */

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    //  Disable caching
    res.setHeader("Cache-Control", "no-store");

    // Ensure authentication middleware runs before executing main logic
    authenticate(req, res, async () => {
        let { account_id, sub_account_id } = req.user;

        // Validate that at least one ID is provided
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        try {

            let connection;

            // authorizing user
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view customers from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view customers from your own sub-account" });
                }
                account_id = Number(req.user.account_id); //assigning the account_id if sub_account_id is provided
            }

            try {
                connection = await db.getConnection();

                // Execute query 
                const [customers] = await connection.execute("SELECT * FROM customers WHERE account_id = ? ", [account_id]);

                return res.status(200).json({ customers });

            } catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Database error" });
            } finally {
                if (connection) connection.release();
            }

        } catch (error) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    });
}