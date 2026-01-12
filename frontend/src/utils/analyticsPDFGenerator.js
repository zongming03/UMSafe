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
  locationStats,
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

    // ====== 1) SUMMARY OVERVIEW ======
    if (include.summary && metrics) {
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.darkGray);
      doc.text("1) SUMMARY OVERVIEW", margin, y);
      y += 7;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Key Metrics Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);
      doc.text("Key Metrics:", margin + 2, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);

      const totalComplaints = (complaints || []).length;
      const closedCount = (complaints || []).filter(c => c.status?.toLowerCase() === 'closed').length;
      const resolvedPct = metrics.resolutionRate || 0;

      const metricsLines = [
        [`Total Volume: ${totalComplaints} cases`, `Resolved: ${metrics.resolved || 0}`, `Open: ${metrics.open || 0}`],
        [`In Progress: ${metrics.inProgress || 0}`, `Closed: ${closedCount}`, `Resolution Rate: ${resolvedPct}%`]
      ];

      metricsLines.forEach((line) => {
        if (Array.isArray(line)) {
          let xPos = margin + 4;
          line.forEach((metric, i) => {
            doc.text(metric, xPos, y);
            xPos += (contentWidth / line.length);
          });
        } else {
          doc.text(line, margin + 4, y);
        }
        y += 5;
      });

      y += 3;
    }

    // ====== 2) STATUS DISTRIBUTION ======
    if (include.statusDistribution && complaints) {
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.darkGray);
      doc.text("2) STATUS DISTRIBUTION", margin, y);
      y += 7;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Category Breakdown
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.darkGray);
      doc.text("Category Breakdown:", margin + 2, y);
      y += 5;

      const categoryCounts = {};
      complaints.forEach(c => {
        let category = 'Uncategorized';
        if (c.category) {
          if (typeof c.category === 'object' && c.category.name) {
            category = c.category.name;
          } else if (typeof c.category === 'string') {
            category = c.category;
          } else if (c.categoryName) {
            category = c.categoryName;
          }
        }
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
      const totalComplaints = complaints.length;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);
      sortedCategories.forEach(([category, count]) => {
        const percentage = ((count / totalComplaints) * 100).toFixed(1);
        doc.text(`  • ${category}: ${count} cases (${percentage}%)`, margin + 4, y);
        y += 4;
      });

      y += 4;

      // Priority Breakdown
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.darkGray);
      doc.text("Priority Distribution:", margin + 2, y);
      y += 5;

      const priorityCounts = {};
      const priorityMap = { high: 'High', medium: 'Medium', low: 'Low', normal: 'Medium' };
      complaints.forEach(c => {
        let priority = 'Medium';
        if (c.category && typeof c.category === 'object' && c.category.priority) {
          priority = priorityMap[c.category.priority.toLowerCase()] || c.category.priority;
        } else if (c.priority) {
          priority = priorityMap[c.priority.toLowerCase()] || c.priority;
        }
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);
      Object.entries(priorityCounts).sort((a, b) => {
        const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return (order[a[0]] ?? 99) - (order[b[0]] ?? 99);
      }).forEach(([priority, count]) => {
        const pct = ((count / totalComplaints) * 100).toFixed(1);
        doc.text(`  • ${priority} Priority: ${count} cases (${pct}%)`, margin + 4, y);
        y += 4;
      });

      y += 5;
    }

    // ====== 3) LOCATION HOTSPOTS ======
    if (include.charts && (complaints && complaints.length > 0)) {
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.darkGray);
      doc.text("3) LOCATION HOTSPOTS", margin, y);
      y += 7;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Location hotspots (blocks/rooms tables)
      if (complaints && complaints.length > 0) {
        if (y > pageHeight - 80) {
          doc.addPage();
          y = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.darkGray);
        doc.text("Location Hotspots:", margin + 2, y);
        y += 6;

        // Derive hotspot data from dashboard stats (with complaint fallback)
        const deriveLocations = () => {
          if (locationStats?.blocks?.length || locationStats?.rooms?.length) {
            return {
              blocks: locationStats.blocks || [],
              rooms: locationStats.rooms || [],
            };
          }

          const blockMap = {};
          const roomMap = {};

          complaints.forEach((c) => {
            const faculty = c.facultyLocation?.faculty || c.facultyLocation?.facultyName || c.faculty || 'Unknown';
            const block = c.facultyLocation?.facultyBlock || c.facultyLocation?.block || c.block || 'Unknown';
            const room = c.facultyLocation?.facultyBlockRoom || c.facultyLocation?.room || c.room || 'Unknown';
            const status = String(c.status || '').toLowerCase();

            const isOpen = status === 'open' || status === 'opened' || status === 'pending';
            const isInProgress = status === 'in progress' || status === 'inprogress' || status === 'in-progress';
            const isResolved = status === 'resolved' || status === 'completed';
            const isClosed = status === 'closed';

            const blockKey = `${faculty}|${block}`;
            if (!blockMap[blockKey]) {
              blockMap[blockKey] = { faculty, block, total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
            }
            blockMap[blockKey].total += 1;
            if (isOpen) blockMap[blockKey].open += 1;
            else if (isInProgress) blockMap[blockKey].inProgress += 1;
            else if (isResolved) blockMap[blockKey].resolved += 1;
            else if (isClosed) blockMap[blockKey].closed += 1;

            const roomKey = `${faculty}|${block}|${room}`;
            if (!roomMap[roomKey]) {
              roomMap[roomKey] = { faculty, block, room, total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
            }
            roomMap[roomKey].total += 1;
            if (isOpen) roomMap[roomKey].open += 1;
            else if (isInProgress) roomMap[roomKey].inProgress += 1;
            else if (isResolved) roomMap[roomKey].resolved += 1;
            else if (isClosed) roomMap[roomKey].closed += 1;
          });

          return {
            blocks: Object.values(blockMap).sort((a, b) => b.total - a.total),
            rooms: Object.values(roomMap).sort((a, b) => b.total - a.total),
          };
        };

        const derivedLocations = deriveLocations();
        const topBlocks = (derivedLocations.blocks || []).slice(0, 8);
        const topRooms = (derivedLocations.rooms || []).slice(0, 10);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.darkGray);
        doc.text("Blocks:", margin + 2, y);
        y += 5;

        const blockHeaders = ['Block', 'Cases', 'Open', 'Progress', 'Resolved', 'Closed'];
        const blockColWidths = [68, 18, 18, 22, 22, 22];
        const blockTableWidth = blockColWidths.reduce((sum, w) => sum + w, 0);
        const rowHeight = 5;

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
        doc.rect(margin + 2, y, blockTableWidth, rowHeight, 'F');
        let xPos = margin + 4;
        blockHeaders.forEach((header, i) => {
          doc.text(header, xPos, y + 3.5);
          xPos += blockColWidths[i];
        });
        y += rowHeight;

        // Data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        topBlocks.forEach((block, idx) => {
          if (y > pageHeight - 15) {
            doc.addPage();
            y = margin;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin + 2, y, blockTableWidth, rowHeight, 'F');
          }
          
          // Abbreviate faculty names for better display
          const facultyAbbreviations = {
            'Faculty of Computer Science and Information Technology': 'FCSIT',
            'Faculty of Engineering': 'FE',
            'Faculty of Business and Economics': 'FBE',
            'Faculty of Arts': 'FA',
            'Faculty of Languages': 'FL'
          };
          
          let facultyName = block.faculty || 'Unknown';
          let abbreviation = facultyAbbreviations[facultyName] || facultyName.substring(0, 10);
          let blockLabel = block.faculty && block.faculty !== 'Unknown' ? `${abbreviation}-${block.block}` : block.block;
          
          xPos = margin + 4;
          doc.text(blockLabel || 'Unknown', xPos, y + 3.5);
          xPos += blockColWidths[0];
          doc.text(String(block.total || 0), xPos, y + 3.5);
          xPos += blockColWidths[1];
          doc.text(String(block.open || 0), xPos, y + 3.5);
          xPos += blockColWidths[2];
          doc.text(String(block.inProgress || 0), xPos, y + 3.5);
          xPos += blockColWidths[3];
          doc.text(String(block.resolved || 0), xPos, y + 3.5);
          xPos += blockColWidths[4];
          doc.text(String(block.closed || 0), xPos, y + 3.5);
          y += rowHeight;
        });

        y += 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.darkGray);
        doc.text("Rooms:", margin + 2, y);
        y += 5;

        const roomHeaders = ['Room', 'Block', 'Cases', 'Open', 'Progress', 'Resolved', 'Closed'];
        const roomColWidths = [40, 36, 18, 18, 20, 20, 20];
        const roomTableWidth = roomColWidths.reduce((sum, w) => sum + w, 0);

        // Header
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
        doc.rect(margin + 2, y, roomTableWidth, rowHeight, 'F');
        xPos = margin + 4;
        roomHeaders.forEach((header, i) => {
          doc.text(header, xPos, y + 3.5);
          xPos += roomColWidths[i];
        });
        y += rowHeight;

        // Data
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        topRooms.forEach((room, idx) => {
          if (y > pageHeight - 15) {
            doc.addPage();
            y = margin;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin + 2, y, roomTableWidth, rowHeight, 'F');
          }
          const roomLabel = room.room || 'Unknown';
          const blockLabel = room.block || 'Unknown';
          xPos = margin + 4;
          doc.text(roomLabel, xPos, y + 3.5);
          xPos += roomColWidths[0];
          doc.text(blockLabel, xPos, y + 3.5);
          xPos += roomColWidths[1];
          doc.text(String(room.total || 0), xPos, y + 3.5);
          xPos += roomColWidths[2];
          doc.text(String(room.open || 0), xPos, y + 3.5);
          xPos += roomColWidths[3];
          doc.text(String(room.inProgress || 0), xPos, y + 3.5);
          xPos += roomColWidths[4];
          doc.text(String(room.resolved || 0), xPos, y + 3.5);
          xPos += roomColWidths[5];
          doc.text(String(room.closed || 0), xPos, y + 3.5);
          y += rowHeight;
        });

        y += 5;
      }
    }

    // ====== 4) OFFICER PERFORMANCE ======
    if (include.performance) {
      if (y > pageHeight - 100) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.darkGray);
      doc.text("4) OFFICER PERFORMANCE", margin, y);
      y += 7;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;

      // Team Performance Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.darkGray);
      doc.text("Team Performance Summary:", margin + 2, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.darkGray);

      const avgResponseTime = officerStats?.teamAvg?.avgResponseTime || 0;
      const avgResolutionTime = officerStats?.teamAvg?.avgResolutionTime || 0;
      const slaNormTarget = 72; // SLA standard is 72 hours

      doc.text(`Average Response Time: ${isFinite(avgResponseTime) ? avgResponseTime.toFixed(1) : '0'} hours (Target: ${slaNormTarget}h)`, margin + 4, y);
      y += 5;
      doc.text(`Average Resolution Time: ${isFinite(avgResolutionTime) ? avgResolutionTime.toFixed(1) : '0'} hours`, margin + 4, y);
      y += 6;

      // Officer Performance Table
      if (officerStats?.list?.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.darkGray);
        doc.text("Officer Performance Metrics:", margin + 2, y);
        y += 5;

        const topOfficers = officerStats.list.filter(o => o.total > 0).slice(0, 10);

        const headers = ['Officer Name', 'Cases', 'Resolved', 'Rate', 'Resp.(h)', 'Sat.'];
        const colWidths = [60, 18, 20, 16, 22, 18];
        const rowHeight = 5;

        // Header row
        doc.setFont("helvetica", "bold");
        doc.setFillColor(220, 220, 220);
        doc.rect(margin + 2, y, 154, rowHeight, 'F');
        let xPos = margin + 4;
        headers.forEach((header, i) => {
          doc.setFontSize(8);
          doc.text(header, xPos, y + 3.5);
          xPos += colWidths[i];
        });
        y += rowHeight;

        // Data rows
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        topOfficers.forEach((officer, idx) => {
          if (y > pageHeight - 15) {
            doc.addPage();
            y = margin;
          }

          const rate = officer.total > 0 ? ((officer.resolved / officer.total) * 100).toFixed(0) : '0';
          const rowData = [
            officer.name.length > 18 ? officer.name.substring(0, 16) + '..' : officer.name,
            String(officer.total),
            String(officer.resolved),
            `${rate}%`,
            (officer.avgResponseTime != null && isFinite(officer.avgResponseTime)) ? officer.avgResponseTime.toFixed(1) : '—',
            (officer.avgSat != null && isFinite(officer.avgSat)) ? officer.avgSat.toFixed(1) : '—'
          ];

          if (idx % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin + 2, y, 154, rowHeight, 'F');
          }

          xPos = margin + 4;
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
