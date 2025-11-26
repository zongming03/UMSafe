import React, { useState, useEffect, useRef } from "react";
import "../styles/ComplaintDetail.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faBars, 

} from "@fortawesome/free-solid-svg-icons";
import StatusBanner from "../components/StatusBanner";
import ComplaintDetailsCard from "../components/ComplaintDetailsCard";
import ActivityHistory from "../components/ActivityHistory";
import AssignedStaffCard from "../components/AssignedStaffCard";
import QuickActionsCard from "../components/QuickActionCard";
import ComplaintsSidebar from "../components/ComplaintsSidebar";
import CollapsibleMainMenu from "../components/CollapsibleMainMenu";
import CreateChatroomModal from "../components/CreateChatroomModal";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import UMSafeLogo from "../assets/UMSafeLogo.png";
import { initiateChatroom, assignAdmin, revokeReport, resolveReport, closeReport } from "../services/api";
import { toast } from "react-hot-toast";

const ComplaintDetails = () => {
  const [currentStatus, setCurrentStatus] = useState("Open");
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedToName, setAssignedToName] = useState("");
  const [assignedToEmail, setAssignedToEmail] = useState("");
  const [staffMembers, setStaffMembers] = useState([]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [isComplaintsSidebarOpen, setIsComplaintsSidebarOpen] = useState(false);
  const [showChatroomModal, setShowChatroomModal] = useState(false);

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  // complaint may be passed in via navigation state during client-only flows.
  // If not provided (direct URL), fetch the complaint by :id from the server.
  const [complaint, setComplaint] = useState(location.state?.complaint || null);
  const [allComplaints, setAllComplaints] = useState(location.state?.allComplaints || []);
  const isAnonymous = complaint?.isAnonymous || false;

  // Scroll to top when component mounts or complaint changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.id]);

  // Update complaint when navigating from sidebar or direct URL
  useEffect(() => {
    // If complaint is provided in navigation state, use it
    if (location.state?.complaint) {
      setComplaint(location.state.complaint);
      if (location.state.allComplaints) {
        setAllComplaints(location.state.allComplaints);
      }
    } 
    // Otherwise fetch from server
    else if (params?.id) {
      const load = async () => {
        try {
          const res = await fetch(`http://localhost:5000/admin/complaints/${params.id}`, { credentials: "include" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setComplaint(data);
        } catch (err) {
          console.error("Failed to fetch complaint:", err);
          try { toast.error("Failed to load complaint."); } catch (e) {}
          // navigate back to list if fetch fails
          navigate("/complaints");
        }
      };
      load();
    }
  }, [params?.id, location.state, navigate]);

  const statusOptions = ["Resolved", "Closed"];

  const [lastUpdated, setLastUpdated] = useState("");
  const [complaintHistory, setComplaintHistory] = useState([]);

  const statusColors = {
    Open: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    Resolved: "bg-green-100 text-green-800 border-green-200",
    Closed: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const priorityColor = {
    High: "text-red-600 bg-red-50 border-red-100",
    Medium: "text-orange-600 bg-orange-50 border-orange-100",
    Low: "text-green-600 bg-green-50 border-green-100",
  };

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState("PDF");
  const [reportContent, setReportContent] = useState({
    basicDetails: true,
    fullHistory: true,
    attachments: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const statusRef = useRef(null);
  const assignRef = useRef(null);
  const profileRef = useRef(null);

  const handleClickOutside = (event) => {
    if (statusRef.current && !statusRef.current.contains(event.target)) {
      setIsStatusDropdownOpen(false);
    }
    if (assignRef.current && !assignRef.current.contains(event.target)) {
      setIsAssignDropdownOpen(false);
    }
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
  };

  const handleOpenChatroom = async () => {
    try {
      const reportId = complaint.id;

      // ✅ If chatroom already exists, navigate directly
      if (complaint.chatroomId && complaint.chatroomId !== "null") {
        console.log("📬 Navigating to existing chatroom:", complaint.chatroomId);
        return navigate(`/complaints/${reportId}/${complaint.chatroomId}`, { state: complaint });
      }

      // ❓ No chatroom exists - show modal
      setShowChatroomModal(true);
    } catch (err) {
      console.error("❌ Failed to open chatroom:", err);
      toast.error("Failed to open chatroom. Please try again.");
    }
  };

  const handleConfirmCreateChatroom = async () => {
    setShowChatroomModal(false);
    
    try {
      const reportId = complaint.id;
      
      // 🔄 Call backend to create chatroom
      console.log("🆕 Creating new chatroom for report:", reportId);
      const result = await initiateChatroom(reportId);

      console.log("✅ Chatroom created:", result);

      const newChatroomId = result?.chatroom?.id;
      const updatedReport = result?.report;

      if (!newChatroomId) {
        throw new Error("No chatroom ID returned from server");
      }

      toast.success("Chatroom created successfully!");

      // Update complaint state with new chatroomId
      const updatedComplaint = {
        ...complaint,
        chatroomId: newChatroomId,
        ...(updatedReport && { ...updatedReport })
      };

      setComplaint(updatedComplaint);

      // Navigate to the new chatroom
      navigate(`/complaints/${reportId}/${newChatroomId}`, { state: updatedComplaint });
    } catch (err) {
      console.error("❌ Failed to create chatroom:", err);
      toast.error("Failed to create chatroom. Please try again.");
    }
  };

  const handleCancelCreateChatroom = () => {
    setShowChatroomModal(false);
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const complaintAdminId = complaint?.adminId || "";
  // Determine current user (from storage) and role for permission logic
  const storedUserStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const currentUserRole = storedUser?.role || "";
  const currentUserId = storedUser?.id || storedUser?._id || storedUser?.userId || "";
  const isUserAssigned = complaintAdminId && currentUserId && complaintAdminId === currentUserId;
  const isAdminUser = currentUserRole.toLowerCase() === "admin";
  // Non-admin users: hide full quick actions if not assigned; if assigned but not admin hide reassignment only.
  const shouldShowQuickActions = isAdminUser || isUserAssigned;
  const shouldShowReassign = isAdminUser; // Only admin can reassign

  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        // Get current user's faculty
        const userDataStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        const currentUserFacultyId = currentUser?.facultyid;

        // Fetch all users
        const res = await fetch("http://localhost:5000/admin/usersMobile/users", {
          credentials: "include",
        });
        
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        const data = await res.json();
        const allAdmins = data.data || [];
        
        console.log("📋 Fetched all admins from database:", allAdmins);
        console.log("🔍 Looking for adminId:", complaintAdminId);
        
        // Filter admins to show only those from the same faculty
        const sameFacultyAdmins = currentUserFacultyId 
          ? allAdmins.filter(admin => admin.facultyid === currentUserFacultyId)
          : allAdmins;

        // Normalize to the shape expected by QuickActionsCard (adminId, name, email)
        const normalized = sameFacultyAdmins.map((u) => ({
          adminId: u._id,
          name: u.name,
          email: u.email,
        }));
        setStaffMembers(normalized);

        // Match adminId from complaint with fetched admins
        if (complaintAdminId) {
          const matchedAdmin = allAdmins.find(
            (admin) => admin._id === complaintAdminId
          );
          if (matchedAdmin) {
            console.log("✅ Found matching admin:", matchedAdmin);
            console.log("📧 Admin email:", matchedAdmin.email);
            setAssignedToName(matchedAdmin.name);
            setAssignedToEmail(matchedAdmin.email);
          } else {
            console.log("❌ No matching admin found in database for ID:", complaintAdminId);
            console.log("📝 Using fallback adminName from complaint:", complaint?.adminName);
            // Use adminName from complaint object if admin not found in database (e.g., mock data)
            setAssignedToName(complaint?.adminName || "Unknown");
            setAssignedToEmail("N/A");
          }
        } else {
          // No adminId, check if adminName exists directly in complaint
          setAssignedToName(complaint?.adminName || "Not Assigned");
          setAssignedToEmail("N/A");
        }
      } catch (err) {
        console.error("Error fetching admin users:", err);
        setAssignedToName(complaint?.adminName || "Unknown");
      }
    };

    fetchStaffMembers();
  }, [complaintAdminId]);

  // Map partner timelineHistory directly for ActivityHistory (preserve fields)
  useEffect(() => {
    if (complaint && Array.isArray(complaint.timelineHistory) && complaint.timelineHistory.length > 0) {
      const mapped = complaint.timelineHistory
        .slice()
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // chronological ascending
        .map(entry => ({
          id: entry.id,
          actionTitle: entry.actionTitle,
          actionDetails: entry.actionDetails || null,
          initiatorName: typeof entry.initiator === 'string' ? entry.initiator : (entry.initiator && entry.initiator.name) || 'System',
          createdAt: entry.createdAt,
        }));
      setComplaintHistory(mapped);
    }
  }, [complaint]);

  const refreshComplaintFromPartner = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/admin/reports/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Normalize to same shape as initial mapping in list view (minimal fields used here)
      const normalized = {
        ...complaint,
        ...data,
        timelineHistory: data.timelineHistory || data.timeline_history || complaint.timelineHistory || [],
      };
      setComplaint(normalized);
    } catch (err) {
      console.warn('⚠️ Failed to refresh complaint after assign/revoke', err);
    }
  };

  const updateAssignedStaff = async (complaintId, staffId) => {
    try {
      const response = await assignAdmin(complaintId, { adminId: staffId });
      console.log("✅ Partner assign-admin response:", response?.data || response);
      try { toast.success("Admin assigned. Status may auto-update."); } catch (e) {}
      await refreshComplaintFromPartner(complaintId);
    } catch (err) {
      console.error("Failed to update assigned staff via partner API:", err);
      try { toast.error("Failed to reassign complaint"); } catch (e) {}
    }
  };

  const revokeAssignedStaff = async (complaintId) => {
    try {
      const response = await revokeReport(complaintId);
      console.log("✅ Partner revoke-admin response:", response?.data || response);
      try { toast.success("Admin revoked successfully"); } catch (e) {}
      await refreshComplaintFromPartner(complaintId);
    } catch (err) {
      console.error("Failed to revoke assigned staff via partner API:", err);
      try { toast.error("Failed to revoke assignment"); } catch (e) {}
    }
  };

  // Update complaint status (partner reports for CMP-* IDs, fallback to local for others)
  const updateComplaintStatus = async (complaintId, newStatus) => {
    const isPartnerReport = typeof complaintId === 'string' && complaintId.startsWith('CMP-');
    try {
      if (isPartnerReport) {
        // Map statuses to partner endpoints
        if (newStatus === 'Resolved') {
          await resolveReport(complaintId, {});
        } else if (newStatus === 'Closed') {
          await closeReport(complaintId, {});
        } else {
          // No explicit endpoint for 'Open' or 'In Progress' in partner API (assumed)
          console.log(`No partner endpoint for status '${newStatus}', skipping API call.`);
        }
        try { toast.success('Complaint status updated'); } catch (e) {}
      } else {
        // Local MongoDB complaint fallback
        const res = await fetch(
          `http://localhost:5000/admin/complaints/${complaintId}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus }),
          }
        );
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json();
        console.log('✅ Local complaint status updated:', data);
        try { toast.success('Complaint status updated'); } catch (e) {}
      }
    } catch (err) {
      console.error('❌ Failed to update complaint status:', err);
      try { toast.error('Failed to update complaint status'); } catch (e) {}
    }
  };

  const handleStatusChange = (status) => {
    if (status !== currentStatus) {
      setCurrentStatus(status);
      updateHistory(`Status changed to "${status}"`);

      updateComplaintStatus(complaint.id, status);
    }
    setIsStatusDropdownOpen(false);
  };

  const handleAssignChange = (staff) => {
    if (staff.adminId !== assignedToId) {
      setAssignedToId(staff.adminId);
      setAssignedToName(staff.name);
      setAssignedToEmail(staff.email);

      updateAssignedStaff(complaint.id, staff.adminId);
      updateHistory(`Assigned to ${staff.name}`);
    }
    setIsAssignDropdownOpen(false);
  };

  // Legacy function retained but now only updates lastUpdated (timeline comes from partner)
  const updateHistory = (action) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()}, ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    setLastUpdated(formattedDate);
  };

  const handleGenerateReport = (complaint) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);

      // ====== Helper: Format date ======
      const formatDate = (date) => {
        if (!date) return "N/A";
        const d = new Date(date);
        const options = { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        return d.toLocaleDateString('en-US', options);
      };

      // ====== Color Palette ======
      const colors = {
        primary: [79, 70, 229],      // Indigo
        primaryLight: [129, 140, 248], // Light Indigo
        secondary: [59, 130, 246],    // Blue
        success: [16, 185, 129],      // Green
        warning: [245, 158, 11],      // Amber
        danger: [239, 68, 68],        // Red
        dark: [31, 41, 55],           // Gray 800
        light: [243, 244, 246],       // Gray 100
        white: [255, 255, 255],
        text: [55, 65, 81],           // Gray 700
        textLight: [107, 114, 128]    // Gray 500
      };

      // ====== Header Background with Modern Gradient ======
      for (let i = 0; i < 35; i++) {
        const ratio = i / 35;
        const r = colors.primary[0] + (colors.primaryLight[0] - colors.primary[0]) * ratio;
        const g = colors.primary[1] + (colors.primaryLight[1] - colors.primary[1]) * ratio;
        const b = colors.primary[2] + (colors.primaryLight[2] - colors.primary[2]) * ratio;
        doc.setFillColor(r, g, b);
        doc.rect(0, i, pageWidth, 1, "F");
      }

      // ====== Logo and Header ======
      try {
        doc.addImage(UMSafeLogo, "PNG", margin, 8, 22, 22);
      } catch (err) {
        console.warn("Logo not found, skipping image.");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...colors.white);
      doc.text("COMPLAINT REPORT", pageWidth / 2, 18, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("UMSafe Complaint Management System", pageWidth / 2, 25, { align: "center" });

      // ====== Report Metadata Bar ======
      doc.setFillColor(255, 255, 255, 0.2);
      doc.roundedRect(margin, 30, contentWidth, 8, 1, 1, "F");
      doc.setFontSize(9);
      doc.setTextColor(...colors.white);
      doc.text(`Report Generated: ${formatDate(new Date())}`, margin + 3, 35);
      doc.text(`Document ID: ${complaint.displayId || complaint.id || "N/A"}`, pageWidth - margin - 3, 35, { align: "right" });

      // ====== Main Content Starts ======
      let y = 50;

      // ====== Complaint ID & Status Header Card ======
      doc.setFillColor(...colors.light);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");

      // Status Badge
      const statusColorMap = {
        "Open": colors.success,
        "Opened": colors.success,
        "InProgress": colors.secondary,
        "In Progress": colors.secondary,
        "Resolved": colors.primary,
        "Closed": [107, 114, 128],
        "Rejected": colors.danger,
        "Pending": colors.warning
      };
      const statusColor = statusColorMap[complaint.status] || [107, 114, 128];
      doc.setFillColor(...statusColor);
      doc.roundedRect(pageWidth - margin - 50, y + 5, 48, 12, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.white);
      doc.text((complaint.status || "N/A").toUpperCase(), pageWidth - margin - 26, y + 12.5, { align: "center" });

      // Complaint ID
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...colors.dark);
      doc.text(`Complaint #${complaint.displayId || complaint.id || "N/A"}`, margin + 5, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.textLight);
      doc.text(`Category: ${complaint.category?.name || "N/A"} • Priority: ${complaint.category?.priority || "N/A"}`, margin + 5, y + 17);

      y += 30;

      // ====== Reporter Information Section ======
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...colors.dark);
      doc.text("REPORTER INFORMATION", margin, y);
      y += 8;

      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "F");
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      
      const reporterInfo = [
        { label: "Reported By", value: complaint.isAnonymous ? "Anonymous User" : (complaint.username || "Unknown") },
        { label: "User ID", value: complaint.isAnonymous ? "Hidden for Privacy" : (complaint.userId || "N/A") },
        { label: "Date Submitted", value: formatDate(complaint.createdAt) }
      ];

      reporterInfo.forEach((info, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(info.label + ":", margin + 5, y + 7 + (index * 6));
        doc.setFont("helvetica", "normal");
        doc.text(info.value, margin + 45, y + 7 + (index * 6));
      });

      y += 28;

      // ====== Location Information Section ======
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...colors.dark);
      doc.text("LOCATION DETAILS", margin, y);
      y += 8;

      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "F");
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);

      const locationInfo = [
        { label: "Faculty", value: complaint.facultyLocation?.faculty || "N/A" },
        { label: "Block", value: complaint.facultyLocation?.facultyBlock || "N/A" },
        { label: "Room", value: complaint.facultyLocation?.facultyBlockRoom || "N/A" }
      ];

      locationInfo.forEach((info, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(info.label + ":", margin + 5, y + 7 + (index * 6));
        doc.setFont("helvetica", "normal");
        doc.text(info.value, margin + 45, y + 7 + (index * 6));
      });

      y += 28;

      // ====== Complaint Title Section ======
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...colors.dark);
      doc.text("COMPLAINT TITLE", margin, y);
      y += 8;

      doc.setFillColor(254, 252, 232); // Light yellow tint
      doc.roundedRect(margin, y, contentWidth, 15, 2, 2, "F");
      doc.setDrawColor(250, 204, 21);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 15, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...colors.dark);
      const title = complaint.title || "No Title Provided";
      const splitTitle = doc.splitTextToSize(title, contentWidth - 10);
      doc.text(splitTitle, margin + 5, y + 9);

      y += Math.max(15, splitTitle.length * 5 + 10);

      // ====== Description Section ======
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...colors.dark);
      doc.text("DESCRIPTION", margin, y);
      y += 8;

      doc.setFillColor(...colors.white);
      const description = complaint.description || "No description provided";
      const splitDescription = doc.splitTextToSize(description, contentWidth - 10);
      const descHeight = Math.max(30, splitDescription.length * 5 + 10);
      
      doc.roundedRect(margin, y, contentWidth, descHeight, 2, 2, "F");
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, descHeight, 2, 2, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text(splitDescription, margin + 5, y + 8);

      y += descHeight + 8;

      // ====== Assignment Information ======
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...colors.dark);
      doc.text("ASSIGNMENT STATUS", margin, y);
      y += 8;

      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text("Assigned To:", margin + 5, y + 7);
      doc.setFont("helvetica", "normal");
      const assignedName = complaint.adminName || assignedToName || "Unassigned";
      doc.text(assignedName, margin + 35, y + 7);
      
      if (assignedToEmail && assignedToEmail !== "N/A") {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.textLight);
        doc.text(`(${assignedToEmail})`, margin + 35, y + 11);
      }

      y += 22;

      // ====== Timeline History (if available) ======
      if (complaintHistory && complaintHistory.length > 0) {
        // Check if we need a new page
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...colors.dark);
        doc.text("ACTIVITY TIMELINE", margin, y);
        y += 8;

        complaintHistory.slice(0, 5).forEach((event, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          // Timeline item
          doc.setFillColor(249, 250, 251);
          doc.roundedRect(margin, y, contentWidth, 12, 1, 1, "F");

          // Timeline dot
          doc.setFillColor(...colors.primary);
          doc.circle(margin + 3, y + 6, 1.5, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(...colors.dark);
          doc.text(event.actionTitle || "Action", margin + 8, y + 5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...colors.textLight);
          doc.text(formatDate(event.createdAt), margin + 8, y + 9);

          if (event.actionDetails) {
            const details = doc.splitTextToSize(event.actionDetails, contentWidth - 20);
            doc.setFontSize(8);
            doc.setTextColor(...colors.text);
            doc.text(details[0], pageWidth - margin - 5, y + 7, { align: "right" });
          }

          y += 14;
        });
      }

      // ====== Footer ======
      const footerY = pageHeight - 15;
      doc.setDrawColor(...colors.light);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      doc.text("This document is generated automatically by UMSafe Complaint Management System", pageWidth / 2, footerY + 4, { align: "center" });
      doc.text("For inquiries, please contact your system administrator", pageWidth / 2, footerY + 8, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text(`Page 1`, pageWidth - margin, footerY + 6, { align: "right" });

      // ====== Confidentiality Notice (if anonymous) ======
      if (complaint.isAnonymous) {
        doc.setFontSize(7);
        doc.setTextColor(220, 38, 38);
        doc.text("CONFIDENTIAL: This complaint was submitted anonymously. Handle with discretion.", margin, footerY + 11);
      }

      // ====== Save File ======
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `UMSafe_Report_${complaint.displayId || complaint.id}_${timestamp}.pdf`;
      doc.save(filename);
      
      toast.success("Report downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate report. Please try again.");
    }
  };
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Complaints Sidebar (Only show when toggled and allComplaints is available) */}
      {isComplaintsSidebarOpen && allComplaints && allComplaints.length > 0 && (
        <ComplaintsSidebar
          allComplaints={allComplaints}
          currentComplaintId={complaint?.id}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Collapsible Menu */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CollapsibleMainMenu />
            
            {/* Toggle Complaints Sidebar Button */}
            {allComplaints && allComplaints.length > 0 && (
              <button
                onClick={() => setIsComplaintsSidebarOpen(!isComplaintsSidebarOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                title="Toggle Complaints List"
              >
                <FontAwesomeIcon 
                  icon={faBars} 
                  className="text-gray-600 w-4 h-4" 
                />
                <span className="text-sm font-medium text-gray-700">
                  {isComplaintsSidebarOpen ? "Hide" : "Show"} Complaints
                </span>
              </button>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Complaint #{complaint?.displayId || complaint?.id || "N/A"}
          </h1>

          <div className="text-sm text-gray-500">
            Last updated:{" "}
            {complaint?.updatedAt
              ? new Date(complaint.updatedAt).toISOString().split("T")[0]
              : "N/A"}
          </div>
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="complaint-detail-main-container">
            <div className="complaint-detail-main-frame">
              {/* Back Button */}
              <div className="mb-6">
                <button
                  onClick={() => navigate("/complaints")}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back to Complaints
                </button>
              </div>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content Column */}
            <div className="flex-1">
              {/* Status Banner */}
              <StatusBanner
                currentStatus={currentStatus}
                statusColors={statusColors}
                priorityColor={priorityColor}
                priority={complaint.category.priority}
              />

              {/* Complaint Details Card */}
              <ComplaintDetailsCard
                title={complaint?.title || "No Title Provided"}
                description={
                  complaint?.description || "No Description Provided"
                }
                submittedBy={complaint?.username || "Unknown"}
                dateSubmitted={
                  complaint.createdAt
                    ? new Date(complaint.createdAt).toISOString().split("T")[0]
                    : "Unknown"
                }
                category={complaint?.category.name || "Unknown"}
                location={
                  complaint?.facultyLocation.facultyBlockRoom || "Unknown"
                }
                attachments={complaint?.media || []}
              />

              {/* Activity History */}
              <ActivityHistory history={complaintHistory} />
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 space-y-6">
              {/* Quick Actions Card */}
              {shouldShowQuickActions && (
                <QuickActionsCard
                  complaint={complaint}
                  statusRef={statusRef}
                  assignRef={assignRef}
                  isStatusDropdownOpen={isStatusDropdownOpen}
                  setIsStatusDropdownOpen={setIsStatusDropdownOpen}
                  isAssignDropdownOpen={isAssignDropdownOpen}
                  setIsAssignDropdownOpen={setIsAssignDropdownOpen}
                  statusOptions={statusOptions}
                  currentStatus={currentStatus}
                  handleStatusChange={handleStatusChange}
                  staffMembers={staffMembers}
                  assignedTo={assignedToName}
                  handleAssignChange={handleAssignChange}
                  handleRevokeAssignment={revokeAssignedStaff}
                  isReportModalOpen={isReportModalOpen}
                  setIsReportModalOpen={setIsReportModalOpen}
                  reportFormat={reportFormat}
                  setReportFormat={setReportFormat}
                  reportContent={reportContent}
                  setReportContent={setReportContent}
                  isGenerating={isGenerating}
                  handleGenerateReport={handleGenerateReport}
                  isAnonymous={isAnonymous}
                  handleOpenChatroom={handleOpenChatroom}
                  shouldShowReassign={shouldShowReassign}
                />
              )}

              {/* Assigned Staff Card */}
              <AssignedStaffCard
                name={assignedToName || "Not Assigned"}
                email={assignedToEmail || "N/A"}
              />
            </div>
          </div>
            </div>
          </div>
        </main>
      </div>

      {/* Chatroom Creation Modal */}
      <CreateChatroomModal
        isOpen={showChatroomModal}
        onConfirm={handleConfirmCreateChatroom}
        onCancel={handleCancelCreateChatroom}
        complaintId={complaint?.reportId || complaint?.id}
      />
    </div>
  );
};
export default ComplaintDetails;
