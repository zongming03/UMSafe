// controllers/dashboardController.js
const Report = require('../models/reportModel');
const Category = require('../models/categoryModel');

const getDashboardSummary = async (req, res) => {
  try {
    const totalComplaints = await Report.countDocuments();
    const resolvedComplaints = await Report.countDocuments({ status: 'Resolved' });
    const openComplaints = await Report.countDocuments({ status: 'Open' });
    const urgentComplaints = await Report.countDocuments({ urgency: 'High' });

    const recentComplaints = await Report.find().sort({ created_at: -1 }).limit(5);

    const trendingCategories = await Report.aggregate([
      {
        $group: {
          _id: '$category_id',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'report_categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          category: '$category.name',
          count: 1
        }
      }
    ]);

    res.json({
      totalComplaints,
      resolvedComplaints,
      openComplaints,
      urgentComplaints,
      recentComplaints,
      trendingCategories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardSummary
};
