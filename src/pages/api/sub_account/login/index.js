import bcrypt from "bcryptjs"; // Library for password hashing 
import jwt from "jsonwebtoken"; // Library for generating JWT tokens
import db from "@/lib/db"; // Importing database connection

/** 
 * API handler for sub-account login..
 * @returns {Promise<void>} Sends a JSON response with a token or an error message.
 */
export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Extract email and password from request body
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password" });
    }

    try {
        const connection = await db.getConnection(); // Establish database connection

        // Query the database to find the sub-account with the provided email
        const [result] = await connection.execute(
            "SELECT sub_account_id, name, email, password, account_id , role FROM Sub_Accounts WHERE email = ?",
            [email]
        );
        connection.release(); // Release database connection

        // If no user is found, return an error
        if (result.length === 0) {
            return res.status(401).json({ error: "Sub-account not found with this email" });
        }

        const user = result[0]; // Retrieve user details

        // Compare provided password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Incorrect Credentials" });
        }

        // Generate a JWT token for authentication
        const tokenPayload = {
            sub_account_id: user.sub_account_id,
            account_id: user.account_id, // Linking to root account
            email: user.email,
            name: user.name,
            account_type: user.role 
        };

        // Generate JWT token valid for 1 hour
        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Return the token and user data on successful login
        return res.status(200).json({ message: "Login successful", token, user: tokenPayload });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Database error" }); // Handle server errors
    }
}
