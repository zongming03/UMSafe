import User from "../models/User.js";
import Room from "../models/Room.js";
import Category from "../models/Category.js";
import FacultyCategory from "../models/FacultyCategory.js";
import mongoose from "mongoose";
import axios from "axios";

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

    // Convert string to ObjectId for matching
    const objectIdFacultyId = new mongoose.Types.ObjectId(facultyId);
    const users = await User.find({ facultyid: objectIdFacultyId }).select("name email role phone createdAt facultyid profileImage");
    
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
    const { facultyId } = req.query;

    // If facultyId provided, return categories for that faculty only
    if (facultyId) {
      const facultyCategories = await FacultyCategory.findOne({ facultyId: String(facultyId) });
      if (!facultyCategories) return res.status(200).json([]);
      return res.status(200).json(facultyCategories.categories);
    }

    // Otherwise return all categories, annotated with faculty info
    const docs = await FacultyCategory.find();
    const categories = docs.flatMap((doc) =>
      doc.categories.map((cat) => ({
        ...cat.toObject(),
        facultyId: doc.facultyId,
        facultyName: doc.facultyName,
      }))
    );

    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching all categories" });
  }
};

export const getUserDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const partnerApiBaseUrl = process.env.PARTNER_API_BASE_URL;

    if (!partnerApiBaseUrl) {
      return res.status(500).json({ 
        success: false,
        msg: "Partner API URL not configured" 
      });
    }

    // Proxy to partner API
    const targetUrl = `${partnerApiBaseUrl}/users/${id}/details`;
    console.log(`📡 Proxying user details request to: ${targetUrl}`);

    const response = await axios.get(targetUrl, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      validateStatus: () => true,
    });

    console.log(`✅ Partner API response: ${response.status}`);

    if (response.status >= 400) {
      console.error('Partner API error:', JSON.stringify(response.data, null, 2));
    }

    // Forward the response from partner API
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Error fetching user details from partner:', err.message);
    res.status(500).json({ 
      success: false,
      msg: "Error fetching user details from partner API", 
      error: err.message 
    });
  }
};
