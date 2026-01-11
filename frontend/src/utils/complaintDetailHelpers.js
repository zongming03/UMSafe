/**
 * Helper functions for ComplaintDetail page
 */

export const normalizeStatus = (status) => {
  if (!status) return 'Open';
  const lowerStatus = status.toLowerCase().trim();
  if (lowerStatus === 'open' || lowerStatus === 'opened') return 'Open';
  if (lowerStatus === 'inprogress' || lowerStatus === 'in progress' || lowerStatus === 'in-progress') return 'In Progress';
  if (lowerStatus === 'resolved') return 'Resolved';
  if (lowerStatus === 'closed') return 'Closed';
  // Fallback: capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Convert display status to API enum format
 */
export const statusToEnum = (status) => {
  if (!status) return 'opened';
  const lowerStatus = status.toLowerCase().trim();
  if (lowerStatus === 'open' || lowerStatus === 'opened') return 'opened';
  if (lowerStatus === 'inprogress' || lowerStatus === 'in progress' || lowerStatus === 'in-progress') return 'inProgress';
  if (lowerStatus === 'resolved') return 'resolved';
  if (lowerStatus === 'closed') return 'closed';
  // Fallback
  return 'opened';
};

export const getStatusColor = (status) => {
  const statusColors = {
    Open: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    Resolved: "bg-green-100 text-green-800 border-green-200",
    Closed: "bg-slate-200 text-slate-900 border-slate-300",
  };
  
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
  const normalizedStatus = normalizeStatus(status);
  return statusColors[normalizedStatus] || "bg-gray-100 text-gray-800 border-gray-200";
};

export const mapReportToComplaintDetail = (report) => ({
  id: report.id,
  displayId: report.displayId || report.id,
  backendId: report.id,
  userId: report.userId,
  username: report.username,
  adminId: report.adminId,
  adminName: report.adminName || "Unassigned",
  acknowledgeAt: report.acknowledgeAt,
  status: report.status,
  title: report.title,
  description: report.description,
  category: report.category || {},
  media: report.media || [],
  latitude: report.latitude,
  longitude: report.longitude,
  facultyLocation: report.facultyLocation || {},
  isAnonymous: report.isAnonymous,
  isFeedbackProvided: report.isFeedbackProvided,
  chatroomId: report.chatroomId || "",
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  timelineHistory: report.timelineHistory || [],
});

export const mapTimelineHistory = (complaint) => {
  if (!complaint || !Array.isArray(complaint.timelineHistory) || complaint.timelineHistory.length === 0) {
    return [];
  }

  return complaint.timelineHistory
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(entry => ({
      id: entry.id,
      actionTitle: entry.actionTitle,
      actionDetails: entry.actionDetails || null,
      initiatorName: typeof entry.initiator === 'string' ? entry.initiator : (entry.initiator && entry.initiator.name) || 'System',
      createdAt: entry.createdAt,
    }));
};

export const normalizeStaffMembers = (admins) => {
  return admins.map((u) => ({
    adminId: u._id,
    name: u.name,
    email: u.email,
  }));
};

export const findMatchedAdmin = (adminId, allAdmins, fallbackName) => {
  if (!adminId) {
    return {
      name: fallbackName || "Not Assigned",
      email: "N/A"
    };
  }

  const matchedAdmin = allAdmins.find((admin) => admin._id === adminId);
  
  if (matchedAdmin) {
    return {
      name: matchedAdmin.name,
      email: matchedAdmin.email
    };
  }

  return {
    name: fallbackName || "Unknown",
    email: "N/A"
  };
};

export const checkUserPermissions = (storedUser, complaintAdminId) => {
  const currentUserRole = storedUser?.role || "";
  const currentUserId = storedUser?.id || storedUser?._id || storedUser?.userId || "";
  const isUserAssigned = complaintAdminId && currentUserId && complaintAdminId === currentUserId;
  const normalizedRole = currentUserRole.toLowerCase();
  const isSuperAdmin = normalizedRole === "superadmin";
  const isAdminUser = isSuperAdmin || normalizedRole === "admin";

  return {
    currentUserRole,
    currentUserId,
    isUserAssigned,
    isAdminUser,
    isSuperAdmin,
    shouldShowQuickActions: isAdminUser || isUserAssigned,
    shouldShowReassign: isAdminUser
  };
};

export const formatHistoryDate = () => {
  const now = new Date();
  const formattedDate = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()}, ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  return formattedDate;
};
