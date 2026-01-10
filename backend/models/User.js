import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  facultyid: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  staffid: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["admin", "officer", "superadmin"],
    required: true,
  },
  hashedpassword: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },

  profileImage: {
    type: String,
    default: null, 
  },

  notifications: {
    emailNotifications: { type: Boolean, default: true },
  },

  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  emailVerificationExpiry: {
    type: Date,
    default: null,
  },

  resetPasswordToken: { type: String, default: null },
  resetPasswordExpiry: { type: Date, default: null },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserModule = mongoose.model("User", userSchema);
export default UserModule;
