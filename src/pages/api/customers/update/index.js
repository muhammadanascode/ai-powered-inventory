import db from "@/lib/db";
import authenticate from "@/middlewares/auth";

/**
 * @description Handles updating a customer in the database using PUT (full update).
 * @param {import('next').NextApiRequest} req - The API request object.
 * @param {import('next').NextApiResponse} res - The API response object.
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
    // Only allow PUT method for full updates
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Authenticate the user
    authenticate(req, res, async () => {
        let { account_id, sub_account_id } = req.user;
        let { customer_id } = req.query
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
         * Validate request body - All fields must be provided for PUT
         */
        if (!name || !email || !phone_number || !address) {
            return res.status(400).json({ error: "All fields (name, email, phone_number, address) are required" });
        }

        let connection;
        try {
            /**
             * Authorization - Ensure only managers and owners can update the customers
             */
            if (sub_account_id) {
                if (req.user.account_type !== "manager") {
                    return res.status(403).json({ error: "Only managers of sub-accounts can update customers" });
                }
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
                return res.status(404).json({ error: "Customer not found" });
            }

            /**
             * Ensure the customer belongs to the authenticated user's account
             */
            if (customer[0].account_id !== account_id) {
                return res.status(403).json({ error: "You are not authorized to update this customer" });
            }

            /**
             * Validate individual fields
             */
            if (name.trim().length < 3) {
                return res.status(400).json({ error: "Customer name must be at least 3 characters long" });
            }

            const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Invalid Email format" });
            }

            const phoneRegex = /^\+[1-9]\d{1,3}\d{6,14}$/;
            if (phone_number.length > 15 || !phoneRegex.test(phone_number)) {
                return res.status(400).json({ error: "Invalid phone number. Must start with a '+' and contain 8 to 15 digits." });
            }

            /**
             * Perform the full update using PUT
             */
            await connection.execute(
                `UPDATE customers 
                 SET name = ?, email = ?, phone_number = ?, address = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE customer_id = ? AND account_id = ?`,
                [name.trim(), email, phone_number, address, customer_id, account_id]
            );

            // Return success response
            return res.status(200).json({ message: "Customer updated successfully" });
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
