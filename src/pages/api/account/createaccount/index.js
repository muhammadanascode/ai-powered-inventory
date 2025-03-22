import db from '@/lib/db';  // Reusing the DB connection
import bcrypt from 'bcryptjs';  // Import bcrypt for password hashing

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Name validation: Start with a letter, min 8, max 50, allows letters, spaces, and numbers
    const nameRegex = /^[A-Za-z][A-Za-z0-9\s]{7,49}$/;
    if (!nameRegex.test(name.trim())) {
        return res.status(400).json({ error: "Name must start with a letter, be at least 8 characters long, and contain only letters, numbers, and spaces" });
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Password validation: At least 8 characters
    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    try {
        // Get a connection from the pool
        const connection = await db.getConnection();

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into the database
        const [result] = await connection.execute(
            "INSERT INTO Account (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        // Release connection back to the pool
        connection.release();

        return res.status(201).json({ message: "Account created successfully", accountId: result.insertId });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Database error" });
    }
}
