import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route GET /api/orders/getAll
 * @desc Get orders for an account or sub_account
 * @access Private (Only logged-in users can access)
 *
 * @param {string} account_id - The ID of the account (optional, sent in query params)
 * @param {string} sub_account_id - The ID of the sub_account (optional, sent in query params)
 * @returns {object} - List of orders
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

            // Build the query to fetch orders
            let query = `SELECT o.order_id, o.total_price, o.order_status, o.created_at,
             c.name AS customer_name, c.phone_number, c.customer_id
             FROM Orders o JOIN Customers c ON o.customer_id = c.customer_id
             WHERE o.account_id = ?
             ORDER BY o.created_at DESC
             `;

            const params = [account_id];

            // Execute the query
            const [orders] = await connection.execute(query, params);

            // Return the list of orders
            return res.status(200).json({ orders });

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Database error" });
        } finally {
            if (connection) connection.release();
        }
    });
}
