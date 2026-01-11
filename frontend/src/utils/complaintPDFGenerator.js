import jsPDF from "jspdf";
import toast from "react-hot-toast";
import UMSafeLogo from "../assets/UMSafeLogo.png";

// ====== Helper: Format date (no time) ======
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day} ${getMonthName(d.getMonth())} ${year}`;
};

const getMonthName = (month) => {
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return months[month];
};

// ====== Main PDF Generation Function ======
export const generateComplaintPDF = (complaint, assignedToName, assignedToEmail, complaintHistory) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 18;
    const contentWidth = pageWidth - (2 * margin);

    // ====== Color Palette - White Background Only ======
    const colors = {
      white: [255, 255, 255],
      darkGray: [51, 51, 51],
      gray: [102, 102, 102],
      lightGray: [179, 179, 179],
      border: [204, 204, 204],
      linkBlue: [0, 0, 255]
    };

    let y = margin;

    // ====== Logo at Top Left ======
    try {
      doc.addImage(UMSafeLogo, "PNG", margin, margin, 20, 20);
    } catch (err) {
      console.warn("Logo not found, skipping image.");
    }

    // ====== SECTION 1: HEADER ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...colors.darkGray);
    doc.text("OFFICIAL COMPLAINT REPORT", pageWidth / 2, y + 6, { align: "center" });
    y += 26;

    // Horizontal line separator
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Report metadata header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);

    const reportId = complaint.displayId || complaint.id || "N/A";
    doc.text(`Complaint Reference Number: ${reportId}`, margin, y);
    y += 5;

    const status = complaint.status || "Pending";
    doc.text(`Status: ${status}`, margin, y);
    y += 5;

    doc.text(`Date Submitted: ${formatDate(complaint.createdAt)}`, margin, y);
    y += 5;

    doc.text(`Last Updated: ${formatDate(complaint.updatedAt || complaint.createdAt)}`, margin, y);
    y += 10;


    // ====== SECTION 2: COMPLAINANT INFORMATION ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.darkGray);
    doc.text("COMPLAINANT INFORMATION", margin, y);
    y += 6;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);

    const complainantName = complaint.isAnonymous ? "Anonymous User" : (complaint.username || "Unknown");
    doc.text(`Complainant Name: ${complainantName}`, margin, y);
    y += 5;

    const submittedBy = complaint.isAnonymous ? "Anonymous" : "Non-Anonymous";
    doc.text(`Submitted By: ${submittedBy}`, margin, y);
    y += 5;

    const userIdDisplay = complaint.isAnonymous ? "Hidden for Privacy" : (complaint.userId || "N/A");
    doc.text(`User ID: ${userIdDisplay}`, margin, y);
    y += 10;

    // ====== SECTION 3: COMPLAINT DETAILS ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.darkGray);
    doc.text("COMPLAINT DETAILS", margin, y);
    y += 6;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    doc.text("Title:", margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    const titleText = complaint.title || "No Title Provided";
    const titleLines = doc.splitTextToSize(titleText, contentWidth - 4);
    doc.text(titleLines, margin + 4, y);
    y += (titleLines.length * 5) + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    doc.text("Description:", margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    const descriptionText = complaint.description || "No description provided";
    const descriptionLines = doc.splitTextToSize(descriptionText, contentWidth - 4);
    doc.text(descriptionLines, margin + 4, y);
    y += (descriptionLines.length * 5) + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    doc.text("Category:", margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    const categoryName = complaint.category?.name || "N/A";
    doc.text(categoryName, margin + 4, y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    doc.text("Priority Level:", margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    const priorityLevel = complaint.category?.priority || complaint.priority || "N/A";
    doc.text(priorityLevel, margin + 4, y);
    y += 10;

    // ====== SECTION 4: LOCATION INFORMATION ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.darkGray);
    doc.text("LOCATION INFORMATION", margin, y);
    y += 6;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);

    const faculty = complaint.facultyLocation?.faculty || complaint.facultyLocation?.facultyName || "N/A";
    doc.text(`Faculty: ${faculty}`, margin, y);
    y += 5;

    const block = complaint.facultyLocation?.facultyBlock || "N/A";
    doc.text(`Block: ${block}`, margin, y);
    y += 5;

    const room = complaint.facultyLocation?.facultyBlockRoom || "N/A";
    doc.text(`Room: ${room}`, margin, y);
    y += 5;

    const latitude = complaint.latitude || "N/A";
    doc.text(`Latitude: ${latitude}`, margin, y);
    y += 5;

    const longitude = complaint.longitude || "N/A";
    doc.text(`Longitude: ${longitude}`, margin, y);
    y += 10;

    // ====== SECTION 5: MEDIA ATTACHMENT ======
    if (complaint.attachments && complaint.attachments.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.darkGray);
      doc.text("MEDIA ATTACHMENT", margin, y);
      y += 6;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.darkGray);

      doc.text("Attached Media:", margin, y);
      y += 5;

      doc.setTextColor(...colors.linkBlue);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      complaint.attachments.forEach((attachment, index) => {
        const attachmentUrl = typeof attachment === "string" ? attachment : (attachment.url || "N/A");
        const attachmentLines = doc.splitTextToSize(attachmentUrl, contentWidth - 8);
        doc.text(attachmentLines, margin + 4, y);
        y += (attachmentLines.length * 4) + 2;
      });

      y += 5;
    }

    // ====== SECTION 6: ADMINISTRATIVE HANDLING ======
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.darkGray);
    doc.text("ADMINISTRATIVE HANDLING", margin, y);
    y += 6;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);

    const adminName = complaint.adminName || assignedToName || "Unassigned";
    doc.text(`Assigned Administrator: ${adminName}`, margin, y);
    y += 5;

    const adminId = complaint.adminId || "N/A";
    doc.text(`Administrator ID: ${adminId}`, margin, y);
    y += 10;

    // ====== SECTION 6.5: ACTIVITY TIMELINE (if available) ======
    if (complaintHistory && complaintHistory.length > 0) {
      // Check if we need a new page
      if (y > 240) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...colors.darkGray);
      doc.text("ACTIVITY TIMELINE", margin, y);
      y += 6;

      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colors.gray);
      doc.text(`${complaintHistory.length} recorded activities (showing most recent ${Math.min(5, complaintHistory.length)})`, margin, y);
      y += 6;

      complaintHistory.slice(0, 5).forEach((event, index) => {
        if (y > 265) {
          doc.addPage();
          y = margin;
        }

        // Timeline item
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...colors.darkGray);
        const eventTitle = event.actionTitle || "Action Taken";
        doc.text(`• ${eventTitle}`, margin + 4, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.gray);
        doc.text(`${formatDate(event.createdAt)}`, margin + 8, y);
        y += 4;

        // Event details
        if (event.actionDetails) {
          const details = doc.splitTextToSize(event.actionDetails, contentWidth - 8);
          doc.setFontSize(9);
          doc.setTextColor(...colors.darkGray);
          doc.text(details, margin + 8, y);
          y += (details.length * 4) + 3;
        }

        y += 2;
      });

      y += 4;
    }

    // ====== SECTION 7: DECLARATION / FOOTER ======
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.darkGray);
    doc.text("DECLARATION", margin, y);
    y += 6;

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...colors.gray);

    const declarationText = "This document is generated for official record purposes. No signature is required.";
    const declarationLines = doc.splitTextToSize(declarationText, contentWidth - 4);
    doc.text(declarationLines, margin + 4, y);

    // ====== Bottom Footer ======
    const footerY = pageHeight - 15;
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colors.lightGray);
    doc.text("UMSafe Complaint Management System", pageWidth / 2, footerY, { align: "center" });
    doc.text("This document is system-generated", pageWidth / 2, footerY + 4, { align: "center" });

    // ====== Save File ======
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Complaint_Report_${reportId}_${timestamp}.pdf`;
    doc.save(filename);

    toast.success("Report downloaded successfully!");
  } catch (err) {
    console.error("PDF generation failed:", err);
    toast.error("Failed to generate report. Please try again.");
  }
};
