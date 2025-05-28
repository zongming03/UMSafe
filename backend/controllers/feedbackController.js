const Feedback = require('../models/Feedback');

// GET /api/feedback?report_id=
exports.getFeedbackByReport = async (req, res) => {
  try {
    const feedback = await Feedback.find({ report_id: req.query.report_id });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching feedback' });
  }
};
