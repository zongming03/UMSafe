import { useState, useRef, useEffect } from "react";
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
  faSort,
  faSortUp,
  faSortDown,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import FilterSlotComplaint from "../components/FilterSlotComplaint";
import Pagination from "../components/Pagination";
import { useNavigate } from "react-router-dom";

const ComplaintManagement = () => {
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
  const [admins, setAdmins] = useState([]);
  const navigate = useNavigate();

  const complaints = [
    {
      id: "CMP-1093",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      username: "Testing1.",
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Unassigned",
      status: "Opened",
      title: "Testing username",
      description: "New name",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://res.cloudinary.com/dcv38gpis/video/upload/v1761235173/reports/019a11cb-f3b4-73ea-a2d2-12fdd76f687f.mp4",
        "https://res.cloudinary.com/dcv38gpis/video/upload/v1761235173/reports/019a11cb-f40c-71aa-bc70-6fd25718bfe0.mp4",
      ],
      latitude: 3.1271268,
      longitude: 101.6349605,
      facultyLocation: {
        faculty: "Faculty of Computer Science and Engineering",
        facultyBlock: "Block A",
        facultyBlockRoom: "Room 101",
      },
      isAnonymous: false,
      isFeedbackProvided: false,
      chatroomId: "FAKE-ROOM-1093",
      createdAt: "2025-10-23T15:59:35.599Z",
      updatedAt: "2025-10-23T15:59:35.599Z",
      version: 1,
    },
    {
      id: "CMP-1094",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "oiiae",
      status: "InProgress",
      title: "Kk",
      description: "Ok",
      category: { name: "Bullying", priority: "High" },
      media: [
        "https://res.cloudinary.com/dcv38gpis/video/upload/v1761149227/reports/019a0cac-840a-73e1-b12d-3ab2393a4abf.mp4",
      ],
      latitude: 3.12719,
      longitude: 101.634895,
      facultyLocation: {
        faculty: "Faculty of Computer Science and Engineering",
        facultyBlock: "Block B",
        facultyBlockRoom: "Room 201",
      },
      isAnonymous: false,
      isFeedbackProvided: false,
      chatroomId: "",
      createdAt: "2025-10-22T16:07:10.441Z",
      updatedAt: "2025-10-23T14:57:36.534Z",
      version: 2,
    },
    {
      id: "CMP-1095",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "Unassigned",
      status: "Opened",
      title: "Testing video ",
      description: "Video testing",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://res.cloudinary.com/dcv38gpis/image/upload/v1761148942/reports/019a0ca8-27ab-757d-a4f4-5f2dd76ec559.jpg",
        "https://res.cloudinary.com/dcv38gpis/video/upload/v1761148947/reports/019a0ca8-4442-739e-937f-e6539a96135a.mp4",
      ],
      latitude: 3.12719,
      longitude: 101.634895,
      facultyLocation: {
        faculty: "Faculty of Business and Economics",
        facultyBlock: "Block E",
        facultyBlockRoom: "Room 501",
      },
      isAnonymous: false,
      isFeedbackProvided: false,
      chatroomId: "",
      createdAt: "2025-10-22T16:02:30.647Z",
      updatedAt: "2025-10-22T16:02:30.647Z",
      version: 1,
    },
    {
      id: "CMP-1096",
      userId: "testing",
      adminId: "Unassigned",
      status: "Opened",
      title: "Graffiti on Wall",
      description:
        "Graffiti spotted near the main entrance of the lecture hall.",
      category: { name: "Vandalism", priority: "Medium" },
      media: [
        "https://res.cloudinary.com/example/image/upload/v1750655596/reports/graffiti.jpg",
      ],
      latitude: 0,
      longitude: 0,
      facultyLocation: {
        faculty: "Faculty of Law",
        facultyBlock: "Block D",
        facultyBlockRoom: "Room 101",
      },
      isAnonymous: false,
      chatroomId: "",
      createdAt: "2025-06-14T12:15:00.000Z",
      updatedAt: "2025-06-23T12:15:00.000Z",
      version: 1,
    },
    {
      id: "CMP-1097",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "oiiae",
      status: "Resolved",
      title:
        "Testing to make this a really long title to see how will my UI render",
      description: "Cooked",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://res.cloudinary.com/dcv38gpis/image/upload/v1760972343/reports/019a0221-7750-70d1-8c53-19ede5b8d3f7.jpg",
      ],
      latitude: 3.1271286,
      longitude: 101.6349525,
      facultyLocation: {
        faculty: "Faculty of Business and Economics",
        facultyBlock: "Block D",
        facultyBlockRoom: "Room 401",
      },
      isAnonymous: false,
      isFeedbackProvided: false,
      chatroomId: "019a0236-cdb6-74dc-878a-b6e675995c1d",
      createdAt: "2025-10-20T14:59:08.106Z",
      updatedAt: "2025-10-20T15:50:33.823Z",
      version: 9,
    },
    {
      id: "CMP-1098",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "Unassigned",
      status: "Opened",
      title: "Yoasobi",
      description: "Yoasobi supremacy",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://res.cloudinary.com/dcv38gpis/image/upload/v1760795567/reports/0199f798-1949-730f-b730-628436f6e0cc.jpg",
      ],
      latitude: 3.1271274,
      longitude: 101.6349593,
      facultyLocation: {
        faculty: "Faculty of Business and Economics",
        facultyBlock: "Block E",
        facultyBlockRoom: "Room 501",
      },
      isAnonymous: false,
      isFeedbackProvided: false,
      chatroomId: "",
      createdAt: "2025-10-18T13:52:48.107Z",
      updatedAt: "2025-10-18T13:52:48.107Z",
      version: 1,
    },
    {
      id: "CMP-1099",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "qwe1",
      status: "Resolved",
      title: "Kk",
      description: "Ok",
      category: { name: "Academic Misconduct", priority: "High" },
      media: [
        "https://res.cloudinary.com/dcv38gpis/image/upload/v1760275685/reports/0199d89b-536e-73af-98a7-ec83159b6b58.jpg",
        "https://res.cloudinary.com/dcv38gpis/image/upload/v1760275685/reports/0199d89b-5371-723c-a73f-294a2db34940.jpg",
      ],
      latitude: 3.1271261,
      longitude: 101.6349792,
      facultyLocation: {
        faculty: "Faculty of Computer Science and Engineering",
        facultyBlock: "Block A",
        facultyBlockRoom: "Room 101",
      },
      isAnonymous: false,
      isFeedbackProvided: true,
      chatroomId: "0199de07-70b5-72a8-b62c-27bceb8d0289",
      createdAt: "2025-10-12T13:28:06.371Z",
      updatedAt: "2025-10-13T16:59:48.850Z",
      version: 15,
    },
  ];

  const [filteredComplaints, setFilteredComplaints] = useState(complaints);

  const getStatusColor = (status) => {
    switch (status) {
      case "Opened":
        return "bg-yellow-100 text-yellow-800";
      case "InProgress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-red-100 text-red-800";
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

  useEffect(() => {
    fetch("http://localhost:5000/admin/usersMobile/users", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAdmins(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const getAdminName = (adminId) => {
    if (!Array.isArray(admins)) return "Unknownnn";
    const admin = admins.find((a) => a._id === adminId);
    return admin ? admin.name : "Unassigned";
  };

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
    const direction =
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";

    setSortConfig({ key, direction });

    const sorted = [...filteredComplaints].sort((a, b) => {
      let valueA = a[key];
      let valueB = b[key];

      if (key === "createdAt") {
        valueA = new Date(a.createdAt);
        valueB = new Date(b.createdAt);
      }

      if (key === "priority") {
        const priorityOrder = { Low: 1, Medium: 2, High: 3 };
        valueA = priorityOrder[a.category.priority] || 0;
        valueB = priorityOrder[b.category.priority] || 0;
      }

      if (valueA < valueB) return direction === "ascending" ? -1 : 1;
      if (valueA > valueB) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setFilteredComplaints(sorted);
  };

  const applyFilters = () => {
    const filtered = complaints.filter((complaint) => {
      const title = complaint?.title || "";
      const id = complaint?.id || "";
      const adminName = getAdminName(complaint.adminId) || "";

      // ✅ Search filter
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adminName.toLowerCase().includes(searchTerm.toLowerCase());

      // ✅ Status filter
      const matchesStatus =
        activeFilter === "all" || complaint.status === activeFilter;

      // ✅ Category filter
      const matchesCategory =
        selectedCategory === "all" ||
        complaint.category.name === selectedCategory;

      // ✅ Date filtering
      let matchesDate = true;
      const rawDate = complaint.createdAt;
      const formattedDate = rawDate
        ? new Date(rawDate).toISOString().slice(0, 10)
        : "";

      if (
        selectedDateRange === "today" ||
        selectedDateRange === "week" ||
        selectedDateRange === "month"
      ) {
        if (dateRange.start && dateRange.end) {
          const complaintDate = formattedDate;
          const startDate = new Date(dateRange.start)
            .toISOString()
            .slice(0, 10);
          const endDate = new Date(dateRange.end).toISOString().slice(0, 10);
          matchesDate = complaintDate >= startDate && complaintDate <= endDate;
        }
      } else if (
        selectedDateRange === "custom" &&
        customStartDate &&
        customEndDate
      ) {
        matchesDate =
          formattedDate >= customStartDate && formattedDate <= customEndDate;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    setFilteredComplaints(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [
    searchTerm,
    activeFilter,
    selectedCategory,
    selectedDateRange,
    dateRange,
    customStartDate,
    customEndDate,
  ]);
  {
    // Pagination logic */}
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
        return <FontAwesomeIcon icon={faSort} className="text-gray-300 ml-1" />;
      }
      return sortConfig.direction === "ascending" ? (
        <FontAwesomeIcon icon={faSortUp} className="text-blue-500 ml-1" />
      ) : (
        <FontAwesomeIcon icon={faSortDown} className="text-blue-500 ml-1" />
      );
    };

    const handleComplaintClick = (complaint) => {
      navigate(`/complaints/${complaint.id}`, { state: complaint });
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex flex-1">
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
                      const dropdown =
                        document.getElementById("exportDropdown");
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
                        placeholder="Search complaints by ID, title, or assignee..."
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
                          { value: "Opened", label: "Opened" },
                          { value: "InProgress", label: "In Progress" },
                          { value: "Resolved", label: "Resolved" },
                          { value: "Closed", label: "Closed" },
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
                          { value: "Bullying", label: "Bullying" },
                          {
                            value: "Sexual harassment",
                            label: "Sexual harassment",
                          },
                          { value: "Dress Code", label: "Dress Code" },
                          {
                            value: "Unauthorized Access",
                            label: "Unauthorized Access",
                          },
                          { value: "Cleanliness", label: "Cleanliness" },
                          {
                            value: "Academic Misconduct",
                            label: "Academic Misconduct",
                          },
                          { value: "Vandalism", label: "Vandalism" },
                          { value: "Mental Issues", label: "Mental Issues" },
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
                      onClick={() => setActiveFilter("Opened")}
                      className={`complaint-status-selection ${
                        activeFilter === "Opened"
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
                      onClick={() => setActiveFilter("InProgress")}
                      className={`complaint-status-selection ${
                        activeFilter === "InProgress"
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

                    <button
                      onClick={() => setActiveFilter("Closed")}
                      className={`complaint-status-selection ${
                        activeFilter === "Closed"
                          ? "bg-red-100 text-red-800"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <FontAwesomeIcon icon={faLock} className="mr-1" />
                      Closed
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
                          className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort("id")}
                        >
                          <div className="flex items-center">
                            ID {getSortIcon("id")}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="complaint-table-header-row "
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex  items-center">
                            title {getSortIcon("title")}
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
                          onClick={() => handleSort("createdAt")}
                        >
                          <div className="flex items-center">
                            Date {getSortIcon("createdAt")}
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
                                  {complaint.title}
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
                              {complaint.createdAt
                                ? new Date(complaint.createdAt)
                                    .toISOString()
                                    .split("T")[0]
                                : ""}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`font-medium ${getPriorityColor(
                                  complaint.category.priority
                                )}`}
                              >
                                {complaint.category.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {complaint.category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getAdminName(complaint.adminId) ===
                              "Unassigned" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Unassigned
                                </span>
                              ) : (
                                getAdminName(complaint.adminId)
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  type="button"
                                  data-readdy="true"
                                  className="!rounded-button whitespace-nowrap text-gray-600 hover:text-gray-900 cursor-pointer"
                                  title="View Details"
                                  onClick={() =>
                                    handleComplaintClick(complaint)
                                  }
                                >
                                  <FontAwesomeIcon
                                    icon={faEye}
                                  ></FontAwesomeIcon>
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
                                                  Are you sure you want to
                                                  delete complaint{" "}
                                                  <span className="font-medium">
                                                    {complaintToDelete.id}
                                                  </span>
                                                  ?
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500">
                                                  title:{" "}
                                                  <span className="font-medium">
                                                    {complaintToDelete.title}
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
      </div>
    );
  }
};
export default ComplaintManagement;
