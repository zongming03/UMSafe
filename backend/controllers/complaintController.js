// controllers/complaintController.js
import Report from '../models/Complaint.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { HOSTNAME } from '../config/urlConfig.js';

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
    
    const notifyUser = async (userRef, roleLabel) => {
      if (!userRef) return;
      let u = null;
      try {
        if (typeof userRef === 'object' && userRef.email) u = userRef;
        else u = await User.findById(userRef);
      } catch (e) {
        console.warn('Failed to resolve user for notification', e);
      }
      if (!u || !u.email) return;
      // Only send if user has enabled email notifications or no settings present
      const wantsEmail = !u.notifications || u.notifications.emailNotifications;
      if (!wantsEmail) return;

      const complaintUrl = `${HOSTNAME}/complaints/${complaint._id || complaint.id}`;
      const subject = `Complaint ${complaint._id || complaint.id} status updated to ${complaint.status}`;
      const text = `Hello ${u.name || u.username || ''},\n\nThe status of complaint #${complaint._id || complaint.id} has been updated to ${complaint.status}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${u.name || u.username || ''},</p><p>The status of complaint <strong>#${complaint._id || complaint.id}</strong> has been updated to <strong>${complaint.status}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;

      try {
        await sendEmail({ to: u.email, subject, text, html });
      } catch (e) {
        console.warn('Failed to send status email to', u.email, e);
      }
    };

    // Notify assigned admin (try multiple possible fields)
    await notifyUser(complaint.admin_id || complaint.assignedTo || complaint.assignedToId || complaint.admin);
    // Notify the reporter / submitter
    await notifyUser(complaint.user_id || complaint.submittedBy || complaint.submitted_by || complaint.user || complaint.reporter, 'reporter');
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
