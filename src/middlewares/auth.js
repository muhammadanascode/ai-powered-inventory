import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT and extract user information.
 * @param {object} req - Express/Next.js API request object
 * @param {object} res - Express/Next.js API response object
 * @param {function} next - Function to proceed to the next middleware
 */
export default function authenticate(req, res, next) {
    // Extract token from headers
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Token required" });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user data to request object
        next(); // Proceed to the actual route handler
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}