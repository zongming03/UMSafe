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
    enum: ["admin", "officer"],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserModule = mongoose.model("User", userSchema);
export default UserModule;
