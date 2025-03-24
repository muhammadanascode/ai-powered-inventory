import db from "@/lib/db";
import jwt from "jsonwebtoken"; // Import JWT for authentication

export default async function handler(req, res) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { sub_account_id } = req.query;

        if (!sub_account_id) {
            return res.status(400).json({ message: "Missing sub_account_id" });
        }

        const connection = await db.getConnection();

        const [result] = await connection.execute(
            "SELECT account_id FROM sub_accounts WHERE sub_account_id = ?",
            [sub_account_id]
        );

        if (result.length === 0) {
            connection.release();
            return res.status(404).json({ message: "Sub-account not found" });
        }

        if (result[0].account_id !== decoded.account_id) {
            connection.release();
            return res.status(403).json({ message: "Forbidden: You cannot delete this sub-account" });
        }

        await connection.execute("DELETE FROM sub_accounts WHERE sub_account_id = ?", [sub_account_id]);
        connection.release();

        return res.status(200).json({ message: "Sub-account deleted successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
