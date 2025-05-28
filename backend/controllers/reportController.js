const Report = require('../models/Report');

// POST /api/reports
exports.createReport = async (req, res) => {
  try {
    const newReport = new Report(req.body);
    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ msg: 'Error creating report' });
  }
};

// GET /api/reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().populate('user_id').populate('admin_id');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch reports' });
  }
};

// PATCH /api/reports/:id/status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Report.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update status' });
  }
};
