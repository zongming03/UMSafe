import express from "express";
import multer from "multer";
import path from "path";
import { getProfile, updateProfile, changePassword } from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/", authMiddleware, getProfile);
router.patch("/", authMiddleware, upload.single("profileImage"), updateProfile);
router.post("/change-password",authMiddleware, changePassword);

export default router;
  