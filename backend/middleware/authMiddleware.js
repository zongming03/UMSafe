import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    
    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: "Token has been revoked. Please log in again." });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-hashedpassword");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      facultyid: user.facultyid,
      staffid: user.staffid,
      phone: user.phone,
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
