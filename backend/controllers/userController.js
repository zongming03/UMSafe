import User from "../models/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import validator from "email-validator";
import { HOSTNAME, ADMIN_PREFIX } from "../config/urlConfig.js";
import { getDefaultProfileImageUrl } from "../utils/uploadDefaultImage.js";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/users
export const addOfficer = async (req, res) => {
  const facultyid = req.user.facultyid;
  const { name, staffid, email, role, phone } = req.body;

  console.log("[addOfficer] Input:", req.body);

  try {
    if (!validator.validate(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("[addOfficer] Duplicate email:", email);
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingStaff = await User.findOne({ staffid });
    if (existingStaff) {
      console.warn("[addOfficer] Duplicate staffid:", staffid);
      return res.status(400).json({ message: "Staff ID already exists" });
    }

    const password = "loveum";
    const hashed = await bcrypt.hash(password, 10);
    console.log("[addOfficer] InputHash:", hashed);

    // Get default profile image from Cloudinary
    const defaultProfileImage = await getDefaultProfileImageUrl();

    const newUser = new User({
      facultyid,
      name,
      staffid,
      email,
      role,
      hashedpassword: hashed,
      phone,
      profileImage: defaultProfileImage,
    });

    const savedUser = await newUser.save();
    console.log("[addOfficer] User saved:", savedUser);

    const mailOptions = {
      from: `"UMSafe Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to UMSafe 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:10px; padding:20px;">
          <h2 style="color:#2c3e50; text-align:center;">Welcome to <span style="color:#3498db;">UMSafe</span> 🚀</h2>
          <p>Dear <b>${name}</b>,</p>
          <p>Your account has been created successfully 🎉</p>

          <div style="background:#f8f9fa; padding:15px; border-left:4px solid #3498db; margin:20px 0; border-radius:6px;">
            <p><b>Temporary Login Details:</b></p>
            <p><b>Email:</b> ${email}</p>
            <p><b>Password:</b> <span style="color:#e74c3c;">${password}</span></p>
          </div>

          <p style="color:#555;">Please change your password after your first login for security purposes 🔐.</p>

          <div style="text-align:center; margin:30px 0;">
            <a href="${HOSTNAME}${ADMIN_PREFIX}/login" style="display:inline-block; background:#3498db; color:#fff; padding:12px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">
              Login to UMSafe
            </a>
          </div>

          <p>Best regards,<br><b>UMSafe Team</b></p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
          <p style="font-size:12px; color:#888; text-align:center;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("[addOfficer] Email sent successfully");

    res.status(201).json({
      message: "Officer created successfully",
    });
  } catch (err) {
    console.error("[addOfficer] ERROR:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

// GET /api/users
export const getAllOfficers = async (req, res) => {
  const facultyid = req.user.facultyid;
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
