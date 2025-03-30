import db from '@/lib/db';
import authenticate from '@/middlewares/auth';

/**
 * @route POST /api/customers/create
 * @desc Create a new customer
 * @access Private (Only authenticated users)
 *
 * @param {string} name - Customer name (required, min 3 characters)
 * @param {string} phone_number - Customer phone number (required, max 15 characters, must follow international format)
 * @param {number} account_id - Associated account ID (required)
 * @param {string} email - Email of a customer (optional, must be in a valid email format)
 * @param {string} address - address of a customer
 * @returns {object} - Success or error message
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    authenticate(req, res, async () => {
        const { name, phone_number, email, address } = req.body;
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
            return res.status(400).json({ error: "Invalid phone number. Must start with a '+' (optional) and contain 8 to 15 digits." });
        }

        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }

        //Email: optional, must be in a valid email format
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid Email format" });
        }

        let connection;
        try {

            // authorizing user
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view customers from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only view customers from your own sub-account" });
                }
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can add new customers" })
                }
                account_id = req.user.account_id; //assigning of in case it is null
            }

            connection = await db.getConnection();

            // Insert the customer
            const [result] = await connection.execute(
                "INSERT INTO customers (name, phone_number, email , address , account_id) VALUES (?, ?, ?, ?, ?)",
                [name.trim(), phone_number, email || null, address, account_id]
            );

            return res.status(201).json({ message: "customer created successfully", customer_id: result.insertId });

        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ error: "Internal server error" });
        } finally {
            if (connection) connection.release();
        }
    });
}