import express from "express";
import { authMiddleware } from '../middleware/authMiddleware.js';
import complaintController from '../controllers/complaintController.js';
import reportController from '../controllers/reportController.js';
const router = express.Router();

// PERFORMANCE OPTIMIZATION: New filtered endpoint that returns pre-filtered data
// This endpoint applies all filters on the backend before returning, reducing payload and frontend processing
router.get('/filtered', authMiddleware, complaintController.getFilteredReports);

router.get('/', authMiddleware, complaintController.getAllComplaints);
router.get('/:id', authMiddleware, complaintController.getComplaintById);
router.get('/:id/histories', authMiddleware, reportController.getReportHistories);
router.post('/:id/histories', authMiddleware, reportController.addReportHistory);
router.patch('/:id/status', authMiddleware, complaintController.updateComplaintStatus);
router.patch('/:id/assign', authMiddleware, complaintController.assignComplaint);

// Get messages for a specific chatroom
router.get('/:reportId/chatrooms/:chatroomId/chats', authMiddleware, complaintController.getChatroomMessages);



export default router;