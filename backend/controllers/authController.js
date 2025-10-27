import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { HOSTNAME, ADMIN_PREFIX } from "../config/urlConfig.js";

// POST /api/auth/login
export const handlelogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ msg: "User not found" });
    console.log("User found:", user);

    const isMatch = await bcrypt.compare(password, user.hashedpassword);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const decoded = jwt.decode(token);
    console.log(
      "✅ JWT issued at:",
      new Date(decoded.iat * 1000).toLocaleString()
    );
    console.log(
      "⏳ JWT expires at:",
      new Date(decoded.exp * 1000).toLocaleString()
    );

    res.status(200).json({
      msg: "Login successful",
      token,
      expiresIn: 3600,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        name: user.name,
        facultyid: user.facultyid,
        staffid: user.staffid,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// POST /api/auth/forgot-password
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token + expiry in DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 1000 * 60 * 15;
    await user.save();

  const resetLink = `${HOSTNAME}${ADMIN_PREFIX}/reset-password/${resetToken}`;

    // Setup mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send decorated email
    await transporter.sendMail({
      from: `"UMSafe Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔑 Reset Your Password - UMSafe",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #2c3e50;">Hi ${user.name},</h2>
          <p style="font-size: 16px;">We received a request to reset your password. Please click the button below:</p>
          <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p style="font-size: 14px; color: #888;">This link will expire in 15 minutes.</p>
          <p style="font-size: 14px;">If you didn’t request a password reset, please ignore this email.</p>
          <br/>
          <p style="font-size: 14px;">— UMSafe Team</p>
        </div>
      `,
    });

    res.json({ msg: "Password reset email sent" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length < 8) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    console.log("Reset token used:", token);
    if (!user) return res.status(400).json({ msg: "Invalid or expired token" });

    // Hash and save new password
    user.hashedpassword = await bcrypt.hash(password.trim(), 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err.message, err.stack);
    res.status(500).json({ msg: "Server error" });
  }
};
