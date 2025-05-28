const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

router.get('/', complaintController.getAllComplaints); // Admin/Officer view all
router.get('/:id', complaintController.getComplaintById);
router.patch('/:id/status', complaintController.updateComplaintStatus);
router.patch('/:id/assign', complaintController.assignComplaint);
// router.get('/filter', complaintController.filterComplaints); // query params: status, urgency, etc.

module.exports = router;