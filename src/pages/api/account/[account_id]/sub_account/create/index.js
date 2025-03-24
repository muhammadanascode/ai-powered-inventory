import db from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * @route POST /api/account/[account_id]/sub_account/create
 * @desc Create a new sub-account under a root account
 * @access Private (Requires authentication)
 * 
 * @param {string} account_id - The root account ID (sent in query params)
 * @param {string} name - Sub-account user's name (required)
 * @param {string} email - Sub-account email (required, must be unique)
 * @param {string} role - Role of the sub-account ('manager' or 'salesman') (required)
 * @param {string} password - Sub-account password (required, min 8 characters)
 * @returns {object} - Success message or error response
 */

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Extract the root account ID from URL query parameters
    const { account_id } = req.query; 
    // Extract required fields from request body
    const { name, email, role, password } = req.body;

    // Validate that account_id is provided
    if (!account_id) {
        return res.status(400).json({ error: "Account ID is null" });
    }

    // Ensure all required fields are provided
    if (!name || !email || !role || !password) {
        return res.status(400).json({ error: "Please fill all the required fields" });
    }

    // Validate role: Only 'manager' or 'salesman' allowed
    if (!["manager", "salesman"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'manager' or 'salesman'." });
    }

    // Validate password length
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    try {
        // Hash the password for security before storing it in the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get a connection from the database pool
        const connection = await db.getConnection();

        // Insert the new sub-account into the database
        const [result] = await connection.execute(
            "INSERT INTO Sub_Accounts (account_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
            [account_id, name, email, hashedPassword, role]
        );

        // Release the database connection
        connection.release();

        // Return success response with the inserted sub-account ID
        return res.status(201).json({ message: "Sub-account created successfully", sub_account_id: result.insertId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Database error" });
    }
}
