import { useState, useRef, useEffect } from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import "../styles/ComplaintManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faFileCsv,
  faChevronDown,
  faCheckCircle,
  faFileExcel,
  faFilePdf,
  faSearch,
  faFilter,
  faExclamationCircle,
  faSpinner,
  faEye,
  faTrashAlt,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import FilterSlotComplaint from "../components/FilterSlotComplaint";
import Pagination from "../components/Pagination"; 


const ComplaintManagement = () => {
  const [activeTab, setActiveTab] = useState("complaints");

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortConfig, setSortConfig] = useState(null);
  const profileRef = useRef(null);

  const complaints = [
    {
      id: "CMP-1092",
      subject: "Facility Maintenance Issue",
      status: "Open",
      date: "2025-04-28",
      priority: "High",
      category: "Facilities",
      assignedTo: "John Smith",
      description:
        "The air conditioning in the Science building Room 302 is not working properly.",
      faculty_location: "MM1",
      user_id: "ZongMing",
      is_anonymous: false,
      media_url: "https://example.com/attachments/ac-issue.jpg",
      chatroom_id: "chat-1092",
      latitude: "1.3521",
      longitude: "103.8198",
    },
    {
      id: "CMP-1091",
      subject: "Course Registration Problem",
      status: "In Progress",
      date: "2025-04-27",
      priority: "Medium",
      category: "Academic",
      assignedTo: "Emma Davis",
      description:
        "Unable to register for Biology 101 despite meeting all prerequisites.",
      faculty_location: "DK1",
      user_id: "LiMing",
      is_anonymous: true,
      media_url: null,
      chatroom_id: "chat-1091",
      latitude: "1.3522",
      longitude: "103.8199",
    },
    {
      id: "CMP-1090",
      subject: "Library Access Denied",
      status: "Open",
      date: "2025-04-26",
      priority: "Low",
      category: "Services",
      assignedTo: "Unassigned",
      description: "Student ID card not working at library entrance gates.",
    },
    {
      id: "CMP-1089",
      subject: "Cafeteria Food Quality",
      status: "Resolved",
      date: "2025-04-25",
      priority: "Medium",
      category: "Facilities",
      assignedTo: "Sarah Johnson",
      description: "Food quality has declined significantly in the past week.",
    },
    {
      id: "CMP-1088",
      subject: "Wi-Fi Connectivity Issues",
      status: "Open",
      date: "2025-04-24",
      priority: "High",
      category: "IT",
      assignedTo: "Michael Brown",
      description:
        "Intermittent Wi-Fi connectivity in the Engineering building.",
    },
    {
      id: "CMP-1087",
      subject: "Scholarship Application Delay",
      status: "In Progress",
      date: "2025-04-23",
      priority: "Medium",
      category: "Financial",
      assignedTo: "Emma Davis",
      description:
        "Scholarship application submitted 3 weeks ago but no response received.",
    },
    {
      id: "CMP-1086",
      subject: "Broken Desk in Classroom",
      status: "Open",
      date: "2025-04-22",
      priority: "Low",
      category: "Facilities",
      assignedTo: "John Smith",
      description: "Desk in Room 105 of Arts building has a broken leg.",
    },
    {
      id: "CMP-1085",
      subject: "Incorrect Grade Posted",
      status: "In Progress",
      date: "2025-04-21",
      priority: "High",
      category: "Academic",
      assignedTo: "Sarah Johnson",
      description:
        "Final grade for Mathematics 202 does not reflect submitted coursework.",
    },
    {
      id: "CMP-1084",
      subject: "Parking Permit Issue",
      status: "Resolved",
      date: "2025-04-20",
      priority: "Medium",
      category: "Administrative",
      assignedTo: "Michael Brown",
      description: "Parking permit paid for but not received.",
    },
    {
      id: "CMP-1083",
      subject: "Student Portal Login Failure",
      status: "Resolved",
      date: "2025-04-19",
      priority: "High",
      category: "IT",
      assignedTo: "Emma Davis",
      description: "Unable to log in to student portal despite password reset.",
    },
  ];
  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600";
      case "Medium":
        return "text-orange-500";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };
  useEffect(() => {
    const handleGlobalClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      const exportButton = document.getElementById("exportButton");
      const exportDropdown = document.getElementById("exportDropdown");
      if (
        exportDropdown &&
        exportButton &&
        !exportButton.contains(event.target) &&
        !exportDropdown.contains(event.target)
      ) {
        exportDropdown.classList.add("hidden");
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, []);

  const getDateRange = (option) => {
    const today = new Date();
    let start, end;
    switch (option) {
      case "today":
        start = end = today;
        break;
      case "week":
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay()); // Sunday
        end = new Date(today);
        end.setDate(start.getDate() + 6); // Saturday
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "all":
      default:
        start = end = null;
        break;
    }
    return { start, end };
  };
  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setSelectedDateRange(value);
    if (value === "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      setDateRange({ start: null, end: null });
    } else {
      setDateRange(getDateRange(value));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedComplaints(
        filteredComplaints.map((complaint) => complaint.id)
      );
    } else {
      setSelectedComplaints([]);
    }
  };
  const handleSelectComplaint = (id) => {
    if (selectedComplaints.includes(id)) {
      setSelectedComplaints(
        selectedComplaints.filter((complaintId) => complaintId !== id)
      );
    } else {
      setSelectedComplaints([...selectedComplaints, id]);
    }
  };
  const handleSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const sortedComplaints = [...complaints].sort((a, b) => {
    if (!sortConfig) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });
  const filteredComplaints = sortedComplaints.filter((complaint) => {
    const matchesSearch =
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      activeFilter === "all" || complaint.status === activeFilter;
    const matchesCategory =
      selectedCategory === "all" || complaint.category === selectedCategory;

    // Date filtering
    let matchesDate = true;
    if (
      selectedDateRange === "today" ||
      selectedDateRange === "week" ||
      selectedDateRange === "month"
    ) {
      if (dateRange.start && dateRange.end) {
        const complaintDate = new Date(complaint.date);
        matchesDate =
          complaintDate >= new Date(dateRange.start.setHours(0, 0, 0, 0)) &&
          complaintDate <= new Date(dateRange.end.setHours(23, 59, 59, 999));
      }
    } else if (
      selectedDateRange === "custom" &&
      customStartDate &&
      customEndDate
    ) {
      const complaintDate = new Date(complaint.date);
      matchesDate =
        complaintDate >= new Date(customStartDate) &&
        complaintDate <= new Date(customEndDate);
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  {// Pagination logic */}
  const itemsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredComplaints.length / itemsPerPage)
  );
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <i className="fas fa-sort text-gray-300 ml-1"></i>;
    }
    return sortConfig.direction === "ascending" ? (
      <i className="fas fa-sort-up text-blue-500 ml-1"></i>
    ) : (
      <i className="fas fa-sort-down text-blue-500 ml-1"></i>
    );
  };
  const handleComplaintClick = (complaint) => {
    window.location.href = `/complaint-details/${complaint.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />{" "}
        {/* Main Content */}
        <main className="complaint-container">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="complaint-page-header">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Complaints Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage and track all complaints in the system -{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-4 md:mt-0 relative">
                <button
                  id="exportButton"
                  onClick={() => {
                    const dropdown = document.getElementById("exportDropdown");
                    if (dropdown) {
                      dropdown.classList.toggle("hidden");
                    }
                  }}
                  className="complaint-export-button"
                >
                  <FontAwesomeIcon
                    icon={faFileExport}
                    className="mr-2"
                  ></FontAwesomeIcon>
                  Export
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="ml-2 text-xs"
                  ></FontAwesomeIcon>
                </button>
                <div
                  id="exportDropdown"
                  className="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <p className="font-medium">Export Options</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Choose format
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        id="exportCSV"
                        onClick={() => {
                          const notification = document.createElement("div");
                          notification.className = "export-notification";
                          notification.innerHTML = `
                          <span>Exporting data as CSV...</span>`;
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 3000);
                          document
                            .getElementById("exportDropdown")
                            ?.classList.add("hidden");
                        }}
                        className="complaint-export-button-selection"
                      >
                        <FontAwesomeIcon
                          icon={faFileCsv}
                          className="text-green-600 mr-3"
                        ></FontAwesomeIcon>
                        Export as CSV
                      </button>

                      <button
                        id="exportExcel"
                        onClick={() => {
                          const notification = document.createElement("div");
                          notification.className = "export-notification";
                          notification.innerHTML = `
                          <span>Exporting data as Excel...</span>`;
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 3000);
                          document
                            .getElementById("exportDropdown")
                            ?.classList.add("hidden");
                        }}
                        className="complaint-export-button-selection"
                      >
                        <FontAwesomeIcon
                          icon={faFileExcel}
                          className="text-green-700 mr-3"
                        ></FontAwesomeIcon>
                        Export as Excel
                      </button>
                      <button
                        id="exportPDF"
                        onClick={() => {
                          const notification = document.createElement("div");
                          notification.className = "export-notification";
                          notification.innerHTML = `
                          <span>Exporting data as PDF...</span>`;
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 3000);
                          document
                            .getElementById("exportDropdown")
                            ?.classList.add("hidden");
                        }}
                        className="complaint-export-button-selection"
                      >
                        <FontAwesomeIcon
                          icon={faFilePdf}
                          className="text-red-600 mr-3"
                        ></FontAwesomeIcon>
                        Export as PDF
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        id="exportSelected"
                        onClick={() => {
                          const notification = document.createElement("div");
                          notification.className = "export-notification";
                          notification.innerHTML = `<span>Exporting selected complaints...</span>`;
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 3000);
                          document
                            .getElementById("exportDropdown")
                            ?.classList.add("hidden");
                        }}
                        className="complaint-export-button-selection"
                      >
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-blue-600 mr-3"
                        ></FontAwesomeIcon>
                        Export Selected Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="search-filter-section">
              <div className="search-filter-button-container">
                <div className="search-filter-bar">
                  <div className="search-bar-box">
                    <input
                      type="text"
                      className="search-bar-input"
                      placeholder="Search complaints by ID, subject, or assignee..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="text-gray-400"
                      ></FontAwesomeIcon>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <div className="relative">
                      <button
                        className="filter-button"
                        onClick={() =>
                          setShowAdvancedFilters(!showAdvancedFilters)
                        }
                      >
                        <FontAwesomeIcon icon={faFilter} className="mr-2" />
                        Filters
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`ml-2 text-xs transition-transform ${
                            showAdvancedFilters ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {showAdvancedFilters && (
                  <div className="advanced-filter-dropdown ">
                    <FilterSlotComplaint
                      label="Status"
                      id="status-filter"
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "Open", label: "Open" },
                        { value: "In Progress", label: "In Progress" },
                        { value: "Resolved", label: "Resolved" },
                      ]}
                      className="advanced-filter-status"
                    />
                    <FilterSlotComplaint
                      label="Category"
                      id="category-filter"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      options={[
                        { value: "all", label: "All Categories" },
                        { value: "Academic", label: "Academic" },
                        { value: "Administrative", label: "Administrative" },
                        { value: "Facilities", label: "Facilities" },
                        { value: "Financial", label: "Financial" },
                        { value: "IT", label: "IT" },
                        { value: "Services", label: "Services" },
                      ]}
                      className="advanced-filter-status"
                    />
                    <FilterSlotComplaint
                      label="Date Range"
                      id="date-filter"
                      value={selectedDateRange}
                      onChange={handleDateRangeChange}
                      options={[
                        { value: "all", label: "All Time" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "This Week" },
                        { value: "month", label: "This Month" },
                        { value: "custom", label: "Custom Range" },
                      ]}
                      className="advanced-filter-status"
                    />
                    {selectedDateRange === "custom" && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="date"
                          className="complaint-filter-custom-calender"
                          value={customStartDate}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomStartDate(value);
                            if (customEndDate && value > customEndDate) {
                              setCustomEndDate(value);
                            }
                          }}
                          max={customEndDate || undefined}
                          placeholder="Start date"
                        />
                        <span className="self-center">to</span>
                        <input
                          type="date"
                          className="complaint-filter-custom-calender"
                          value={customEndDate}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCustomEndDate(value);
                            if (customStartDate && value < customStartDate) {
                              setCustomStartDate(value);
                            }
                          }}
                          min={customStartDate || undefined}
                          placeholder="End date"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="complaint-status-found-box">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`complaint-status-selection ${
                      activeFilter === "all"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter("Open")}
                    className={`complaint-status-selection ${
                      activeFilter === "Open"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faExclamationCircle}
                      className="mr-1"
                    />
                    Open
                  </button>
                  <button
                    onClick={() => setActiveFilter("In Progress")}
                    className={`complaint-status-selection ${
                      activeFilter === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faSpinner} className="mr-1" />
                    In Progress
                  </button>
                  <button
                    onClick={() => setActiveFilter("Resolved")}
                    className={`complaint-status-selection ${
                      activeFilter === "Resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                    Resolved
                  </button>
                  <div className="ml-auto text-sm text-gray-500 flex items-center">
                    <span>{filteredComplaints.length} complaints found</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Complaints Table */}
            <div className="complaint-table-container">
              <div className="overflow-x-auto">
                <table className="complaint-table-header">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onChange={handleSelectAll}
                            checked={
                              selectedComplaints.length ===
                                filteredComplaints.length &&
                              filteredComplaints.length > 0
                            }
                          />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("id")}
                      >
                        <div className="flex items-center">
                          ID {getSortIcon("id")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="complaint-table-header-row "
                        onClick={() => handleSort("subject")}
                      >
                        <div className="flex items-center">
                          Subject {getSortIcon("subject")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="complaint-table-header-row "
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status {getSortIcon("status")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="complaint-table-header-row "
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center">
                          Date {getSortIcon("date")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="complaint-table-header-row "
                        onClick={() => handleSort("priority")}
                      >
                        <div className="flex items-center">
                          Priority {getSortIcon("priority")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="complaint-table-header-row "
                        onClick={() => handleSort("category")}
                      >
                        <div className="flex items-center">
                          Category {getSortIcon("category")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="complaint-table-header-row "
                        onClick={() => handleSort("assignedTo")}
                      >
                        <div className="flex items-center">
                          Assigned To {getSortIcon("assignedTo")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedComplaints.length > 0 ? (
                      paginatedComplaints.map((complaint) => (
                        <tr
                          key={complaint.id}
                          data-complaint-id={complaint.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedComplaints.includes(
                                  complaint.id
                                )}
                                onChange={() =>
                                  handleSelectComplaint(complaint.id)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer">
                            {complaint.id}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-900 cursor-pointer"
                            onClick={() => handleComplaintClick(complaint)}
                          >
                            <div>
                              <div className="font-medium">
                                {complaint.subject}
                              </div>
                              <div className="text-gray-500 text-xs mt-1 line-clamp-1">
                                {complaint.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                complaint.status
                              )}`}
                            >
                              {complaint.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {complaint.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`font-medium ${getPriorityColor(
                                complaint.priority
                              )}`}
                            >
                              {complaint.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {complaint.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {complaint.assignedTo === "Unassigned" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Unassigned
                              </span>
                            ) : (
                              complaint.assignedTo
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                data-readdy="true"
                                className="!rounded-button whitespace-nowrap text-gray-600 hover:text-gray-900 cursor-pointer"
                                title="View Details"
                                onClick={() => handleComplaintClick(complaint)}
                              >
                                <FontAwesomeIcon icon={faEye}></FontAwesomeIcon>
                              </button>
                              <button
                                className="!rounded-button whitespace-nowrap text-red-600 hover:text-red-900 cursor-pointer"
                                title="Delete"
                                onClick={() => {
                                  setComplaintToDelete(complaint);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faTrashAlt}
                                ></FontAwesomeIcon>
                              </button>
                              {isDeleteModalOpen && complaintToDelete && (
                                <div className="fixed inset-0 z-50 overflow-y-auto">
                                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                    <div
                                      className="fixed inset-0 transition-opacity"
                                      aria-hidden="true"
                                    >
                                      <div
                                        className="absolute inset-0 backdrop-blur-sm"
                                        onClick={() =>
                                          setIsDeleteModalOpen(false)
                                        }
                                      ></div>
                                    </div>
                                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                      <div className="modal-content">
                                        <div className="modal-header">
                                          <div className="modal-icon">
                                            <FontAwesomeIcon
                                              icon={faExclamationTriangle}
                                              className="text-red-600"
                                            />
                                          </div>
                                          <div className="modal-body">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                              Delete Complaint
                                            </h3>
                                            <div className="modal-text">
                                              <p className="text-sm text-gray-500">
                                                Are you sure you want to delete
                                                complaint{" "}
                                                <span className="font-medium">
                                                  {complaintToDelete.id}
                                                </span>
                                                ?
                                              </p>
                                              <p className="mt-1 text-sm text-gray-500">
                                                Subject:{" "}
                                                <span className="font-medium">
                                                  {complaintToDelete.subject}
                                                </span>
                                              </p>
                                              <p className="mt-2 text-sm text-red-500">
                                                This action cannot be undone.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="modal-delete">
                                        <button
                                          type="button"
                                          id="confirmDelete"
                                          onClick={() => {
                                            const complaintRow =
                                              document.querySelector(
                                                `tr[data-complaint-id="${complaintToDelete.id}"]`
                                              );
                                            if (complaintRow) {
                                              complaintRow.remove();
                                            }
                                            setIsDeleteModalOpen(false);
                                            setComplaintToDelete(null);

                                            const notification =
                                              document.createElement("div");
                                            notification.className =
                                              "export-notification";
                                            notification.innerHTML = `<FontAwesomeIcon icon={faCheckCircle} className="text-green-400 mr-2" /><span>Complaint successfully deleted</span>`;
                                            document.body.appendChild(
                                              notification
                                            );
                                            setTimeout(() => {
                                              notification.remove();
                                            }, 3000);
                                          }}
                                          className="!rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                          Confirm Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsDeleteModalOpen(false);
                                            setComplaintToDelete(null);
                                          }}
                                          className="!rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          <FontAwesomeIcon
                            icon={faSearch}
                            className="text-gray-400 text-3xl mb-3"
                          ></FontAwesomeIcon>
                          <p>
                            No complaints found matching your search criteria.
                          </p>
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setActiveFilter("all");
                              setSelectedCategory("all");
                              setSelectedDateRange("all");
                              setCustomStartDate("");
                              setCustomEndDate("");
                              setDateRange({ start: null, end: null });
                            }}
                            className="!rounded-button whitespace-nowrap mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {filteredComplaints.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredComplaints.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
}
export default ComplaintManagement;
