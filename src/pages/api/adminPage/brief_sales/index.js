import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

export default async function handler(req, res) {
    authenticate(req, res, async () => {
        const { account_id, sub_account_id } = req.user;

        // Validate account and sub-account IDs
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        //fetch Last 5 months of sales data
        try{
            const salesData = await db.query(
                `SELECT MONTH(created_at) AS month, YEAR(created_at) AS year, 
                        SUM(total_price) AS total_sales, COUNT(order_id) AS total_orders
                 FROM Orders
                 WHERE account_id = ? 
                 GROUP BY YEAR(created_at), MONTH(created_at)
                 ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC
                 LIMIT 5`,
                [account_id]
            );

            const sales = salesData[0] || [];
            const formattedSales = sales.map(sale => ({
                month: sale.month,
                year: sale.year,
                total_sales: sale.total_sales || 0,
                total_orders: sale.total_orders || 0
            }));

            console.log(formattedSales);
            
            // return the last 5 months of sales data
            return res.status(200).json(formattedSales);  

        }catch(error){
            console.error("Error fetching sales data:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }

    });
}