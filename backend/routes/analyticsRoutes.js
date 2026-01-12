import { Router } from 'express';
const router = Router();
import { getComplaintSummary, getComplaintTypeChart, getComplaintTrends, getCategoryTrendComparison } from '../controllers/analyticsController.js';

// GET /api/analytics/summary
router.get('/summary', getComplaintSummary);

// GET /api/analytics/categories
router.get('/categories', getComplaintTypeChart);

// GET /api/analytics/trend
router.get('/trend', getComplaintTrends);

// POST /api/analytics/category-trend
router.post('/category-trend', getCategoryTrendComparison);

export default router;