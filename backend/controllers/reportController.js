import axios from 'axios';

const PARTNER_API_BASE_URL = process.env.PARTNER_API_BASE_URL || process.env.REPORTS_API_BASE_URL || '';

// GET /admin/reports/:id/histories - Get report timeline histories
export const getReportHistories = async (req, res) => {
  try {
    const { id } = req.params;

    if (!PARTNER_API_BASE_URL) {
      return res.status(500).json({ 
        message: 'Partner API not configured',
        reportHistories: []
      });
    }

    // Fetch full report from partner API
    const targetUrl = `${PARTNER_API_BASE_URL.replace(/\/$/, '')}/reports/${id}`;
    
    const response = await axios.get(targetUrl, {
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'ngrok-skip-browser-warning': 'true',
      },
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      console.warn(`⚠️ Partner API returned ${response.status} for report ${id}`);
      return res.status(response.status).json({ 
        message: 'Failed to fetch report from partner API',
        reportHistories: []
      });
    }

    const report = response.data?.report || response.data;
    
    // Extract and format timeline history
    const timelineHistory = report?.timelineHistory || report?.timeline_history || [];
    
    const formattedHistories = timelineHistory
      .map(entry => ({
        actionTitle: entry.actionTitle || entry.action || 'Activity',
        actionDetails: entry.actionDetails || entry.details || null,
        initiator: typeof entry.initiator === 'string' 
          ? entry.initiator 
          : (entry.initiator?.name || entry.initiatorName || 'System'),
        createdAt: entry.createdAt || entry.timestamp || entry.date,
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({
      reportId: id,
      reportHistories: formattedHistories,
      count: formattedHistories.length
    });
  } catch (error) {
    console.error('Error fetching report histories:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch report histories',
      error: error.message,
      reportHistories: []
    });
  }
};

export default { getReportHistories };
