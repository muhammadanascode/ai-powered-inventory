import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route GET /api/Products/getAll
 * @desc Get Products for an account or sub_account
 * @access Private (Only logged-in users can access)
 *
 * @param {string} account_id - The ID of the account (optional, sent in query params)
 * @param {string} sub_account_id - The ID of the sub_account (optional, sent in query params)
 * @returns {object} - List of Products
 */

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Ensure authentication middleware runs before executing main logic
    authenticate(req, res, async () => {
        let { account_id, sub_account_id } = req.user;

        // Validate that at least one ID is provided
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        let connection;
        try {

            // Get a database connection
            connection = await db.getConnection();

            // Build the query to fetch products
            const query = "SELECT * FROM Products WHERE account_id = ?";
            const params = [account_id];

            // Execute the query
            const [products] = await connection.execute(query, params);

            // Return the list of products
            return res.status(200).json({ products });

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Database error" });
        } finally {
            if (connection) connection.release();
        }
    });
}
