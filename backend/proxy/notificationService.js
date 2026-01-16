// src/proxy/notificationService.js
import axios from "axios";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import { emitEvent } from "../realtime/socket.js";
import * as Templates from "./emailTemplates.js";

export const fetchReportDetailsIfNeeded = async (
  partnerBaseUrl,
  reportId,
  existing
) => {
  // Always fetch full report with user details for email notifications
  if (!reportId) return existing;

  try {
    const res = await axios.get(
      `${partnerBaseUrl.replace(/\/$/, "")}/reports/${reportId}`,
      {
        headers: { "ngrok-skip-browser-warning": "true" },
      }
    );
    const fullReport = res.data?.report || res.data;

    if (fullReport?.user) {
      console.log("  - User email:", fullReport.user.email);
      console.log("  - User ID:", fullReport.user.id || fullReport.user._id);
    }

    return fullReport;
  } catch (e) {
    console.warn(
      "❌ [FETCH REPORT DETAILS] Could not fetch report details for email notification:",
      e.message
    );
    return existing;
  }
};

export const gatherRecipients = async (
  User,
  adminId,
  currentUserFacultyId = null
) => {
  // Strict: if currentUserFacultyId is missing, skip staff notifications
  if (!currentUserFacultyId) {
    return {
      superAdminEmails: [],
      adminEmails: [],
      assignedOfficerEmail: null,
    };
  }

  try {
    // Fetch all users from the current admin/officer's faculty via API
    const apiUrl = `${
      process.env.HOSTNAME || "http://localhost:5000"
    }/admin/mobile/users/faculty/${currentUserFacultyId}`;

    const response = await axios.get(apiUrl, {
      headers: { "ngrok-skip-browser-warning": "true" },
      validateStatus: () => true,
    });

    if (response.status !== 200 || !response.data?.data) {
      return {
        superAdminEmails: [],
        adminEmails: [],
        assignedOfficerEmail: null,
      };
    }

    const facultyUsers = response.data.data;

    // Filter for super admins and admins only (exclude officers from general notification)
    const superAdminEmails = facultyUsers
      .filter((u) => u.role === "superadmin")
      .map((u) => u.email)
      .filter(Boolean);
    const adminEmails = facultyUsers
      .filter((u) => u.role === "admin")
      .map((u) => u.email)
      .filter(Boolean);

    // Get assigned officer email separately (if adminId provided)
    let assignedOfficerEmail = null;
    if (adminId) {
      const officer = await User.findById(adminId);
      if (officer && officer.notifications?.emailNotifications !== false) {
        assignedOfficerEmail = officer.email || null;
      }
    }

    return { superAdminEmails, adminEmails, assignedOfficerEmail };
  } catch (error) {
    console.error("❌ [GATHER RECIPIENTS] Error:", error.message);
    return {
      superAdminEmails: [],
      adminEmails: [],
      assignedOfficerEmail: null,
    };
  }
};

export const sendEmailIfAny = async (sendEmail, to, subject, html) => {
  if (!to?.length) {
    console.warn("⚠️ [SEND EMAIL] No recipients provided - skipping email");
    return;
  }

  try {
    await sendEmail({ to: to.join(","), subject, html });
    console.log("✅ [SEND EMAIL] Successfully sent email to:", to.join(", "));
  } catch (error) {
    console.error("❌ [SEND EMAIL] Error sending email:", error.message);
  }
};

