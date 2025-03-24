import db from '@/lib/db';

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { account_id } = req.query;

    if (!account_id) {
        return res.status(400).json({ error: "Account ID is null" });
    }

    try {
        const connection = await db.getConnection();

        const [result] = await connection.execute(
            "SELECT * FROM Sub_Accounts WHERE account_id = ?",
            [account_id]
        );

        connection.release();
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}