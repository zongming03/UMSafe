import axios from "axios";

// Main API instance for auth, rooms, categories, users, profile (localhost)
const api = axios.create({
  baseURL: "http://localhost:5000/admin",
  withCredentials: true,
});

// Reports API instance for complaint/report management
// Now using localhost backend instead of ngrok
const reportsApi = axios.create({
  baseURL: "http://localhost:5000/admin",
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to main API requests
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add auth token to reports API requests
reportsApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== Auth APIs ====================
// Login & Logout
export const login = (credentials) => api.post("/auth/login", credentials);
export const logout = () => api.post("/auth/logout");

// Forgot Password
export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email });

// Reset Password
export const resetPassword = (token, newPassword) =>
  api.post(`/auth/reset-password/${token}`, { password: newPassword });

// ==================== Room Management APIs ====================
export const fetchRooms = () => api.get("/rooms");
export const addRoom = (data) => api.post("/rooms", data);
export const editRoom = (facultyId, blockId, roomId, data) =>
  api.patch(`/rooms/${facultyId}/${blockId}/${roomId}`, data);
export const deleteRoom = (facultyId, blockId, roomId) =>
  api.delete(`/rooms/${facultyId}/${blockId}/${roomId}`);
export const bulkDeleteRooms = (facultyId, rooms) =>
  api.post(`/rooms/bulk-delete`, { facultyId, rooms });

// ==================== Category Management APIs ====================
export const fetchCategories = () => api.get("/categories");
export const addCategory = (data) => api.post("/categories", data);
export const updateCategory = (categoryId, data) =>
  api.patch(`/categories/${categoryId}`, data);
export const deleteCategory = (categoryId) =>
  api.delete(`/categories/${categoryId}`);
export const bulkDeleteCategories = (categories) =>
  api.post("/categories/bulk-delete", { categories });

// ==================== User Management APIs ====================
export const addOfficer = (data) => api.post("/users", data);
export const getAllOfficers = () => api.get("/users");
export const updateOfficer = (id, data) => api.patch(`/users/${id}`, data);
export const deleteOfficer = (id) => api.delete(`/users/${id}`);
export const bulkDeleteOfficers = (officers) =>
  api.post("/users/bulk-delete", { officers });

// ==================== Profile Management APIs ====================
export const getProfile = () => api.get("/profile");
export const updateProfile = (data) =>
  api.patch("/profile", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const changePassword = (data) =>
  api.post("/profile/change-password", data);

// ==================== Reports/Complaints Management APIs (using ngrok) ====================
// 1) GET admin/reports - Fetch all reports/complaints
export const fetchReports = () => reportsApi.get("/reports");

// 2) GET admin/reports/{id} - Get single report/complaint details
export const getReport = (reportId) => reportsApi.get(`/reports/${reportId}`);

// 3) PATCH admin/reports/{reportId}/assign-admin - Assign admin to report
export const assignAdmin = (reportId, data) => 
  reportsApi.patch(`/reports/${reportId}/assign-admin`, data);

// 4) PATCH /reports/:id/revoke - Revoke report assignment
export const revokeReport = (reportId) => 
  reportsApi.patch(`/reports/${reportId}/revoke`);

// 5) PATCH admin/reports/:id/close - Close report
export const closeReport = (reportId, data) => 
  reportsApi.patch(`/reports/${reportId}/close`, data);

// 6) PATCH /reports/:id/resolve - Resolve report
export const resolveReport = (reportId, data) => 
  reportsApi.patch(`/reports/${reportId}/resolve`, data);

// ==================== Chatroom Management APIs (using ngrok) ====================
export const fetchChatrooms = () => api.get("/chatrooms");

// 7) POST admin/reports/{reportId}/chatrooms/initiate - Initiate chatroom
export const initiateChatroom = async (reportId) => {
  const response = await reportsApi.post(`/reports/${reportId}/chatrooms/initiate`);
  return response.data;
};

// 8) GET reports/:reportId/chatrooms/:chatroomId/chats - Get chat messages
export const getChatMessages = (reportId, chatroomId) =>
  reportsApi.get(`/reports/${reportId}/chatrooms/${chatroomId}/chats`)
     .then((res) => res.data);

// 8) POST /reports/:reportId/chatrooms/:chatroomId/chats - Send message
export const sendMessage = async (reportId, chatroomId, messageData) => {
  // If caller passed a FormData (file uploads), let axios send multipart/form-data
  if (messageData instanceof FormData) {
    const res = await reportsApi
      .post(`/reports/${reportId}/chatrooms/${chatroomId}/chats`, messageData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    return res.data;
  }

  // Default: JSON body
  const res_1 = await reportsApi
    .post(`/reports/${reportId}/chatrooms/${chatroomId}/chats`, messageData);
  return res_1.data;
};

export default api;