// --- MAIN EXPORTED FUNCTION ---
export const sendNotificationEmailsAndEvents = async ({ req, r, reportId, reportData, partnerApiBaseUrl }) => {
  // Ensure we have the latest data
  reportData = await fetchReportDetailsIfNeeded(partnerApiBaseUrl, reportId, reportData);

  // Helper to extract student email
  const getStudentEmail = async () => {
    if (reportData?.user?.email) return reportData.user.email;
    if (reportData?.email) return reportData.email;
    return null;
  };

  // Helper to get Current User Faculty
  const getCurrentUserFacultyId = () => req.user?.facultyid || req.user?.facultyId || null;

  const currentUserFacultyId = getCurrentUserFacultyId();
  const studentEmail = await getStudentEmail();

  // 1. ASSIGNMENT
  if (req.originalUrl.includes('/assign-admin') && r.status === 200) {
    const { superAdminEmails, adminEmails, assignedOfficerEmail } = await gatherRecipients(User, req.body.adminId, currentUserFacultyId);
    const recipients = [...new Set([...superAdminEmails, ...adminEmails, assignedOfficerEmail].filter(Boolean))];
    
    // Staff Email
    const email = Templates.assignmentEmail(reportId, reportData, req.body.adminName || 'Officer');
    await sendEmailIfAny(sendEmail,recipients, email.subject, email.html);
    
    // Student Email
    if (!reportData?.isAnonymous && studentEmail) {
      const sEmail = Templates.studentAssignmentEmail(reportId, reportData, req.body.adminName || 'Officer');
      await sendEmailIfAny(sendEmail,[studentEmail], sEmail.subject, sEmail.html);
    }

    emitEvent('complaint:assignment', { complaintId: reportId, displayId: reportData?.displayId, adminId: req.body.adminId, adminName: req.body.adminName, status: reportData?.status });
    if (reportData?.status) emitEvent('complaint:status', { complaintId: reportId, displayId: reportData?.displayId, status: reportData.status });
  }

  // 2. REVOKE
  if (req.originalUrl.includes('/revoke-admin') && (r.status === 200 || r.status === 422)) {
    const { superAdminEmails, adminEmails, assignedOfficerEmail } = await gatherRecipients(User, reportData?.adminId, currentUserFacultyId);
    const recipients = [...new Set([...superAdminEmails, ...adminEmails, assignedOfficerEmail].filter(Boolean))];

    const email = Templates.revokeEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail,recipients, email.subject, email.html);

    if (!reportData?.isAnonymous && studentEmail) {
      const sEmail = Templates.studentRevokeEmail(reportId, reportData);
      await sendEmailIfAny(sendEmail,[studentEmail], sEmail.subject, sEmail.html);
    }

    emitEvent('complaint:assignment', { complaintId: reportId, displayId: reportData?.displayId, adminId: null, adminName: null, status: reportData?.status });
  }

  // 3. RESOLVE
  if (req.originalUrl.includes('/resolve') && r.status === 200) {
    const { superAdminEmails, adminEmails, assignedOfficerEmail } = await gatherRecipients(User,reportData?.adminId, currentUserFacultyId);
    const recipients = [...new Set([...superAdminEmails, ...adminEmails, assignedOfficerEmail].filter(Boolean))];

    const email = Templates.resolveEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail,recipients, email.subject, email.html);

    if (!reportData?.isAnonymous && studentEmail) {
      const sEmail = Templates.studentStatusUpdateEmail(reportId, reportData, 'Resolved');
      await sendEmailIfAny(sendEmail,[studentEmail], sEmail.subject, sEmail.html);
    }

    emitEvent('complaint:status', { complaintId: reportId, displayId: reportData?.displayId, status: 'Resolved' });
  }

  // 4. CLOSE
  if (req.originalUrl.includes('/close') && r.status === 200) {
    const { superAdminEmails, adminEmails, assignedOfficerEmail } = await gatherRecipients(User,reportData?.adminId, currentUserFacultyId);
    const recipients = [...new Set([...superAdminEmails, ...adminEmails, assignedOfficerEmail].filter(Boolean))];

    const email = Templates.closeEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail,recipients, email.subject, email.html);
    if (!reportData?.isAnonymous && studentEmail) {
      const sEmail = Templates.studentStatusUpdateEmail(reportId, reportData, 'Closed');
      await sendEmailIfAny(sendEmail,[studentEmail], sEmail.subject, sEmail.html);
    }

    emitEvent('complaint:status', { complaintId: reportId, displayId: reportData?.displayId, status: 'Closed' });
  }

  // 5. CHATROOM
  if (req.originalUrl.includes('/chatrooms/initiate') && req.method === 'POST' && r.status === 200) {
    const { superAdminEmails, adminEmails, assignedOfficerEmail } = await gatherRecipients(User,reportData?.adminId, currentUserFacultyId);
    const recipients = [...new Set([...superAdminEmails, ...adminEmails, assignedOfficerEmail].filter(Boolean))];

    const email = Templates.chatroomEmail(reportId, reportData);
    await sendEmailIfAny(sendEmail,recipients, email.subject, email.html);
    if (!reportData?.isAnonymous && studentEmail) {
      const sEmail = Templates.studentChatroomEmail(reportId, reportData);
      await sendEmailIfAny(sendEmail,[studentEmail], sEmail.subject, sEmail.html);
    }
    
    emitEvent('complaint:chatroom', { complaintId: reportId, displayId: reportData?.displayId, chatroomId: r.data?.chatroom?.id });
  }
};