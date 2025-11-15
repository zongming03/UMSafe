import React, { useState, useEffect, useRef } from "react";
import "../styles/ComplaintDetail.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import StatusBanner from "../components/StatusBanner";
import ComplaintDetailsCard from "../components/ComplaintDetailsCard";
import ActivityHistory from "../components/ActivityHistory";
import AssignedStaffCard from "../components/AssignedStaffCard";
import QuickActionsCard from "../components/QuickActionCard";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import UMSafeLogo from "../assets/UMSafeLogo.png";
import { initiateChatroom } from "../services/api";
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

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  // complaint may be passed in via navigation state during client-only flows.
  // If not provided (direct URL), fetch the complaint by :id from the server.
  const [complaint, setComplaint] = useState(location.state || null);
  const isAnonymous = complaint?.isAnonymous || false;

  useEffect(() => {
    if (!location.state && params?.id) {
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
  }, [location.state, params?.id, navigate]);

  const statusOptions = ["Open", "In Progress", "Resolved", "Closed"];

  const [lastUpdated, setLastUpdated] = useState("");
  const [complaintHistory, setComplaintHistory] = useState([
    {
      date: "2025-05-26 14:32",
      action: 'Status changed to "In Progress"',
      user: "Emma Davis",
    },
    {
      date: "2025-05-25 10:15",
      action: 'Comment added: "Looking into this issue now."',
      user: "John Smith",
    },
    {
      date: "2025-05-24 16:45",
      action: "Assigned to John Smith",
      user: "System",
    },
    {
      date: "2025-05-24 09:20",
      action: "Complaint created",
      user: isAnonymous ? "Anonymous" : "Michael Chen (Student)",
    },
  ]);

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
      const fallbackChatroomId = "FAKE-ROOM-" + reportId; // 🔥 For testing only

      // ✅ If chatroom already exists (DB value)
      if (complaint.chatroomId) {
        return navigate(`/complaints/${reportId}/${complaint.chatroomId}`,{ state: complaint });
      }

      // ✅ If database features are still disabled, skip API call
      if (!initiateChatroom) {
        console.warn("Chatroom API not connected. Using fallback ID.");
        return navigate(`/complaints/${reportId}/${fallbackChatroomId}`,{ state: complaint });
      }

      // ✅ Call backend to create chatroom (future real use)
      const result = await initiateChatroom(reportId);

      const newChatroomId = result?.chatroom?.id || fallbackChatroomId;

      toast.success("Chatroom initiated successfully!");

      navigate(`/complaints/${reportId}/${newChatroomId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to open chatroom. Using fallback chatroom.");

      // ✅ Backup navigation to allow UI testing
      const fallbackChatroomId = "FAKE-ROOM-" + complaint.id;
      navigate(`/complaints/${complaint.id}/${fallbackChatroomId}`);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const complaintAdminId = complaint?.adminId || "";

  useEffect(() => {
    fetch("http://localhost:5000/admin/usersMobile/users", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const admins = data.data || [];
        setStaffMembers(admins);

        // Match adminId from complaint with fetched admins
        if (complaintAdminId) {
          const matchedAdmin = admins.find(
            (admin) => admin._id === complaintAdminId
          );
          if (matchedAdmin) {
            setAssignedToName(matchedAdmin.name);
            setAssignedToEmail(matchedAdmin.email);
          } else {
            setAssignedToName("Unknown");
            setAssignedToEmail("Unknown");
          }
        } else {
          setAssignedToName("Unknown");
          setAssignedToEmail("Unknown");
        }
      })
      .catch((err) => {
        console.error("Error fetching admin users:", err);
        setAssignedToName("Unknown");
      });
  }, [complaintAdminId]);

  const updateAssignedStaff = async (complaintId, staffId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/admin/complaints/${complaintId}/assign-admin`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ assignedTo: staffId }),
        }
      );
      const data = await res.json();
      console.log("Updated assignment:", data);
    } catch (err) {
      console.error("Failed to update assigned staff:", err);
    }
  };

  // Update complaint status
  const updateComplaintStatus = async (complaintId, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:5000/admin/complaints/${complaintId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      console.log("✅ Complaint status updated:", data);
      try { toast.success("Complaint status updated"); } catch (e) {}
    } catch (err) {
      console.error("❌ Failed to update complaint status:", err);
      try { toast.error("Failed to update complaint status"); } catch (e) {}
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

  const updateHistory = (action, user = "Admin User") => {
    const now = new Date();
    const dateStr =
      now.toISOString().slice(0, 10) +
      " " +
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const formattedDate = `${now.toLocaleString("default", {
      month: "short",
    })} ${now.getDate()}, ${now.getFullYear()}, ${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLastUpdated(formattedDate);
    const newHistoryItem = {
      date: dateStr,
      action,
      user,
    };
    setComplaintHistory([newHistoryItem, ...complaintHistory]);
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
    <div className="flex flex-1">
      {/* Main Content */}
      <main className="complaint-detail-main-container">
        <div className="complaint-detail-main-frame">
          {/* Page Header */}
          <div className="complaint-detail-page-header flex items-center justify-between">
            {/* Left Section: Back Button */}
            <div className="flex items-center">
              <button
                onClick={() => navigate("/complaints")}
                className="!rounded-button whitespace-nowrap mr-4 flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back
              </button>
            </div>

            {/* Center Section: Complaint Title */}
            <h1 className="text-2xl font-bold text-gray-900 text-center flex-1">
              Complaint #{complaint?.id || "N/A"}
            </h1>

            {/* Right Section: Last Updated */}
            <div className="text-sm text-gray-500 whitespace-nowrap">
              Last updated:{" "}
              {complaint.updatedAt
                ? new Date(complaint.updatedAt).toISOString().split("T")[0]
                : ""}
            </div>
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
                attachments={[
                  {
                    //   url: "",
                    alt: "Heating Unit",
                    name: "heating-unit-photo.jpg",
                    size: "1.2 MB",
                  },
                  {
                    //   url: "",
                    alt: "Temperature Reading",
                    name: "temperature-reading.jpg",
                    size: "0.8 MB",
                  },
                ]}
              />

              {/* Activity History */}
              <ActivityHistory history={complaintHistory} />
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 space-y-6">
              {/* Quick Actions Card */}
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
              />

              {/* Assigned Staff Card */}
              <AssignedStaffCard
                name={assignedToName || "Not Assigned"}
                email={assignedToEmail || "N/A"}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ComplaintDetails;
