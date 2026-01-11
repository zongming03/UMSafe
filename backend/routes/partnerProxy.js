import axios from 'axios';
import { emitEvent } from '../realtime/socket.js';

const enrichAssignAdminBody = async (req) => {
  if (req.method !== 'PATCH' || !req.originalUrl.includes('/assign-admin')) return;
  const { User } = await import('../models/User.js').then((m) => ({ User: m.default }));
  try {
    if (req.body.adminId) {
      const admin = await User.findById(req.body.adminId);
      if (admin) {
        req.body.adminName = admin.name;
      }
    }
    req.body.initiatorName = req.body.initiatorName || 'Admin';
    console.log('📝 Enriched assign-admin request:', JSON.stringify(req.body, null, 2));
  } catch (err) {
    console.warn('⚠️ Failed to enrich assign-admin request:', err.message);
    if (!req.body.initiatorName) req.body.initiatorName = 'Admin';
  }
};

const enrichRevokeAdminBody = (req) => {
  if (req.method !== 'PATCH' || !req.originalUrl.includes('/revoke-admin')) return;
  try {
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
    }
    if (!req.body.initiatorName) {
      req.body.initiatorName = 'Admin';
    }
    console.log('📝 Enriched revoke-admin request:', JSON.stringify(req.body, null, 2));
  } catch (err) {
    console.warn('⚠️ Failed to enrich revoke-admin request:', err.message);
    if (!req.body || typeof req.body !== 'object') req.body = {};
    if (!req.body.initiatorName) req.body.initiatorName = 'Admin';
  }
};

const enrichStatusBody = (req) => {
  if (req.method !== 'PATCH') return;
  const isStatus = req.originalUrl.includes('/resolve') || req.originalUrl.includes('/close');
  if (!isStatus) return;
  
  // Ensure body is an object
  if (!req.body || typeof req.body !== 'object') {
    req.body = {};
  }
  
  // Add initiatorName if not already present
  if (!req.body.initiatorName) {
    req.body.initiatorName = 'Admin';
  }
  
  // For close endpoint, ensure reason is present (this is required by CloseReportInputSchema)
  if (req.originalUrl.includes('/close') && !req.body.reason) {
    req.body.reason = 'Case closed by admin';
  }
  
  console.log('📝 Enriched status update request:', JSON.stringify(req.body, null, 2));
};

const maybeSaveChatMessage = async (req) => {
  if (!(req.method === 'POST' && req.originalUrl.includes('/chats'))) return;
  const { Chat } = await import('../models/Chat.js').then((m) => ({ Chat: m.default }));
  const match = req.originalUrl.match(/\/admin\/reports\/([^\/]+)\/chatrooms\/([^\/]+)/);
  if (!match || !req.body) return;
  const [, reportId, chatroomId] = match;
  try {
    console.log(`📨 Chat message payload received:`, JSON.stringify(req.body, null, 2));
    const newChat = new Chat({
      reportId,
      chatroomId,
      senderId: req.body.senderId,
      receiverId: req.body.receiverId,
      message: req.body.message,
      attachment: req.body.attachment || undefined,
    });
    await newChat.save();
    console.log(`💾 Saved chat message to MongoDB: ${reportId}/${chatroomId}`);
  } catch (err) {
    console.warn('⚠️ Failed to save message to MongoDB:', err.message);
  }
};

