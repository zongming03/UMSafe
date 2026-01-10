/**
 * Export utilities for CSV, Excel, and PDF formats
 */

import { formatDate } from './dateUtils';

export const getComplaintsForExport = (complaints, selectedIds) => {
  return complaints.filter(complaint => selectedIds.includes(complaint.id));
};

export const exportToCSV = (complaints, selectedIds) => {
  const complaintsToExport = getComplaintsForExport(complaints, selectedIds);
  if (complaintsToExport.length === 0) return;

  const headers = [
    'Complaint ID',
    'Title',
    'Description',
    'Status',
    'Category',
    'Priority',
    'Reporter',
    'Assigned To',
    'Location',
    'Created Date',
    'Last Updated',
    'Anonymous'
  ];

  const rows = complaintsToExport.map(complaint => [
    complaint.displayId || complaint.id,
    complaint.title,
    complaint.description?.replace(/[\n\r]/g, ' ').replace(/"/g, '""') || 'N/A',
    complaint.status,
    complaint.category?.name || 'N/A',
    complaint.category?.priority || 'N/A',
    complaint.username || 'Unknown',
    complaint.adminName || 'Unassigned',
    `${complaint.facultyLocation?.faculty || ''} ${complaint.facultyLocation?.facultyBlock || ''} ${complaint.facultyLocation?.facultyBlockRoom || ''}`.trim() || 'N/A',
    formatDate(complaint.createdAt),
    formatDate(complaint.updatedAt),
    complaint.isAnonymous ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `UMSafe_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
};

export const exportToExcel = (complaints, selectedIds) => {
  const complaintsToExport = getComplaintsForExport(complaints, selectedIds);
  if (complaintsToExport.length === 0) return;

  const headers = [
    'Complaint ID', 'Title', 'Description', 'Status', 'Category', 'Priority',
    'Reporter', 'Assigned To', 'Faculty', 'Block', 'Room',
    'Created Date', 'Last Updated', 'Anonymous'
  ];

  const rows = complaintsToExport.map(complaint => [
    complaint.displayId || complaint.id,
    complaint.title,
    complaint.description || 'N/A',
    complaint.status,
    complaint.category?.name || 'N/A',
    complaint.category?.priority || 'N/A',
    complaint.username || 'Unknown',
    complaint.adminName || 'Unassigned',
    complaint.facultyLocation?.faculty || 'N/A',
    complaint.facultyLocation?.facultyBlock || 'N/A',
    complaint.facultyLocation?.facultyBlockRoom || 'N/A',
    formatDate(complaint.createdAt),
    formatDate(complaint.updatedAt),
    complaint.isAnonymous ? 'Yes' : 'No'
  ]);

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; text-align: left; border: 1px solid #ddd; }
        td { padding: 10px 8px; border: 1px solid #ddd; vertical-align: top; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
        .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">UMSafe Complaint Management System - Export Report</div>
      <div class="meta">Generated on: ${new Date().toLocaleString()} | Total Records: ${complaintsToExport.length}</div>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
  downloadFile(blob, `UMSafe_Complaints_${new Date().toISOString().slice(0, 10)}.xls`);
};

export const exportToPDF = (complaints, selectedIds, generatePDFHtml) => {
  const complaintsToExport = getComplaintsForExport(complaints, selectedIds);
  if (complaintsToExport.length === 0) return;

  const printWindow = window.open('', '_blank');
  const htmlContent = generatePDFHtml(complaintsToExport, formatDate);
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const downloadFile = (blob, filename) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
