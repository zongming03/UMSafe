import User from "../models/User.js";
import bcrypt from "bcryptjs";

// POST /api/users
export const addOfficer = async (req, res) => {
  // const facultyid = req.user.facultyid;
  const facultyid = "6842ad78c4d2971c14fd13c1";
  const { name, staffid, email, role, phone } = req.body;
  console.log("[addOfficer] Input:", req.body);
  try {
    const password = "loveum";
    const hashed = await bcrypt.hash(password, 10);
    console.log("[addOfficer] InputHash:", hashed);

    const newUser = new User({
      facultyid,
      name,
      staffid,
      email,
      role,
      hashedpassword: hashed,
      phone,
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error("[addOfficer] Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/users
export const getAllOfficers = async (req, res) => {
  const facultyid = "6842ad78c4d2971c14fd13c1";// Temporary hardcoded facultyid for testing
  try {
    const users = await User.find({ facultyid });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching officers" });
  }
};

// PATCH /api/users/:id
export const updateOfficer = async (req, res) => {
  const { name, staffid, email, role, phone } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, staffid, email, role, phone },
      { new: true }
    );
    res.status(201).json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: "Error updating officer" });
  }
};

// DELETE /api/users/:id
export const deleteOfficer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Officer deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete officer" });
  }
};

export const bulkDeleteOfficer = async (req, res) => {
  try {
    const {} = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ msg: "Invalid users array" });
    }

    await Category.deleteMany({ _id: { $in: categories } });
    res.status(200).json({ msg: "Users deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete users" });
  }
};
