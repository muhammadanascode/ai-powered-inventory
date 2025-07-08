import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

export default async function handler(req, res) {
    authenticate(req, res, async () => {
        const { account_id, sub_account_id } = req.user;
        const { month, year } = req.body;

        if (!month || !year) {
            return res.status(400).json({ error: "Month and year are required" });
        }

        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        try {
            // 1. Get current month data
            const salesData = await db.query(
                `SELECT SUM(total_price) AS total_sales, COUNT(order_id) AS total_orders
                 FROM Orders
                 WHERE account_id = ? 
                 AND MONTH(created_at) = ?
                 AND YEAR(created_at) = ?`,
                [account_id, month, year]
            );

            const current = salesData[0][0] || { total_sales: 0, total_orders: 0 };

            // 2. Calculate previous month/year
            let prevMonth = month - 1;
            let prevYear = year;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear -= 1;
            }

            // 3. Get previous month data
            const prevSalesData = await db.query(
                `SELECT SUM(total_price) AS total_sales , COUNT(order_id) AS total_orders
                 FROM Orders
                 WHERE account_id = ?
                 AND MONTH(created_at) = ?
                 AND YEAR(created_at) = ?`,
                [account_id, prevMonth, prevYear]
            );


            const prev = prevSalesData[0][0] || { total_sales: 0 };

            // 4. Calculate change for sales %
            const currentSales = Number(current.total_sales) || 0;
            const prevSales = Number(prev.total_sales) || 0;

            let change_percent_sales = 0;
            let change_direction_sales = 'neutral';

            if (prevSales === 0 && currentSales > 0) {
                change_direction_sales = 'up';
                change_percent_sales = 100;
            } else if (prevSales > 0) {
                const diff = currentSales - prevSales;
                change_percent_sales = Math.abs((diff / prevSales) * 100).toFixed(2);
                change_direction_sales = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
            }

            // 5: Calculate change for orders
            const currentOrders = Number(current.total_orders) || 0;
            const prevOrders = Number(prev.total_orders) || 0;

            let change_percent_orders = 0;
            let change_direction_orders = 'neutral';

            if (prevOrders === 0 && currentOrders > 0) {
                change_direction_orders = 'up';
                change_percent_orders = 100;
            } else if (prevOrders > 0) {
                const diff = currentOrders - prevOrders;
                change_percent_orders = Math.abs((diff / prevOrders) * 100).toFixed(2);
                change_direction_orders = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
            }

            return res.status(200).json({
                total_sales: currentSales,
                total_orders: current.total_orders,
                change_percent_sales,
                change_direction_sales,
                change_percent_orders,
                change_direction_orders
            });

        } catch (error) {
            console.error("Error fetching sales data:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });
}
