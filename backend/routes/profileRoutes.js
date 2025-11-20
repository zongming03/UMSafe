import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import { getProfile, updateProfile, changePassword } from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Use Cloudinary storage instead of local disk storage
const upload = multer({ storage });

router.get("/", authMiddleware, getProfile);
router.patch("/", authMiddleware, upload.single("profileImage"), updateProfile);
router.post("/change-password",authMiddleware, changePassword);

export default router;
  