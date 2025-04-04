import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @route PATCH /api/orders/updateStatus
 * @desc Update the status of an order (only to "completed" or "cancelled")
 * @access Private (Account/Sub-account holders only)
 *
 * @query {string} order_id - ID of the order
 * @query {string} account_id - ID of the account (optional if sub_account_id is provided)
 * @query {string} sub_account_id - ID of the sub-account (optional if account_id is provided)
 * @body {string} order_status - New status: must be "completed" or "cancelled"
 *
 * @returns {object} - Success message or error response
 */
export default async function handler(req, res) {
    if (req.method !== "PATCH") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        let { order_id, account_id, sub_account_id } = req.query;
        const { order_status } = req.body;

        // Validate input
        if (!order_id) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        if (!["completed", "cancelled"].includes(order_status)) {
            return res.status(400).json({ error: "Invalid order status. Only 'completed' or 'cancelled' allowed" });
        }

        let connection;

        try {
            // Authorization check
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only update your own orders" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only update your own orders" });
                }
                // Inferred from sub-account
                account_id = req.user.account_id;
            }

            connection = await db.getConnection();

            // Get existing order
            const [order] = await connection.execute(
                `SELECT order_status FROM Orders WHERE order_id = ? AND account_id = ?`,
                [order_id, account_id]
            );

            if (order.length === 0) {
                return res.status(404).json({ error: "Order not found" });
            }

            const currentStatus = order[0].order_status;

            // Prevent updates to final statuses
            if (["completed", "cancelled"].includes(currentStatus)) {
                return res.status(400).json({ error: `Cannot update an order that is already ${currentStatus}` });
            }

            // Prevent redundant updates
            if (currentStatus === order_status) {
                return res.status(400).json({ error: `Order is already marked as ${order_status}` });
            }

            // Begin transaction
            await connection.beginTransaction();

            // Perform update
            const [result] = await connection.execute(
                `UPDATE Orders SET order_status = ? WHERE order_id = ? AND account_id = ?`,
                [order_status, order_id, account_id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback(); // // No rows updated, rollback transaction
                return res.status(404).json({ error: "Order not found or update failed" });
            }

            // If the order is cancelled, update product quantities in inventory
            if (order_status === "cancelled") {
                // Get all order items for this order
                const [items] = await connection.execute(
                    `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
                    [order_id]
                );
            
                // Loop through each item and update its product quantity
                for (const item of items) {
                    await connection.execute(
                        `UPDATE products SET quantity = quantity + ? WHERE product_id = ?`,
                        [item.quantity, item.product_id]
                    );
                }
            }

            // Commit transaction
            await connection.commit();

            return res.status(200).json({ message: "Order status updated successfully" });

        } catch (error) {
            console.error("Error updating order status:", error);
            await connection.rollback(); // Rollback transaction in case of error
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            if (connection) connection.release();
        }
    });
}
