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
 * GET /admin/reports?includeFeedback=true - Fetch all reports with embedded feedback (cached for 30s)
 * Note: This endpoint is expected to proxy the partner source and may ignore faculty filtering server-side.
 * Client will filter by user faculty after fetching.
 */
export const fetchAdminReports = async (includeFeedback = true, skipCache = false) => {
  const cacheKey = `admin_reports_${includeFeedback ? 'with_feedback' : 'no_feedback'}`;

  if (skipCache) {
    apiCache.invalidate(cacheKey);
  }

  const cached = apiCache.get(cacheKey, 30000);
  if (cached) return cached;

  const result = await api.get("/admin/reports", { params: { includeFeedback } });
  apiCache.set(cacheKey, result);
  return result;
};

/**
 * PERFORMANCE OPTIMIZATION: Fetch filtered reports from backend
 * Backend applies all filters before returning, reducing payload and frontend processing.
 * Parameters are passed as query strings to enable efficient backend filtering.
 * 
 * @param {Object} filters - Filter criteria
 * @param {string} filters.from - Start date (YYYY-MM-DD)
 * @param {string} filters.to - End date (YYYY-MM-DD)
 * @param {string} filters.category - Category name
 * @param {string} filters.block - Faculty block
 * @param {string} filters.room - Room name
 * @param {string} filters.status - Complaint status
 * @param {string} filters.priority - Priority level
 * @param {string} filters.officer - Officer/Admin ID
 * @param {string} filters.faculty - Faculty name
 * @param {boolean} filters.includeFeedback - Include feedback data
 * @param {boolean} skipCache - Skip cache
 */
export const fetchFilteredAdminReports = async (filters = {}, skipCache = false) => {
  const {
    from = '',
    to = '',
    category = 'all',
    block = 'all',
    room = 'all',
    status = '',
    priority = '',
    officer = 'all',
    faculty = '',
    includeFeedback = true
  } = filters;

  // Build cache key from filter parameters for better cache granularity
  const cacheKey = `admin_reports_filtered_${from}_${to}_${category}_${block}_${room}_${status}_${priority}_${officer}_${includeFeedback}`;

  if (skipCache) {
    apiCache.invalidate(cacheKey);
  }

  const cached = apiCache.get(cacheKey, 30000);
  if (cached) return cached;

  const params = {
    from,
    to,
    category,
    block,
    room,
    status,
    priority,
    officer,
    faculty,
    includeFeedback
  };

  const result = await api.get("/complaints/filtered", { params });
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
 * POST /reports/{reportId}/histories - Add new timeline entry to report
 * Expects: { status, initiator, actionTitle, actionDetails? }
 */
export const addReportHistory = async (reportId, historyData) => {
  if (!reportId) {
    throw new Error("Report ID is required to add history");
  }
  
  const result = await api.post(`/reports/${reportId}/histories`, historyData);
  
  // Invalidate history cache to fetch fresh data
  apiCache.invalidate(`report_histories_${reportId}`);
  
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

/**
 * PATCH /reports/{reportId}/acknowledge - Acknowledge report by assigned admin
 */
export const acknowledgeReport = async (reportId, data) => {
  const result = await api.patch(`/reports/${reportId}/acknowledge`, data);
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
 * GET /reports/{reportId}/feedbacks - Fetch student feedback for a resolved report
 * Returns feedback data including ratings and comments
 * Expected response: { reportFeedback: { id, reportId, q1Rating, q2Rating, overallComment, createdAt, updatedAt, version } }
 */
export const fetchReportFeedback = async (reportId, skipCache = false) => {
  if (!reportId) {
    throw new Error("Report ID is required to fetch feedback");
  }

  const cacheKey = `report_feedback_${reportId}`;
  
  if (skipCache) {
    apiCache.invalidate(cacheKey);
  }
  
  const cached = apiCache.get(cacheKey, 30000);
  if (cached) return cached;
  
  const result = await api.get(`/reports/${reportId}/feedbacks`);
  apiCache.set(cacheKey, result);
  return result;
};

/**
 * GET /reports/:reportId/chatrooms/:chatroomId/chats - Get chat messages
 * Supports optional `since` query to fetch only new messages.
 */
export const getChatMessages = (reportId, chatroomId, since) => {
  const url = `/reports/${reportId}/chatrooms/${chatroomId}/chats`;
  const config = since ? { params: { since } } : undefined;
  return api.get(url, config).then((res) => res.data);
};

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
  fetchAdminReports,
  getReport,
  getReportHistories,
  addReportHistory,
  assignAdmin,
  revokeReport,
  closeReport,
  resolveReport,
  acknowledgeReport,
  fetchChatrooms,
  initiateChatroom,
  fetchReportFeedback,
  getChatMessages,
  sendMessage,
};

export default reportsApi;
