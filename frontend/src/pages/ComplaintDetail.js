import React, { useState, useEffect, useRef, useCallback } from "react";
import "../styles/ComplaintDetail.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faBars,
  faUser,

} from "@fortawesome/free-solid-svg-icons";
import StatusBanner from "../components/StatusBanner";
import ComplaintDetailsCard from "../components/ComplaintDetailsCard";
import ActivityHistory from "../components/ActivityHistory";
import AssignedStaffCard from "../components/AssignedStaffCard";
import QuickActionsCard from "../components/QuickActionCard";
import ComplaintsSidebar from "../components/ComplaintsSidebar";
import CollapsibleMainMenu from "../components/CollapsibleMainMenu";
import CreateChatroomModal from "../components/CreateChatroomModal";
import ViewUserDetailsModal from "../components/ViewUserDetailsModal";
import AddTimelineModal from "../components/AddTimelineModal";
import CloseReportModal from "../components/CloseReportModal";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {getUsersByFacultyForMobile, getUserDetails} from "../services/api";
import { getReport, getReportHistories, initiateChatroom, addReportHistory, acknowledgeReport } from "../services/reportsApi";
import { toast } from "react-hot-toast";
import { useComplaintUpdates } from "../hooks/useComplaintUpdates";


import {
  normalizeStatus,
  statusToEnum,
  getStatusColor,
  mapReportToComplaintDetail,
  normalizeStaffMembers,
  findMatchedAdmin,
  checkUserPermissions,
  formatHistoryDate
} from "../utils/complaintDetailHelpers";

import {
  refreshComplaintFromPartner,
  updateAssignedStaff,
  revokeAssignedStaff,
  updateComplaintStatus
} from "../utils/complaintApiHelpers";


