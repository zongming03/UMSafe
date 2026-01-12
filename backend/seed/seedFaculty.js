import mongoose from "mongoose";
import FacultyModel from "../models/Room.js";
import FacultyCS from "./FacultyCS.js";
import FacultyEngineering from "./FacultyEngineering.js";
import FacultyBusiness from "./FacultyBusEcon.js";
import FacultyArts from "./FacultyArts.js";
import FacultyLanguages from "./FacultyLanguages.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("🔍 Mongo URI:", process.env.MONGO_URI);
    console.log("MongoDB connected ✅");
    
    // Check if Faculty of Languages already exists
    const existingLanguages = await FacultyModel.findOne({ name: "Faculty of Languages and Linguistics" });
    
    if (existingLanguages) {
      console.log("⚠️ Faculty of Languages and Linguistics already exists, skipping...");
    } else {
      await FacultyModel.create(FacultyLanguages);
      console.log("✅ Faculty of Languages and Linguistics added successfully");
    }
    
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Error seeding faculty:", err);
    process.exit(1);
  });
