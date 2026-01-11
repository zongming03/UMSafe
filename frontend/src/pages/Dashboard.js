import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";
import { useComplaintUpdates } from "../hooks/useComplaintUpdates";
import { NotificationService } from "../utils/NotificationService";
import { fetchReports, closeReport, resolveReport } from "../services/reportsApi";
import { fetchRooms } from "../services/api";

import "../styles/Dashboard.css";
import SummaryCard from "../components/SummaryCard";
import KanbanBoard from "../components/KanbanBoard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faClipboardList,
  faExclamationCircle,
  faCheckCircle,
  faArrowDown,
  faChevronDown,
  faSearch,
  faFilter,
  faTrashAlt,
  faEye,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("Last 7 Days");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const timeRangeOptions = [
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "Last 3 Months",
  ];

  const updateChartData = (range) => {
    const chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) return;
    // build dynamic series from complaints for the given range
    const buildChartData = (rangeLabel) => {
      const { start, end } = getPeriodBounds(rangeLabel);
      const buckets = [];
      const labels = [];
      // For 'Today' use hourly buckets (0..23)
      if (rangeLabel === "Today") {
        const dayStart = normalizeDayStart(new Date());
        for (let h = 0; h < 24; h++) {
          const s = new Date(dayStart);
          s.setHours(h, 0, 0, 0);
          const e = new Date(dayStart);
          e.setHours(h, 59, 59, 999);
          buckets.push([s.getTime(), e.getTime()]);
          labels.push(`${String(h).padStart(2, "0")}:00`);
        }
      } else {
        // daily buckets from start to end inclusive
        const s = normalizeDayStart(start);
        const e = normalizeDayEnd(end);
        for (
          let cur = new Date(s);
          cur.getTime() <= e.getTime();
          cur.setDate(cur.getDate() + 1)
        ) {
          const bs = new Date(cur);
          const be = new Date(cur);
          be.setHours(23, 59, 59, 999);
          buckets.push([bs.getTime(), be.getTime()]);
          labels.push(
            `${bs.getFullYear()}-${String(bs.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(bs.getDate()).padStart(2, "0")}`
          );
        }
      }

      // Treat Closed separately from Resolved for trend display
      const normalizeForTrend = (status) => {
        const raw = String(status || '').trim().toLowerCase();
        if (raw === 'closed' || raw === 'close') return 'Closed';
        return normalizeStatus(status);
      };

      const openSeries = [];
      const inProgressSeries = [];
      const resolvedSeries = [];
      const closedSeries = [];

      buckets.forEach(([bs, be]) => {
        const createdInBucket = complaints.filter((it) => {
          const t = it.createdAt ? Date.parse(it.createdAt) : NaN;
          return !isNaN(t) && t >= bs && t <= be;
        });
        const openCount = createdInBucket.filter(
          (c) => normalizeForTrend(c.status) === "Opened"
        ).length;
        const inProgCount = createdInBucket.filter(
          (c) => normalizeForTrend(c.status) === "InProgress"
        ).length;
        const resCount = createdInBucket.filter(
          (c) => normalizeForTrend(c.status) === "Resolved"
        ).length;
        const closedCount = createdInBucket.filter(
          (c) => normalizeForTrend(c.status) === "Closed"
        ).length;
        openSeries.push(openCount);
        inProgressSeries.push(inProgCount);
        resolvedSeries.push(resCount);
        closedSeries.push(closedCount);
      });

      return { labels, openSeries, inProgressSeries, resolvedSeries, closedSeries };
    };

    const data = buildChartData(range || selectedTimeRange);
    chart.setOption(
      {
        xAxis: { type: "category", data: data.labels },
        series: [
          {
            name: "Open",
            type: "bar",
            stack: "total",
            data: data.openSeries,
            itemStyle: { color: "#FCD34D" },
          },
          {
            name: "In Progress",
            type: "bar",
            stack: "total",
            data: data.inProgressSeries,
            itemStyle: { color: "#60A5FA" },
          },
          {
            name: "Resolved",
            type: "bar",
            stack: "total",
            data: data.resolvedSeries,
            itemStyle: { color: "#34D399" },
          },
          {
            name: "Closed",
            type: "bar",
            stack: "total",
            data: data.closedSeries,
            itemStyle: { color: "#f30000ff" },
          },
        ],
        legend: { data: ["Open", "In Progress", "Resolved", "Closed"] },
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      },
      { notMerge: false }
    );
  };
  const [filterValues, setFilterValues] = useState({
    status: "",
    priority: "",
    dateFrom: "",
    dateTo: "",
    assignedTo: "",
  });
  // appliedFilters is the snapshot of filters when the user clicks Apply
  const [appliedFilters, setAppliedFilters] = useState({
    status: "",
    priority: "",
    dateFrom: "",
    dateTo: "",
    assignedTo: "",
  });
  // persist view mode across sessions so admin's preference remains
  const STORAGE_KEY_VIEW = "umsafe:viewMode";
  const [viewMode, setViewMode] = useState(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY_VIEW);
      return v === "kanban" ? "kanban" : "table";
    } catch (e) {
      return "table";
    }
  });

  const profileRef = useRef(null);

  const chartRef = useRef(null);
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [adminsMap, setAdminsMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allComplaints, setAllComplaints] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [userFacultyName, setUserFacultyName] = useState("");
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  // Resolve user's faculty name
  useEffect(() => {
    (async () => {
      try {
        const userDataStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        const facultyId = currentUser?.facultyid;
        if (!facultyId) return;
        const res = await fetchRooms();
        const faculties = Array.isArray(res.data) ? res.data : [];
        const fac = faculties.find((f) => String(f._id) === String(facultyId));
        const facName = fac?.name || fac?.faculty || fac?.title;
        if (facName) setUserFacultyName(String(facName));
      } catch (e) {
        console.warn("[Dashboard] Failed to resolve user faculty name", e);
      }
    })();
  }, []);

  // Fetch complaints from API on mount
  useEffect(() => {
    const loadComplaints = async () => {
      setIsLoadingComplaints(true);
      try {
        const response = await fetchReports();
        const reportsData = response.data?.reports || response.data?.data || response.data || [];
        
        // Map API response to match component's expected format
        const mappedComplaints = reportsData.map(report => ({
          id: report.id || report._id,
          displayId: report.displayId || report.id || report._id,
          userId: report.userId,
          username: report.username,
          adminId: report.adminId || "Unassigned",
            adminName: report.adminName || "Unassigned",
          status: report.status,
          title: report.title,
          description: report.description,
          category: report.category || {},
          media: report.media || [],
          latitude: report.latitude,
          longitude: report.longitude,
          facultyLocation: report.facultyLocation || {},
          isAnonymous: report.isAnonymous,
          isFeedbackProvided: report.isFeedbackProvided,
          chatroomId: report.chatroomId || "",
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
          timelineHistory: report.timelineHistory || []
        }));
        
        console.log("✅ Dashboard: Loaded complaints from API:", mappedComplaints.length);
        setAllComplaints(mappedComplaints);
      } catch (err) {
        console.error("❌ Dashboard: Error fetching complaints:", err);
        setAllComplaints([]);
      } finally {
        setIsLoadingComplaints(false);
      }
    };

    loadComplaints();
  }, []);

  // 🔄 Poll for new complaints from partner API every 4 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetchReports();
        const reportsData = response.data?.reports || response.data?.data || response.data || [];

        const mappedComplaints = reportsData.map(report => ({
          id: report.id || report._id,
          displayId: report.displayId || report.id || report._id,
          userId: report.userId,
          username: report.username,
          adminId: report.adminId || "Unassigned",
          adminName: report.adminName || "Unassigned",
          status: report.status,
          title: report.title,
          description: report.description,
          category: report.category || {},
          media: report.media || [],
          latitude: report.latitude,
          longitude: report.longitude,
          facultyLocation: report.facultyLocation || {},
          isAnonymous: report.isAnonymous,
          isFeedbackProvided: report.isFeedbackProvided,
          chatroomId: report.chatroomId || "",
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
          timelineHistory: report.timelineHistory || []
        }));

        // Compare with existing complaints to find new ones or updates
        setAllComplaints((prevComplaints) => {
          // Create a set of existing complaint IDs
          const existingIds = new Set(prevComplaints.map((c) => c.id));

          // Find new complaints
          const newComplaints = mappedComplaints.filter(
            (c) => !existingIds.has(c.id)
          );

          if (newComplaints.length > 0) {
            console.log(
              `📬 Dashboard Polling: Found ${newComplaints.length} new complaint(s)`
            );
            // Add new complaints to the beginning of the list
            return [...newComplaints, ...prevComplaints];
          }

          // Also check for status/assignment changes in existing complaints
          let hasUpdates = false;
          const updatedComplaints = prevComplaints.map((prevComplaint) => {
            const updatedComplaint = mappedComplaints.find(
              (c) => c.id === prevComplaint.id
            );
            if (
              updatedComplaint &&
              (prevComplaint.status !== updatedComplaint.status ||
                prevComplaint.adminId !== updatedComplaint.adminId ||
                prevComplaint.adminName !== updatedComplaint.adminName)
            ) {
              hasUpdates = true;
              return updatedComplaint;
            }
            return prevComplaint;
          });

          if (hasUpdates) {
            console.log("📝 Dashboard Polling: Found status/assignment updates");
            return updatedComplaints;
          }

          return prevComplaints;
        });
      } catch (error) {
        console.warn("Dashboard polling error:", error);
      }
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Derive complaints filtered by user's faculty name
  useEffect(() => {
    const norm = (s) => String(s || "").trim().toLowerCase();
    const normalizedUserFaculty = norm(userFacultyName);
    if (!normalizedUserFaculty) {
      setComplaints([]);
      return;
    }
    const filtered = (allComplaints || []).filter((c) => {
      const reportFaculty = norm(c?.facultyLocation?.faculty || c?.facultyLocation?.facultyName);
      return reportFaculty && reportFaculty === normalizedUserFaculty;
    });
    setComplaints(filtered);
  }, [allComplaints, userFacultyName]);

  // Real-time complaint updates
  useComplaintUpdates({
    showNotifications: true, // Show notifications on Dashboard (main page)
    onNewComplaint: (payload) => {
      // Refetch or add new complaint to list
      setAllComplaints((prev) => [
        { id: payload.complaintId, title: payload.title, status: 'Open', createdAt: payload.createdAt || new Date().toISOString(), facultyLocation: payload.facultyLocation || {} },
        ...prev,
      ]);
    },
    onStatusChange: (payload) => {
      // Update complaint status in local state
      setAllComplaints((prev) =>
        prev.map((c) =>
          matchesComplaint(c, payload.complaintId)
            ? { ...c, status: payload.status }
            : c
        )
      );
    },
    onAssignment: (payload) => {
      // Update complaint assignment in local state
      setAllComplaints((prev) =>
        prev.map((c) =>
          matchesComplaint(c, payload.complaintId)
            ? { ...c, adminId: payload.adminId, adminName: payload.adminName || payload.adminId }
            : c
        )
      );
    },
  });

  const matchesComplaint = (c, complaintId) => c.id === complaintId || c.displayId === complaintId || c._id === complaintId;

  const navigateToComplaint = (complaint) => {
    if (!complaint) return;
    // navigate to complaint detail route and pass the complaint object and all complaints in state
    navigate(`/complaints/${complaint.id}`, {
      state: {
        complaint,
        allComplaints: complaints,
      },
    });
  };

  const handleKanbanMove = async (complaintId, newStatus) => {
    // optimistic update locally and persist to backend; rollback on failure
    let previousStatus = null;
    setComplaints((prev) => {
      return prev.map((c) => {
        if (matchesComplaint(c, complaintId)) {
          previousStatus = c.status;
          return { ...c, status: newStatus };
        }
        return c;
      });
    });

    // Attempt to persist change to backend
    try {
      // Call the appropriate partner API endpoint based on target status
      if (newStatus === "Closed") {
        await closeReport(complaintId, {});
      } else if (newStatus === "Resolved") {
        await resolveReport(complaintId, {});
      } else {
        throw new Error(`Unsupported kanban status: ${newStatus}`);
      }
      
      // Success: state already updated optimistically
      console.log(`✅ Kanban move persisted: ${complaintId} -> ${newStatus}`);
    } catch (err) {
      console.warn("Failed to persist kanban move, rolling back:", err);
      // rollback to previous status
      setComplaints((prev) =>
        prev.map((c) =>
          matchesComplaint(c, complaintId)
            ? { ...c, status: previousStatus || "Opened" }
            : c
        )
      );
    }
  };
  // apply search + applied filters for pagination and table display
  const q = (searchQuery || "").trim().toLowerCase();

  const matchesStatusFilter = (c, statusFilter) => {
    if (!statusFilter) return true;
    const raw = (c.status || "").toLowerCase();
    const sf = statusFilter.toLowerCase();
    if (sf === "closed") return raw.includes("closed");
    if (sf === "open" || sf === "opened")
      return raw === "open" || raw === "opened" || raw.includes("open");
    if (sf === "in progress" || sf === "inprogress" || sf === "in-progress")
      return (
        raw.includes("inprogress") ||
        raw.includes("in progress") ||
        raw.includes("in-progress")
      );
    if (sf === "resolved")
      return raw.includes("resolved") || raw.includes("resolve");
    return raw === sf;
  };

  const matchesPriorityFilter = (c, priorityFilter) => {
    if (!priorityFilter) return true;
    const p = (c.priority || c.category?.priority || "").toLowerCase();
    return p === priorityFilter.toLowerCase();
  };

  const matchesAssignedFilter = (c, assignedFilter) => {
    if (!assignedFilter) return true;
    if (assignedFilter === "Unassigned") {
      return (
        !c.adminId ||
        c.adminId === "Unassigned" ||
        c.assignedTo === "Unassigned"
      );
    }
    // compare by resolved admin name (adminsMap maps id->name) or by any assignedTo/adminName field
    const adminName = adminsMap[c.adminId] || c.adminName || c.assignedTo || "";
    return (
      String(adminName).toLowerCase() === String(assignedFilter).toLowerCase()
    );
  };

  const matchesDateRange = (c, from, to) => {
    if (!from && !to) return true;
    const created = c.createdAt ? Date.parse(c.createdAt) : NaN;
    if (isNaN(created)) return false;
    if (from) {
      const f = Date.parse(new Date(from + "T00:00:00"));
      if (created < f) return false;
    }
    if (to) {
      const t = Date.parse(new Date(to + "T23:59:59"));
      if (created > t) return false;
    }
    return true;
  };

  // Normalize day boundaries (hoisted as functions to avoid TDZ)
  function normalizeDayStart(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function normalizeDayEnd(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  const matchesTimeRange = (c, timeRangeLabel) => {
    if (!timeRangeLabel || timeRangeLabel === "all") return true;
    const { start, end } = getPeriodBounds(timeRangeLabel);
    const created = c.createdAt ? Date.parse(c.createdAt) : NaN;
    if (isNaN(created)) return false;
    return created >= start.getTime() && created <= end.getTime();
  };

  const filteredComplaints = complaints.filter((c) => {
    // search
    if (
      q &&
      !(
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.id || "").toLowerCase().includes(q)
      )
    ) {
      return false;
    }
    // applied filters
    const f = appliedFilters || {};
    if (!matchesStatusFilter(c, f.status)) return false;
    if (!matchesPriorityFilter(c, f.priority)) return false;
    if (!matchesAssignedFilter(c, f.assignedTo)) return false;
    if (!matchesDateRange(c, f.dateFrom, f.dateTo)) return false;
    // time range filter for table display
    if (!matchesTimeRange(c, selectedTimeRange)) return false;
    return true;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedComplaints = (complaints) => {
    if (!sortConfig.key) return complaints;

    return [...complaints].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle ID sorting (extract number from "CMP-1093" format)
      if (sortConfig.key === 'id') {
        aValue = parseInt(aValue.split('-')[1]) || 0;
        bValue = parseInt(bValue.split('-')[1]) || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const getCurrentPageComplaints = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const sorted = getSortedComplaints(filteredComplaints);
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  };
  const totalPages = Math.max(
    1,
    Math.ceil(filteredComplaints.length / itemsPerPage)
  );
  const maxPageButtons = 5;

  const getDisplayStatusLabel = (status) => {
    const raw = String(status || '').trim().toLowerCase();
    if (raw === 'closed' || raw === 'close') return 'Closed';
    return normalizeStatus(status);
  };

  // Calculate start and end page numbers for pagination
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  const getStatusColor = (status) => {
    const s = getDisplayStatusLabel(status);
    switch (s) {
      case "Opened":
        return "bg-yellow-100 text-yellow-800";
      case "InProgress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-red-100 text-red-800";
      default:
        // default to Opened to avoid other labels
        return "bg-yellow-100 text-yellow-800";
    }
  };
  // --- Period helpers for percent change ---

  function getPeriodBounds(rangeLabel, now = new Date()) {
    const end = new Date(now);
    let start = new Date(now);
    switch (rangeLabel) {
      case "Today": {
        const s = normalizeDayStart(now);
        const e = normalizeDayEnd(now);
        const prev = new Date(s.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: s,
          end: e,
          prevStart: normalizeDayStart(prev),
          prevEnd: normalizeDayEnd(prev),
        };
      }
      case "Last 7 Days": {
        const e = normalizeDayEnd(end);
        const s = normalizeDayStart(
          new Date(end.getTime() - (7 - 1) * 24 * 60 * 60 * 1000)
        );
        const prevEnd = new Date(s.getTime() - 1);
        const prevStart = normalizeDayStart(
          new Date(prevEnd.getTime() - (7 - 1) * 24 * 60 * 60 * 1000)
        );
        return {
          start: s,
          end: e,
          prevStart,
          prevEnd: normalizeDayEnd(prevEnd),
        };
      }
      case "Last 30 Days": {
        const e = normalizeDayEnd(end);
        const s = normalizeDayStart(
          new Date(end.getTime() - (30 - 1) * 24 * 60 * 60 * 1000)
        );
        const prevEnd = new Date(s.getTime() - 1);
        const prevStart = normalizeDayStart(
          new Date(prevEnd.getTime() - (30 - 1) * 24 * 60 * 60 * 1000)
        );
        return {
          start: s,
          end: e,
          prevStart,
          prevEnd: normalizeDayEnd(prevEnd),
        };
      }
      case "Last 3 Months": {
        // use calendar months: subtract 3 months
        const e = normalizeDayEnd(end);
        const s = new Date(end);
        s.setMonth(s.getMonth() - 3);
        const startCal = normalizeDayStart(s);
        const prevEnd = new Date(startCal.getTime() - 1);
        const prevStart = new Date(startCal);
        prevStart.setMonth(prevStart.getMonth() - 3);
        return {
          start: startCal,
          end: e,
          prevStart: normalizeDayStart(prevStart),
          prevEnd: normalizeDayEnd(prevEnd),
        };
      }
      default:
        return getPeriodBounds("Last 7 Days", now);
    }
  }

  function countCreatedInRange(items, start, end) {
    const sT = start.getTime();
    const eT = end.getTime();
    return items.filter((it) => {
      const t = it.createdAt ? Date.parse(it.createdAt) : NaN;
      return !isNaN(t) && t >= sT && t <= eT;
    }).length;
  }

  // Normalize status values into one of: Opened, InProgress, Resolved
  const normalizeStatus = (raw) => {
    if (!raw) return "Opened";
    const s = String(raw).trim().toLowerCase();
    if (s === "open" || s === "opened") return "Opened";
    if (
      s === "inprogress" ||
      s === "in progress" ||
      s === "in_progress" ||
      s === "in-progress"
    )
      return "InProgress";
    if (s === "resolved" || s === "resolve" || s === "closed")
      return "Resolved";
    // map any unknown/other status to Opened (no other labels allowed)
    return "Opened";
  };

  function countResolvedInRange(items, start, end) {
    const sT = start.getTime();
    const eT = end.getTime();
    return items.filter((it) => {
      const status = (it.status || "").toLowerCase();
      if (status !== "resolved") return false;
      const t = it.updatedAt ? Date.parse(it.updatedAt) : NaN;
      return !isNaN(t) && t >= sT && t <= eT;
    }).length;
  }

  function countByStatusInRange(items, statusValue, start, end) {
    const sT = start.getTime();
    const eT = end.getTime();
    return items.filter((it) => {
      // Check if complaint was created in the range
      const t = it.createdAt ? Date.parse(it.createdAt) : NaN;
      if (isNaN(t) || t < sT || t > eT) return false;
      
      // Check if status matches
      const normalized = normalizeStatus(it.status);
      return normalized === statusValue;
    }).length;
  }

  function computeChange(current, previous) {
    const delta = current - previous;
    
    // When previous is 0, we can't calculate percentage (division by zero)
    // Show the absolute increase/decrease instead
    if (!previous || previous === 0) {
      if (delta === 0) {
        return { percent: 0, label: "0%", delta: 0 };
      }
      // Show as absolute increase with indicator
      return {
        percent: delta > 0 ? 999 : -999, // Use high number to indicate significant change
        label: delta > 0 ? `+${delta} (new)` : `${delta} (new)`,
        delta,
      };
    }
    
    // Calculate real percentage (not capped at 100%)
    const rawPct = (delta / previous) * 100;
    const pct = Math.round(rawPct * 10) / 10; // one decimal
    const sign = pct > 0 ? "+" : "";
    
    return {
      percent: pct,
      label: `${sign}${pct}% (${delta > 0 ? "+" : ""}${delta})`,
      delta,
    };
  }

  // compute counts for selectedTimeRange
  const {
    start: periodStart,
    end: periodEnd,
    prevStart,
    prevEnd,
  } = getPeriodBounds(selectedTimeRange);
  const totalCurrentPeriod = countCreatedInRange(
    complaints,
    periodStart,
    periodEnd
  );
  const totalPrevPeriod = countCreatedInRange(complaints, prevStart, prevEnd);
  const totalChange = computeChange(totalCurrentPeriod, totalPrevPeriod);

  // Count complaints with "Opened" status in the period
  const openedCurrentPeriod = countByStatusInRange(
    complaints,
    "Opened",
    periodStart,
    periodEnd
  );
  const openedPrevPeriod = countByStatusInRange(
    complaints,
    "Opened",
    prevStart,
    prevEnd
  );
  const openedChange = computeChange(openedCurrentPeriod, openedPrevPeriod);

  // Count complaints with "Resolved" status in the period
  const resolvedCurrentPeriod = countByStatusInRange(
    complaints,
    "Resolved",
    periodStart,
    periodEnd
  );
  const resolvedPrevPeriod = countByStatusInRange(
    complaints,
    "Resolved",
    prevStart,
    prevEnd
  );
  const resolvedChange = computeChange(
    resolvedCurrentPeriod,
    resolvedPrevPeriod
  );
  
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
  const formatDateShort = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      if (isNaN(d)) return String(iso);
      // Return YYYY-MM-DD
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      return String(iso);
    }
  };
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
    if (
      filterRef.current &&
      !filterRef.current.contains(event.target) &&
      filterButtonRef.current &&
      !filterButtonRef.current.contains(event.target)
    ) {
      setIsFilterOpen(false);
    }
    const timeRangeButton = document.getElementById("timeRangeButton");
    const timeRangeDropdown = document.getElementById("timeRangeDropdown");
    if (
      timeRangeButton &&
      timeRangeDropdown &&
      !timeRangeButton.contains(event.target) &&
      !timeRangeDropdown.contains(event.target)
    ) {
      setIsTimeRangeOpen(false);
    }
  };
  const handleFilterApply = () => {
    // apply current UI filter values
    setAppliedFilters({ ...filterValues });
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleFilterReset = () => {
    const empty = {
      status: "",
      priority: "",
      dateFrom: "",
      dateTo: "",
      assignedTo: "",
    };
    setFilterValues(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Close popovers on outside click
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize chart once
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const option = {
      animation: false,
      tooltip: { trigger: "axis" },
      legend: { data: ["Open", "In Progress", "Resolved"] },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: [
        {
          name: "Open",
          type: "bar",
          stack: "total",
          data: [],
          itemStyle: { color: "#FCD34D" },
        },
        {
          name: "In Progress",
          type: "bar",
          stack: "total",
          data: [],
          itemStyle: { color: "#60A5FA" },
        },
        {
          name: "Resolved",
          type: "bar",
          stack: "total",
          data: [],
          itemStyle: { color: "#34D399" },
        },
      ],
    };
    chart.setOption(option);
    updateChartData(selectedTimeRange);
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      chart.dispose();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // update chart when complaints or selected range change
  useEffect(() => {
    const chart = echarts.getInstanceByDom(chartRef.current);
    if (!chart) return;
    updateChartData(selectedTimeRange);
  }, [selectedTimeRange, complaints]);

  // load admins so we can resolve adminId -> name
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        // Get token from storage
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const apiBase = (process.env.REACT_APP_API_BASE_URL).replace(/\/$/, "");
        
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(
          `${apiBase}/users`,
          { 
            credentials: "include",
            headers,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const admins = Array.isArray(data.data) ? data.data : Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : [];
        const map = {};
        admins.forEach((a) => {
          const id = a._id || a.id || a.userId;
          const name =
            a.name ||
            a.username ||
            `${a.firstName || ""} ${a.lastName || ""}`.trim() ||
            a.displayName;
          if (id) map[id] = name || "(admin)";
        });
        setAdminsMap(map);
      } catch (err) {
        console.warn("Failed to load admins:", err);
      }
    };
    loadAdmins();
  }, []);

  // persist view mode preference
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_VIEW, viewMode);
    } catch (e) {
      // ignore
    }
  }, [viewMode]);

  return (
    <div className="dashboard-container ">
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto h-full">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Overview of complaint management system -{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faClipboardList} />}
                iconBg="bg-blue-500"
                title="Total Complaints"
                value={totalCurrentPeriod}
                change={totalChange.label}
                changeColor={
                  totalChange.percent > 0
                    ? "text-red-600"
                    : totalChange.percent < 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
                changeIcon={
                  totalChange.percent > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : totalChange.percent < 0 ? (
                    <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                  ) : null
                }
              />
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faExclamationCircle} />}
                iconBg="bg-yellow-500"
                title="Opened"
                value={openedCurrentPeriod}
                change={openedChange.label}
                changeColor={
                  openedChange.percent > 0
                    ? "text-red-600"
                    : openedChange.percent < 0
                    ? "text-green-600"
                    : "text-gray-600"
                }
                changeIcon={
                  openedChange.percent > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : openedChange.percent < 0 ? (
                    <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                  ) : null
                }
              />
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faCheckCircle} />}
                iconBg="bg-green-500"
                title="Resolved"
                value={resolvedCurrentPeriod}
                change={resolvedChange.label}
                changeColor={
                  resolvedChange.percent > 0
                    ? "text-green-600"
                    : resolvedChange.percent < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }
                changeIcon={
                  resolvedChange.percent > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : resolvedChange.percent < 0 ? (
                    <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                  ) : null
                }
              />
            </div>

            {/* Chart Section */}
            <div className="mb-6">
              {/* Chart */}
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Complaint Trends
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <button
                        id="timeRangeButton"
                        onClick={() => setIsTimeRangeOpen(!isTimeRangeOpen)}
                        className="time-range-button"
                      >
                        <span>{selectedTimeRange}</span>

                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`ml-2 text-xs transition-transform ${
                            isTimeRangeOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isTimeRangeOpen && (
                        <div
                          id="timeRangeDropdown"
                          className="time-range-dropdown"
                        >
                          <div className="py-1">
                            {timeRangeOptions.map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setSelectedTimeRange(option);
                                  setIsTimeRangeOpen(false);
                                  updateChartData(option);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  selectedTimeRange === option
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View toggle stays visible here so it doesn't disappear when switching views */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode("table")}
                        className={`px-3 py-1 rounded text-sm border ${
                          viewMode === "table"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        Table
                      </button>
                      <button
                        onClick={() => setViewMode("kanban")}
                        className={`px-3 py-1 rounded text-sm border ${
                          viewMode === "kanban"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        Kanban
                      </button>
                    </div>
                  </div>
                </div>
                <div ref={chartRef} className="h-48 lg:h-56"></div>
              </div>
            </div>

            {/* Kanban Board (arrange complaints by status) */}
            {viewMode === "kanban" && (
              <div className="mb-6 view-panel">
                <KanbanBoard
                  complaints={filteredComplaints}
                  onStatusChange={handleKanbanMove}
                  onCardClick={navigateToComplaint}
                  adminsMap={adminsMap}
                />
              </div>
            )}

            {/* Recent Complaints Table */}
            {viewMode === "table" && (
              <div className="recent-complaint-table-container view-panel">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">
                    Recent Complaints
                  </h2>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        className="search-complaint-input"
                        placeholder="Search complaints..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="text-gray-400"
                        ></FontAwesomeIcon>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        ref={filterButtonRef}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="filter-button"
                      >
                        <FontAwesomeIcon
                          icon={faFilter}
                          className=" mr-1"
                        ></FontAwesomeIcon>
                        Filter
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className="ml-2 text-xs"
                        />
                      </button>
                      {/* Filter Dropdown */}
                      {isFilterOpen && (
                        <div
                          ref={filterRef}
                          className="filterComplaintContainer absolute right-0 mt-2 w-[min(90vw,480px)] max-h-[70vh] overflow-auto z-50 bg-white shadow-xl rounded-lg border border-gray-200"
                        >
                          <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                              Filter Complaints
                            </h3>
                            {/* Filter Fields stacked top-to-bottom */}
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Status
                                </label>
                                <div className="relative">
                                  <select
                                    value={filterValues.status}
                                    onChange={(e) =>
                                      setFilterValues({
                                        ...filterValues,
                                        status: e.target.value,
                                      })
                                    }
                                    className="block w-full appearance-none pl-3 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  >
                                    <option value="">All</option>
                                    <option value="Open">Open</option>
                                    <option value="In Progress">
                                      In Progress
                                    </option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                    <FontAwesomeIcon icon={faChevronDown} />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Priority
                                </label>
                                <div className="relative">
                                  <select
                                    value={filterValues.priority}
                                    onChange={(e) =>
                                      setFilterValues({
                                        ...filterValues,
                                        priority: e.target.value,
                                      })
                                    }
                                    className="block w-full appearance-none pl-3 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  >
                                    <option value="">All</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                    <FontAwesomeIcon icon={faChevronDown} />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Assigned To
                                </label>
                                <div className="relative">
                                  <select
                                    value={filterValues.assignedTo}
                                    onChange={(e) =>
                                      setFilterValues({
                                        ...filterValues,
                                        assignedTo: e.target.value,
                                      })
                                    }
                                    className="block w-full appearance-none pl-3 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  >
                                    <option value="">All</option>
                                    <option value="Unassigned">
                                      Unassigned
                                    </option>
                                    {Object.values(adminsMap || {}).length > 0
                                      ? Object.values(adminsMap)
                                          .filter(Boolean)
                                          .sort()
                                          .map((name) => (
                                            <option key={name} value={name}>
                                              {name}
                                            </option>
                                          ))
                                      : null}
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                                    <FontAwesomeIcon icon={faChevronDown} />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-2 sticky bottom-0 bg-white pt-2">
                              <button
                                onClick={handleFilterReset}
                                className="!rounded-button whitespace-nowrap px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Reset
                              </button>
                              <button
                                onClick={handleFilterApply}
                                className="!rounded-button whitespace-nowrap px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                              >
                                Apply Filters
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Complaints Table */}
                <div className="complaint-table">
                  <table className="complaint-table-details">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          scope="col" 
                          className="complaint-table-thread cursor-pointer hover:bg-gray-100 select-none"
                          onClick={() => handleSort('displayId')}
                        >
                          <div className="flex items-center justify-between">
                            <span>ID</span>
                            <span className="ml-2">
                              {sortConfig.key === 'id' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : (
                                <span className="text-gray-400">↕</span>
                              )}
                            </span>
                          </div>
                        </th>
                        <th scope="col" className="complaint-table-thread">
                          Subject
                        </th>
                        <th scope="col" className="complaint-table-thread">
                          Status
                        </th>
                        <th scope="col" className="complaint-table-thread">
                          Date
                        </th>
                        <th scope="col" className="complaint-table-thread">
                          Priority
                        </th>
                        <th scope="col" className="complaint-table-thread">
                          Assigned To
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="complaint-table-body">
                      {getCurrentPageComplaints().length > 0 ? (
                        getCurrentPageComplaints().map((complaint) => (
                          <tr
                            key={complaint.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigateToComplaint(complaint)}
                          >
                            <td className="complaint-table-row-id">
                              {complaint.displayId}
                            </td>
                            {(() => {
                              // Subject (truncated)
                              const subj = complaint.title || "";
                              const MAX = 50;
                              const display =
                                subj.length > MAX
                                  ? `${subj.slice(0, MAX - 1)}…`
                                  : subj;
                              return (
                                <>
                                  <td className="complaint-table-row-subject">
                                    <span
                                      className="inline-block max-w-xs truncate"
                                      title={subj}
                                    >
                                      {display}
                                    </span>
                                  </td>
                                  <td className="complaint-table-row-status">
                                    {(() => {
                                      const statusLabel = getDisplayStatusLabel(
                                        complaint.status
                                      );
                                      return (
                                        <span
                                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                            statusLabel
                                          )}`}
                                        >
                                          {statusLabel}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                </>
                              );
                            })()}
                            <td className="complaint-table-row-date">
                              {formatDateShort(
                                complaint.createdAt ||
                                  complaint.updatedAt ||
                                  complaint.date
                              )}
                            </td>
                            <td className="complaint-table-row-status">
                              {(() => {
                                const priorityLabel =
                                  complaint.priority ||
                                  complaint.category?.priority ||
                                  "";
                                return (
                                  <span
                                    className={`font-medium ${getPriorityColor(
                                      priorityLabel
                                    )}`}
                                  >
                                    {priorityLabel}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="complaint-table-row-assigned">
                              {adminsMap[complaint.adminId] ||
                                complaint.adminName ||
                                complaint.assignedTo ||
                                "Unassigned"}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToComplaint(complaint);
                                  }}
                                  className="complaint-table-row-action-eye"
                                >
                                  <FontAwesomeIcon icon={faEye} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: implement delete flow
                                  }}
                                  className="complaint-table-row-action-trash"
                                >
                                  <FontAwesomeIcon icon={faTrashAlt} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center">
                            <div className="text-gray-500">
                              <p className="text-lg font-medium">
                                No reports found
                              </p>
                              <p className="text-sm mt-2">
                                There are no reports submitted in <strong>{selectedTimeRange}</strong>
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="complaint-table-bottom">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {filteredComplaints.length === 0
                            ? 0
                            : (currentPage - 1) * itemsPerPage + 1}{" "}
                          -{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredComplaints.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {filteredComplaints.length}
                        </span>{" "}
                        complaints
                      </span>
                    </div>

                    <div>
                      <nav className="navigation-bar" aria-label="Pagination">
                        <button
                          onClick={() =>
                            currentPage > 1 && setCurrentPage(currentPage - 1)
                          }
                          className="!rounded-button whitespace-nowrap relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="sr-only">Previous</span>
                          <FontAwesomeIcon
                            icon={faChevronLeft}
                            className="text-xs"
                          />
                        </button>

                        {Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => {
                            const page = startPage + i;
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`!rounded-button whitespace-nowrap relative inline-flex items-center px-4 py-2 border border-gray-300 ${
                                  currentPage === page
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-white text-gray-500"
                                } text-sm font-medium hover:bg-gray-50 cursor-pointer`}
                              >
                                {page}
                              </button>
                            );
                          }
                        )}

                        <button
                          onClick={() =>
                            currentPage < totalPages &&
                            setCurrentPage(currentPage + 1)
                          }
                          className="!rounded-button whitespace-nowrap relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="sr-only">Next</span>
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            className="text-xs"
                          />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
export default Dashboard;

