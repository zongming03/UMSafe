import api from "./api";
import apiCache from "../utils/apiCache";

// ==================== Reports/Complaints Management ====================

/**
 * GET /reports - Fetch all reports/complaints (cached for 30s)
 */
export const fetchReports = async (skipCache = false) => {
  const cacheKey = 'reports_all';
  
  if (skipCache) {
    apiCache.invalidate(cacheKey);
  }
  
  const cached = apiCache.get(cacheKey, 30000);
  if (cached) return cached;
  
  const result = await api.get("/reports");
  apiCache.set(cacheKey, result);
  return result;
};

/**
 * GET /reports/{id} - Get single report details (cached for 20s)
 */
export const getReport = async (reportId, skipCache = false) => {
  const cacheKey = `report_${reportId}`;
  
  if (skipCache) {
    apiCache.invalidate(cacheKey);
  }
  
  const cached = apiCache.get(cacheKey, 20000);
  if (cached) return cached;
  
  const result = await api.get(`/reports/${reportId}`);
  apiCache.set(cacheKey, result);
  return result;
};

/**
 * GET /reports/{reportId}/histories - Get report timeline history (cached for 20s)
 */
export const getReportHistories = async (reportId, skipCache = false) => {
  const cacheKey = `report_histories_${reportId}`;
  
  if (skipCache) {
    apiCache.invalidate(cacheKey);
  }
  
  const cached = apiCache.get(cacheKey, 20000);
  if (cached) return cached;
  
  const result = await api.get(`/reports/${reportId}/histories`);
  apiCache.set(cacheKey, result);
  return result;
};

/**
 * PATCH /reports/{reportId}/assign-admin - Assign admin to report
 */
export const assignAdmin = async (reportId, data) => {
  const result = await api.patch(`/reports/${reportId}/assign-admin`, data);
  // Invalidate related caches
  apiCache.invalidate('reports_all');
  apiCache.invalidate(`report_${reportId}`);
  apiCache.invalidate(`report_histories_${reportId}`);
  return result;
};

/**
 * PATCH /reports/:id/revoke-admin - Revoke report assignment
 */
export const revokeReport = async (reportId) => {
  const result = await api.patch(`/reports/${reportId}/revoke-admin`);
  // Invalidate related caches
  apiCache.invalidate('reports_all');
  apiCache.invalidate(`report_${reportId}`);
  apiCache.invalidate(`report_histories_${reportId}`);
  return result;
};

/**
 * PATCH /reports/:id/close - Close report
 */
export const closeReport = async (reportId, data) => {
  const result = await api.patch(`/reports/${reportId}/close`, data);
  // Invalidate related caches
  apiCache.invalidate('reports_all');
  apiCache.invalidate(`report_${reportId}`);
  apiCache.invalidate(`report_histories_${reportId}`);
  return result;
};

/**
 * PATCH /reports/:id/resolve - Resolve report
 */
export const resolveReport = async (reportId, data) => {
  const result = await api.patch(`/reports/${reportId}/resolve`, data);
  // Invalidate related caches
  apiCache.invalidate('reports_all');
  apiCache.invalidate(`report_${reportId}`);
  apiCache.invalidate(`report_histories_${reportId}`);
  return result;
};

// ==================== Chatroom Management ====================

/**
 * GET /chatrooms - Fetch all chatrooms
 */
export const fetchChatrooms = () => api.get("/chatrooms");

/**
 * POST /reports/{reportId}/chatrooms/initiate - Create new chatroom for report
 * Note: Backend will validate that anonymous complaints cannot have chatrooms created
 */
export const initiateChatroom = async (reportId) => {
  if (!reportId) {
    throw new Error("Report ID is required to create a chatroom");
  }
  const response = await api.post(`/reports/${reportId}/chatrooms/initiate`);
  return response.data;
};

/**
 * GET /reports/:reportId/chatrooms/:chatroomId/chats - Get chat messages
 */
export const getChatMessages = (reportId, chatroomId) =>
  api.get(`/reports/${reportId}/chatrooms/${chatroomId}/chats`)
     .then((res) => res.data);

/**
 * POST /reports/:reportId/chatrooms/:chatroomId/chats - Send chat message
 * Supports both JSON and FormData (for file uploads)
 */
export const sendMessage = async (reportId, chatroomId, messageData) => {
  // Handle file uploads via FormData
  if (messageData instanceof FormData) {
    const res = await api.post(
      `/reports/${reportId}/chatrooms/${chatroomId}/chats`,
      messageData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  }

  // Handle JSON messages
  const res = await api.post(
    `/reports/${reportId}/chatrooms/${chatroomId}/chats`,
    messageData
  );
  return res.data;
};

// Default export for convenience
const reportsApi = {
  fetchReports,
  getReport,
  getReportHistories,
  assignAdmin,
  revokeReport,
  closeReport,
  resolveReport,
  fetchChatrooms,
  initiateChatroom,
  getChatMessages,
  sendMessage,
};

export default reportsApi;
