import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

export default async function handler(req, res) {
    authenticate(req, res, async () => {
        const { account_id, sub_account_id } = req.user;

        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account ID or Sub Account ID is required" });
        }

        try {

            // Get account creation date
            const dateData = await db.query(
                `SELECT created_at FROM Account WHERE account_id = ?`,
                [account_id]
            );

            if (!dateData || dateData.length === 0) {
                return res.status(404).json({ error: "Account not found" });
            }
            
            const createdAt = new Date(dateData[0][0].created_at);
            const now = new Date();

            // Generate list of months/years from createdAt to now
            const monthsYears = [];

            // Initialize current month/year to createdAt month/year
            let currentYear = createdAt.getFullYear();
            let currentMonth = createdAt.getMonth() + 1; // getMonth() is 0-based

            const nowYear = now.getFullYear();
            const nowMonth = now.getMonth() + 1;

            // Loop through months until we reach the current month/year
            while (currentYear < nowYear || (currentYear === nowYear && currentMonth <= nowMonth)) {
                monthsYears.push({ year: currentYear, month: currentMonth });

                // Increment month and roll over year if needed
                currentMonth++;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                }
            }

            return res.status(200).json(monthsYears);
        } catch (error) {
            console.error("Error fetching date data:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    });
}
