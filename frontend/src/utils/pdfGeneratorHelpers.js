/**
 * PDF Report Generation utility for complaints
 */

import jsPDF from "jspdf";

export const formatDateForPDF = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const getPDFColors = () => ({
  primary: [79, 70, 229],
  primaryLight: [129, 140, 248],
  secondary: [59, 130, 246],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  dark: [31, 41, 55],
  light: [243, 244, 246],
  white: [255, 255, 255],
  text: [55, 65, 81],
  textLight: [107, 114, 128]
});

export const addPDFHeader = (doc, logo, pageWidth, margin) => {
  const colors = getPDFColors();
  
  // Gradient background
  for (let i = 0; i < 35; i++) {
    const ratio = i / 35;
    const r = colors.primary[0] + (colors.primaryLight[0] - colors.primary[0]) * ratio;
    const g = colors.primary[1] + (colors.primaryLight[1] - colors.primary[1]) * ratio;
    const b = colors.primary[2] + (colors.primaryLight[2] - colors.primary[2]) * ratio;
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageWidth, 1, "F");
  }

  // Logo
  try {
    doc.addImage(logo, "PNG", margin, 8, 22, 22);
  } catch (err) {
    console.warn("Logo not found, skipping image.");
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...colors.white);
  doc.text("COMPLAINT REPORT", pageWidth / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.text("UMSafe Complaint Management System", pageWidth / 2, 25, { align: "center" });

  return 35; // Return Y position after header
};

export const addPDFMetadataBar = (doc, complaint, pageWidth, margin, contentWidth, y) => {
  const colors = getPDFColors();
  
  doc.setFillColor(255, 255, 255, 0.2);
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setTextColor(...colors.white);
  doc.text(`Report Generated: ${formatDateForPDF(new Date())}`, margin + 3, y + 5);
  doc.text(`Document ID: ${complaint.displayId || complaint.id || "N/A"}`, pageWidth - margin - 3, y + 5, { align: "right" });
  
  return y + 12;
};

export const addSectionBox = (doc, x, y, width, height, color) => {
  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, height, 2, 2, "F");
};

export const addSectionTitle = (doc, title, y, margin, colors) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...colors.dark);
  doc.text(title, margin, y);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(...colors.primary);
  doc.line(margin, y + 2, margin + 40, y + 2);
  
  return y + 8;
};

export const addKeyValuePair = (doc, key, value, y, margin, colors, maxWidth = 170) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...colors.text);
  doc.text(`${key}:`, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textLight);
  
  const lines = doc.splitTextToSize(value || "N/A", maxWidth - 40);
  doc.text(lines, margin + 40, y);
  
  return y + (lines.length * 5) + 3;
};

export const wrapText = (doc, text, maxWidth) => {
  return doc.splitTextToSize(text || "N/A", maxWidth);
};

export const checkPageBreak = (doc, currentY, neededSpace, pageHeight, margin) => {
  if (currentY + neededSpace > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return currentY;
};
