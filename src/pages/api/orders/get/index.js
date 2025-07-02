import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route GET /api/orders/:id
 * @desc Get details for a specific order
 * @access Private (Only logged-in users can access)
 *
 * @param {string} id - The order ID (from the URL param)
 * @returns {object} - Full order details including customer and products
 */

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Run auth middleware
    authenticate(req, res, async () => {
        const { id } = req.query;
        const { account_id, sub_account_id } = req.user;

        if (!sub_account_id && !account_id) {
            return res.status(400).json({ error: "Missing account or sub account id" });
        }

        if(!id){
            return res.status(400).json({ error: "Order ID is required" });
        }

        let connection;
        try {
            connection = await db.getConnection();

            // Fetch order + customer
            const [orderRows] = await connection.execute(
                `SELECT o.order_id, o.total_price, o.order_status, o.created_at,
                c.customer_id,c.email,c.name AS customer_name, c.phone_number , c.address
         FROM Orders o
         JOIN Customers c ON o.customer_id = c.customer_id
         WHERE o.order_id = ? AND o.account_id = ?`,
                [id, account_id]
            );

            if (orderRows.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }

            const order = orderRows[0];

            // Fetch order items
            const [items] = await connection.execute(
                `SELECT oi.product_id, p.name AS product_name, oi.quantity, oi.price
         FROM Order_items oi
         JOIN Products p ON oi.product_id = p.product_id
         WHERE oi.order_id = ?`,
                [id]
            );

            return res.status(200).json({
                order: {
                    ...order,
                    products: items
                }
            });

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Database error" });
        } finally {
            if (connection) connection.release();
        }
    });
}
