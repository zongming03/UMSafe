const Report = require('../models/Complaint');

// GET /api/analytics/summary
exports.getComplaintSummary = async (req, res) => {
  try {
    const total = await Report.countDocuments();
    const resolved = await Report.countDocuments({ status: 'Resolved' });
    const open = await Report.countDocuments({ status: 'Open' });
    const urgent = await Report.countDocuments({ urgency: 'High' });

    res.json({ total, resolved, open, urgent });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load summary data' });
  }
};

// GET /api/analytics/categories
exports.getComplaintTypeChart = async (req, res) => {
  try {
    const breakdown = await Report.aggregate([
      { $group: { _id: "$category_id", count: { $sum: 1 } } }
    ]);
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load category chart' });
  }
};

// GET /api/analytics/trend
exports.getComplaintTrends = async (req, res) => {
  try {
    const trends = await Report.aggregate([
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
};
