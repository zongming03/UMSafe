const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true,
  },
  question1: {
    type: Number,
    required: true,
  },
  question2: {
    type: Number, 
    required: true,
  },
  question3: {
    type: String, 
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Feedback', feedbackSchema);
