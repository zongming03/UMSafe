import { find } from '../models/Feedback';

// GET /api/feedback?report_id=
export async function getFeedbackByReport(req, res) {
  try {
    const feedback = await find({ report_id: req.query.report_id });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching feedback' });
  }
}
