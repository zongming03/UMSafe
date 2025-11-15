import mongoose from "mongoose";
import FacultyModel from "../models/Room.js";
import FacultyCS from "./FacultyCS.js";
import FacultyEngineering from "./FacultyEngineering.js";
import FacultyBusiness from "./FacultyBusEcon.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("🔍 Mongo URI:", process.env.MONGO_URI);
    console.log("MongoDB connected ✅");
    await FacultyModel.deleteMany({});
    await FacultyModel.insertMany([FacultyCS, FacultyEngineering, FacultyBusiness]);
    console.log("✅ Faculty data seeded successfully");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Error seeding faculty:", err);
    process.exit(1);
  });
