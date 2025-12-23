import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { HOSTNAME, ADMIN_PREFIX } from "../config/urlConfig.js";
import { blacklistToken } from "../utils/tokenBlacklist.js";
import sendEmail from "../utils/sendEmail.js";

// POST /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid or expired verification token",
        success: false,
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    console.log(`✅ Email verified for user: ${user.email}`);

    // Send welcome email with credentials
    try {
      const loginUrl = `${HOSTNAME || 'http://localhost:3000'}/login`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to UMSafe! 🎉</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your email has been successfully verified. Your account is now active and ready to use.</p>
          
          <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 10px 0;"><strong>Your Login Credentials:</strong></p>
            <p style="margin: 10px 0;">📧 <strong>Email:</strong> ${user.email}</p>
            <p style="margin: 10px 0;">🔐 <strong>Temporary Password:</strong> ${user.temporaryPassword || 'Contact your administrator'}</p>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Go to <a href="${loginUrl}" style="color: #0066cc;">Login Page</a></li>
            <li>Enter your email and temporary password</li>
            <li>You will be prompted to change your password on first login</li>
          </ol>

          <p style="margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px;">
            If you did not create this account, please contact the administrator immediately.<br>
            <strong>UMSafe Security Team</strong>
          </p>
        </div>
      `;

      const emailText = `
Welcome to UMSafe!

Hello ${user.name},

Your email has been successfully verified. Your account is now active and ready to use.

Your Login Credentials:
Email: ${user.email}
Temporary Password: ${user.temporaryPassword || 'Contact your administrator'}

Next Steps:
1. Go to the Login Page
2. Enter your email and temporary password
3. You will be prompted to change your password on first login

If you did not create this account, please contact the administrator immediately.

UMSafe Security Team
      `;

      await sendEmail({
        to: user.email,
        subject: "Email Verified - Your Account is Active! 🎉",
        text: emailText,
        html: emailHtml,
      });

      console.log(`✅ Verification email sent to: ${user.email}`);
    } catch (emailErr) {
      console.warn("⚠️ Failed to send verification email:", emailErr.message);
      // Don't fail the verification if email fails to send
    }

    res.json({
      msg: "Email verified successfully! You can now login.",
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ msg: "Server error during verification" });
  }
};

// POST /api/auth/login
export const handlelogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailInput = email?.toLowerCase().trim();
    const passwordInput = password?.trim();

    if (!emailInput || !passwordInput) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    // Case-insensitive lookup to handle mixed-case emails stored in DB
    const user = await User.findOne({ email: { $regex: `^${emailInput}$`, $options: 'i' } });
    if (!user) return res.status(404).json({ msg: "Invalid username or password." });
    console.log("User found:", user.email);
    console.log("Email verified status:", user.emailVerified);

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        msg: "Please verify your email first. Check your inbox for the verification link.",
        requiresEmailVerification: true,
      });
    }

    console.log("Attempting password comparison...");
    console.log("Password from request (trimmed):", passwordInput);
    console.log("Hashed password from DB:", user.hashedpassword);
    
    const isMatch = await bcrypt.compare(passwordInput, user.hashedpassword);
    console.log("Password match result:", isMatch);
    
    if (!isMatch)
      return res.status(401).json({ msg: "Login failed. Please check your credentials and try again." });

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
    if (!user) return res.status(404).json({ msg: "User doesn't exist in database. Please contact your administrator." });

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token + expiry in DB
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 1000 * 60 * 15;
    await user.save();

    // Frontend route for reset password does NOT include ADMIN_PREFIX, so build link without it
    const resetLink = `${HOSTNAME}/reset-password/${resetToken}`;

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

// POST /api/auth/refresh
// Issues a new JWT if the current one is still valid. This enables "Stay signed in" UX.
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Missing authorization header" });
    }
    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Allow refresh if token expired within the last 5 minutes (grace period)
      if (err.name === "TokenExpiredError") {
        try {
          payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
          const now = Math.floor(Date.now() / 1000);
          const gracePeriod = 5 * 60; // 5 minutes
          if (now - payload.exp > gracePeriod) {
            return res.status(401).json({ msg: "Token expired beyond grace period" });
          }
          console.log(`⏰ Token expired ${now - payload.exp}s ago, within grace period, allowing refresh`);
        } catch (decodeErr) {
          return res.status(401).json({ msg: "Invalid token" });
        }
      } else {
        return res.status(401).json({ msg: "Invalid token" });
      }
    }

    // Optional: you could implement a max session length check here.
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const newToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const decoded = jwt.decode(newToken);
    res.status(200).json({
      msg: "Token refreshed",
      token: newToken,
      expiresIn: 3600,
      exp: decoded.exp,
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// POST /api/auth/logout
// Blacklist the current token and log out the user
export const handleLogout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify token is valid before blacklisting
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Blacklist the token (add to blacklist until expiry)
      blacklistToken(token, decoded.exp);
      
      console.log(`🚪 User ${decoded.email} logged out successfully`);
      
      res.status(200).json({ msg: "Logged out successfully" });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        // Token already expired, but still process logout
        console.log("⚠️ Token already expired but logging out anyway");
        res.status(200).json({ msg: "Logged out successfully (token was expired)" });
      } else {
        return res.status(401).json({ msg: "Invalid token" });
      }
    }
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ msg: "Server error during logout" });
  }
};
