import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/ComplaintDetail.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import StatusBanner from "../components/StatusBanner";
import ComplaintDetailsCard from "../components/ComplaintDetailsCard";
import ActivityHistory from "../components/ActivityHistory";
import AssignedStaffCard from "../components/AssignedStaffCard";
import QuickActionsCard from "../components/QuickActionCard";

const ComplaintDetails = () => {
  const [currentStatus, setCurrentStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState("John Smith");
  const [isProfileOpen, setIsProfileOpen] = useState("false");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const statusOptions = ["Open", "In Progress", "Resolved", "Closed"];
  const staffMembers = [
    "John Smith",
    "Emma Davis",
    "Sarah Johnson",
    "Michael Brown",
    "David Wilson",
  ];
  const [lastUpdated, setLastUpdated] = useState("May 26, 2025, 14:32");
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
  const statusRef = useRef < HTMLDivElement > null;
  const assignRef = useRef < HTMLDivElement > null;
  const profileRef = useRef < HTMLDivElement > null;
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
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleStatusChange = (status) => {
    if (status !== currentStatus) {
      setCurrentStatus(status);
      updateHistory(`Status changed to "${status}"`);
    }
    setIsStatusDropdownOpen(false);
  };
  const handleAssignChange = (staff) => {
    if (staff !== assignedTo) {
      setAssignedTo(staff);
      updateHistory(`Assigned to ${staff}`);
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
  const [isAnonymous] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState("PDF");
  const [reportContent, setReportContent] = useState({
    basicDetails: true,
    fullHistory: true,
    attachments: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateReport = () => {
    setIsGenerating(true);
    const fileName = `complaint-CMP-1084-report.${reportFormat.toLowerCase()}`;
    // Simulate report generation and download
    setTimeout(() => {
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = "#"; // In real implementation, this would be the actual file URL
      link.download = fileName;
      document.body.appendChild(link);
      // Show success notification
      const notification = document.createElement("div");
      notification.className =
        "fixed bottom-4 right-4 bg-green-50 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center";
      notification.innerHTML = `
<i class="fas fa-check-circle mr-2"></i>
Report generated successfully
`;
      document.body.appendChild(notification);
      // Trigger download
      link.click();
      document.body.removeChild(link);
      // Clean up
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      setIsGenerating(false);
      setIsReportModalOpen(false);
      // Reset selections for next time
      setReportFormat("PDF");
      setReportContent({
        basicDetails: true,
        fullHistory: true,
        attachments: false,
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="complaint-detail-main-container">
          <div className="complaint-detail-main-frame">
            {/* Page Header */}
            <div className="complaint-detail-page-header">
              <div className="flex items-center">
                <a
                  href="link back to complaint table"
                  className="!rounded-button whitespace-nowrap mr-4 flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Back to Complaint Management Board{" "}
                </a>

                <h1 className="text-2xl font-bold text-gray-900">
                  Complaint #CMP-1084
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: May 26, 2025, 14:32
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
                />

                {/* Complaint Details Card */}
                <ComplaintDetailsCard
                  title="Dormitory Heating Problem"
                  description="The heating system in West Hall, Room 304 has not been working properly for the past three days. The temperature drops below 60°F at night making it difficult to sleep or study. Multiple requests to the front desk have not resulted in any action."
                  submittedBy="Michael Chen (Student)"
                  dateSubmitted="April 20, 2025"
                  category="Facilities & Maintenance"
                  location="West Hall, Room 304"
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
                  assignedTo={assignedTo}
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
                />

                {/* Assigned Staff Card */}
                <AssignedStaffCard
                  name={assignedTo}
                  role="Facilities Manager"
                  email="john.smith@umsafe.edu"
                />

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default ComplaintDetails;
