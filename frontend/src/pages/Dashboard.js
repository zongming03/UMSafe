import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as echarts from "echarts";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("Last 7 Days");
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
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

      const openSeries = [];
      const inProgressSeries = [];
      const resolvedSeries = [];

      buckets.forEach(([bs, be]) => {
        const createdInBucket = complaints.filter((it) => {
          const t = it.createdAt ? Date.parse(it.createdAt) : NaN;
          return !isNaN(t) && t >= bs && t <= be;
        });
        const openCount = createdInBucket.filter(
          (c) => normalizeStatus(c.status) === "Opened"
        ).length;
        const inProgCount = createdInBucket.filter(
          (c) => normalizeStatus(c.status) === "InProgress"
        ).length;
        const resCount = createdInBucket.filter(
          (c) => normalizeStatus(c.status) === "Resolved"
        ).length;
        openSeries.push(openCount);
        inProgressSeries.push(inProgCount);
        resolvedSeries.push(resCount);
      });

      return { labels, openSeries, inProgressSeries, resolvedSeries };
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
        ],
        legend: { data: ["Open", "In Progress", "Resolved"] },
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
  const [complaints, setComplaints] = useState([
    // Page 1 complaints
    {
      id: "CMP-1093",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      username: "Testing1.",
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Dirty Classroom Floor",
      description:
        "The classroom floor has not been cleaned for days. There are food wrappers and dust everywhere.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1093-evt-1",
          actionTitle: "Report Submitted",
          actionDetails: "Complaint submitted by user Testing1.",
          initiator: "Testing1.",
          createdAt: "2025-10-23T15:59:35.599Z",
        },
        {
          id: "CMP-1093-evt-2",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-10-23T15:59:36.000Z",
        },
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
      adminId: "null",
      adminName: "Unassigned",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "InProgress",
      title: "Student Harassment Incident",
      description:
        "Witnessed bullying behavior in the cafeteria during lunch hour. Multiple students involved.",
      category: { name: "Bullying", priority: "High" },
      media: [
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1094-evt-1",
          actionTitle: "Report Submitted",
          actionDetails: "Complaint submitted regarding bullying in cafeteria.",
          initiator: "User",
          createdAt: "2025-10-22T16:07:10.441Z",
        },
        {
          id: "CMP-1094-evt-2",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin oiiae assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-22T17:00:10.441Z",
        },
        {
          id: "CMP-1094-evt-3",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to InProgress.",
          initiator: "oiiae",
          createdAt: "2025-10-23T14:57:36.534Z",
        },
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
      chatroomId: "FAKE-ROOM-1094",
      createdAt: "2025-10-22T16:07:10.441Z",
      updatedAt: "2025-10-23T14:57:36.534Z",
      version: 2,
    },
    {
      id: "CMP-1095",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "null",
      adminName: "Unassigned",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Overflowing Trash Bins",
      description:
        "Trash bins near the library entrance are overflowing. Bad smell and attracting flies.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80",
        "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1095-evt-1",
          actionTitle: "Report Submitted",
          actionDetails:
            "Overflowing trash bins reported near library entrance.",
          initiator: "User",
          createdAt: "2025-10-22T16:02:30.647Z",
        },
        {
          id: "CMP-1095-evt-2",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-10-22T16:02:31.000Z",
        },
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
      adminId: "null",
      adminName: "Unassigned",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Graffiti on Wall",
      description:
        "Graffiti spotted near the main entrance of the lecture hall. Contains inappropriate content.",
      category: { name: "Vandalism", priority: "Medium" },
      media: [
        "https://images.unsplash.com/photo-1604509988450-70f2e6827eb6?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1096-evt-1",
          actionTitle: "Report Submitted",
          actionDetails: "Graffiti reported at lecture hall entrance.",
          initiator: "testing",
          createdAt: "2025-06-14T12:15:00.000Z",
        },
        {
          id: "CMP-1096-evt-2",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-06-14T12:15:05.000Z",
        },
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
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Resolved",
      title: "Broken Window in Lecture Hall",
      description:
        "Window on the third floor is cracked and poses safety risk. Needs immediate attention.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1097-evt-1",
          actionTitle: "Report Submitted",
          actionDetails: "Broken window reported in lecture hall.",
          initiator: "User",
          createdAt: "2025-10-20T14:59:08.106Z",
        },
        {
          id: "CMP-1097-evt-2",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin oiiae assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-20T15:10:08.106Z",
        },
        {
          id: "CMP-1097-evt-3",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to Resolved.",
          initiator: "oiiae",
          createdAt: "2025-10-20T15:50:33.823Z",
        },
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
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Stained Carpet in Study Area",
      description:
        "Large stain on carpet in the main study area. Looks like coffee spill that was never cleaned properly.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1098-evt-1",
          actionTitle: "Report Submitted",
          actionDetails: "Carpet stain reported in study area.",
          initiator: "User",
          createdAt: "2025-10-18T13:52:48.107Z",
        },
        {
          id: "CMP-1098-evt-2",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-10-18T13:52:49.000Z",
        },
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
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Resolved",
      title: "Cheating During Exam",
      description:
        "Witnessed student using unauthorized materials during final examination. Multiple instances observed.",
      category: { name: "Academic Misconduct", priority: "High" },
      media: [
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "CMP-1099-evt-1",
          actionTitle: "Report Submitted",
          actionDetails: "Academic misconduct reported during exam.",
          initiator: "User",
          createdAt: "2025-10-12T13:28:06.371Z",
        },
        {
          id: "CMP-1099-evt-2",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin qwe1 assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-12T14:00:06.371Z",
        },
        {
          id: "CMP-1099-evt-3",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to Resolved.",
          initiator: "qwe1",
          createdAt: "2025-10-13T16:59:48.850Z",
        },
        {
          id: "CMP-1099-evt-4",
          actionTitle: "Feedback Provided",
          actionDetails: "User submitted feedback after resolution.",
          initiator: "User",
          createdAt: "2025-10-13T17:10:00.000Z",
        },
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
  ]);
  const itemsPerPage = 6;
  const navigate = useNavigate();

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
        if (c.id === complaintId) {
          previousStatus = c.status;
          return { ...c, status: newStatus };
        }
        return c;
      });
    });

    // Attempt to persist change to backend
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // update local item with returned server values (if any)
      if (data) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, ...data } : c))
        );
      }
    } catch (err) {
      console.warn("Failed to persist kanban move, rolling back:", err);
      // rollback to previous status
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
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
    // fallback: check exact match
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

  // Calculate start and end page numbers for pagination
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  const getStatusColor = (status) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "Opened":
        return "bg-yellow-100 text-yellow-800";
      case "InProgress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        // default to Opened to avoid other labels
        return "bg-yellow-100 text-yellow-800";
    }
  };
  // --- Period helpers for percent change ---
  const normalizeDayStart = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const normalizeDayEnd = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

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

  function computeChange(current, previous) {
    const delta = current - previous;
    if (!previous) {
      if (!current) return { percent: 0, label: "0%", delta };
      return {
        percent: null,
        label: `New (${delta > 0 ? `+${delta}` : delta})`,
        delta,
      };
    }
    const rawPct = (delta / previous) * 100;
    const pct = Math.round(rawPct * 10) / 10; // one decimal
    const sign = pct > 0 ? "+" : "";
    return {
      percent: pct,
      label: `${sign}${pct}% (${delta > 0 ? `+${delta}` : delta})`,
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

  const openedCurrentPeriod = totalCurrentPeriod; // opened = created in period
  const openedPrevPeriod = totalPrevPeriod;
  const openedChange = computeChange(openedCurrentPeriod, openedPrevPeriod);

  const resolvedCurrentPeriod = countResolvedInRange(
    complaints,
    periodStart,
    periodEnd
  );
  const resolvedPrevPeriod = countResolvedInRange(
    complaints,
    prevStart,
    prevEnd
  );
  const resolvedChange = computeChange(
    resolvedCurrentPeriod,
    resolvedPrevPeriod
  );

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
        const res = await fetch(
          "http://localhost:5000/admin/usersMobile/users",
          { credentials: "include" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const admins = data.data || data || [];
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
                  totalChange.percent === null
                    ? "text-red-600"
                    : totalChange.percent > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
                changeIcon={
                  totalChange.percent === null ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : totalChange.percent > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                  )
                }
              />
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faExclamationCircle} />}
                iconBg="bg-yellow-500"
                title="Opened"
                value={openedCurrentPeriod}
                change={openedChange.label}
                changeColor={
                  openedChange.percent === null
                    ? "text-red-600"
                    : openedChange.percent > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
                changeIcon={
                  openedChange.percent === null ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : openedChange.percent > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                  )
                }
              />
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faCheckCircle} />}
                iconBg="bg-green-500"
                title="Resolved"
                value={resolvedCurrentPeriod}
                change={resolvedChange.label}
                changeColor={
                  resolvedChange.percent === null
                    ? "text-green-600"
                    : resolvedChange.percent > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
                changeIcon={
                  resolvedChange.percent === null ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : resolvedChange.percent > 0 ? (
                    <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                  )
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
                          onClick={() => handleSort('id')}
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
                      {getCurrentPageComplaints().map((complaint) => (
                        <tr
                          key={complaint.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigateToComplaint(complaint)}
                        >
                          <td className="complaint-table-row-id">
                            {complaint.id}
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
                                    const statusLabel = normalizeStatus(
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
                      ))}
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
