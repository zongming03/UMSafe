import axios from "axios";

// ==================== API Configuration ====================
// All API calls go through our backend - no direct partner API calls from frontend
const API_BASE = (
  process.env.REACT_APP_API_BASE_URL
).replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
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

// ==================== Faculty Category Management APIs ====================
export const fetchFacultyCategories = (facultyId) => 
  api.get(`/faculty-categories/${facultyId}`);
export const fetchAllFacultyCategories = () => 
  api.get("/faculty-categories");
export const addFacultyCategory = (data) => 
  api.post("/faculty-categories", data);
export const updateFacultyCategory = (facultyId, categoryId, data) =>
  api.patch(`/faculty-categories/${facultyId}/${categoryId}`, data);
export const deleteFacultyCategory = (facultyId, categoryId) =>
  api.delete(`/faculty-categories/${facultyId}/${categoryId}`);
export const bulkDeleteFacultyCategories = (facultyId, categoryIds) =>
  api.post(`/faculty-categories/${facultyId}/bulk-delete`, { categoryIds });

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

export default api;

//Mobile Routes to Partner

export const getAllUsersForMobile = () => api.get("mobile/users");
export const getUsersByFacultyForMobile = (facultyId) => api.get(`mobile/users/faculty/${facultyId}`);
export const getAllRoomsForMobile = () => api.get("mobile/rooms");
export const getAllCategoriesForMobile = () => api.get("mobile/categories");

// ==================== Mobile Admin (Partner) ====================
// Create admin account on partner (mobile) service
export const createMobileAdmin = (data) =>
  api.post("/mobileAdmin/users", data);

// List admin accounts from partner (mobile) service
export const fetchMobileAdmins = () =>
  api.get("/mobileAdmin/users");

// Delete admin account on partner (mobile) service
export const deleteMobileAdmin = (id) =>
  api.delete(`/mobileAdmin/users/${id}`);

// ==================== User Details (Super Admin) ====================
// Get detailed user information by userId (for super admin viewing anonymous reports)
export const getUserDetails = (userId) =>
  api.get(`/users/${userId}/details`);

// ==================== Faculty Info ====================
// Get faculty name by ID
export const getFacultyName = (facultyId) =>
  api.get(`/rooms/faculty/${facultyId}`);
