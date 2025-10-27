import User from "../models/User.js";
import bcrypt from "bcryptjs";
import Faculty from "../models/Room.js";

// GET /api/profile
export const getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const faculty = await Faculty.findById(user.facultyid);
    console.log("User's faculty ID:", faculty);
    const facultyName = faculty ? faculty.name : "";
    console.log("Fetched faculty profile:", facultyName);
    res.status(200).json({ user, facultyName });
  } catch (err) {
    console.error("❌ Failed to fetch user profile:", err);
    res.status(500).json({ msg: "Failed to fetch user profile" });
  }
};

// PATCH /api/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = {
      name: req.body.name,
      notifications: JSON.parse(req.body.notifications),
    };
    if (req.file) {
      updates.profileImage = "/uploads/" + req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    });
    res.json({ user: updatedUser });
  } catch (err) {
    console.error("❌ Failed to update profile:", err);
    res.status(500).json({ msg: "Failed to update profile" });
  }
};

// POST /api/profile/change-password
export const changePassword = async (req, res) => {
  const userId = req.user.id;
  console.log("Change password request for user ID:", userId);
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(userId);
    console.log("User found for password change:", user);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.hashedpassword);
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    user.hashedpassword = hashed;
    await user.save();
    res.status(200).json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to change password" });
  }
};
