import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

/**
 * @route POST /api/account/[account_id]/suppliers/create
 * @desc Create a new supplier
 * @access Private (Only authenticated users)
 *
 * @param {string} name - Supplier name (required, min 3 characters)
 * @param {string} phone_number - Supplier phone number (required, max 15 characters, must follow international format)
 * @param {number} account_id - Associated account ID (required)
 * @returns {object} - Success or error message
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        const { name, phone_number } = req.body;
        let { account_id, sub_account_id } = req.query;

        // Validate account_id
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
        }

        // Validate request body
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ error: "Name must be at least 3 characters" });
        }

        /**
         * phone number regex validation
         * Ensures 8 to 17 character length
         *  No spaces, dashes, or special characters
         * Valid international format
         * must start with a '+' sign
           */

        const phoneRegex = /^\+[1-9]\d{1,3}\d{6,14}$/;
        if (!phone_number || phone_number.length > 15 || !phoneRegex.test(phone_number)) {
            return res.status(400).json({ error: "Invalid phone number format" });
        }

        let connection;
        try {

            // authorizing user
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view suppliers from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view suppliers from your own sub-account" });
                }
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can add new suppliers" })
                }
            }

            //assigning of in case it is null

            account_id = req.user.account_id;

            connection = await db.getConnection();

            // Insert the supplier
            const [result] = await connection.execute(
                "INSERT INTO Suppliers (name, phone_number, account_id) VALUES (?, ?, ?)",
                [name.trim(), phone_number, account_id]
            );

            return res.status(201).json({ message: "Supplier created successfully", supplier_id: result.insertId });

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    });
}