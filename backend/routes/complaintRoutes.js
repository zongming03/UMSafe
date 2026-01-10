import express from "express";
import { authMiddleware } from '../middleware/authMiddleware.js';
import complaintController from '../controllers/complaintController.js';
import reportController from '../controllers/reportController.js';
const router = express.Router();

router.get('/', authMiddleware, complaintController.getAllComplaints);
router.get('/:id', authMiddleware, complaintController.getComplaintById);
router.get('/:id/histories', authMiddleware, reportController.getReportHistories);
router.patch('/:id/status', authMiddleware, complaintController.updateComplaintStatus);
router.patch('/:id/assign', authMiddleware, complaintController.assignComplaint);

// Get messages for a specific chatroom
router.get('/:reportId/chatrooms/:chatroomId/chats', authMiddleware, complaintController.getChatroomMessages);

// Webhook endpoint for new complaint notifications (no auth required for external webhooks)
router.post('/webhook/new-complaint', complaintController.handleNewComplaintWebhook);

export default router;