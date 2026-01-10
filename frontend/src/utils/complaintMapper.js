/**
 * Complaint data transformation utility
 */

import { capitalizeStatus } from './statusUtils';

export const mapReportToComplaint = (report) => ({
  id: report.id || report._id,
  displayId: report.displayId || report.id || report._id,
  userId: report.userId,
  username: report.username,
  adminId: report.adminId || "Unassigned",
  adminName: report.adminName || "Unassigned",
  status: capitalizeStatus(report.status),
  title: report.title,
  description: report.description,
  category: {
    name: report.category?.name || "Unknown",
    priority: report.category?.priority || "Low"
  },
  media: report.media || [],
  latitude: report.latitude,
  longitude: report.longitude,
  facultyLocation: report.facultyLocation || {},
  isAnonymous: report.isAnonymous,
  isFeedbackProvided: report.isFeedbackProvided,
  chatroomId: report.chatroomId || "",
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  version: report.version,
  comments: report.comments || []
});

export const createMinimalComplaint = (payload) => ({
  id: payload.complaintId,
  displayId: payload.complaintId,
  userId: payload.userId || 'Unknown',
  username: payload.username || 'Unknown User',
  adminId: "Unassigned",
  adminName: "Unassigned",
  status: 'Opened',
  title: payload.title || 'New Complaint',
  description: payload.description || '',
  category: { name: 'Unknown', priority: 'Low' },
  media: [],
  latitude: null,
  longitude: null,
  facultyLocation: {},
  isAnonymous: false,
  isFeedbackProvided: false,
  chatroomId: "",
  createdAt: payload.createdAt || new Date().toISOString(),
  updatedAt: payload.createdAt || new Date().toISOString(),
  version: 0,
  comments: []
});
