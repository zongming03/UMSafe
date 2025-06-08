import axios from 'axios';  

const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
  withCredentials: true, 
});

// Room Management API
export const fetchRooms = () => api.get('/rooms');
export const addRoom = (data) => api.post('/rooms', data);
export const editRoom = (facultyId, blockId, roomId, data) => api.patch(`/rooms/${facultyId}/${blockId}/${roomId}`, data);
export const deleteRoom = (facultyId, blockId, roomId) => api.delete(`/rooms/${facultyId}/${blockId}/${roomId}`);
export const bulkDeleteRooms = (facultyId,rooms)=>api.post(`/rooms/bulk-delete`, { facultyId, rooms });


// Category Management API
export const fetchCategories = () => api.get('/categories');
export const addCategory = (data) => api.post('/categories', data); 
export const updateCategory = (categoryId, data) => api.patch(`/categories/${categoryId}`, data);
export const deleteCategory = (categoryId) => api.delete(`/categories/${categoryId}`);
export const bulkDeleteCategories = (categories) => api.post('/categories/bulk-delete', { categories });


export default api;