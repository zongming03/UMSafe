// ExportPDFTemplate.js - Separate component for PDF export HTML generation

export const generatePDFHtml = (complaintsToExport, formatDate) => {
  const timestamp = new Date().toLocaleString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>UMSafe Complaints Export</title>
      <style>
        @media print {
          @page { size: A4 landscape; margin: 1cm; }
          body { margin: 0; }
          .no-print { display: none; }
          .page-break { page-break-after: always; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #1f2937;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          color: #4F46E5;
          font-size: 24px;
        }
        .header .meta {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
        }
        .complaint-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .complaint-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
          border-bottom: 2px solid #f3f4f6;
          padding-bottom: 10px;
        }
        .complaint-id {
          font-size: 18px;
          font-weight: bold;
          color: #4F46E5;
        }
        .complaint-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-opened { background: #FEF3C7; color: #92400E; }
        .status-inprogress { background: #DBEAFE; color: #1E40AF; }
        .status-resolved { background: #D1FAE5; color: #065F46; }
        .status-closed { background: #E5E7EB; color: #374151; }
        .complaint-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #111827;
        }
        .complaint-description {
          margin-bottom: 15px;
          color: #4b5563;
          line-height: 1.6;
        }
        .complaint-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          font-size: 13px;
        }
        .detail-row {
          display: flex;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          width: 130px;
        }
        .detail-value {
          color: #1f2937;
        }
        .print-button {
          background: #4F46E5;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .print-button:hover {
          background: #4338CA;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <div class="header">
        <h1>UMSafe Complaint Management System</h1>
        <div class="meta">
          <strong>Export Report</strong><br>
          Generated: ${timestamp} | Total Records: ${complaintsToExport.length}
        </div>
      </div>
      ${complaintsToExport.map((complaint, index) => `
        <div class="complaint-card">
          <div class="complaint-header">
            <div class="complaint-id">${complaint.displayId || complaint.id}</div>
            <div class="complaint-status status-${complaint.status.toLowerCase()}">${complaint.status}</div>
          </div>
          <div class="complaint-title">${complaint.title}</div>
          <div class="complaint-description">${complaint.description || 'No description provided'}</div>
          <div class="complaint-details">
            <div class="detail-row">
              <span class="detail-label">Category:</span>
              <span class="detail-value">${complaint.category?.name || 'N/A'} (${complaint.category?.priority || 'N/A'} Priority)</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reporter:</span>
              <span class="detail-value">${complaint.isAnonymous ? 'Anonymous' : (complaint.username || 'Unknown')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Assigned To:</span>
              <span class="detail-value">${complaint.adminName || 'Unassigned'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${[complaint.facultyLocation?.faculty, complaint.facultyLocation?.facultyBlock, complaint.facultyLocation?.facultyBlockRoom].filter(Boolean).join(', ') || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span class="detail-value">${formatDate(complaint.createdAt)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last Updated:</span>
              <span class="detail-value">${formatDate(complaint.updatedAt)}</span>
            </div>
          </div>
        </div>
        ${(index + 1) % 3 === 0 && index !== complaintsToExport.length - 1 ? '<div class="page-break"></div>' : ''}
      `).join('')}
    </body>
    </html>
  `;

  return htmlContent;
};
