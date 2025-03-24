import db from '@/lib/db';

/**
 * @route GET /api/account/:[account_id]
 * @desc Fetch user details by account ID
 * @access Public (Requires account_id in params)
 *
 * @param {number} id - The user's account ID
 * @returns {object} - User details (excluding password)
 */

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { account_id } = req.query;

    // Ensure id is provided and is a valid number
    if (!account_id  || isNaN(account_id )) {
        return res.status(400).json({ error: "Valid Account ID is required" });
    }

    try {
        const connection = await db.getConnection();

        // Fetch user details (excluding password)
        const [rows] = await connection.execute(
            "SELECT account_id, name, email FROM Account WHERE account_id = ?",
            [account_id ]
        );

         connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        }

        return res.status(200).json({ user: rows[0] });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Database error" });
    }
}
