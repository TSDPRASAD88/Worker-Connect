import jwt from "jsonwebtoken";

// Hardcoded as fallback — .env value is trimmed to avoid whitespace issues
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "prasadthamarana2006@gmail.com").trim();

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.worker = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Only allows the admin email through
export const adminOnly = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email?.trim() !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.worker = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default protect;