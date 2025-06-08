import mongoose from "mongoose";
const { Schema } = mongoose;

// Room Schema
const facultyBlockRoomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

// Block Schema
const facultyBlockSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    faculty_block_rooms: {
      type: [facultyBlockRoomSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

// Faculty Schema
const facultySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    faculty_blocks: {
      type: [facultyBlockSchema],
      default: [],
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

const FacultyModel = mongoose.model("Faculty", facultySchema);
export default FacultyModel;
