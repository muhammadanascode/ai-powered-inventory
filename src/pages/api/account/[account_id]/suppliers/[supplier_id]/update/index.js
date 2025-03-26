import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    authenticate(req, res, async () => {
        const { account_id, supplier_id } = req.query;
        const { name, phone_number } = req.body;

        // Validate query params
        if (!account_id || isNaN(account_id)) {
            return res.status(400).json({ error: "Valid account_id is required" });
        }

        if (!supplier_id || isNaN(supplier_id)) {
            return res.status(400).json({ error: "Valid supplier_id is required" })
        }

        // Validate request body
        if (!name && !phone_number) {
            return res.status(400).json({ error: "At least one of name or phone must be provided" });
        }

        let connection;
        try {
            // Check user authorization
            if (req.user.account_id !== Number(account_id)) {
                return res.status(403).json({ error: "Forbidden: You can only update suppliers from your own account" });
            }

            connection = await db.getConnection();

            // Check if supplier exists
            const [supplier] = await connection.execute(
                "SELECT * FROM Suppliers WHERE supplier_id = ? AND account_id = ?",
                [supplier_id, account_id]
            );

            if (supplier.length === 0) {
                return res.status(404).json({ error: "Supplier not found" });
            }

            //Validating name and phone number format

            if (name && name.trim().length < 3) {
                return res.status(400).json({ error: "name length can't be less than 3" })
            }

            /**
         * phone number regex validation
         * Ensures 8 to 17 character length
         *  No spaces, dashes, or special characters
         * Valid international format
         * must start with a '+' sign
           */

            const phoneRegex = /^\+[1-9]\d{1,3}\d{6,14}$/;
            if (phone_number && (phone_number.length > 15 || !phoneRegex.test(phone_number))) {
                return res.status(400).json({ error: "Invalid phone number format" });
            }

            // Construct update query dynamically
            const updates = [];
            const params = [];
            if (name) {
                updates.push("name = ?");
                params.push(name);
            }
            if (phone_number) {
                updates.push("phone = ?");
                params.push(phone_number);
            }
            params.push(supplier_id); // For WHERE clause

            const query = `UPDATE Suppliers SET ${updates.join(", ")} WHERE supplier_id = ?`;
            await connection.execute(query, params);

            return res.status(200).json({ message: "Supplier updated successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    });
}
