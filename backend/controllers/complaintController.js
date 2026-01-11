// controllers/complaintController.js
import Report from '../models/Complaint.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import sendEmail from '../utils/sendEmail.js';
import { HOSTNAME } from '../config/urlConfig.js';
import axios from 'axios';
import { emitEvent, emitToUser } from '../realtime/socket.js';

// Helper function to notify all admins about new complaints
const notifyAdminsNewComplaint = async (complaintId, complaintTitle, facultyId = null) => {
  try {
    // Fetch all admins (and officers if needed)
    const query = facultyId ? { facultyid: facultyId, role: { $in: ['admin', 'officer'] } } : { role: { $in: ['admin', 'officer'] } };
    const admins = await User.find(query);
    
    const complaintUrl = `${HOSTNAME}/complaints/${complaintId}`;
    
    for (const admin of admins) {
      // Only send if admin has email notifications enabled
      if (admin.notifications?.emailNotifications !== false) {
        const subject = `New Complaint Submitted: ${complaintId}`;
        const text = `Hello ${admin.name},\n\nA new complaint has been submitted and requires attention.\n\nComplaint ID: ${complaintId}\nTitle: ${complaintTitle}\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
        const html = `<p>Hello ${admin.name},</p><p>A new complaint has been submitted and requires attention.</p><div style="background:#f8f9fa;padding:15px;border-left:4px solid #3498db;margin:20px 0;border-radius:6px;"><p><strong>Complaint ID:</strong> ${complaintId}</p><p><strong>Title:</strong> ${complaintTitle}</p></div><p><a href="${complaintUrl}" style="display:inline-block;background:#3498db;color:#fff;padding:12px 20px;text-decoration:none;border-radius:5px;font-weight:bold;">View Complaint</a></p><p>Regards,<br/>UMSafe</p>`;
        
        try {
          await sendEmail({ to: admin.email, subject, text, html });
          console.log(`📧 New complaint notification sent to ${admin.email}`);
        } catch (emailErr) {
          console.warn(`Failed to send new complaint email to ${admin.email}:`, emailErr.message);
        }
      }
    }
  } catch (error) {
    console.error('Error notifying admins about new complaint:', error);
  }
};

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
    // Check if this is a partner API report (has display ID like RPT-2XXX-XX)
    const isPartnerReport = /^RPT-/.test(req.params.id);
    
    if (isPartnerReport) {
      const newStatus = req.body.status?.toLowerCase();
      const reportId = req.params.id;
      
      // Get the assigned admin and previous status before status change for notification
      let assignedAdmin = null;
      let previousStatus = null;
      let reportTitle = null;
      try {
        const currentReport = await axios.get(`http://localhost:5000/admin/reports/${reportId}`, {
          headers: { 'Authorization': req.headers.authorization || '' }
        });
        const adminId = currentReport.data.report?.adminId;
        previousStatus = currentReport.data.report?.status?.toLowerCase();
        reportTitle = currentReport.data.report?.title;
        if (adminId) {
          assignedAdmin = await User.findById(adminId);
        }
      } catch (err) {
        console.warn('Could not fetch assigned admin:', err.message);
      }
      
      // Check if complaint is being reopened (from Resolved/Closed to Open/InProgress)
      const isReopened = (previousStatus === 'resolved' || previousStatus === 'closed') && 
                         (newStatus === 'open' || newStatus === 'opened' || newStatus === 'inprogress' || newStatus === 'in progress');
      
      if (isReopened && assignedAdmin && assignedAdmin.notifications?.emailNotifications) {
        const complaintUrl = `${HOSTNAME}/complaints/${reportId}`;
        const subject = `Complaint ${reportId} has been reopened`;
        const text = `Hello ${assignedAdmin.name},\n\nThe complaint #${reportId} that was previously ${previousStatus} has been reopened.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
        const html = `<p>Hello ${assignedAdmin.name},</p><p>The complaint <strong>#${reportId}</strong> that was previously <strong>${previousStatus}</strong> has been <strong>reopened</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
        
        try {
          await sendEmail({ to: assignedAdmin.email, subject, text, html });
          console.log(`📧 Reopened complaint email sent to ${assignedAdmin.email}`);
        } catch (emailErr) {
          console.warn('Failed to send reopened complaint email:', emailErr.message);
        }
      }
      
      // For "Resolved" or "Closed", use PATCH endpoints
      if (newStatus === 'resolved' || newStatus === 'closed') {
        try {
          const axios = require('axios');
          const endpoint = newStatus === 'resolved' 
            ? `http://localhost:5000/admin/reports/${reportId}/resolve`
            : `http://localhost:5000/admin/reports/${reportId}/close`;
          
          const response = await axios.patch(endpoint, {}, {
            headers: {
              'Authorization': req.headers.authorization || '',
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`✅ Partner API: ${newStatus} status updated for ${reportId}`);

          emitEvent('complaint:status', {
            complaintId: reportId,
            status: newStatus,
            previousStatus,
            updatedBy: req.user?.id,
            updatedByRole: req.user?.role,
            isPartner: true,
          });
          if (assignedAdmin?._id) {
            emitToUser(assignedAdmin._id, 'complaint:status', {
              complaintId: reportId,
              status: newStatus,
              previousStatus,
            });
          }
          
          // Send email notification to assigned admin if they have notifications enabled
          if (assignedAdmin && assignedAdmin.notifications?.emailNotifications) {
            const complaintUrl = `${HOSTNAME}/complaints/${reportId}`;
            const subject = `Complaint ${reportId} status changed to ${newStatus}`;
            const text = `Hello ${assignedAdmin.name},\n\nThe status of complaint #${reportId} assigned to you has been updated to ${newStatus}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
            const html = `<p>Hello ${assignedAdmin.name},</p><p>The status of complaint <strong>#${reportId}</strong> assigned to you has been updated to <strong>${newStatus}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
            
            try {
              await sendEmail({ to: assignedAdmin.email, subject, text, html });
              console.log(`📧 Status change email sent to ${assignedAdmin.email}`);
            } catch (emailErr) {
              console.warn('Failed to send status change email:', emailErr.message);
            }
          }
          
          return res.json({
            id: reportId,
            status: newStatus,
            message: `Report ${newStatus} successfully`,
            data: response.data
          });
        } catch (error) {
          console.error(`❌ Failed to update partner report status:`, error.message);
          return res.status(error.response?.status || 500).json({
            message: `Failed to ${newStatus} partner report`,
            error: error.response?.data || error.message
          });
        }
      }
      
      // For "Open" or "In Progress", just fetch current status from partner API
      if (newStatus === 'open' || newStatus === 'in progress' || newStatus === 'inprogress') {
        try {
          const axios = require('axios');
          const response = await axios.get(`http://localhost:5000/admin/reports/${reportId}`, {
            headers: {
              'Authorization': req.headers.authorization || ''
            }
          });
          
          console.log(`📥 Partner API: Fetched current status for ${reportId}`);
          return res.json({
            id: reportId,
            status: response.data.report?.status || newStatus,
            message: 'Status fetched from partner API',
            data: response.data
          });
        } catch (error) {
          console.error(`❌ Failed to fetch partner report:`, error.message);
          return res.status(error.response?.status || 500).json({
            message: 'Failed to fetch partner report status',
            error: error.response?.data || error.message
          });
        }
      }
      
      // Fallback for any other status
      console.log(`⚠️ Unsupported status update for partner report: ${newStatus}`);
      return res.json({ 
        id: reportId, 
        status: newStatus,
        message: 'Status update not supported for this state' 
      });
    }

   
    const oldComplaint = await Report.findById(req.params.id);
    const previousStatus = oldComplaint?.status?.toLowerCase();
    
    const complaint = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updated_at: Date.now() },
      { new: true }
    );
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Fetch student/submitter to get their faculty ID
    let studentFacultyId = null;
    let studentEmail = null;
    if (complaint.user_id) {
      try {
        const student = await User.findById(complaint.user_id);
        if (student) {
          studentFacultyId = student.facultyid;
          studentEmail = student.email;
        }
      } catch (e) {
        console.warn('Failed to fetch student details:', e.message);
      }
    }
    
    // Check if complaint is being reopened
    const newStatus = req.body.status?.toLowerCase();
    const isReopened = (previousStatus === 'resolved' || previousStatus === 'closed') && 
                       (newStatus === 'open' || newStatus === 'in progress');
    
    if (isReopened && complaint.admin_id) {
      const admin = await User.findById(complaint.admin_id);
      if (admin && admin.notifications?.emailNotifications) {
        const complaintUrl = `${HOSTNAME}/complaints/${complaint._id}`;
        const subject = `Complaint ${complaint._id} has been reopened`;
        const text = `Hello ${admin.name},\n\nThe complaint #${complaint._id} that was previously ${previousStatus} has been reopened.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
        const html = `<p>Hello ${admin.name},</p><p>The complaint <strong>#${complaint._id}</strong> that was previously <strong>${previousStatus}</strong> has been <strong>reopened</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
        
        try {
          await sendEmail({ to: admin.email, subject, text, html });
          console.log(`📧 Reopened complaint email sent to ${admin.email}`);
        } catch (emailErr) {
          console.warn('Failed to send reopened complaint email:', emailErr.message);
        }
      }
    }
    
    // Gather admin/officer/superadmin recipients within the same faculty
    const gatherFacultyStaffRecipients = async (facultyId) => {
      if (!facultyId) return { adminEmails: [], officerEmails: [], superAdminEmails: [] };
      
      try {
        const superAdmins = await User.find({ 
          facultyid: facultyId, 
          role: 'superadmin', 
          'notifications.emailNotifications': { $ne: false } 
        });
        const admins = await User.find({ 
          facultyid: facultyId, 
          role: 'admin', 
          'notifications.emailNotifications': { $ne: false } 
        });
        const officers = await User.find({ 
          facultyid: facultyId, 
          role: 'officer', 
          'notifications.emailNotifications': { $ne: false } 
        });
        
        return {
          superAdminEmails: superAdmins.map(u => u.email).filter(Boolean),
          adminEmails: admins.map(u => u.email).filter(Boolean),
          officerEmails: officers.map(u => u.email).filter(Boolean),
        };
      } catch (e) {
        console.warn('Failed to gather faculty staff recipients:', e.message);
        return { adminEmails: [], officerEmails: [], superAdminEmails: [] };
      }
    };
    
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
    
    // Notify all staff (admin, superadmin, officer) within the same faculty
    if (studentFacultyId) {
      const { superAdminEmails, adminEmails, officerEmails } = await gatherFacultyStaffRecipients(studentFacultyId);
      const allStaffEmails = [...new Set([...superAdminEmails, ...adminEmails, ...officerEmails])].filter(Boolean);
      
      if (allStaffEmails.length > 0) {
        const complaintUrl = `${HOSTNAME}/complaints/${complaint._id}`;
        const subject = `Complaint Status Update - ${complaint._id} - ${complaint.status}`;
        const html = `<p>Complaint <strong>#${complaint._id}</strong> status has been updated to <strong>${complaint.status}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
        
        for (const email of allStaffEmails) {
          try {
            await sendEmail({ to: email, subject, text: html, html });
            console.log(`📧 Faculty staff notification sent to ${email}`);
          } catch (e) {
            console.warn('Failed to send faculty staff notification to', email, e);
          }
        }
      }
    }
    
    // Notify the reporter / submitter (student)
    if (studentEmail) {
      const complaintUrl = `${HOSTNAME}/complaints/${complaint._id}`;
      const subject = `Your Complaint Status Updated - ${complaint._id}`;
      const statusIcon = complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⏳' : '📋';
      const html = `<p>Hello,</p><p>Your complaint <strong>#${complaint._id}</strong> status has been updated to <strong>${statusIcon} ${complaint.status}</strong>.</p><p><a href="${complaintUrl}">View your complaint</a></p><p>Thank you for using UMSafe.<br/>Regards,<br/>UMSafe</p>`;
      
      try {
        await sendEmail({ to: studentEmail, subject, text: html, html });
        console.log(`📧 Student notification sent to ${studentEmail}`);
      } catch (e) {
        console.warn('Failed to send student notification to', studentEmail, e);
      }
    }
    
    emitEvent('complaint:status', {
      complaintId: complaint._id?.toString(),
      status: complaint.status,
      previousStatus,
      updatedBy: req.user?.id,
      updatedByRole: req.user?.role,
      isPartner: false,
    });
    if (complaint.admin_id) {
      emitToUser(complaint.admin_id, 'complaint:status', {
        complaintId: complaint._id?.toString(),
        status: complaint.status,
        previousStatus,
      });
    }
    if (complaint.user_id) {
      emitToUser(complaint.user_id, 'complaint:status', {
        complaintId: complaint._id?.toString(),
        status: complaint.status,
        previousStatus,
      });
    }
    res.json(complaint);
  } catch (error) {
    console.error('Error in updateComplaintStatus:', error);
    res.status(500).json({ message: error.message });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const reportId = req.params.id;
    const adminId = req.body.admin_id;
    const isPartnerReport = /^RPT-/.test(reportId);
    
    if (isPartnerReport) {
      // Check if this is revoking admin (unassigning)
      const isRevoking = !adminId || adminId === 'Unassigned' || adminId === '';
      
      if (isRevoking) {
        try {
          // Get the current admin before revoking
          let previousAdmin = null;
          try {
            const currentReport = await axios.get(`http://localhost:5000/admin/reports/${reportId}`, {
              headers: { 'Authorization': req.headers.authorization || '' }
            });
            const previousAdminId = currentReport.data.report?.adminId;
            if (previousAdminId) {
              previousAdmin = await User.findById(previousAdminId);
            }
          } catch (err) {
            console.warn('Could not fetch previous admin:', err.message);
          }

          // Call revoke admin endpoint
          await axios.patch(`http://localhost:5000/admin/reports/${reportId}/revoke-admin`, {}, {
            headers: {
              'Authorization': req.headers.authorization || '',
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`✅ Partner API: Admin revoked for ${reportId}`);

          emitEvent('complaint:assignment', {
            complaintId: reportId,
            adminId: null,
            adminName: previousAdmin?.name || 'Unassigned',
            updatedBy: req.user?.id,
            updatedByName: req.user?.name,
            isPartner: true,
          });
          if (previousAdmin?._id) {
            emitToUser(previousAdmin._id, 'complaint:assignment', {
              complaintId: reportId,
              adminId: null,
              adminName: 'Unassigned',
            });
          }
          
          // Send email notification to revoked admin if they have notifications enabled
          if (previousAdmin && previousAdmin.notifications?.emailNotifications) {
            const complaintUrl = `${HOSTNAME}/complaints/${reportId}`;
            const subject = `You have been unassigned from complaint ${reportId}`;
            const text = `Hello ${previousAdmin.name},\n\nYou have been unassigned from complaint #${reportId}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
            const html = `<p>Hello ${previousAdmin.name},</p><p>You have been <strong>unassigned</strong> from complaint <strong>#${reportId}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
            
            try {
              await sendEmail({ to: previousAdmin.email, subject, text, html });
              console.log(`📧 Revocation email sent to ${previousAdmin.email}`);
            } catch (emailErr) {
              console.warn('Failed to send revocation email:', emailErr.message);
            }
          }
          
          // Fetch updated report to get new status (should be "Open")
          const response = await axios.get(`http://localhost:5000/admin/reports/${reportId}`, {
            headers: {
              'Authorization': req.headers.authorization || ''
            }
          });
          
          console.log(`📥 Partner API: Fetched updated status after revoke for ${reportId}`);
          return res.json({
            id: reportId,
            adminId: null,
            status: response.data.report?.status || 'Open',
            message: 'Admin revoked successfully',
            data: response.data
          });
        } catch (error) {
          console.error(`❌ Failed to revoke admin for partner report:`, error.message);
          return res.status(error.response?.status || 500).json({
            message: 'Failed to revoke admin from partner report',
            error: error.response?.data || error.message
          });
        }
      } else {
        // Assigning admin - use assign-admin endpoint
        try {
          const response = await axios.patch(`http://localhost:5000/admin/reports/${reportId}/assign-admin`, 
            { adminId },
            {
              headers: {
                'Authorization': req.headers.authorization || '',
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`✅ Partner API: Admin assigned for ${reportId}`);

          // Send email notification to newly assigned admin if they have notifications enabled
          const assignedUser = await User.findById(adminId);

          emitEvent('complaint:assignment', {
            complaintId: reportId,
            adminId,
            adminName: assignedUser?.name || 'Assigned',
            updatedBy: req.user?.id,
            updatedByName: req.user?.name,
            isPartner: true,
          });
          if (adminId) {
            emitToUser(adminId, 'complaint:assignment', {
              complaintId: reportId,
              adminId,
              adminName: assignedUser?.name || 'You',
            });
          }
          
          if (assignedUser && assignedUser.notifications?.emailNotifications) {
            const complaintUrl = `${HOSTNAME}/complaints/${reportId}`;
            const subject = `New complaint assigned to you: ${reportId}`;
            const text = `Hello ${assignedUser.name},\n\nYou have been assigned to complaint #${reportId}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
            const html = `<p>Hello ${assignedUser.name},</p><p>You have been <strong>assigned</strong> to complaint <strong>#${reportId}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
            
            try {
              await sendEmail({ to: assignedUser.email, subject, text, html });
              console.log(`📧 Assignment email sent to ${assignedUser.email}`);
            } catch (emailErr) {
              console.warn('Failed to send assignment email:', emailErr.message);
            }
          }
          
          return res.json({
            id: reportId,
            adminId: adminId,
            message: 'Admin assigned successfully',
            data: response.data
          });
        } catch (error) {
          console.error(`❌ Failed to assign admin to partner report:`, error.message);
          return res.status(error.response?.status || 500).json({
            message: 'Failed to assign admin to partner report',
            error: error.response?.data || error.message
          });
        }
      }
    }
    
    // Original MongoDB-based logic for local complaints
    const complaint = await Report.findByIdAndUpdate(
      req.params.id,
      { admin_id: req.body.admin_id },
      { new: true }
    );

    let assignedUser = null;
    if (complaint?.admin_id) {
      assignedUser = await User.findById(complaint.admin_id).catch(() => null);
    }

    if (complaint) {
      emitEvent('complaint:assignment', {
        complaintId: complaint._id?.toString(),
        adminId: complaint.admin_id || null,
        adminName: assignedUser?.name || 'Unassigned',
        updatedBy: req.user?.id,
        updatedByName: req.user?.name,
        isPartner: false,
      });
      if (complaint.admin_id) {
        emitToUser(complaint.admin_id, 'complaint:assignment', {
          complaintId: complaint._id?.toString(),
          adminId: complaint.admin_id,
          adminName: assignedUser?.name || 'You',
        });
      }
    }

    // Send email notification to assigned user if enabled
    if (complaint && assignedUser && assignedUser.notifications?.emailNotifications) {
      const complaintUrl = `${HOSTNAME}/complaints/${complaint._id}`;
      const subject = `New complaint assigned to you: ${complaint._id}`;
      const text = `Hello ${assignedUser.name},\n\nYou have been assigned to complaint #${complaint._id}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${assignedUser.name},</p><p>You have been <strong>assigned</strong> to complaint <strong>#${complaint._id}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
      
      try {
        await sendEmail({ to: assignedUser.email, subject, text, html });
        console.log(`📧 Assignment email sent to ${assignedUser.email}`);
      } catch (emailErr) {
        console.warn('Failed to send assignment email:', emailErr.message);
      }
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages for a specific chatroom
const getChatroomMessages = async (req, res) => {
  try {
    const { reportId, chatroomId } = req.params;

    if (!reportId || !chatroomId) {
      return res.status(400).json({ message: 'reportId and chatroomId are required' });
    }

    // Fetch messages from MongoDB for this chatroom
    const messages = await Chat.find({ reportId, chatroomId }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error fetching chatroom messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

export default {
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  getChatroomMessages,
  notifyAdminsNewComplaint
};