const fetchReportDetailsIfNeeded = async (partnerBaseUrl, reportId, existing) => {
  // Always fetch full report with user details for email notifications
  if (!reportId) return existing;
  
  console.log('🔄 Fetching full report details with user data for reportId:', reportId);
  
  try {
    const res = await axios.get(`${partnerBaseUrl.replace(/\/$/, '')}/reports/${reportId}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    const fullReport = res.data?.report || res.data;
    console.log('✅ Fetched report with user data:', JSON.stringify({
      reportId: fullReport?.id || fullReport?.displayId,
      hasUser: !!fullReport?.user,
      userEmail: fullReport?.user?.email,
      facultyId: fullReport?.user?.facultyId
    }, null, 2));
    return fullReport;
  } catch (e) {
    console.warn('⚠️ Could not fetch report details for email notification:', e.message);
    return existing;
  }
};

const sendEmailIfAny = async (sendEmail, to, subject, html) => {
  if (!to?.length) return;
  await sendEmail({ to: to.join(','), subject, html });
};

const buildTargetUrl = (baseUrl, originalUrl) => {
  const suffix = originalUrl.replace(/^\/admin\/reports/, '');
  return `${baseUrl.replace(/\/$/, '')}/reports${suffix}`;
};

const logProxyRequest = (req, targetUrl) => {
  console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${targetUrl}`);
  console.log('📨 Request Body:', JSON.stringify(req.body, null, 2));
};

const assignmentEmail = (reportId, reportData, adminName) => ({
  subject: `Report Assignment - ${reportData?.displayId || reportId}`,
  html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Report Assignment</title></head><body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding:30px; border-radius:8px 8px 0 0;"><h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">📋 UMSafe Report System</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="margin:0 0 20px 0; color:#1F2937; font-size:20px; font-weight:600;">Report Assignment Notification</h2><p style="margin:0 0 25px 0; color:#4B5563; font-size:16px; line-height:1.6;">A report has been assigned to <strong style="color:#3B82F6;">${adminName}</strong>.</p><div style="background-color:#F3F4F6; border-left:4px solid #3B82F6; padding:20px; margin:25px 0; border-radius:4px;"><table width="100%" cellpadding="8" cellspacing="0"><tr><td style="color:#6B7280; font-size:14px; width:140px;">Report ID:</td><td style="color:#1F2937; font-size:14px; font-weight:600;">${reportData?.displayId || reportId}</td></tr><tr><td style="color:#6B7280; font-size:14px;">Title:</td><td style="color:#1F2937; font-size:14px; font-weight:500;">${reportData?.title || 'N/A'}</td></tr><tr><td style="color:#6B7280; font-size:14px;">Assigned Officer:</td><td style="color:#3B82F6; font-size:14px; font-weight:600;">${adminName}</td></tr><tr><td style="color:#6B7280; font-size:14px;">Action:</td><td><span style="background-color:#10B981; color:#ffffff; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">Officer Assigned</span></td></tr></table></div><p style="margin:25px 0 0 0; color:#6B7280; font-size:14px; line-height:1.6;">Please log in to the UMSafe system to view full details and take necessary actions.</p></td></tr><tr><td style="background-color:#F9FAFB; padding:20px 30px; border-radius:0 0 8px 8px; border-top:1px solid #E5E7EB;"><p style="margin:0; color:#9CA3AF; font-size:12px; text-align:center;">© ${new Date().getFullYear()} UMSafe - University Maintenance & Safety System<br/>This is an automated notification. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`,
});

const revokeEmail = (reportId, reportData) => ({
  subject: `Report Assignment Revoked - ${reportData?.displayId || reportId}`,
  html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Report Assignment Revoked</title></head><body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding:30px; border-radius:8px 8px 0 0;"><h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">📋 UMSafe Report System</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="margin:0 0 20px 0; color:#1F2937; font-size:20px; font-weight:600;">Report Assignment Revoked</h2><p style="margin:0 0 25px 0; color:#4B5563; font-size:16px; line-height:1.6;">The officer assignment for this report has been revoked and is now unassigned.</p><div style="background-color:#FEF3C7; border-left:4px solid #F59E0B; padding:20px; margin:25px 0; border-radius:4px;"><table width="100%" cellpadding="8" cellspacing="0"><tr><td style="color:#92400E; font-size:14px; width:140px;">Report ID:</td><td style="color:#1F2937; font-size:14px; font-weight:600;">${reportData?.displayId || reportId}</td></tr><tr><td style="color:#92400E; font-size:14px;">Title:</td><td style="color:#1F2937; font-size:14px; font-weight:500;">${reportData?.title || 'N/A'}</td></tr><tr><td style="color:#92400E; font-size:14px;">Action:</td><td><span style="background-color:#F59E0B; color:#ffffff; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">Officer Unassigned</span></td></tr></table></div><p style="margin:25px 0 0 0; color:#6B7280; font-size:14px; line-height:1.6;">Please log in to the UMSafe system to view full details and reassign if necessary.</p></td></tr><tr><td style="background-color:#F9FAFB; padding:20px 30px; border-radius:0 0 8px 8px; border-top:1px solid #E5E7EB;"><p style="margin:0; color:#9CA3AF; font-size:12px; text-align:center;">© ${new Date().getFullYear()} UMSafe - University Maintenance & Safety System<br/>This is an automated notification. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`,
});

const resolveEmail = (reportId, reportData) => ({
  subject: `Report Resolved - ${reportData?.displayId || reportId}`,
  html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Report Resolved</title></head><body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg, #10B981 0%, #059669 100%); padding:30px; border-radius:8px 8px 0 0;"><h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">📋 UMSafe Report System</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="margin:0 0 20px 0; color:#1F2937; font-size:20px; font-weight:600;">✅ Report Resolved</h2><p style="margin:0 0 25px 0; color:#4B5563; font-size:16px; line-height:1.6;">This report has been successfully marked as <strong style="color:#10B981;">Resolved</strong>.</p><div style="background-color:#D1FAE5; border-left:4px solid #10B981; padding:20px; margin:25px 0; border-radius:4px;"><table width="100%" cellpadding="8" cellspacing="0"><tr><td style="color:#065F46; font-size:14px; width:140px;">Report ID:</td><td style="color:#1F2937; font-size:14px; font-weight:600;">${reportData?.displayId || reportId}</td></tr><tr><td style="color:#065F46; font-size:14px;">Title:</td><td style="color:#1F2937; font-size:14px; font-weight:500;">${reportData?.title || 'N/A'}</td></tr><tr><td style="color:#065F46; font-size:14px;">Status:</td><td><span style="background-color:#10B981; color:#ffffff; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">Resolved</span></td></tr></table></div><p style="margin:25px 0 0 0; color:#6B7280; font-size:14px; line-height:1.6;">Please log in to the UMSafe system to view full resolution details.</p></td></tr><tr><td style="background-color:#F9FAFB; padding:20px 30px; border-radius:0 0 8px 8px; border-top:1px solid #E5E7EB;"><p style="margin:0; color:#9CA3AF; font-size:12px; text-align:center;">© ${new Date().getFullYear()} UMSafe - University Maintenance & Safety System<br/>This is an automated notification. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`,
});

const closeEmail = (reportId, reportData) => ({
  subject: `Report Closed - ${reportData?.displayId || reportId}`,
  html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Report Closed</title></head><body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding:30px; border-radius:8px 8px 0 0;"><h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">📋 UMSafe Report System</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="margin:0 0 20px 0; color:#1F2937; font-size:20px; font-weight:600;">🔒 Report Closed</h2><p style="margin:0 0 25px 0; color:#4B5563; font-size:16px; line-height:1.6;">This report has been marked as <strong style=\"color:#6B7280;\">Closed</strong>. The case is now complete.</p><div style="background-color:#F3F4F6; border-left:4px solid #6B7280; padding:20px; margin:25px 0; border-radius:4px;"><table width="100%" cellpadding="8" cellspacing="0"><tr><td style="color:#4B5563; font-size:14px; width:140px;">Report ID:</td><td style="color:#1F2937; font-size:14px; font-weight:600;">${reportData?.displayId || reportId}</td></tr><tr><td style="color:#4B5563; font-size:14px;">Title:</td><td style="color:#1F2937; font-size:14px; font-weight:500;">${reportData?.title || 'N/A'}</td></tr><tr><td style="color:#4B5563; font-size:14px;">Status:</td><td><span style="background-color:#6B7280; color:#ffffff; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">Closed</span></td></tr></table></div><p style="margin:25px 0 0 0; color:#6B7280; font-size:14px; line-height:1.6;">This case is now complete. Please log in to the UMSafe system to view final details and documentation.</p></td></tr><tr><td style="background-color:#F9FAFB; padding:20px 30px; border-radius:0 0 8px 8px; border-top:1px solid #E5E7EB;"><p style="margin:0; color:#9CA3AF; font-size:12px; text-align:center;">© ${new Date().getFullYear()} UMSafe - University Maintenance & Safety System<br/>This is an automated notification. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`,
});

const studentStatusUpdateEmail = (reportId, reportData, newStatus) => {
  const statusColor = newStatus === 'Resolved' ? '#10B981' : '#6B7280';
  const statusIcon = newStatus === 'Resolved' ? '✅' : '🔒';
  const message = newStatus === 'Resolved' 
    ? 'Your report has been successfully resolved. Thank you for using the UMSafe system.'
    : 'Your report has been closed. Thank you for using the UMSafe system.';
  
  return {
    subject: `Your Report Has Been ${newStatus} - ${reportData?.displayId || reportId}`,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Report ${newStatus}</title></head><body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding:30px; border-radius:8px 8px 0 0;"><h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">${statusIcon} UMSafe Report System</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="margin:0 0 20px 0; color:#1F2937; font-size:20px; font-weight:600;">Report Status Updated</h2><p style="margin:0 0 25px 0; color:#4B5563; font-size:16px; line-height:1.6;">${message}</p><div style="background-color:#F0FDF4; border-left:4px solid ${statusColor}; padding:20px; margin:25px 0; border-radius:4px;"><table width="100%" cellpadding="8" cellspacing="0"><tr><td style="color:#065F46; font-size:14px; width:140px;">Report ID:</td><td style="color:#1F2937; font-size:14px; font-weight:600;">${reportData?.displayId || reportId}</td></tr><tr><td style="color:#065F46; font-size:14px;">Title:</td><td style="color:#1F2937; font-size:14px; font-weight:500;">${reportData?.title || 'N/A'}</td></tr><tr><td style="color:#065F46; font-size:14px;">New Status:</td><td><span style="background-color:${statusColor}; color:#ffffff; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">${newStatus}</span></td></tr></table></div><p style="margin:25px 0 0 0; color:#6B7280; font-size:14px; line-height:1.6;">You can log in to the UMSafe system to view complete details of your report. If you have any questions, please contact the support team.</p></td></tr><tr><td style="background-color:#F9FAFB; padding:20px 30px; border-radius:0 0 8px 8px; border-top:1px solid #E5E7EB;"><p style="margin:0; color:#9CA3AF; font-size:12px; text-align:center;">© ${new Date().getFullYear()} UMSafe - University Maintenance & Safety System<br/>This is an automated notification. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`,
  };
};

const chatroomEmail = (reportId, reportData) => ({
  subject: `Chatroom Created - ${reportData?.displayId || reportId}`,
  html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Chatroom Created</title></head><body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f5f5f5;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding:20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);"><tr><td style="background:linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%); padding:30px; border-radius:8px 8px 0 0;"><h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600;">💬 UMSafe Report System</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="margin:0 0 20px 0; color:#1F2937; font-size:20px; font-weight:600;">Chatroom Initiated</h2><p style="margin:0 0 25px 0; color:#4B5563; font-size:16px; line-height:1.6;">A chatroom has been created for direct communication with the student regarding this report.</p><div style="background-color:#F3F4F6; border-left:4px solid #3B82F6; padding:20px; margin:25px 0; border-radius:4px;"><table width="100%" cellpadding="8" cellspacing="0"><tr><td style="color:#6B7280; font-size:14px; width:140px;">Report ID:</td><td style="color:#1F2937; font-size:14px; font-weight:600;">${reportData?.displayId || reportId}</td></tr><tr><td style="color:#6B7280; font-size:14px;">Title:</td><td style="color:#1F2937; font-size:14px; font-weight:500;">${reportData?.title || 'N/A'}</td></tr><tr><td style="color:#6B7280; font-size:14px;">Action:</td><td><span style="background-color:#3B82F6; color:#ffffff; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:600;">Chatroom Created</span></td></tr></table></div><p style="margin:25px 0 0 0; color:#6B7280; font-size:14px; line-height:1.6;">You can now communicate directly with the student. Please log in to the UMSafe system to access the chatroom.</p></td></tr><tr><td style="background-color:#F9FAFB; padding:20px 30px; border-radius:0 0 8px 8px; border-top:1px solid #E5E7EB;"><p style="margin:0; color:#9CA3AF; font-size:12px; text-align:center;">© ${new Date().getFullYear()} UMSafe - University Maintenance & Safety System<br/>This is an automated notification. Please do not reply to this email.</p></td></tr></table></td></tr></table></body></html>`,
});

const gatherRecipients = async (User, adminId, facultyId = null) => {
  console.log('🔍 gatherRecipients called with facultyId:', facultyId);
  // Strict: if facultyId is missing, avoid cross-faculty emails by skipping staff recipients
  if (!facultyId) {
    console.warn('⚠️ Missing facultyId — skipping staff notifications to prevent cross-faculty emails');
    return { superAdminEmails: [], adminEmails: [], officerEmails: [], assignedOfficerEmail: null };
  }
  
  // Build query to filter by faculty if provided
  const superAdminQuery = { role: 'superadmin', 'notifications.emailNotifications': { $ne: false } };
  const adminQuery = { role: 'admin', 'notifications.emailNotifications': { $ne: false } };
  const officerQuery = { role: 'officer', 'notifications.emailNotifications': { $ne: false } };
  
  // Add faculty filter if facultyId is provided
  if (facultyId) {
    console.log('✅ Applying faculty filter:', facultyId);
    superAdminQuery.facultyid = facultyId;
    adminQuery.facultyid = facultyId;
    officerQuery.facultyid = facultyId;
  }
  
  console.log('📊 Queries:', {
    superAdminQuery,
    adminQuery,
    officerQuery
  });
  
  // Get all superadmins, admins, and officers with email notifications enabled
  const superAdmins = await User.find(superAdminQuery);
  const admins = await User.find(adminQuery);
  const officers = await User.find(officerQuery);
  
  console.log('📧 Found recipients:', {
    superAdmins: superAdmins.length,
    admins: admins.length,
    officers: officers.length,
    superAdminFaculties: superAdmins.map(u => ({ email: u.email, facultyid: u.facultyid })),
    adminFaculties: admins.map(u => ({ email: u.email, facultyid: u.facultyid })),
    officerFaculties: officers.map(u => ({ email: u.email, facultyid: u.facultyid }))
  });
  
  const superAdminEmails = superAdmins.map((admin) => admin.email).filter(Boolean);
  const adminEmails = admins.map((admin) => admin.email).filter(Boolean);
  const officerEmails = officers.map((officer) => officer.email).filter(Boolean);
  
  let assignedOfficerEmail = null;
  if (adminId) {
    const officer = await User.findById(adminId);
    if (officer) {
      const hasEmailNotif = officer.notifications?.emailNotifications !== false;
      const sameFaculty = facultyId ? String(officer.facultyid) === String(facultyId) : false;
      console.log('👮 Assigned officer check:', {
        officerEmail: officer.email,
        officerFacultyId: officer.facultyid,
        targetFacultyId: facultyId || 'N/A',
        hasEmailNotif,
        sameFaculty
      });
      if (hasEmailNotif && sameFaculty) {
        assignedOfficerEmail = officer.email || null;
      } else {
        console.warn('🚫 Excluding assigned officer from recipients due to', {
          reason: !hasEmailNotif ? 'notifications disabled' : 'faculty mismatch or missing facultyId'
        });
      }
    }
  }
  
  console.log('✅ Returning emails:', {
    superAdminEmails,
    adminEmails,
    officerEmails,
    assignedOfficerEmail
  });
  
  return { superAdminEmails, adminEmails, officerEmails, assignedOfficerEmail };
};

const sendNotificationEmailsAndEvents = async ({ req, r, reportId, reportData }) => {
  const { default: sendEmail } = await import('../utils/sendEmail.js');
  const { default: User } = await import('../models/User.js');

  // Get student/submitter email from report data
  const getStudentEmail = () => {
    console.log('🔍 Attempting to extract student email from report data...');
    console.log('📊 Report data structure:', JSON.stringify({
      hasUser: !!reportData?.user,
      userEmail: reportData?.user?.email || 'N/A',
      directEmail: reportData?.email || 'N/A',
      userId: reportData?.userId || reportData?.user?.id || 'N/A'
    }, null, 2));
    
    // First try to get from user object (partner API response includes user data)
    if (reportData?.user?.email) {
      console.log('✅ Student email found in reportData.user.email:', reportData.user.email);
      return reportData.user.email;
    }
    // Fallback to direct email field if present
    if (reportData?.email) {
      console.log('✅ Student email found in reportData.email:', reportData.email);
      return reportData.email;
    }
    console.warn('❌ Student email NOT found in report data');
    return null;
  };
  
  // Get faculty ID from report data
  const getFacultyId = () => {
    console.log('🔍 Attempting to extract faculty ID from report data...');
    console.log('📊 Faculty data:', {
      userFacultyId: reportData?.user?.facultyId || 'N/A',
      directFacultyId: reportData?.facultyId || 'N/A'
    });
    
    // Try user.facultyId first (partner API response)
    if (reportData?.user?.facultyId) {
      console.log('✅ Faculty ID found in reportData.user.facultyId:', reportData.user.facultyId);
      return reportData.user.facultyId;
    }
    // Fallback to direct facultyId field
    if (reportData?.facultyId) {
      console.log('✅ Faculty ID found in reportData.facultyId:', reportData.facultyId);
      return reportData.facultyId;
    }
    console.warn('❌ Faculty ID NOT found in report data');
    return null;
  };

  // Assignment
  if (req.originalUrl.includes('/assign-admin') && r.status === 200) {
    const facultyId = getFacultyId();
    const { superAdminEmails, adminEmails, officerEmails, assignedOfficerEmail } = await gatherRecipients(User, req.body.adminId, facultyId);
    const recipientEmails = [...new Set([...superAdminEmails, ...adminEmails, ...officerEmails, assignedOfficerEmail].filter(Boolean))];
    const email = assignmentEmail(reportId, reportData, req.body.adminName || 'Officer');
    await sendEmailIfAny(sendEmail, recipientEmails, email.subject, email.html);
    console.log(`📧 Assignment notification sent to: ${recipientEmails.length} recipients (superadmins, admins, officers in faculty ${facultyId || 'N/A'})`);
    emitEvent('complaint:assignment', { complaintId: reportId, adminId: req.body.adminId, adminName: req.body.adminName || 'Officer', status: reportData?.status });
    if (reportData?.status) emitEvent('complaint:status', { complaintId: reportId, status: reportData.status });
    return;
  }

  // Revoke
  if (req.originalUrl.includes('/revoke-admin') && (r.status === 200 || r.status === 422)) {
    const facultyId = getFacultyId();
    const { superAdminEmails, adminEmails, officerEmails, assignedOfficerEmail } = await gatherRecipients(User, reportData?.adminId, facultyId);
    const recipientEmails = [...new Set([...superAdminEmails, ...adminEmails, ...officerEmails, assignedOfficerEmail].filter(Boolean))];
    const email = revokeEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail, recipientEmails, email.subject, email.html);
    console.log(`📧 Revoke notification sent to: ${recipientEmails.length} recipients (superadmins, admins, officers in faculty ${facultyId || 'N/A'})`);
    emitEvent('complaint:assignment', { complaintId: reportId, adminId: null, adminName: null, status: reportData?.status });
    if (reportData?.status) emitEvent('complaint:status', { complaintId: reportId, status: reportData.status });
    return;
  }

  // Resolve
  if (req.originalUrl.includes('/resolve') && r.status === 200) {
    console.log('📧 Starting RESOLVE notification process...');
    const facultyId = getFacultyId();
    const { superAdminEmails, adminEmails, officerEmails, assignedOfficerEmail } = await gatherRecipients(User, reportData?.adminId, facultyId);
    const recipientEmails = [...new Set([...superAdminEmails, ...adminEmails, ...officerEmails, assignedOfficerEmail].filter(Boolean))];
    
    // Get student email for resolved notification (from report data)
    const studentEmail = getStudentEmail();
    console.log('📬 Student email extracted for RESOLVE:', studentEmail || 'NOT FOUND');
    
    // Send email to staff (admins, superadmins, officers)
    const email = resolveEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail, recipientEmails, email.subject, email.html);
    console.log(`📧 Resolve notification sent to: ${recipientEmails.length} recipients (superadmins, admins, officers in faculty ${facultyId || 'N/A'})`);
    
    // Send email to student
    if (studentEmail) {
      const studentEmail_obj = studentStatusUpdateEmail(reportId, reportData, 'Resolved');
      await sendEmailIfAny(sendEmail, [studentEmail], studentEmail_obj.subject, studentEmail_obj.html);
      console.log(`📧 Resolve notification sent to student: ${studentEmail} (from report data)`);
    } else {
      console.warn('⚠️ Student email not found in report data for resolved notification');
    }
    
    emitEvent('complaint:status', { complaintId: reportId, status: 'Resolved' });
    return;
  }

  // Close
  if (req.originalUrl.includes('/close') && r.status === 200) {
    console.log('📧 Starting CLOSE notification process...');
    const facultyId = getFacultyId();
    const { superAdminEmails, adminEmails, officerEmails, assignedOfficerEmail } = await gatherRecipients(User, reportData?.adminId, facultyId);
    const recipientEmails = [...new Set([...superAdminEmails, ...adminEmails, ...officerEmails, assignedOfficerEmail].filter(Boolean))];
    
    // Get student email for closed notification (from report data)
    const studentEmail = getStudentEmail();
    console.log('📬 Student email extracted for CLOSE:', studentEmail || 'NOT FOUND');
    
    // Send email to staff (admins, superadmins, officers)
    const email = closeEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail, recipientEmails, email.subject, email.html);
    console.log(`📧 Close notification sent to: ${recipientEmails.length} recipients (superadmins, admins, officers in faculty ${facultyId || 'N/A'})`);
    
    // Send email to student
    if (studentEmail) {
      const studentEmail_obj = studentStatusUpdateEmail(reportId, reportData, 'Closed');
      await sendEmailIfAny(sendEmail, [studentEmail], studentEmail_obj.subject, studentEmail_obj.html);
      console.log(`📧 Close notification sent to student: ${studentEmail} (from report data)`);
    } else {
      console.warn('⚠️ Student email not found in report data for closed notification');
    }
    
    emitEvent('complaint:status', { complaintId: reportId, status: 'Closed' });
    return;
  }

  // Chatroom Creation
  if (req.originalUrl.includes('/chatrooms/initiate') && req.method === 'POST' && r.status === 200) {
    const facultyId = getFacultyId();
    const { superAdminEmails, adminEmails, officerEmails, assignedOfficerEmail } = await gatherRecipients(User, reportData?.adminId, facultyId);
    const recipientEmails = [...new Set([...superAdminEmails, ...adminEmails, ...officerEmails, assignedOfficerEmail].filter(Boolean))];
    const email = chatroomEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail, recipientEmails, email.subject, email.html);
    console.log(`📧 Chatroom creation notification sent to: ${recipientEmails.length} recipients (superadmins, admins, officers in faculty ${facultyId || 'N/A'})`);
    emitEvent('complaint:chatroom', { complaintId: reportId, chatroomId: r.data?.chatroom?.id });
  }
};

