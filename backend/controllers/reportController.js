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

// POST /admin/reports/:id/histories - Add new timeline entry to report
export const addReportHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const historyData = req.body;

    // Use reportId from body if URL param is missing, or use URL param
    const reportId = id || historyData.reportId;

    console.log('📝 Add history request - ID from params:', id);
    console.log('📝 Add history request - ID from body:', historyData.reportId);
    console.log('📝 Using reportId:', reportId);
    console.log('📝 Add history request - Body:', historyData);

    if (!PARTNER_API_BASE_URL) {
      return res.status(500).json({ 
        message: 'Partner API not configured'
      });
    }

    // Validate report ID
    if (!reportId || reportId === 'undefined' || reportId === 'null') {
      return res.status(400).json({
        message: 'Valid report ID is required in URL or request body'
      });
    }

    // Validate required fields
    if (!historyData.status) {
      return res.status(400).json({
        message: 'status is required'
      });
    }

    if (!historyData.initiator) {
      return res.status(400).json({
        message: 'initiator is required'
      });
    }

    if (!historyData.actionTitle) {
      return res.status(400).json({
        message: 'actionTitle is required'
      });
    }

    // Validate status enum
    const validStatuses = ['opened', 'inProgress', 'resolved', 'closed'];
    if (!validStatuses.includes(historyData.status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Forward the request to partner API with reportId in body
    const targetUrl = `${PARTNER_API_BASE_URL.replace(/\/$/, '')}/reports/${reportId}/histories`;
    
    const payload = {
      reportId: String(reportId),
      status: historyData.status,
      initiator: String(historyData.initiator),
      actionTitle: String(historyData.actionTitle),
      actionDetails: historyData.actionDetails ? String(historyData.actionDetails) : null
    };

    console.log('📤 Sending to partner API:', targetUrl);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(targetUrl, payload, {
      headers: {
        'Authorization': req.headers['authorization'] || '',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      validateStatus: () => true,
    });

    if (response.status !== 200 && response.status !== 201) {
      console.error(`❌ Partner API error:`, response.data);
      console.error('Partner API response headers:', response.headers);
      console.warn(`⚠️ Partner API returned ${response.status} when adding history to report ${id}`);
      return res.status(response.status).json(
        response.data || { message: 'Failed to add timeline entry' }
      );
    }

    console.log('✅ Timeline entry added successfully');
    res.status(201).json({
      message: 'Timeline entry added successfully',
      data: response.data
    });
  } catch (error) {
    console.error('❌ Error adding report history:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    res.status(500).json({ 
      message: 'Failed to add timeline entry',
      error: error.message
    });
  }
};

export default { getReportHistories, addReportHistory };
