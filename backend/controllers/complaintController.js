// controllers/complaintController.js
import Report from '../models/Complaint.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

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
    // Send email notification to assigned user if enabled
    if (complaint && complaint.admin_id) {
      const user = await User.findById(complaint.admin_id);
      if (user && user.notifications && user.notifications.emailNotifications) {
        await sendEmail({
          to: user.email,
          subject: 'Complaint Status Updated',
          text: `The status of complaint #${complaint._id} has been updated to ${complaint.status}.`,
        });
      }
    }
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
    // Send email notification to assigned user if enabled
    if (complaint && complaint.admin_id) {
      const user = await User.findById(complaint.admin_id);
      if (user && user.notifications && user.notifications.emailNotifications) {
        await sendEmail({
          to: user.email,
          subject: 'New Complaint Assigned',
          text: `You have been assigned a new complaint (ID: ${complaint._id}).`,
        });
      }
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint
};
