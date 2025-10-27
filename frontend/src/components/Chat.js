// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect, useRef } from "react";
const App = () => {
  const [currentStatus, setCurrentStatus] = useState("Open");
  const [assignedTo, setAssignedTo] = useState("John Smith");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
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
      user: "Michael Chen (Student)",
    },
  ]);
  const statusOptions = ["Open", "In Progress", "Resolved", "Closed"];
  const staffMembers = [
    "John Smith",
    "Emma Davis",
    "Sarah Johnson",
    "Michael Brown",
    "David Wilson",
  ];
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
  const statusRef = useRef(null);
  const assignRef = useRef(null);
  const profileRef = useRef(null);
  const handleClickOutside = (event) => {
    if (
      statusRef.current &&
      !statusRef.current.contains(event.target as Node)
    ) {
      setIsStatusDropdownOpen(false);
    }
    if (
      assignRef.current &&
      !assignRef.current.contains(event.target as Node)
    ) {
      setIsAssignDropdownOpen(false);
    }
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target as Node)
    ) {
      setIsProfileOpen(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const updateHistory = (action, user = "Admin User") => {
    const now = new Date();
    const dateStr =
      now.toISOString().slice(0, 10) +
      " " +
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");
    const formattedDate = `${now.toLocaleString("default", { month: "short" })} ${now.getDate()}, ${now.getFullYear()}, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLastUpdated(formattedDate);
    const newHistoryItem = {
      date: dateStr,
      action,
      user,
    };
    setComplaintHistory([newHistoryItem, ...complaintHistory]);
  };
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
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img
                src="https://static.readdy.ai/image/8e779976bd6305bc40a7706cbbe5c8f3/01998a84496762f135444c05c6d2817d.png"
                alt="UMSafe Logo"
                className="h-10 w-auto"
              />
              <h1 className="ml-3 text-xl font-semibold text-gray-800">
                UMSafe
              </h1>
            </div>
            <div className="flex items-center">
              {/* Notifications */}
              <button className="!rounded-button whitespace-nowrap relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none cursor-pointer mr-2">
                <i className="fas fa-bell text-lg"></i>
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  3
                </span>
              </button>
              {/* User Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  className="!rounded-button whitespace-nowrap flex items-center space-x-2 cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <i className="fas fa-user-circle"></i>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Admin User
                  </span>
                  <i
                    className={`fas fa-chevron-down text-xs text-gray-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                  ></i>
                </button>
                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <i className="fas fa-user-circle mr-2"></i>
                        Your Profile
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <i className="fas fa-cog mr-2"></i>
                        Settings
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Sign out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md z-10">
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              <a
                href="#"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-tachometer-alt mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Dashboard
              </a>
              <a
                href="#"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer bg-blue-100 text-blue-800"
              >
                <i className="fas fa-clipboard-list mr-3 text-lg text-blue-600"></i>
                Complaints
              </a>
              <a
                href="#"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-chart-bar mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Analytics
              </a>
              <button className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <i className="fas fa-users mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Users
              </button>
              <a
                href="#"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-door-open mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Room Management
              </a>
              <a
                href="#"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-cog mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Settings
              </a>
            </div>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto h-full">
            {/* Breadcrumb Navigation */}
            <nav className="flex mb-5" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <a href="#" className="text-gray-500 hover:text-gray-700">
                    <i className="fas fa-home mr-2"></i>
                    Dashboard
                  </a>
                </li>
                <li>
                  <div className="flex items-center">
                    <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                    <a href="#" className="text-gray-500 hover:text-gray-700">
                      Complaints
                    </a>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <i className="fas fa-chevron-right text-gray-400 mx-2 text-xs"></i>
                    <span className="text-gray-700 font-medium">
                      Complaint Details
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
            {/* Page Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <a
                  href="#"
                  className="!rounded-button whitespace-nowrap mr-4 flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back to Dashboard
                </a>
                <h1 className="text-2xl font-bold text-gray-900">
                  Complaint #CMP-1084
                </h1>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated}
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Content Column */}
              <div className="flex-1">
                {/* Status Banner */}
                <div
                  className={`mb-6 p-4 rounded-lg border ${statusColors[currentStatus]}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <i
                        className={`fas fa-exclamation-circle mr-2 ${currentStatus === "Open" ? "text-yellow-600" : currentStatus === "In Progress" ? "text-blue-600" : "text-green-600"}`}
                      ></i>
                      <span className="font-medium">
                        Status: {currentStatus}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColor["High"]}`}
                      >
                        High Priority
                      </span>
                    </div>
                  </div>
                </div>
                {/* Complaint Details Card */}
                <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Complaint Details
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Dormitory Heating Problem
                      </h3>
                      <p className="text-gray-700 mb-4">
                        The heating system in West Hall, Room 304 has not been
                        working properly for the past three days. The
                        temperature drops below 60°F at night making it
                        difficult to sleep or study. Multiple requests to the
                        front desk have not resulted in any action.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Submitted by</p>
                          <p className="font-medium">Michael Chen (Student)</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Date Submitted
                          </p>
                          <p className="font-medium">April 20, 2025</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium">
                            Facilities & Maintenance
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">West Hall, Room 304</p>
                        </div>
                      </div>
                    </div>
                    {/* Attachments Section */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">
                        Attachments
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                              src="https://readdy.ai/api/search-image?query=broken%20heating%20unit%20in%20a%20dormitory%20room%20with%20visible%20frost%20on%20the%20window%2C%20realistic%20photo%2C%20high%20quality%2C%20detailed%20image%20showing%20a%20malfunctioning%20heater%20with%20temperature%20display%20showing%20low%20numbers&width=300&height=200&seq=2&orientation=landscape"
                              alt="Heating Unit"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              heating-unit-photo.jpg
                            </p>
                            <p className="text-xs text-gray-500">1.2 MB</p>
                          </div>
                          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button className="!rounded-button whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                              <i className="fas fa-download mr-1"></i> Download
                            </button>
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                              src="https://readdy.ai/api/search-image?query=digital%20thermometer%20showing%20low%20temperature%20reading%20in%20a%20cold%20room%2C%20realistic%20photo%2C%20high%20quality%2C%20detailed%20image%20of%20a%20thermometer%20displaying%20temperature%20below%2060%20degrees%20Fahrenheit&width=300&height=200&seq=3&orientation=landscape"
                              alt="Temperature Reading"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 bg-white">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              temperature-reading.jpg
                            </p>
                            <p className="text-xs text-gray-500">0.8 MB</p>
                          </div>
                          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button className="!rounded-button whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                              <i className="fas fa-download mr-1"></i> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Activity History */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Activity History
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {complaintHistory.map((item, index) => (
                          <li key={index}>
                            <div className="relative pb-8">
                              {index !== complaintHistory.length - 1 && (
                                <span
                                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                ></span>
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                    <i className="fas fa-history text-white"></i>
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm text-gray-900">
                                      {item.action}
                                    </p>
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <div>{item.date}</div>
                                    <div>by {item.user}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right Sidebar */}
              <div className="w-full lg:w-80 space-y-6">
                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Quick Actions
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {/* Update Status */}
                      <div className="relative" ref={statusRef}>
                        <button
                          onClick={() =>
                            setIsStatusDropdownOpen(!isStatusDropdownOpen)
                          }
                          className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          <span>Update Status</span>
                          <i
                            className={`fas fa-chevron-down text-gray-500 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                          ></i>
                        </button>
                        {isStatusDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              {statusOptions.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(status)}
                                  className={`w-full text-left block px-4 py-2 text-sm ${
                                    currentStatus === status
                                      ? "bg-blue-50 text-blue-700"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Assign To */}
                      <div className="relative" ref={assignRef}>
                        <button
                          onClick={() =>
                            setIsAssignDropdownOpen(!isAssignDropdownOpen)
                          }
                          className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          <span>Reassign Complaint</span>
                          <i
                            className={`fas fa-chevron-down text-gray-500 transition-transform ${isAssignDropdownOpen ? "rotate-180" : ""}`}
                          ></i>
                        </button>
                        {isAssignDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              {staffMembers.map((staff) => (
                                <button
                                  key={staff}
                                  onClick={() => handleAssignChange(staff)}
                                  className={`w-full text-left block px-4 py-2 text-sm ${
                                    assignedTo === staff
                                      ? "bg-blue-50 text-blue-700"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {staff}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                      >
                        <span>Download Report</span>
                        <i className="fas fa-download text-gray-500"></i>
                      </button>
                      {/* Report Modal */}
                      {isReportModalOpen && (
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                            <div className="px-6 py-4 border-b border-gray-200">
                              <h3 className="text-lg font-medium text-gray-900">
                                Download Report
                              </h3>
                            </div>
                            <div className="px-6 py-4">
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Report Format
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                  {["PDF", "Excel", "CSV"].map((format) => (
                                    <button
                                      key={format}
                                      onClick={() => setReportFormat(format)}
                                      className={`!rounded-button whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md ${
                                        reportFormat === format
                                          ? "bg-blue-100 text-blue-700 border-blue-200"
                                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                      }`}
                                    >
                                      {format}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Include in Report
                                </label>
                                <div className="space-y-2">
                                  {Object.entries({
                                    basicDetails: "Basic Details",
                                    fullHistory: "Full History",
                                    attachments: "Attachments",
                                  }).map(([key, label]) => (
                                    <label
                                      key={key}
                                      className="flex items-center"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          reportContent[
                                            key as keyof typeof reportContent
                                          ]
                                        }
                                        onChange={(e) =>
                                          setReportContent((prev) => ({
                                            ...prev,
                                            [key]: e.target.checked,
                                          }))
                                        }
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">
                                        {label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                              <button
                                onClick={() => setIsReportModalOpen(false)}
                                className="!rounded-button whitespace-nowrap px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleGenerateReport}
                                disabled={isGenerating}
                                className={`!rounded-button whitespace-nowrap px-4 py-2 ${
                                  isGenerating
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                } text-white rounded-md shadow-sm text-sm font-medium flex items-center justify-center min-w-[120px]`}
                              >
                                {isGenerating ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Generating...
                                  </>
                                ) : (
                                  "Generate Report"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {!isAnonymous && (
                        <a
                          href="#"
                          className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 cursor-pointer"
                        >
                          <span>Chat with Student</span>
                          <i className="fas fa-comments text-white"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                {/* Assigned Staff Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Assigned Staff
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                        <i className="fas fa-user text-xl"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignedTo}
                        </p>
                        <p className="text-sm text-gray-500">
                          Facilities Manager
                        </p>
                        <div className="flex items-center mt-1">
                          <i className="fas fa-envelope text-gray-400 mr-1 text-sm"></i>
                          <span className="text-xs text-gray-500">
                            {assignedTo.toLowerCase().replace(" ", ".")}
                            @umsafe.edu
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} UMSafe. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
