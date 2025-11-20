import express from "express";
import { authMiddleware } from '../middleware/authMiddleware.js';
import complaintController from '../controllers/complaintController.js';
const router = express.Router();

router.get('/', authMiddleware, complaintController.getAllComplaints);
router.get('/:id', authMiddleware, complaintController.getComplaintById);
router.patch('/:id/status', authMiddleware, complaintController.updateComplaintStatus);
router.patch('/:id/assign', authMiddleware, complaintController.assignComplaint);

export default router;