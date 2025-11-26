import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import complaintController from '../controllers/complaintController.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import { HOSTNAME } from '../config/urlConfig.js';

const router = express.Router();

// Test endpoint 1: New Complaint Notification
router.post('/test-new-complaint', authMiddleware, async (req, res) => {
  try {
    const { complaintId, title } = req.body;
    
    // Use test data if not provided
    const testComplaintId = complaintId || 'CMP-TEST-' + Date.now();
    const testTitle = title || 'Test Complaint - Email Notification';
    
    console.log('🧪 Testing new complaint notification...');
    
    // Call the notification function
    await complaintController.notifyAdminsNewComplaint(testComplaintId, testTitle);
    
    res.json({
      success: true,
      message: 'New complaint notification test sent',
      complaintId: testComplaintId,
      title: testTitle
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint 2: Assignment Notification
router.post('/test-assignment', authMiddleware, async (req, res) => {
  try {
    const { staffId, complaintId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    
    const testComplaintId = complaintId || 'CMP-TEST-' + Date.now();
    
    console.log('🧪 Testing assignment notification...');
    
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    if (user.notifications?.emailNotifications) {
      const complaintUrl = `${HOSTNAME}/complaints/${testComplaintId}`;
      const subject = `New complaint assigned to you: ${testComplaintId}`;
      const text = `Hello ${user.name},\n\nYou have been assigned to complaint #${testComplaintId}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${user.name},</p><p>You have been <strong>assigned</strong> to complaint <strong>#${testComplaintId}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
      
      await sendEmail({ to: user.email, subject, text, html });
      console.log(`📧 Test assignment email sent to ${user.email}`);
      
      res.json({
        success: true,
        message: 'Assignment notification test sent',
        email: user.email,
        complaintId: testComplaintId
      });
    } else {
      res.json({
        success: false,
        message: 'Staff member has email notifications disabled',
        email: user.email
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint 3: Unassignment Notification
router.post('/test-unassignment', authMiddleware, async (req, res) => {
  try {
    const { staffId, complaintId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    
    const testComplaintId = complaintId || 'CMP-TEST-' + Date.now();
    
    console.log('🧪 Testing unassignment notification...');
    
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    if (user.notifications?.emailNotifications) {
      const complaintUrl = `${HOSTNAME}/complaints/${testComplaintId}`;
      const subject = `You have been unassigned from complaint ${testComplaintId}`;
      const text = `Hello ${user.name},\n\nYou have been unassigned from complaint #${testComplaintId}.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${user.name},</p><p>You have been <strong>unassigned</strong> from complaint <strong>#${testComplaintId}</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
      
      await sendEmail({ to: user.email, subject, text, html });
      console.log(`📧 Test unassignment email sent to ${user.email}`);
      
      res.json({
        success: true,
        message: 'Unassignment notification test sent',
        email: user.email,
        complaintId: testComplaintId
      });
    } else {
      res.json({
        success: false,
        message: 'Staff member has email notifications disabled',
        email: user.email
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint 4: Status Change to Resolved
router.post('/test-resolved', authMiddleware, async (req, res) => {
  try {
    const { staffId, complaintId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    
    const testComplaintId = complaintId || 'CMP-TEST-' + Date.now();
    
    console.log('🧪 Testing resolved status notification...');
    
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    if (user.notifications?.emailNotifications) {
      const complaintUrl = `${HOSTNAME}/complaints/${testComplaintId}`;
      const subject = `Complaint ${testComplaintId} status changed to resolved`;
      const text = `Hello ${user.name},\n\nThe status of complaint #${testComplaintId} assigned to you has been updated to resolved.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${user.name},</p><p>The status of complaint <strong>#${testComplaintId}</strong> assigned to you has been updated to <strong>resolved</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
      
      await sendEmail({ to: user.email, subject, text, html });
      console.log(`📧 Test resolved status email sent to ${user.email}`);
      
      res.json({
        success: true,
        message: 'Resolved status notification test sent',
        email: user.email,
        complaintId: testComplaintId
      });
    } else {
      res.json({
        success: false,
        message: 'Staff member has email notifications disabled',
        email: user.email
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint 5: Status Change to Closed
router.post('/test-closed', authMiddleware, async (req, res) => {
  try {
    const { staffId, complaintId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    
    const testComplaintId = complaintId || 'CMP-TEST-' + Date.now();
    
    console.log('🧪 Testing closed status notification...');
    
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    if (user.notifications?.emailNotifications) {
      const complaintUrl = `${HOSTNAME}/complaints/${testComplaintId}`;
      const subject = `Complaint ${testComplaintId} status changed to closed`;
      const text = `Hello ${user.name},\n\nThe status of complaint #${testComplaintId} assigned to you has been updated to closed.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${user.name},</p><p>The status of complaint <strong>#${testComplaintId}</strong> assigned to you has been updated to <strong>closed</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
      
      await sendEmail({ to: user.email, subject, text, html });
      console.log(`📧 Test closed status email sent to ${user.email}`);
      
      res.json({
        success: true,
        message: 'Closed status notification test sent',
        email: user.email,
        complaintId: testComplaintId
      });
    } else {
      res.json({
        success: false,
        message: 'Staff member has email notifications disabled',
        email: user.email
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ message: error.message });
  }
});

// Test endpoint 6: Reopened Complaint
router.post('/test-reopened', authMiddleware, async (req, res) => {
  try {
    const { staffId, complaintId } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }
    
    const testComplaintId = complaintId || 'CMP-TEST-' + Date.now();
    
    console.log('🧪 Testing reopened complaint notification...');
    
    const user = await User.findById(staffId);
    if (!user) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    
    if (user.notifications?.emailNotifications) {
      const complaintUrl = `${HOSTNAME}/complaints/${testComplaintId}`;
      const subject = `Complaint ${testComplaintId} has been reopened`;
      const text = `Hello ${user.name},\n\nThe complaint #${testComplaintId} that was previously resolved has been reopened.\n\nYou can view the complaint here: ${complaintUrl}\n\nRegards,\nUMSafe`;
      const html = `<p>Hello ${user.name},</p><p>The complaint <strong>#${testComplaintId}</strong> that was previously <strong>resolved</strong> has been <strong>reopened</strong>.</p><p><a href="${complaintUrl}">View complaint</a></p><p>Regards,<br/>UMSafe</p>`;
      
      await sendEmail({ to: user.email, subject, text, html });
      console.log(`📧 Test reopened complaint email sent to ${user.email}`);
      
      res.json({
        success: true,
        message: 'Reopened complaint notification test sent',
        email: user.email,
        complaintId: testComplaintId
      });
    } else {
      res.json({
        success: false,
        message: 'Staff member has email notifications disabled',
        email: user.email
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all staff members for testing
router.get('/staff-list', authMiddleware, async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['admin', 'officer'] } })
      .select('_id name email role notifications');
    
    res.json({
      success: true,
      count: staff.length,
      staff: staff.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        role: s.role,
        emailNotificationsEnabled: s.notifications?.emailNotifications !== false
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
