import jsPDF from "jspdf";
import { toast } from "react-hot-toast";

// ====== Helper: Format date ======
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${formatDate(d)} at ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

// ====== Main Analytics PDF Generation Function ======
export const generateAnalyticsPDF = (
  {
    orientation = 'landscape',
    include = {
      summary: true,
      statusDistribution: true,
      charts: true,
      performance: true
    },
    filename = 'Analytics_Report.pdf'
  } = {},
  // Data parameters
  dateRange,
  filters,
  complaints,
  metrics,
  officerStats,
  feedbackMetrics,
  trendChartImage,
  performanceChartImage
) => {
  try {
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;
    const margin = 15;
    const contentWidth = pageWidth - (2 * margin);

    // ====== Color Palette - White Background Only ======
    const colors = {
      white: [255, 255, 255],
      darkGray: [51, 51, 51],
      gray: [102, 102, 102],
      lightGray: [179, 179, 179],
      border: [204, 204, 204]
    };

    let y = margin;

    // ====== HEADER SECTION ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...colors.darkGray);
    doc.text("UMSAFE ANALYTICS REPORT", pageWidth / 2, y, { align: "center" });
    y += 8;

    // Horizontal line separator
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Report metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.gray);
    doc.text(`Report Generated: ${formatDateTime(new Date())}`, margin, y);
    y += 6;

    // ====== REPORT PERIOD & FILTERS ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.darkGray);
    doc.text("REPORT PERIOD & FILTERS", margin, y);
    y += 5;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.darkGray);

    if (dateRange) {
      doc.text(`Analysis Period: ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`, margin, y);
      y += 4;
    }

    if (filters) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Applied Filters:", margin + 2, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const filterEntries = Object.entries(filters).filter(([, v]) => v && v !== 'all');
      filterEntries.forEach(([label, value]) => {
        doc.text(`• ${label}: ${value}`, margin + 4, y);
        y += 3;
      });
    }

    y += 3;

    // ====== EXECUTIVE SUMMARY ======
    if (include.summary && metrics) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.darkGray);
      doc.text("EXECUTIVE SUMMARY", margin, y);
      y += 5;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);

      const totalComplaints = (complaints || []).length;
      const resolvedPct = metrics.resolutionRate || 0;

      const summaryLines = [
        `Total Cases: ${totalComplaints}`,
        `Resolved: ${metrics.resolved || 0} (${resolvedPct}%)`,
        `In Progress: ${metrics.inProgress || 0}`,
        `Open/Pending: ${metrics.open || 0}`,
        `Avg Response Time: ${isFinite(officerStats?.teamAvg?.avgResponseTime) ? officerStats.teamAvg.avgResponseTime.toFixed(1) : '0'} hours`,
        `Avg Resolution Time: ${isFinite(officerStats?.teamAvg?.avgResolutionTime) ? officerStats.teamAvg.avgResolutionTime.toFixed(1) : '0'} hours`,
        `Student Satisfaction: ${isFinite(feedbackMetrics?.avgSatisfaction) ? feedbackMetrics.avgSatisfaction.toFixed(2) : 'N/A'}/5.0`
      ];

      summaryLines.forEach((line) => {
        doc.text(line, margin + 2, y);
        y += 4;
      });

      y += 3;
    }

    // ====== STATUS DISTRIBUTION ======
    if (include.statusDistribution && complaints) {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.darkGray);
      doc.text("STATUS DISTRIBUTION", margin, y);
      y += 5;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);

      const statusCounts = {};
      (complaints || []).forEach(c => {
        const status = (c.status || 'Unknown').toString();
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
      const totalComplaints = complaints.length;

      sortedStatuses.forEach(([status, count]) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }

        const percentage = totalComplaints > 0 ? ((count / totalComplaints) * 100).toFixed(1) : 0;
        const statusLine = `• ${status}: ${count} cases (${percentage}%)`;
        doc.text(statusLine, margin + 2, y);
        y += 4;
      });

      y += 3;
    }

    // ====== CHARTS ======
    if (include.charts) {
      const chartImages = [];

      if (trendChartImage) {
        chartImages.push({ img: trendChartImage, label: 'TREND ANALYSIS', desc: 'Historical pattern of complaint submissions over time' });
      }

      if (performanceChartImage) {
        chartImages.push({ img: performanceChartImage, label: 'OFFICER PERFORMANCE', desc: 'Comparative analysis of officer workload and resolution metrics' });
      }

      chartImages.forEach(({ img, label, desc }) => {
        if (y > pageHeight - 100) {
          doc.addPage();
          y = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...colors.darkGray);
        doc.text(label, margin, y);
        y += 5;

        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...colors.gray);
        doc.text(desc, margin + 2, y);
        y += 5;

        try {
          const imgW = contentWidth;
          const imgH = (imgW / 16) * 9; // 16:9 ratio
          doc.addImage(img, 'PNG', margin, y, imgW, imgH);
          y += imgH + 8;
        } catch (err) {
          console.warn("Chart image could not be added:", err);
          y += 5;
        }
      });
    }

    // ====== OFFICER PERFORMANCE ANALYSIS ======
    if (include.performance && officerStats?.list?.length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.darkGray);
      doc.text("OFFICER PERFORMANCE ANALYSIS", margin, y);
      y += 5;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.darkGray);

      const topOfficers = officerStats.list.filter(o => o.total > 0).slice(0, 8);

      if (topOfficers.length > 0) {
        // Table headers
        const headers = ['Officer', 'Cases', 'Resolved', 'Rate', 'Resp.(h)', 'Resol.(h)', 'Sat.'];
        const colWidths = [50, 20, 22, 18, 25, 28, 20];
        const rowHeight = 5;

        // Header row
        doc.setFont("helvetica", "bold");
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        let xPos = margin + 2;
        headers.forEach((header, i) => {
          doc.text(header, xPos, y + 3.5);
          xPos += colWidths[i];
        });
        y += rowHeight;

        // Data rows
        doc.setFont("helvetica", "normal");
        topOfficers.forEach((officer, idx) => {
          if (y > pageHeight - 15) {
            doc.addPage();
            y = margin;
          }

          const rate = officer.total > 0 ? ((officer.resolved / officer.total) * 100).toFixed(0) : '0';
          const rowData = [
            officer.name.length > 20 ? officer.name.substring(0, 18) + '..' : officer.name,
            String(officer.total),
            String(officer.resolved),
            `${rate}%`,
            (officer.avgResponseTime != null && isFinite(officer.avgResponseTime)) ? officer.avgResponseTime.toFixed(1) : '—',
            (officer.avgResolutionTime != null && isFinite(officer.avgResolutionTime)) ? officer.avgResolutionTime.toFixed(1) : '—',
            (officer.avgSat != null && isFinite(officer.avgSat)) ? officer.avgSat.toFixed(1) : '—'
          ];

          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(margin, y, contentWidth, rowHeight, 'F');
          }

          xPos = margin + 2;
          rowData.forEach((cell, i) => {
            doc.text(cell, xPos, y + 3.5);
            xPos += colWidths[i];
          });
          y += rowHeight;
        });

        y += 5;
      }
    }

    // ====== FOOTER ON ALL PAGES ======
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.lightGray);
      doc.text("UMSafe Analytics Report - Confidential", margin, pageHeight - 5);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 5, { align: "right" });
    }

    // ====== Save File ======
    doc.save(filename);
    toast.success("Analytics report downloaded successfully!");
  } catch (err) {
    console.error("Analytics PDF generation failed:", err);
    toast.error("Failed to generate analytics report. Please try again.");
  }
};
