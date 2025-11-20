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

  const statusOptions = ["Open", "In Progress", "Resolved", "Closed"];

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

      // ====== Helper: Format date ======
      const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${day}-${month}-${year} ${hours}:${minutes}`;
      };

      // ====== Header Background (Modern Gradient Effect) ======
      const gradientStart = [0, 51, 102]; 
      const gradientEnd = [0, 102, 204]; 
      for (let i = 0; i < 30; i++) {
        const r =
          gradientStart[0] + ((gradientEnd[0] - gradientStart[0]) * i) / 30;
        const g =
          gradientStart[1] + ((gradientEnd[1] - gradientStart[1]) * i) / 30;
        const b =
          gradientStart[2] + ((gradientEnd[2] - gradientStart[2]) * i) / 30;
        doc.setFillColor(r, g, b);
        doc.rect(0, i, 210, 1, "F");
      }

      // ====== Logo and Title ======
      try {
        doc.addImage(UMSafeLogo, "PNG", 14, 5, 20, 20);
      } catch (err) {
        console.warn("Logo not found, skipping image.");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("UMSafe Complaint Report", 105, 20, { align: "center" });

      // ====== Sub Info ======
      doc.setFontSize(11);
      doc.setTextColor(230, 230, 230);
      doc.text(`Generated on: ${formatDate(new Date())}`, 105, 27, {
        align: "center",
      });

      // ====== Section: Complaint Summary Card ======
      let y = 45;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(14, y, 182, 40, 3, 3, "F");

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Complaint Summary", 24, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      y += 18;
      doc.text(`Complaint ID: ${complaint.id || "N/A"}`, 24, y);
      doc.text(`Category: ${complaint.category?.name || "N/A"}`, 24, y + 7);
      doc.text(`Reported By: ${complaint.userId || "Anonymous"}`, 24, y + 14);

      // ====== Section Divider ======
      y += 30;
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.6);
      doc.line(14, y, 196, y);
      y += 10;

      // ====== Section: Complaint Details ======
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 51, 102);
      doc.text("Complaint Details", 14, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const details = [
        ["Status", complaint.status || "N/A"],
        ["Faculty", complaint.facultyLocation?.faculty || "N/A"],
        ["Block", complaint.facultyLocation?.facultyBlock || "N/A"],
        ["Room", complaint.facultyLocation?.facultyBlockRoom || "N/A"],
        ["Date Reported", formatDate(complaint.createdAt)],
      ];

      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), 60, y);
        y += 8;
      });

      // ====== Section Divider ======
      y += 4;
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.4);
      doc.line(14, y, 196, y);
      y += 10;

      // ====== Section: Description Card ======
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(14, y, 182, 50, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 51, 102);
      doc.text("Description", 20, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      const description = complaint.description || "No description provided";
      const splitDescription = doc.splitTextToSize(description, 172);
      doc.text(splitDescription, 20, y + 18);
      y += splitDescription.length * 6 + 30;

      // ====== Section: Status Badge ======
      const statusColors = {
        Pending: [255, 193, 7],
        Rejected: [244, 67, 54],
        Resolved: [33, 150, 243],
        Open: [0, 200, 83],
        InProgress: [3, 155, 229],
        Closed: [96, 125, 139],
      };

      const color = statusColors[complaint.status] || [158, 158, 158];
      doc.setFillColor(...color);
      doc.roundedRect(70, y, 70, 12, 6, 6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`STATUS: ${complaint.status || "N/A"}`, 105, y + 8, {
        align: "center",
      });

      // ====== Footer ======
      doc.setDrawColor(220);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text("Generated by UMSafe Complaint Management System", 105, 292, {
        align: "center",
      });

      // ====== Save File ======
      const filename = `Complaint_Report_${complaint._id || complaint.id}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
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
            Complaint #{complaint?.id || "N/A"}
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
