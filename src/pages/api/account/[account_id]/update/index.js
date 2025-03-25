import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authenticate from '@/middlewares/auth';

/**
 * @route PATCH /api/account/[account_id]/update
 * @desc Update user details (name or password)
 * @access Public (Can be restricted later)
 * 
 * @param {string} account_id - The ID of the user (required, sent in query params)
 * @param {string} [name] - The new name (optional, must be at least 8 characters and start with a letter)
 * @param {string} [newPassword] - The new password (optional, must be at least 8 characters)
 * @param {string} oldPassword - The old password (required if changing password)
 * @returns {object} - Success or error message
 */

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    //added middleware function check if the user is logged in then proceede
    authenticate(req, res , async () => {

    const { name, newPassword, oldPassword } = req.body;
    const { account_id } = req.query;

    // Checking if account_id is provided
    if (!account_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {

        // Check if the logged-in user is updating their own account
        if (req.user.account_id !== Number(account_id)) {
            return res.status(403).json({ error: "Forbidden: You can only update your own account" });
        }

        // Ensure at least one field is provided for update
        if (!name && !newPassword) {
            return res.status(400).json({ error: "Provide at least one field to update (name or password)" });
        }
    }
    catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }

    let connection;
    try {
        // Get database connection
        connection = await db.getConnection();

        // Validate name if provided
        if (name) {
            const nameRegex = /^[A-Za-z][A-Za-z0-9 ]{7,}$/; // Starts with a letter, min 8 chars
            if (!nameRegex.test(name)) {
                return res.status(400).json({ error: "Name must be at least 8 characters and start with a letter" });
            }
        }

        let hashedPassword = null;
        if (newPassword) {
            // Ensure old password is provided for verification
            if (!oldPassword) {
                return res.status(400).json({ error: "Old password is required to update the password" });
            }

            // Fetch current password from database
            const [resultAccount] = await connection.execute(
                "SELECT password FROM Account WHERE account_id = ?",
                [account_id]
            );

            if (resultAccount.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const account = resultAccount[0];

            // Compare old password with the stored hash
            const isMatch = await bcrypt.compare(oldPassword, account.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Old password is incorrect" });
            }

            // Validate new password length
            if (newPassword.length < 8) {
                return res.status(400).json({ error: "New password must be at least 8 characters" });
            }

            // Hash the new password
            hashedPassword = await bcrypt.hash(newPassword, 10);
        }

        // Prepare the update query dynamically
        let updateQuery = "UPDATE Account SET ";
        const updateValues = [];

        // If name is being updated
        if (name) {
            updateQuery += "name = ?, ";
            updateValues.push(name);
        }
        // If password is being updated
        if (hashedPassword) {
            updateQuery += "password = ?, ";
            updateValues.push(hashedPassword);
        }

        // Remove the trailing comma and add the WHERE clause
        updateQuery = updateQuery.slice(0, -2) + " WHERE account_id = ?";
        updateValues.push(account_id);

        // Execute update query
        const [result] = await connection.execute(updateQuery, updateValues);

        // If no rows were affected, return a message
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No changes made" });
        }

        return res.status(200).json({ message: "Account updated successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Database error" });
    }
    // Close the database connection in the finally block
    finally {
        if (connection) connection.release();
    }

});

}
