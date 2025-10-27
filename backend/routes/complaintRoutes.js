import express from "express";

import complaintController from '../controllers/complaintController.js';
const router = express.Router();

router.get('/', complaintController.getAllComplaints);
router.get('/:id', complaintController.getComplaintById);
router.patch('/:id/status', complaintController.updateComplaintStatus);
router.patch('/:id/assign', complaintController.assignComplaint);

export default router;