const buildMobileAdminTargetUrl = (baseUrl, originalUrl) => {

  const suffix = originalUrl.replace(/^\/admin\/mobileAdmin\/users/, '');
  return `${baseUrl.replace(/\/admin$/, '')}/admin/users${suffix}`;
};

// Proxy target builder for user details endpoint
const buildUserDetailsTargetUrl = (baseUrl, originalUrl) => {
  // Map /admin/users/:id/details → {PARTNER_API_BASE_URL without trailing /admin}/admin/users/:id/details
  const suffix = originalUrl.replace(/^\/admin\/users/, '');
  return `${baseUrl.replace(/\/admin$/, '')}/admin/users${suffix}`;
};

export const registerPartnerProxy = (app, partnerApiBaseUrl) => {
  if (!partnerApiBaseUrl) {
    console.warn('PARTNER_API_BASE_URL not set; /admin/reports and /admin/mobileAdmin proxy are disabled');
    return;
  }

  app.all(/^\/admin\/mobileAdmin/, async (req, res) => {
    try {
      const targetUrl = buildMobileAdminTargetUrl(partnerApiBaseUrl, req.originalUrl);
      console.log(`🔄 Proxying Mobile Admin ${req.method} ${req.originalUrl} → ${targetUrl}`);
      console.log('📨 Request Body:', JSON.stringify(req.body, null, 2));

      const cfg = {
        method: req.method,
        url: targetUrl,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          Authorization: req.headers['authorization'] || '',
          'ngrok-skip-browser-warning': 'true',
        },
        data: req.body,
        validateStatus: () => true,
      };

      const r = await axios(cfg);
      console.log(`✅ Mobile Admin Proxy response: ${r.status} from ${targetUrl}`);
      
      if (r.status >= 400) {
        console.error('Partner Mobile Admin API error:', JSON.stringify(r.data, null, 2));
      }

      const contentType = r.headers['content-type'] || 'application/json';
      res.status(r.status).type(contentType).send(r.data);
    } catch (err) {
      console.error('Proxy /admin/usersMobile error:', err.message);
      console.error('   Stack:', err.stack);
      res.status(502).json({ error: 'Mobile Admin Proxy error', detail: err.message });
    }
  });

  // === FEEDBACK ENDPOINT: Fetch feedback for resolved reports ===
  app.get(/^\/admin\/reports\/([^\/]+)\/feedbacks$/, async (req, res) => {
    try {
      const reportIdMatch = req.originalUrl.match(/\/admin\/reports\/([^\/]+)\/feedbacks/);
      const reportId = reportIdMatch ? reportIdMatch[1] : null;
      
      if (!reportId) {
        return res.status(400).json({ error: 'Report ID is required' });
      }

      const targetUrl = `${partnerApiBaseUrl.replace(/\/$/, '')}/reports/${reportId}/feedbacks`;
      console.log(`🔄 Fetching feedback for report: ${reportId} from ${targetUrl}`);

      const cfg = {
        method: 'GET',
        url: targetUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers['authorization'] || '',
          'ngrok-skip-browser-warning': 'true',
        },
        validateStatus: () => true,
      };

      const r = await axios(cfg);
      console.log(`✅ Feedback Proxy response: ${r.status} from ${targetUrl}`);
      
      if (r.status >= 400) {
        console.error('Partner Feedback API error:', JSON.stringify(r.data, null, 2));
      }

      // Normalize response to match expected format if needed
      const responseData = r.data;
      
      const contentType = r.headers['content-type'] || 'application/json';
      res.status(r.status).type(contentType).json(responseData);
    } catch (err) {
      console.error('Proxy /admin/reports/:reportId/feedbacks error:', err.message);
      console.error('   Stack:', err.stack);
      res.status(502).json({ error: 'Feedback Proxy error', detail: err.message });
    }
  });

  // === VALIDATION: Prevent chatroom creation for anonymous complaints & unassigned officers ===
  const validateAnonymousComplaintRestriction = async (req, partnerApiBaseUrl) => {
    try {
      // Check if this is a chatroom initiation request
      if (req.originalUrl.includes('/chatrooms/initiate') && req.method === 'POST') {
        const reportIdMatch = req.originalUrl.match(/\/admin\/reports\/([^\/]+)/);
        if (reportIdMatch && reportIdMatch[1]) {
          const reportId = reportIdMatch[1];
          console.log(`🔒 Checking if report ${reportId} is anonymous and has assigned officer for chatroom creation...`);
          
          // Fetch report details from partner API to check isAnonymous flag and assigned officer
          try {
            const reportResponse = await axios.get(
              `${partnerApiBaseUrl.replace(/\/$/, '')}/reports/${reportId}`,
              {
                headers: {
                  'ngrok-skip-browser-warning': 'true',
                  Authorization: req.headers['authorization'] || '',
                },
                validateStatus: () => true,
              }
            );
            
            const reportData = reportResponse.data?.report || reportResponse.data;
            const isAnonymous = reportData?.isAnonymous === true;
            const adminId = reportData?.adminId || reportData?.assignedTo;
            
            // Check if anonymous
            if (isAnonymous) {
              console.warn(`❌ BLOCKED: Attempted to create chatroom for anonymous complaint ${reportId}`);
              return {
                blocked: true,
                statusCode: 400,
                error: 'Chatroom creation is not allowed for anonymous complaints. The student must be identified before initiating direct communication.',
              };
            }

            // Check if officer is assigned
            if (!adminId || adminId === '' || adminId === null) {
              console.warn(`❌ BLOCKED: Attempted to create chatroom for unassigned complaint ${reportId}`);
              return {
                blocked: true,
                statusCode: 400,
                error: 'Chatroom creation requires an assigned officer. Please assign an officer to this complaint first.',
              };
            }

            console.log(`✅ Report ${reportId} is not anonymous and has assigned officer - chatroom creation allowed`);
          } catch (checkErr) {
            console.warn(`⚠️ Could not verify complaint status for ${reportId}:`, checkErr.message);
            // If we can't verify, allow the request to proceed to partner API
            return { blocked: false };
          }
        }
      }
      return { blocked: false };
    } catch (err) {
      console.error('Error in validation:', err.message);
      return { blocked: false }; // Don't block if validation fails
    }
  };

  // Reports Proxy
  app.all(/^\/admin\/reports/, async (req, res) => {
    try {
      // Check for anonymous complaint restrictions
      const validationResult = await validateAnonymousComplaintRestriction(req, partnerApiBaseUrl);
      if (validationResult.blocked) {
        return res.status(validationResult.statusCode).json({ error: validationResult.error });
      }

      await maybeSaveChatMessage(req);
      await enrichAssignAdminBody(req);
      enrichRevokeAdminBody(req);
      enrichStatusBody(req);

      const targetUrl = buildTargetUrl(partnerApiBaseUrl, req.originalUrl);
      logProxyRequest(req, targetUrl);

      const cfg = {
        method: req.method,
        url: targetUrl,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          Authorization: req.headers['authorization'] || '',
          'ngrok-skip-browser-warning': 'true',
        },
        data: req.body,
        validateStatus: () => true,
      };

      const r = await axios(cfg);
      console.log(`Proxy response: ${r.status} from ${targetUrl}`);
      if (r.status >= 400) {
        console.error('Partner API error:', JSON.stringify(r.data, null, 2));
        console.error('Partner API response headers:', JSON.stringify(r.headers, null, 2));
      }

      if (r.status >= 200 && r.status < 300) {
        try {
          const reportIdMatch = req.originalUrl.match(/\/reports\/([^\/]+)/);
          const reportId = reportIdMatch ? reportIdMatch[1] : null;
          let reportData = r.data?.report || r.data;
          reportData = await fetchReportDetailsIfNeeded(partnerApiBaseUrl, reportId, reportData);
          await sendNotificationEmailsAndEvents({ req, r, reportId, reportData });
        } catch (emailErr) {
          console.error('Failed to send email notification:', emailErr.message);
        }
      }

      const contentType = r.headers['content-type'] || 'application/json';
      res.status(r.status).type(contentType).send(r.data);
    } catch (err) {
      console.error('Proxy /admin/reports error:', err.message);
      console.error('   Stack:', err.stack);
      res.status(502).json({ error: 'Proxy error', detail: err.message });
    }
  });

  // User Details Proxy (Super Admin viewing anonymous report user details)
  app.get(/^\/admin\/users\/[^\/]+\/details$/, async (req, res) => {
    try {
      const targetUrl = buildUserDetailsTargetUrl(partnerApiBaseUrl, req.originalUrl);
      console.log(`🔄 Proxying User Details ${req.method} ${req.originalUrl} → ${targetUrl}`);

      const cfg = {
        method: 'GET',
        url: targetUrl,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          Authorization: req.headers['authorization'] || '',
          'ngrok-skip-browser-warning': 'true',
        },
        validateStatus: () => true,
      };

      const r = await axios(cfg);
      console.log(`✅ User Details Proxy response: ${r.status} from ${targetUrl}`);

      if (r.status >= 400) {
        console.error('Partner User Details API error:', JSON.stringify(r.data, null, 2));
      }

      const contentType = r.headers['content-type'] || 'application/json';
      res.status(r.status).type(contentType).send(r.data);
    } catch (err) {
      console.error('Proxy /admin/users/:id/details error:', err.message);
      console.error('   Stack:', err.stack);
      res.status(502).json({ error: 'User Details Proxy error', detail: err.message });
    }
  });
};
