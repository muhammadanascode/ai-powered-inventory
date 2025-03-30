import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @description Handles updating a customer in the database.
 * @param {import('next').NextApiRequest} req - The API request object.
 * @param {import('next').NextApiResponse} res - The API response object.
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    authenticate(req, res, async () => {
        let { account_id, sub_account_id, customer_id } = req.query;
        const { name, email, phone_number, address } = req.body;

        /**
         * Validate query parameters
         */
        if (!account_id && !sub_account_id) {
            return res.status(400).json({ error: "Account id or sub account id is required" });
        }

        if (!customer_id || isNaN(customer_id)) {
            return res.status(400).json({ error: "Valid customer_id is required" });
        }

        /**
         * Validate request body - At least one field must be updated
         */
        if (!name && !email && !phone_number && !address) {
            return res.status(400).json({ error: "At least one of name, email, phone_number, or address should be updated" });
        }

        let connection;
        try {
            /**
             * Authorization - Ensure user can only update their own customers
             */
            if (account_id) {
                if (req.user.account_id !== Number(account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only update customers from your own account" });
                }
            } else {
                if (req.user.sub_account_id !== Number(sub_account_id)) {
                    return res.status(403).json({ error: "Forbidden: You can only update customers from your own sub-account" });
                }
                else if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only owner and manager can update customers" });
                }
                account_id = req.user.account_id; // Assign account_id for sub-accounts
            }

            /**
             * Establish database connection
             */
            connection = await db.getConnection();

            /**
             * Check if the customer exists in the database
             */
            const [customer] = await connection.execute(
                "SELECT * FROM customers WHERE customer_id = ? AND account_id = ?",
                [customer_id, account_id]
            );

            if (customer.length === 0) {
                return res.status(404).json({ error: "customer not found" });
            }

            //validate name
            if (name && name.trim().length < 3) {
                return res.status(400).json({ error: "customer name must be at least 3 characters long" });
            }

            //email validation
            const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            if (email && !emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid Email format" });
            }

            //phone_number validation
            const phoneRegex = /^\+[1-9]\d{1,3}\d{6,14}$/;
            if(phone_number && (phone_number.length > 15 || !phoneRegex.test(phone_number))) {
                return res.status(400).json({ error: "Invalid phone number. Must start with a '+' (optional) and contain 8 to 15 digits." });
            }


            /**
             * Construct dynamic update query
             */
            const updates = [];
            const params = [];

            if (name) {
                updates.push("name = ?");
                params.push(name.trim());
            }
            if (email) {
                updates.push("email = ?");
                params.push(email);
            }
            if (phone_number) {
                updates.push("phone_number = ?");
                params.push(phone_number);
            }
            if (address) {
                updates.push("address = ?");
                params.push(address);
            }

            /**
             * Track last update time
             */
            updates.push("updated_at = CURRENT_TIMESTAMP");

            // Add customer_id and account_id for WHERE clause
            params.push(customer_id, account_id);

            /**
             * Execute the update query
             */
            const query = `UPDATE customers SET ${updates.join(", ")} WHERE customer_id = ? AND account_id = ?`;
            await connection.execute(query, params);

            return res.status(200).json({ message: "customer updated successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        } finally {
            /**
             * Ensure the database connection is released
             */
            if (connection) {
                connection.release();
            }
        }
    });
}
