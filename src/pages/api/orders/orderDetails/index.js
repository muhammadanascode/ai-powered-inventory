import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route GET /api/orders/getById
 * @desc Fetch detailed information about a specific order including customer info and ordered items
 * @access Private (Only authenticated users with proper authorization can access)
 *
 * @query {string} order_id - The ID of the order to fetch (required)
 * @query {string} account_id - The ID of the account (optional)
 * @query {string} sub_account_id - The ID of the sub-account (optional)
 *
 * @returns {object} JSON response containing:
 *  - orderDetails: object with total_price, order_status, customer_name, phone_number, and customer_id
 *  - orderItems: array of products with quantity, product_name, and product_price
 */
export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        let { order_id, account_id, sub_account_id } = req.query;

        // Validate presence of account or sub-account
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        // Validate presence of order_id
        if (!order_id) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        let connection;
        try {
            // Authorization: Ensure user can only view their own data
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view orders from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view orders from your own sub-account" });
                }
                account_id = req.user.account_id;
            }

            connection = await db.getConnection();

            /**
             * Fetch order details along with customer info
             */
            const orderQuery = `
                SELECT o.total_price, o.order_status, c.name AS customer_name, 
                       c.phone_number, c.customer_id
                FROM Orders o
                JOIN Customers c ON o.customer_id = c.customer_id
                WHERE o.order_id = ? AND o.account_id = ?
            `;
            const [orderDetails] = await connection.execute(orderQuery, [order_id, account_id]);

            if (orderDetails.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }

            /**
             * Fetch order items with product details
             */
            const orderItemsQuery = `
                SELECT p.name AS product_name , p.price As product_price, oi.quantity
                FROM order_items oi
                JOIN products p ON oi.product_id = p.product_id
                WHERE oi.order_id = ?
            `;
            const [orderItems] = await connection.execute(orderItemsQuery, [order_id]);

            return res.status(200).json({
                orderDetails: orderDetails[0],
                orderItems
            });

        } catch (error) {
            console.error("Error fetching order details:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            if (connection) connection.release();
        }
    });
}
