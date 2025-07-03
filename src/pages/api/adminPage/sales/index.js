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

        // Validate month and year
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const monthIndex = monthNames.indexOf(month);
        if (monthIndex === -1) {
            return res.status(400).json({ error: "Invalid month name" });
        }
        const monthNumber = monthIndex + 1;

        try {

            const salesData = await db.query(
                `SELECT SUM(total_price) AS total_sales, COUNT(order_id) AS total_orders
         FROM Orders
         WHERE account_id = ? 
         AND MONTH(created_at) = ?
         AND YEAR(created_at) = ?`,
                [account_id, monthNumber, year]
            );

            const result = salesData[0] || { total_sales: 0, total_orders: 0 };
            console.log(result);


            return res.status(200).json({
                total_sales: Number(result[0].total_sales),   // convert string to number
                total_orders: result[0].total_orders,
            });


        } catch (error) {
            console.error("Error fetching sales data:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });
}
