import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * @route PATCH /api/account/[account_id]/update
 * @desc Update user details (name or password)
 * @access Private (Only logged-in users can update their own sub_account)
 * 
 * @param {string} sub_account_id - The ID of the user (required, sent in query params)
 * @param {string} [name] - The new name (optional, must be at least 8 characters and start with a letter)
 * @param {string} [newPassword] - The new password (optional, must be at least 8 characters)
 * @param {string} oldPassword - The old password (required if changing password)
 * @returns {object} - Success or error message
 */

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { sub_account_id } = req.query;
    // Check sub_account_id is provided
    if (!sub_account_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Token is missing" });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const loggedInSubAccountId = decoded.sub_account_id;

        const { name, newPassword, oldPassword } = req.body;
        
        // Check if user is updating their own sub_account_id
        if (loggedInSubAccountId !== Number(sub_account_id)) {
            return res.status(403).json({ error: "Forbidden: You can only update your own account" });
        }

        // Ensure at least one field is being updated
        if (!name && !newPassword) {
            return res.status(400).json({ error: "Provide at least one field to update (name or password)" });
        }

        let connection;
        try {
            connection = await db.getConnection();

            // Validate name (if provided)
            if (name) {
                const nameRegex = /^[A-Za-z][A-Za-z0-9 ]{7,}$/; // Starts with a letter, min 8 chars
                if (!nameRegex.test(name)) {
                    return res.status(400).json({ error: "Name must be at least 8 characters and start with a letter" });
                }
            }

            let hashedPassword = null;
            if (newPassword) {
                if (!oldPassword) {
                    return res.status(400).json({ error: "Old password is required to update the password" });
                }

                // Fetch current password from database
                const [resultAccount] = await connection.execute(
                    "SELECT password FROM Sub_Accounts WHERE sub_account_id = ?",
                    [sub_account_id]
                );

                if (resultAccount.length === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                const sub_account = resultAccount[0];

                // Compare old password
                const isMatch = await bcrypt.compare(oldPassword, sub_account.password);
                if (!isMatch) {
                    return res.status(400).json({ error: "Old password is incorrect" });
                }

                // Validate new password
                if (newPassword.length < 8) {
                    return res.status(400).json({ error: "New password must be at least 8 characters" });
                }

                hashedPassword = await bcrypt.hash(newPassword, 10);
            }

            // Prepare the update query dynamically
            let updateQuery = "UPDATE Sub_Accounts SET ";
            const updateValues = [];

            // If updating name
            if (name) {
                updateQuery += "name = ?, ";
                updateValues.push(name);
            }
            // If updating password
            if (hashedPassword) {
                updateQuery += "password = ?, ";
                updateValues.push(hashedPassword);
            }

            // Remove the trailing comma and add the WHERE clause
            updateQuery = updateQuery.slice(0, -2) + " WHERE sub_account_id = ?";
            updateValues.push(sub_account_id);

            // Execute update query
            const [result] = await connection.execute(updateQuery, updateValues);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "No changes made" });
            }

            return res.status(200).json({ message: "Sub_Account updated successfully" });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Database error" });
        }
        // Close the connection
        finally {
            if (connection) connection.release();
        }

    } catch (error) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
}
