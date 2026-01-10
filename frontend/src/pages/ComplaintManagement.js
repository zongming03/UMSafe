import { useState, useEffect } from "react";
import "../styles/ComplaintManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchReports } from "../services/reportsApi";
import { fetchRooms, fetchFacultyCategories } from "../services/api";
import { useComplaintUpdates } from "../hooks/useComplaintUpdates";
import {
  faFileExport,
  faFileCsv,
  faChevronDown,
  faCheckCircle,
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
import { generatePDFHtml } from "../components/ExportPDFTemplate";

// Import utilities
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import {
  capitalizeStatus,
  getStatusColor,
  getPriorityColor,
} from "../utils/statusUtils";
import {
  getSortIcon as getSortIconString,
} from "../utils/filterUtils";
import { mapReportToComplaint } from "../utils/complaintMapper";

const ComplaintManagement = () => {
  // ==================== STATE MANAGEMENT ====================
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedComplaints, setSelectedComplaints] = useState([]);

  // Modals & UI State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState(null);

  // Data
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [userFacultyName, setUserFacultyName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // ==================== UTILITY FUNCTIONS ====================
  // Wrapper for getSortIcon to return React component
  const getSortIcon = (key) => {
    const iconString = getSortIconString(key, sortConfig);
    if (iconString === "⇅") {
      return <FontAwesomeIcon icon={faSort} className="text-gray-300 ml-1" />;
    } else if (iconString === "↑") {
      return <FontAwesomeIcon icon={faSortUp} className="text-blue-500 ml-1" />;
    } else {
      return (
        <FontAwesomeIcon icon={faSortDown} className="text-blue-500 ml-1" />
      );
    }
  };

  // Real-time complaint updates
  useComplaintUpdates({
    onNewComplaint: async (payload) => {
      console.log("📬 New complaint received via WebSocket:", payload);

      // Fetch full complaint details from API
      try {
        const response = await fetchReports();
        const reportsData =
          response.data?.reports || response.data?.data || response.data || [];

        // Find the new complaint by ID
        const newReport = reportsData.find(
          (r) =>
            r.id === payload.complaintId || r.displayId === payload.complaintId
        );

        if (newReport) {
          const mappedComplaint = {
            id: newReport.id,
            displayId: newReport.displayId,
            userId: newReport.userId,
            username: newReport.username,
            adminId: newReport.adminId || "Unassigned",
            adminName: newReport.adminName || "Unassigned",
            status: capitalizeStatus(newReport.status),
            title: newReport.title,
            description: newReport.description,
            category: {
              name: newReport.category?.name || "Unknown",
              priority: newReport.category?.priority || "Low",
            },
            media: newReport.media || [],
            latitude: newReport.latitude,
            longitude: newReport.longitude,
            facultyLocation: newReport.facultyLocation || {},
            isAnonymous: newReport.isAnonymous,
            isFeedbackProvided: newReport.isFeedbackProvided,
            chatroomId: newReport.chatroomId || "",
            createdAt: newReport.createdAt,
            updatedAt: newReport.updatedAt,
            version: newReport.version,
            comments: newReport.comments || [],
          };

          console.log("✅ Adding new complaint to list:", mappedComplaint);

          // Add to list (avoid duplicates)
          setComplaints((prev) => {
            const exists = prev.some((c) => c.id === mappedComplaint.id);
            if (exists) {
              console.log("⚠️ Complaint already exists, skipping");
              return prev;
            }
            return [mappedComplaint, ...prev];
          });
        } else {
          console.log("⚠️ New complaint not found in API, adding minimal data");
          // Fallback: Add minimal complaint data
          setComplaints((prev) => {
            const exists = prev.some((c) => c.id === payload.complaintId);
            if (exists) return prev;

            return [
              {
                id: payload.complaintId,
                displayId: payload.complaintId,
                userId: payload.userId || "Unknown",
                username: payload.username || "Unknown User",
                adminId: "Unassigned",
                adminName: "Unassigned",
                status: "Opened",
                title: payload.title || "New Complaint",
                description: payload.description || "",
                category: { name: "Unknown", priority: "Low" },
                media: [],
                latitude: null,
                longitude: null,
                facultyLocation: {},
                isAnonymous: false,
                isFeedbackProvided: false,
                chatroomId: "",
                createdAt: payload.createdAt || new Date().toISOString(),
                updatedAt: payload.createdAt || new Date().toISOString(),
                version: 0,
                comments: [],
              },
              ...prev,
            ];
          });
        }
      } catch (err) {
        console.error("❌ Error fetching new complaint details:", err);
        // Fallback: Add minimal complaint data
        setComplaints((prev) => {
          const exists = prev.some((c) => c.id === payload.complaintId);
          if (exists) return prev;

          return [
            {
              id: payload.complaintId,
              displayId: payload.complaintId,
              userId: payload.userId || "Unknown",
              username: payload.username || "Unknown User",
              adminId: "Unassigned",
              adminName: "Unassigned",
              status: "Opened",
              title: payload.title || "New Complaint",
              description: payload.description || "",
              category: { name: "Unknown", priority: "Low" },
              media: [],
              latitude: null,
              longitude: null,
              facultyLocation: {},
              isAnonymous: false,
              isFeedbackProvided: false,
              chatroomId: "",
              createdAt: payload.createdAt || new Date().toISOString(),
              updatedAt: payload.createdAt || new Date().toISOString(),
              version: 0,
              comments: [],
            },
            ...prev,
          ];
        });
      }
    },
    onStatusChange: (payload) => {
      console.log("🔄 Status change received via WebSocket:", payload);
      // Update complaint status in local state
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === payload.complaintId || c.displayId === payload.complaintId
            ? {
                ...c,
                status: capitalizeStatus(payload.status),
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    },
    onAssignment: (payload) => {
      console.log("👤 Assignment change received via WebSocket:", payload);
      // Update complaint assignment in local state
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === payload.complaintId || c.displayId === payload.complaintId
            ? {
                ...c,
                adminId: payload.adminId || "Unassigned",
                adminName: payload.adminId
                  ? payload.adminName || "Assigned"
                  : "Unassigned",
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    },
  });

  // ==================== EFFECTS & INITIALIZATION ====================

  // Real-time WebSocket updates for new complaints, status changes, and assignments
  useEffect(() => {
    // Resolve logged-in user's faculty name for filtering and get user role
    (async () => {
      try {
        const userDataStr =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        
        // Get and set user role for permission checks
        if (currentUser?.role) {
          setUserRole(currentUser.role);
        }
        
        const currentUserFacultyId = currentUser?.facultyid;
        if (!currentUserFacultyId) return;
        const res = await fetchRooms();
        const faculties = Array.isArray(res.data) ? res.data : [];
        const faculty = faculties.find(
          (f) => String(f._id) === String(currentUserFacultyId)
        );
        if (faculty?.name) setUserFacultyName(String(faculty.name));
      } catch (e) {
        console.warn("[Complaints] Failed to resolve user faculty name", e);
      }
    })();

    const loadComplaints = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchReports();
        console.log("📋 Reports API Response:", response.data);

        // Extract reports array from response
        const reportsData =
          response.data?.reports || response.data?.data || response.data || [];

        // Map API response using utility
        const mappedComplaints = reportsData.map(mapReportToComplaint);

        setComplaints(mappedComplaints);
      } catch (err) {
        console.error("Error fetching complaints:", err);
        setError("Failed to fetch complaints.");
        setComplaints([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadComplaints();
  }, []);

  // Global click listener for dropdown menus
  useEffect(() => {
    const handleGlobalClick = (event) => {
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

  // Fetch and filter admins by faculty
  useEffect(() => {
    const userDataStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
    const currentUserFacultyId = currentUser?.facultyid;

    const apiBase = process.env.REACT_APP_API_BASE_URL.replace(/\/$/, "");
    fetch(`${apiBase}/mobile/users`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const userList = data.data || data.users || [];
        const filtered = userList.filter(
          (user) =>
            (user.role === "admin" || user.role === "superadmin") &&
            String(user.facultyid) === String(currentUserFacultyId)
        );
        setAdmins(filtered);
      })
      .catch((err) => {
        console.error("Error fetching admins:", err);
        setAdmins([]);
      });
  }, []);

  // Fetch categories from backend
  useEffect(() => {
    const userDataStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
    const userFacultyId = currentUser?.facultyid;
    
    if (!userFacultyId) {
      console.error("No facultyId found for current user");
      setCategoryOptions([]);
      return;
    }

    fetchFacultyCategories(userFacultyId)
      .then((res) => {
        const categories = Array.isArray(res.data)
          ? res.data
          : res.data.data || res.data.categories || [];
        setCategoryOptions(categories);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setCategoryOptions([]);
      });
  }, []);

  const getAdminName = (complaint) => {
    if (complaint.adminName && complaint.adminName !== "Unassigned") {
      return complaint.adminName;
    }

    if (!Array.isArray(admins) || !complaint.adminId) return "Unassigned";
    const admin = admins.find((a) => a._id === complaint.adminId);
    return admin ? admin.name : "Unassigned";
  };

  // Handle date range changes
  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setSelectedDateRange(value);
    
    if (value === "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      setDateRange({ start: null, end: null });
    } else {
      // Calculate date ranges for preset options
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      let startDate = new Date(today);

      if (value === "today") {
        startDate = new Date(today);
      } else if (value === "week") {
        // Get start of current week (Monday)
        startDate = new Date(today);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
      } else if (value === "month") {
        // Get start of current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
      }

      setDateRange({ start: startDate, end: endDate });
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedComplaints(
        filteredComplaints.map((complaint) => complaint.id)
      );
    } else {
      setSelectedComplaints([]);
    }
  };

  // Handle individual complaint selection
  const handleSelectComplaint = (id) => {
    if (selectedComplaints.includes(id)) {
      setSelectedComplaints(
        selectedComplaints.filter((complaintId) => complaintId !== id)
      );
    } else {
      setSelectedComplaints([...selectedComplaints, id]);
    }
  };

  // Sort handler - updates sort config and reorders filtered complaints
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

  // Apply filters based on search, status, category, and date
  const applyFilters = () => {
    const filtered = complaints.filter((complaint) => {
      const title = complaint?.title || "";
      const displayId = complaint?.displayId || "";
      const adminName = getAdminName(complaint) || "";

      // ✅ Faculty filter - only show complaints from user's faculty
      const complaintFacultyName = (
        complaint?.facultyLocation?.faculty ||
        complaint?.facultyLocation?.facultyName ||
        ""
      ).toString().trim().toLowerCase();
      const normalizedUserFaculty = (userFacultyName || "").toString().trim().toLowerCase();
      
      // If user faculty not resolved yet or complaint doesn't match user's faculty, exclude it
      const matchesFaculty = normalizedUserFaculty && complaintFacultyName === normalizedUserFaculty;
      
      if (!matchesFaculty) return false;

      // ✅ Search filter (use displayId)
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        displayId.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      if (selectedDateRange !== "all") {
        const rawDate = complaint.createdAt;
        const formattedDate = rawDate
          ? new Date(rawDate).toISOString().slice(0, 10)
          : "";

        if (selectedDateRange === "custom" && customStartDate && customEndDate) {
          matchesDate =
            formattedDate >= customStartDate && formattedDate <= customEndDate;
        } else if (dateRange.start && dateRange.end) {
          const complaintDate = formattedDate;
          const startDate = new Date(dateRange.start)
            .toISOString()
            .slice(0, 10);
          const endDate = new Date(dateRange.end).toISOString().slice(0, 10);
          matchesDate = complaintDate >= startDate && complaintDate <= endDate;
        }
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });

    setFilteredComplaints(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [
    complaints, 
    searchTerm,
    activeFilter,
    selectedCategory,
    selectedDateRange,
    dateRange,
    customStartDate,
    customEndDate,
    userFacultyName, // Re-filter when user faculty name is resolved
  ]);

  // ==================== PAGINATION & NAVIGATION ====================

  // Calculate pagination properties
  const itemsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredComplaints.length / itemsPerPage)
  );
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Navigate to complaint details page
  const handleComplaintClick = (complaint) => {
    // Pass all complaints for sidebar navigation
    navigate(`/complaints/${complaint.id}`, {
      state: {
        complaint,
        allComplaints: filteredComplaints,
      },
    });
  };

  // ==================== RENDER ====================

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

              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <div className="relative">
                  <button
                    id="exportButton"
                    onClick={() => {
                      const count = selectedComplaints.length;
                      if (count === 0) {
                        const n = document.createElement("div");
                        n.className = "export-notification";
                        n.innerHTML = `<span>Please select complaints to export (max 10).</span>`;
                        document.body.appendChild(n);
                        setTimeout(() => n.remove(), 3000);
                        return;
                      }
                      if (count > 10) {
                        const n = document.createElement("div");
                        n.className = "export-notification";
                        n.innerHTML = `<span>You can export up to 10 complaints per request. You selected ${count}.</span>`;
                        document.body.appendChild(n);
                        setTimeout(() => n.remove(), 3500);
                        return;
                      }
                      const dropdown =
                        document.getElementById("exportDropdown");
                      if (dropdown) {
                        dropdown.classList.toggle("hidden");
                      }
                    }}
                    className={`complaint-export-button ${
                      selectedComplaints.length === 0 ||
                      selectedComplaints.length > 10
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    aria-disabled={
                      selectedComplaints.length === 0 ||
                      selectedComplaints.length > 10
                    }
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
                    className="hidden absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        <p className="font-medium">Export Options</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Choose format (selected: {selectedComplaints.length})
                        </p>
                      </div>
                      <div className="py-1">
                        <button
                          id="exportCSV"
                          onClick={() => {
                            const count = selectedComplaints.length;
                            if (count === 0 || count > 10) return;
                            try {
                              exportToCSV(
                                filteredComplaints,
                                selectedComplaints
                              );
                              const n = document.createElement("div");
                              n.className = "export-notification";
                              n.innerHTML = `<span>✅ Successfully exported ${count} complaints as CSV</span>`;
                              document.body.appendChild(n);
                              setTimeout(() => n.remove(), 3000);
                            } catch (error) {
                              const n = document.createElement("div");
                              n.className = "export-notification";
                              n.style.background = "#FEE2E2";
                              n.style.color = "#991B1B";
                              n.innerHTML = `<span>❌ Export failed. Please try again.</span>`;
                              document.body.appendChild(n);
                              setTimeout(() => n.remove(), 3000);
                            }
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
                          id="exportPDF"
                          onClick={() => {
                            const count = selectedComplaints.length;
                            if (count === 0 || count > 10) return;
                            try {
                              exportToPDF(
                                filteredComplaints,
                                selectedComplaints,
                                generatePDFHtml
                              );
                              const n = document.createElement("div");
                              n.className = "export-notification";
                              n.innerHTML = `<span>✅ Print preview opened for ${count} complaints</span>`;
                              document.body.appendChild(n);
                              setTimeout(() => n.remove(), 3000);
                            } catch (error) {
                              const n = document.createElement("div");
                              n.className = "export-notification";
                              n.style.background = "#FEE2E2";
                              n.style.color = "#991B1B";
                              n.innerHTML = `<span>❌ Export failed. Please try again.</span>`;
                              document.body.appendChild(n);
                              setTimeout(() => n.remove(), 3000);
                            }
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
                        ...categoryOptions
                          .map((category) => ({ value: category.name, label: category.name }))
                          .sort((a, b) => a.label.localeCompare(b.label)),
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

            {/* Loading and Error States */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-blue-600 text-3xl mr-3"
                />
                <span className="text-gray-600">
                  Loading complaints from database...
                </span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-red-600 mr-3"
                  />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Complaints Table */}
            {!isLoading && !error && (
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
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex items-center">Category</div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          <div className="flex items-center">Assigned To</div>
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
                            <td
                              className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                              onClick={() => handleComplaintClick(complaint)}
                            >
                              {complaint.displayId}
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
                              {getAdminName(complaint) === "Unassigned" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Unassigned
                                </span>
                              ) : (
                                getAdminName(complaint)
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
                                  className={`!rounded-button whitespace-nowrap ${
                                    userRole === "officer"
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "text-red-600 hover:text-red-900 cursor-pointer"
                                  }`}
                                  title={userRole === "officer" ? "Only admins can delete complaints" : "Delete"}
                                  disabled={userRole === "officer"}
                                  onClick={() => {
                                    if (userRole === "officer") return;
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
                                                    {
                                                      complaintToDelete.displayId
                                                    }
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
                                setSelectedComplaints([]);
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
export default ComplaintManagement;
