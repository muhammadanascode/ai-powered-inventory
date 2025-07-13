import db from "@/lib/db";
import authenticate from "@/middlewares/auth";
import { exec } from "child_process";
import path from "path";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        const { account_id } = req.user;

        if (!account_id) {
            return res.status(400).json({ error: "Account ID is required" });
        }

        try {
            const connection = await db.getConnection();
            const query = `SELECT product_id, name, quantity FROM products WHERE account_id=?`;
            const [products] = await connection.execute(query, [account_id]);

            if (products.length === 0) {
                return res.status(200).json({ error: "No predictions available" });
            }

            const forecastScriptPath = path.resolve(process.cwd(), "src/utils/forecast.py");

            const command = `python ${forecastScriptPath} ${account_id}`;

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).json({ error: stderr || "Error running Python script" });
                }

                try {
                    const predictions = JSON.parse(stdout);

                    //preparing data for frontend
                    const predictedData = products.map((product) => {
                        const prediction = predictions[product.product_id]?.[0]; // safely get first prediction

                        return {
                            product_id: product.product_id,
                            product_name: product.name,
                            quantity: product.quantity,
                            forecastedDate: prediction?.ds || null,
                            forecastedQuantity: Math.round(prediction?.yhat) || null,
                        };
                    });

                    return res.status(200).json({ predictedData });
                } catch (jsonErr) {
                    return res.status(500).json({ error: "Invalid JSON from Python script", details: stdout });
                }
            });

        } catch (error) {
            return res.status(500).json({ error: "Internal server error", details: error.message });
        }
    });
}
