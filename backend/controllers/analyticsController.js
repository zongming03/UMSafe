import { countDocuments, aggregate } from '../models/Complaint';

// GET /api/analytics/summary
export async function getComplaintSummary(req, res) {
  try {
    const total = await countDocuments();
    const resolved = await countDocuments({ status: 'Resolved' });
    const open = await countDocuments({ status: 'Open' });
    const urgent = await countDocuments({ urgency: 'High' });

    res.json({ total, resolved, open, urgent });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load summary data' });
  }
}

// GET /api/analytics/categories
export async function getComplaintTypeChart(req, res) {
  try {
    const breakdown = await aggregate([
      { $group: { _id: "$category_id", count: { $sum: 1 } } }
    ]);
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load category chart' });
  }
}

// GET /api/analytics/trend
export async function getComplaintTrends(req, res) {
  try {
    const trends = await aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load trends' });
  }
}
