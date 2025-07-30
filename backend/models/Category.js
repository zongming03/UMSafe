import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  complaintsCount:{
    type: Number,
    default: 0,
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
});

const CategoryModel = mongoose.model("Category", categorySchema);
export default CategoryModel;
