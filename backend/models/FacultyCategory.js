import mongoose from 'mongoose';

const categoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const facultyCategorySchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  facultyName: {
    type: String,
    required: true,
  },
  categories: [categoryItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
facultyCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const FacultyCategoryModel = mongoose.model("FacultyCategory", facultyCategorySchema);
export default FacultyCategoryModel;
