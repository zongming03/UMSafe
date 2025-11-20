import User from "../models/User.js";
import Room from "../models/Room.js";
import Category from "../models/Category.js";

export const getAllUsersForMobile = async (req, res) => {
  try {
    const users = await User.find().select("name email role phone createdAt facultyid profileImage");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error fetching all users", error: err.message });
  }
};

export const getUsersByFacultyForMobile = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    if (!facultyId) {
      return res.status(400).json({ 
        success: false,
        msg: "Faculty ID is required" 
      });
    }

    const users = await User.find({ facultyid: facultyId }).select("name email role phone createdAt facultyid profileImage");
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Error fetching users by faculty", error: err.message });
  }
};

export const getAllRoomsForMobile = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching all rooms" });
  }
};

export const getAllCategoriesForMobile = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching all categories" });
  }
};
