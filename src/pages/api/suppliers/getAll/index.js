import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route GET /api/suppliers/getAll
 * @desc Get suppliers for an account or sub_account
 * @access Private (Only logged-in users can access)
 *
 * @param {string} account_id - The ID of the account (optional, sent in query params)
 * @param {string} sub_account_id - The ID of the sub_account (optional, sent in query params)
 * @returns {object} - List of suppliers
 */

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Ensure authentication middleware runs before executing main logic
    authenticate(req, res, async () => {
        const { account_id, sub_account_id } = req.user;

        // Validate that at least one ID is provided
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        try {

            let connection;

            try {
                connection = await db.getConnection();

                // Execute query
                const [suppliers] = await connection.execute("SELECT * FROM Suppliers WHERE account_id = ? ", [account_id]);

                return res.status(200).json({ suppliers });

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