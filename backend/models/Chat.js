import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
  },
  chatroomId: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: false,
  },
  attachment: {
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'pdf'],
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Store partner API response if needed
  partnerId: String, // ID from partner API
});

export default mongoose.model('Chat', chatSchema);
