import db from '@/lib/db';
import bcrypt from 'bcryptjs';

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

    const { name, newPassword, oldPassword } = req.body;
    const { account_id } = req.query;

    //checking account_id is not null
    if (!account_id) {
        return res.status(400).json({ error: "User ID is required" });
    }

    //checking there is atleast one field either name or password
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
                "SELECT password FROM Account WHERE account_id = ?",
                [account_id]
            );

            if (resultAccount.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const account = resultAccount[0];

            // Compare old password
            const isMatch = await bcrypt.compare(oldPassword, account.password);
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
        let updateQuery = "UPDATE Account SET ";
        const updateValues = [];

        //if the update is for name
        if (name) {
            updateQuery += "name = ?, ";
            updateValues.push(name);
        }
        // if the update is for password
        if (hashedPassword) {
            updateQuery += "password = ?, ";
            updateValues.push(hashedPassword);
        }

        // Remove the trailing comma and add the WHERE clause
        updateQuery = updateQuery.slice(0, -2) + " WHERE account_id = ?";
        updateValues.push(account_id);

        // Execute update query
        const [result] = await connection.execute(updateQuery, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No changes made" });
        }

        return res.status(200).json({ message: "Account updated successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Database error" });
    }
    // close the connection
    finally {
        if (connection) connection.release(); // Ensure connection is closed
    }
}
