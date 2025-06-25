import jwt from "jsonwebtoken";
export const verifyToken = (req, res, next) => {
    console.log("Cookies:", req.cookies);
    const token = req.cookies?.jwt;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }
        req.userId = decoded.userId;
        next();
    });
};