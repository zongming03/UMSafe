import { Router } from 'express';
const router = Router();
import { getComplaintSummary, getComplaintTypeChart, getComplaintTrends } from '../controllers/analyticsController.js';

// GET /api/analytics/summary
router.get('/summary', getComplaintSummary);

// GET /api/analytics/categories
router.get('/categories', getComplaintTypeChart);

// GET /api/analytics/trend
router.get('/trend', getComplaintTrends);

export default router;