import { generateComplaintPDF } from "../utils/complaintPDFGenerator";

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
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showAddTimelineModal, setShowAddTimelineModal] = useState(false);
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();


  const [complaint, setComplaint] = useState(location.state?.complaint || null);
  const [allComplaints, setAllComplaints] = useState(location.state?.allComplaints || []);
  const isAnonymous = complaint?.isAnonymous || false;

  const fetchAndSetHistories = useCallback(async (id) => {
    if (!id) return;
    try {
      const historiesRes = await getReportHistories(id);

      const historiesData = historiesRes.data?.reportHistories || historiesRes.data?.histories || historiesRes.data || [];


      const mappedHistories = historiesData.map(item => {
        const mapped = {
          id: item.id,
          action: item.actionTitle || item.action || "Activity",
          createdAt: item.createdAt || item.timestamp || item.date,
          timestamp: item.createdAt || item.timestamp || item.date,
          initiatorName: item.initiator || item.initiatorName || "System",
          actionTitle: item.actionTitle || item.action || "Activity",
          actionDetails: item.actionDetails || item.details || "",
          details: item.actionDetails || item.details || ""
        };

        return mapped;
      });

      console.log("✅ Final mappedHistories:", mappedHistories);
      setComplaintHistory(mappedHistories);
    } catch (err) {
      console.warn('❌ Failed to refresh histories:', err);
      console.error('Error details:', err.message, err.response?.data);
    }
  }, []);

  
  useComplaintUpdates({
    currentComplaintId: complaint?.id || complaint?.displayId || params?.id,
    showNotifications: false,
    onStatusChange: (payload) => {
      console.log("📡 Received status change event:", payload);
      const matchesId = payload.complaintId === complaint?.id || 
                        payload.complaintId === complaint?.displayId ||
                        payload.complaintId === params?.id;
      
      if (matchesId) {
        console.log("Status change applies to current complaint, updating...");
        const mappedStatus = normalizeStatus(payload.status);
        const targetId = complaint?.id || complaint?.displayId || params?.id;

        // Update complaint object
        setComplaint((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, status: payload.status };
          console.log("Updated complaint with new status:", payload.status);
          return updated;
        });

        // Update the currentStatus state for immediate UI update
        setCurrentStatus(mappedStatus);

        // Keep sidebar list in sync
        if (targetId && allComplaints && allComplaints.length) {
          setAllComplaints((prev) => prev.map((c) => {
            const matches = c.id === targetId || c.displayId === targetId;
            return matches ? { ...c, status: mappedStatus } : c;
          }));
        }

        // Refresh full complaint data and histories
        if (targetId) {
          (async () => {
            const refreshed = await refreshComplaintFromPartner(targetId, complaint || {});
            if (refreshed) {
              setComplaint(refreshed);
              // Re-sync status after refresh
              const refreshedStatus = normalizeStatus(refreshed.status);
              setCurrentStatus(refreshedStatus);
            }
            await fetchAndSetHistories(targetId);
          })();
        }
      } else {
        console.log("❌ Status change doesn't match current complaint. Event ID:", payload.complaintId, "Current ID:", complaint?.id || complaint?.displayId);
      }
    },
    onAssignment: (payload) => {
      console.log("Received assignment change event:", payload);
      const matchesId = payload.complaintId === complaint?.id || 
                        payload.complaintId === complaint?.displayId ||
                        payload.complaintId === params?.id;
      
      if (matchesId) {
        console.log("Assignment change applies to current complaint, updating...");
        setComplaint((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, adminId: payload.adminId, adminName: payload.adminName };
          if (payload.status) {
            updated.status = payload.status;
          }
          console.log("Updated complaint with new assignment:", payload.adminName);
          return updated;
        });
        if (payload.adminId) {
          setAssignedToId(payload.adminId);
          setAssignedToName(payload.adminName || 'Assigned');
        } else {
          setAssignedToId('');
          setAssignedToName('Unassigned');
          setAssignedToEmail('');
        }

        if (payload.status) {
          const mappedStatus = normalizeStatus(payload.status);
          setCurrentStatus(mappedStatus);
        }

        const targetId = complaint?.id || complaint?.displayId || params?.id;
        if (targetId) {
          fetchAndSetHistories(targetId);
        }
      } else {
        console.log("❌ Assignment change doesn't match current complaint. Event ID:", payload.complaintId, "Current ID:", complaint?.id || complaint?.displayId);
      }
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params?.id]);

  useEffect(() => {
    if (params?.id) {
      const load = async () => {
        try {
          const res = await getReport(params.id);
          const report = res.data?.report || res.data?.data || res.data;
          if (!report) throw new Error("No report returned");

          const mapped = mapReportToComplaintDetail(report);
          setComplaint(mapped);
          
          // Extract student details from the report response if available
          const userData = res.data?.user;
          if (userData) {
            console.log("📋 Student Details from Report:", userData);
            console.log("📌 Matric Number:", userData?.matricNumber);
            console.log("👤 Gender:", userData?.gender);
            console.log("📧 Email:", userData?.email);
            console.log("📞 Phone Number:", userData?.phoneNumber);
            setUserDetails(userData);
          }
          
          if (location.state?.allComplaints) {
            setAllComplaints(location.state.allComplaints);
          }

          await fetchAndSetHistories(params.id);
        } catch (err) {
          console.error("Failed to fetch complaint:", err);
          try { toast.error("Failed to load complaint."); } catch (e) {}
          navigate("/complaints");
        }
      };
      load();
    }
  }, [params?.id, location.state?.allComplaints]);

  useEffect(() => {
    if (complaint?.status) {
      const mappedStatus = normalizeStatus(complaint.status);
      console.log(`📊 Complaint status changed, updating UI: ${complaint.status} → ${mappedStatus}`);
      setCurrentStatus(mappedStatus);
    }
  }, [complaint?.status]);

  const statusOptions = ["Resolved", "Closed"];

  const [lastUpdated, setLastUpdated] = useState("");
  const [complaintHistory, setComplaintHistory] = useState([]);

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
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);
  const [isCloseReportModalOpen, setIsCloseReportModalOpen] = useState(false);
  const [statusPendingConfirmation, setStatusPendingConfirmation] = useState(null);

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
      // 🔒 VALIDATION: Prevent any chatroom operations for anonymous complaints
      if (isAnonymous) {
        toast.error("Chatroom is not available for anonymous complaints. The student must be identified first.");
        return;
      }

      // 🔒 VALIDATION: Prevent chatroom if no officer is assigned
      if (!complaintAdminId || complaintAdminId === "") {
        toast.error("Please assign an officer to this complaint before creating a chatroom.");
        return;
      }

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
      // 🔒 VALIDATION: Prevent chatroom creation for anonymous complaints
      if (isAnonymous) {
        toast.error("Chatroom cannot be created for anonymous complaints. The student must be identified first.");
        return;
      }

      // 🔒 VALIDATION: Prevent chatroom creation if no officer is assigned
      if (!complaintAdminId || complaintAdminId === "") {
        toast.error("Chatroom cannot be created without an assigned officer. Please assign an officer first.");
        return;
      }

      // Prefer backend id if provided; fall back to displayed id
      const reportId = complaint.backendId || complaint.id;

      // Prevent empty/undefined IDs; live backend IDs can include prefixes like RPT-
      if (!reportId) {
        toast.error("Chatroom can only be created for live reports.");
        return;
      }
      
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

  const handleViewUserDetails = async () => {
    if (!complaint?.userId) {
      toast.error("User ID not available");
      return;
    }

    setIsLoadingUserDetails(true);
    setShowUserDetailsModal(true);

    try {
      const response = await getUserDetails(complaint.userId);
      const userData = response.data?.user || response.data;
      console.log("📋 User Details Fetched:", userData);
      console.log("📌 Matric Number:", userData?.matricNumber);
      console.log("👤 Gender:", userData?.gender);
      console.log("📧 Email:", userData?.email);
      console.log("📞 Phone Number:", userData?.phoneNumber);
      setUserDetails(userData);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast.error("Failed to load user details");
      setShowUserDetailsModal(false);
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  const handleCloseUserDetailsModal = () => {
    setShowUserDetailsModal(false);
    setUserDetails(null);
  };

  const handleAddTimelineClick = () => {
    // Check if the complaint has been acknowledged before allowing timeline addition
    if (!complaint?.acknowledgeAt) {
      toast.error("You must acknowledge this report before adding timeline entries.");
      return;
    }
    setShowAddTimelineModal(true);
  };

  const handleAddTimeline = async (timelineData) => {
    // Double-check acknowledgment before proceeding
    if (!complaint?.acknowledgeAt) {
      toast.error("You must acknowledge this report before adding timeline entries.");
      return;
    }
    
    setIsAddingTimeline(true);
    try {
      // Get reportId with multiple fallbacks
      const reportId = complaint?.id || complaint?.backendId || complaint?.displayId || params?.id;
      console.log("📝 Complaint object:", {
        id: complaint?.id,
        backendId: complaint?.backendId,
        displayId: complaint?.displayId,
        paramsId: params?.id
      });
      console.log("📝 Selected report ID:", reportId);
      console.log("📝 Timeline data received:", timelineData);
      
      if (!reportId) {
        throw new Error("Report ID is required");
      }

      // Include reportId in the timeline data for backend processing
      const dataWithReportId = {
        status: timelineData.status,
        initiator: timelineData.initiator,
        actionTitle: timelineData.actionTitle,
        actionDetails: timelineData.actionDetails,
        reportId: reportId
      };
      
      console.log("📤 Sending to backend:", dataWithReportId);

      // Timeline data already includes the current status from the modal
      await addReportHistory(reportId, dataWithReportId);
      
      toast.success("Timeline entry added successfully!");
      
      // Refresh the history to show the new entry
      await fetchAndSetHistories(reportId);
    } catch (error) {
      console.error("Failed to add timeline entry:", error);
      toast.error(error.message || "Failed to add timeline entry");
      throw error;
    } finally {
      setIsAddingTimeline(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!isUserAssigned) {
      toast.error("Only the assigned officer can acknowledge this report.");
      return;
    }

    if (complaint?.acknowledgeAt) {
      toast.success("Already acknowledged.");
      return;
    }

    const reportId = complaint?.id || complaint?.displayId || params?.id;
    if (!reportId) {
      toast.error("Report ID is missing.");
      return;
    }

    const initiatorName = storedUser?.name || "Admin";
    const acknowledgeAt = new Date().toISOString();

    setIsAcknowledging(true);
    try {
      const res = await acknowledgeReport(reportId, { initiatorName, acknowledgeAt });
      const updated = res?.data?.report || res?.data;
      if (updated) {
        const mapped = mapReportToComplaintDetail(updated);
        setComplaint(mapped);
      }

      await fetchAndSetHistories(reportId);
      toast.success("Report acknowledged.");
    } catch (err) {
      console.error("Failed to acknowledge report:", err);
      toast.error(err?.response?.data?.error || err.message || "Failed to acknowledge");
    } finally {
      setIsAcknowledging(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const complaintAdminId = complaint?.adminId || "";
  const storedUserStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  
  const {
    isUserAssigned,
    isAdminUser,
    isSuperAdmin,
    shouldShowQuickActions,
    shouldShowReassign
  } = checkUserPermissions(storedUser, complaintAdminId);

  const canViewAnonymousDetails = !isAnonymous || isSuperAdmin;

  const displayedTitle = complaint?.title || "No Title Provided";
  const displayedDescription = canViewAnonymousDetails
    ? (complaint?.description || "No Description Provided")
    : "Details hidden for anonymous complaint. Super Admins can view full details.";
  const displayedSubmittedBy = canViewAnonymousDetails
    ? (complaint?.username || "Unknown")
    : "Anonymous";
  const displayedLocation = canViewAnonymousDetails
    ? (complaint?.facultyLocation?.facultyBlockRoom || "Unknown")
    : "Hidden (anonymous)";
  const displayedAttachments = canViewAnonymousDetails ? (complaint?.media || []) : [];

  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        const userDataStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        const currentUserFacultyId = currentUser?.facultyid;

        const res = await getUsersByFacultyForMobile(currentUserFacultyId);
        const thisFacultyAdmins = res.data?.data || res.data || [];
        
        console.log("📋 Fetched all admins from database:", thisFacultyAdmins);
        console.log("🔍 Looking for adminId:", complaintAdminId);
        
        const sameFacultyAdmins = currentUserFacultyId 
          ? thisFacultyAdmins.filter(admin => admin.facultyid === currentUserFacultyId)
          : thisFacultyAdmins;

        const normalized = normalizeStaffMembers(sameFacultyAdmins);
        setStaffMembers(normalized);

        const matchedAdmin = findMatchedAdmin(complaintAdminId, thisFacultyAdmins, complaint?.adminName);
        setAssignedToName(matchedAdmin.name);
        setAssignedToEmail(matchedAdmin.email);
        
        if (complaintAdminId) {
          const found = thisFacultyAdmins.find((admin) => admin._id === complaintAdminId);
          if (found) {
            console.log("✅ Found matching admin:", found);
            console.log("📧 Admin email:", found.email);
          } else {
            console.log("❌ No matching admin found in database for ID:", complaintAdminId);
            console.log("📝 Using fallback adminName from complaint:", complaint?.adminName);
          }
        }
      } catch (err) {
        console.error("Error fetching admin users:", err);
        setAssignedToName(complaint?.adminName || "Unknown");
      }
    };

    fetchStaffMembers();
  }, [complaintAdminId]);

  const handleStatusChange = (status) => {
    const hasAssigned = Boolean(complaintAdminId);
    const isTerminalStatus = status === 'Resolved' || status === 'Closed';
    if (isTerminalStatus && !hasAssigned) {
      try { toast.error('Assign an officer before changing status to Resolved or Closed'); } catch (e) {}
      setIsStatusDropdownOpen(false);
      return;
    }

    // Check if acknowledgement is required for Resolved/Closed status
    if (isTerminalStatus && !complaint?.acknowledgeAt) {
      try { 
        toast.error('You must acknowledge this report before changing status to Resolved or Closed'); 
      } catch (e) {}
      setIsStatusDropdownOpen(false);
      return;
    }

    // Require confirmation before closing (canceling) the case
    if (status === 'Closed') {
      setStatusPendingConfirmation(status);
      setIsCloseReportModalOpen(true);
      setIsStatusDropdownOpen(false);
      return;
    }

    if (status !== currentStatus) {
      // Optimistically update the UI first
      setCurrentStatus(status);
      updateHistory(`Status changed to "${status}"`);
      
      const onSuccess = async () => {
        // Refresh from backend
        const refreshed = await refreshComplaintFromPartner(complaint.id, complaint);
        if (refreshed) {
          // Update complaint state with refreshed data
          setComplaint(refreshed);
          // Ensure status is synced with the refreshed data
          const refreshedStatus = normalizeStatus(refreshed.status);
          setCurrentStatus(refreshedStatus);
        }
        await fetchAndSetHistories(complaint.id);
      };
      
      updateComplaintStatus(complaint.id, status, onSuccess);
    }
    setIsStatusDropdownOpen(false);
  };

  const handleConfirmClose = async (reason) => {
    if (statusPendingConfirmation === 'Closed' && statusPendingConfirmation !== currentStatus) {
      // Optimistically update the UI first
      setCurrentStatus('Closed');
      updateHistory(`Case closed with reason: ${reason}`);
      
      const onSuccess = async () => {
        // Refresh from backend
        const refreshed = await refreshComplaintFromPartner(complaint.id, complaint);
        if (refreshed) {
          // Update complaint state with refreshed data
          setComplaint(refreshed);
          // Ensure status is synced with the refreshed data
          const refreshedStatus = normalizeStatus(refreshed.status);
          setCurrentStatus(refreshedStatus);
        }
        await fetchAndSetHistories(complaint.id);
      };
      
      // Pass the reason in the payload
      updateComplaintStatus(complaint.id, 'Closed', onSuccess, reason);
    }
    setIsCloseReportModalOpen(false);
    setStatusPendingConfirmation(null);
  };

  const handleCancelClose = () => {
    setIsCloseReportModalOpen(false);
    setStatusPendingConfirmation(null);
  };

  const handleAssignChange = (staff) => {
    // Prevent reassignment if complaint is in terminated state (Resolved or Closed)
    const isTerminated = currentStatus === 'Resolved' || currentStatus === 'Closed';
    if (isTerminated) {
      toast.error(`Cannot reassign officer for ${currentStatus.toLowerCase()} (terminated) complaints.`);
      setIsAssignDropdownOpen(false);
      return;
    }

    if (staff.adminId !== assignedToId) {
      setAssignedToId(staff.adminId);
      setAssignedToName(staff.name);
      setAssignedToEmail(staff.email);

      const onSuccess = async () => {
        const refreshed = await refreshComplaintFromPartner(complaint.id, complaint);
        setComplaint(refreshed);
        await fetchAndSetHistories(complaint.id);
      };
      
      updateAssignedStaff(complaint.id, staff.adminId, onSuccess);
      updateHistory(`Assigned to ${staff.name}`);
    }
    setIsAssignDropdownOpen(false);
  };

  const updateHistory = (action) => {
    const formattedDate = formatHistoryDate();
    setLastUpdated(formattedDate);
  };

  const handleGenerateReport = (complaint) => {
    const complaintForPDF = canViewAnonymousDetails
      ? { ...complaint, isAnonymous: false }
      : complaint;
    generateComplaintPDF(complaintForPDF, assignedToName, assignedToEmail, complaintHistory);
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
              <div className="mb-6 flex items-center justify-between gap-4">
                <button
                  onClick={() => navigate("/complaints")}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-2" />
                  Back to Complaints
                </button>

                {/* View User Details Button (Super Admin Only for Anonymous Reports) */}
                {isSuperAdmin && isAnonymous && complaint?.userId && (
                  <button
                    onClick={handleViewUserDetails}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 mr-2" />
                    View User Details
                  </button>
                )}
              </div>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content Column */}
            <div className="flex-1">
              {/* Status Banner */}
              <StatusBanner
                currentStatus={currentStatus}
                statusColor={getStatusColor(currentStatus)}
                priorityColor={priorityColor}
                priority={complaint?.category?.priority || 'Medium'}
              />

              {/* Complaint Details Card */}
              {console.log("🎫 Props being passed to ComplaintDetailsCard:", {
                matricNumber: userDetails?.matricNumber,
                gender: userDetails?.gender,
                email: userDetails?.email,
                phoneNumber: userDetails?.phoneNumber,
                userDetailsState: userDetails
              })}
              <ComplaintDetailsCard
                title={displayedTitle}
                description={displayedDescription}
                submittedBy={displayedSubmittedBy}
                dateSubmitted={
                  complaint.createdAt
                    ? new Date(complaint.createdAt).toISOString().split("T")[0]
                    : "Unknown"
                }
                category={complaint?.category.name || "Unknown"}
                location={displayedLocation}
                attachments={displayedAttachments}
                matricNumber={userDetails?.matricNumber}
                gender={userDetails?.gender}
                email={userDetails?.email}
                phoneNumber={userDetails?.phoneNumber}
              />

              {/* Acknowledge banner (only assigned admin/officer and not yet acknowledged and not Resolved/Closed) */}
              {isUserAssigned && !complaint?.acknowledgeAt && currentStatus !== 'Resolved' && currentStatus !== 'Closed' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Acknowledge this report</p>
                    <p className="text-xs text-blue-800">Confirm you have received and started handling this complaint.</p>
                  </div>
                  <button
                    onClick={handleAcknowledge}
                    disabled={isAcknowledging}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-blue-700 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAcknowledging ? "Acknowledging..." : "Acknowledge"}
                  </button>
                </div>
              )}

              {/* Activity History */}
              {canViewAnonymousDetails ? (
                <ActivityHistory 
                  history={complaintHistory}
                  onAddTimelineClick={isUserAssigned && complaint?.acknowledgeAt && currentStatus !== 'Resolved' && currentStatus !== 'Closed' ? handleAddTimelineClick : null}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Anonymous Complaint</h3>
                  <p className="text-sm text-gray-600">
                    Details are hidden for anonymous submissions. Super Admins can view full content.
                  </p>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 space-y-6" style={{ overflow: 'visible' }}>
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
                  handleRevokeAssignment={() => {
                    // Prevent revocation if complaint is in terminated state (Resolved or Closed)
                    const isTerminated = currentStatus === 'Resolved' || currentStatus === 'Closed';
                    if (isTerminated) {
                      toast.error(`Cannot revoke assignment for ${currentStatus.toLowerCase()} (terminated) complaints.`);
                      return;
                    }

                    const onSuccess = async () => {
                      setAssignedToId('');
                      setAssignedToName('Unassigned');
                      setAssignedToEmail('');
                      setCurrentStatus('Open');
                      updateHistory(`Assignment revoked`);
                      
                      const refreshed = await refreshComplaintFromPartner(complaint.id, complaint);
                      setComplaint(refreshed);
                      await fetchAndSetHistories(complaint.id);
                    };
                    
                    revokeAssignedStaff(complaint.id, onSuccess);
                  }}
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

      {/* User Details Modal (Super Admin Only) */}
      <ViewUserDetailsModal
        isOpen={showUserDetailsModal}
        onClose={handleCloseUserDetailsModal}
        userDetails={userDetails}
        isLoading={isLoadingUserDetails}
      />

      {/* Add Timeline Modal */}
      <AddTimelineModal
        isOpen={showAddTimelineModal}
        onClose={() => setShowAddTimelineModal(false)}
        onSubmit={handleAddTimeline}
        isLoading={isAddingTimeline}
        userName={storedUser?.name || "Admin"}
        currentStatus={statusToEnum(currentStatus)}
      />

      {/* Close Report Modal - Requires reason */}
      <CloseReportModal
        isOpen={isCloseReportModalOpen}
        onClose={() => {
          setIsCloseReportModalOpen(false);
          setStatusPendingConfirmation(null);
        }}
        onConfirm={handleConfirmClose}
        reportId={complaint?.displayId || complaint?.id}
      />
    </div>
  );
};
export default ComplaintDetails;
