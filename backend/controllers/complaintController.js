// controllers/complaintController.js
const Report = require('../models/Complaint');

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Report.find().populate('category_id').populate('user_id');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const complaint = await Report.findById(req.params.id)
      .populate('category_id')
      .populate('user_id')
      .populate('admin_id');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const complaint = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updated_at: Date.now() },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const complaint = await Report.findByIdAndUpdate(
      req.params.id,
      { admin_id: req.body.admin_id },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint
};
