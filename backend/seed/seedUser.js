import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import dotenv from 'dotenv';
dotenv.config();

const facultyid = "6842ad78c4d2971c14fd13c1";

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const password = "admin123";
  const hashed = await bcrypt.hash(password, 10);

  const adminUser = new User({
    facultyid,
    name: "FCSIT Admin",
    staffid: "CS0001",
    email: "csadmin@university.edu",
    role: "admin",
    hashedpassword: hashed,
    phone: "012-3456789",
  });

  try {
    await adminUser.save();
    console.log("Seed admin user created!");
  } catch (err) {
    console.error("Error seeding admin user:", err);
  } finally {
    await mongoose.disconnect();
  }
};

seed();