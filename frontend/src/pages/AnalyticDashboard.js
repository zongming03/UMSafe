import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import * as echarts from "echarts";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCheckCircle,
  faFileExport,
  faChevronDown,
  faChevronUp,
  faTimes,
  faCalendarAlt,
  faCalendarCheck,
  faTags,
  faLayerGroup,
  faDoorClosed,
  faInfoCircle,
  faExclamationTriangle,
  faUserShield,
  faUndo,
  faChartPie,
  faChartLine,
  faUsers,
  faUserCheck,
  faClipboardList,
  faArrowUp,
  faExclamationCircle,
  faHourglassHalf,
  faSignal,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { faStar as faStarSolid, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";


function App() {
  const { user } = useContext(AuthContext);
  // Helpers to compute a default date range: from 1 month before today to today
  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const getDefaultDateRange = () => {
    const today = new Date();
    const from = new Date(today);
    from.setMonth(from.getMonth() - 1);
    return { from: formatDate(from), to: formatDate(today) };
  };

  
  // Temporary: force analytics to use local mock data for ALL modules (no API).
  // Flip this to false later to enable backend fetching again.
  const USE_MOCK_ANALYTICS = true;

  // Local fallback data for development only; real data comes from router state.
  const DEV_MOCK_COMPLAINTS = [
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

  const [dateRange, setDateRange] = useState(() => getDefaultDateRange());

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  // New hierarchical location filters
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("all");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [officerOptions, setOfficerOptions] = useState([]); 
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const complaintChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const trendChartLargeRef = useRef(null);
  const locationChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const ageChartRef = useRef(null);
  // Priority chart removed; using summary cards instead
  const filterRefetchTimer = useRef(null);
  const location = useLocation();
  const initialDataRef = useRef(null);
  // When true, never call API; always use router-provided state (or empty array)
  const [preferLocationData, setPreferLocationData] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "New complaint assigned to you",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      message: "Complaint #1089 has been resolved",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      message: "System maintenance scheduled for tonight",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 4,
      message: "Weekly report is now available",
      time: "Yesterday",
      read: true,
    },
  ]);
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;
  const handleClickOutside = (event) => {
    if (profileRef.current && !profileRef.current.contains(event.target)) {
      setIsProfileOpen(false);
    }
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setIsNotificationsOpen(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // (Removed) Complaints by Priority chart; replaced with responsive summary cards

  // Load officers filtered by current faculty (backend enforces faculty via auth)
  useEffect(() => {
    const loadOfficers = async () => {
      // When using mock analytics, derive officer list from the local dataset and skip API
      if (USE_MOCK_ANALYTICS) {
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : DEV_MOCK_COMPLAINTS) || [];
        const pairs = [];
        base.forEach((c) => {
          const id = String(c.adminId || c.assignedTo || c.assigned_to || "").trim();
          const name = String(c.adminName || c.assignedName || id || "Unassigned").trim();
          if (id || name) pairs.push({ _id: id || name, name });
        });
        const dedup = Array.from(
          new Map(pairs.map((p) => [String(p._id), p]))
        ).map(([, v]) => v);
        setOfficerOptions(dedup);
        return;
      }
      try {
        const res = await api.get("/users");
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list
          .filter((u) => u && (u.role === "officer" || u.role === "admin"))
          .map((u) => ({ _id: u._id, name: u.name }));
        setOfficerOptions(mapped);
      } catch (e) {
        console.warn("[Analytics] Failed to fetch officers, will fallback to deriving from complaints", e);
        // Fallback: derive unique adminId-like values from current dataset if needed
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : DEV_MOCK_COMPLAINTS) || [];
        const pairs = [];
        base.forEach((c) => {
          const id = String(c.adminId || c.assignedTo || c.assigned_to || "").trim();
          const name = String(c.adminName || c.assignedName || id || "Unassigned").trim();
          if (id || name) pairs.push({ _id: id || name, name });
        });
        const dedup = Array.from(
          new Map(pairs.map((p) => [String(p._id), p]))
        ).map(([, v]) => v);
        setOfficerOptions(dedup);
      }
    };
    loadOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load blocks/rooms for current user's faculty
  useEffect(() => {
    const loadRooms = async () => {
      // When using mock analytics, derive blocks and rooms from local dataset
      if (USE_MOCK_ANALYTICS) {
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : DEV_MOCK_COMPLAINTS) || [];
        const blocks = Array.from(
          new Set(
            base
              .map((c) => String(c.facultyLocation?.facultyBlock || c.facultyLocation?.block || "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        setBlockOptions(blocks);
        // Initialize rooms for the active block selection
        const activeBlockName = selectedBlock !== "all" ? selectedBlock : blocks[0];
        if (!activeBlockName) {
          setRoomOptions([]);
          return;
        }
        const rooms = Array.from(
          new Set(
            base
              .filter((c) => String(c.facultyLocation?.facultyBlock || c.facultyLocation?.block || "").trim() === String(activeBlockName))
              .map((c) => String(c.facultyLocation?.facultyBlockRoom || c.facultyLocation?.room || "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        setRoomOptions(rooms);
        return;
      }
      try {
        const res = await api.get("/rooms");
        const faculties = Array.isArray(res.data) ? res.data : [];
        let faculty = null;
        if (user?.facultyid) {
          faculty = faculties.find((f) => String(f._id) === String(user.facultyid));
        }
        if (!faculty && faculties.length) faculty = faculties[0];

        const blocks = Array.from(
          new Set((faculty?.faculty_blocks || []).map((b) => String(b.name)))
        ).sort((a, b) => a.localeCompare(b));
        setBlockOptions(blocks);
        // Initialize rooms based on currently selectedBlock (or first block)
        let activeBlockName = selectedBlock !== "all" ? selectedBlock : blocks[0];
        if (!activeBlockName && blocks.length === 0) {
          setRoomOptions([]);
          return;
        }
        const blk = (faculty?.faculty_blocks || []).find((b) => String(b.name) === String(activeBlockName));
        const rooms = Array.from(
          new Set((blk?.faculty_block_rooms || []).map((r) => String(r.name)))
        ).sort((a, b) => a.localeCompare(b));
        setRoomOptions(rooms);
      } catch (e) {
        console.warn("[Analytics] Failed to fetch rooms (faculties). Location filters will be limited.", e);
      }
    };
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.facultyid]);

  // When block changes, recompute room options and reset selectedRoom
  useEffect(() => {
    const refreshRoomsForBlock = async () => {
      // Use mock dataset to recompute rooms for the selected block
      if (USE_MOCK_ANALYTICS) {
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : DEV_MOCK_COMPLAINTS) || [];
        const rooms = Array.from(
          new Set(
            base
              .filter((c) => String(c.facultyLocation?.facultyBlock || c.facultyLocation?.block || "").trim() === String(selectedBlock))
              .map((c) => String(c.facultyLocation?.facultyBlockRoom || c.facultyLocation?.room || "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        setRoomOptions(rooms);
        setSelectedRoom("all");
        return;
      }
      try {
        const res = await api.get("/rooms");
        const faculties = Array.isArray(res.data) ? res.data : [];
        const faculty = faculties.find((f) => String(f._id) === String(user?.facultyid)) || faculties[0];
        const blk = (faculty?.faculty_blocks || []).find((b) => String(b.name) === String(selectedBlock));
        const rooms = Array.from(
          new Set((blk?.faculty_block_rooms || []).map((r) => String(r.name)))
        ).sort((a, b) => a.localeCompare(b));
        setRoomOptions(rooms);
        setSelectedRoom("all");
      } catch (e) {
        // Ignore; keep previous roomOptions
      }
    };
    if (selectedBlock && selectedBlock !== "all") {
      refreshRoomsForBlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlock]);

  // Load categories from backend to populate the Category filter dynamically
  useEffect(() => {
    const loadCategories = async () => {
      // When using mock analytics, derive categories from local dataset and skip API
      if (USE_MOCK_ANALYTICS) {
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : DEV_MOCK_COMPLAINTS) || [];
        const derived = Array.from(
          new Set(
            base
              .map((c) => {
                const n = c?.category?.name || c?.category?.title || c?.category_id?.name;
                return n ? String(n) : "";
              })
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        setCategoryOptions(derived);
        return;
      }
      try {
        const res = await api.get("/categories");
        const list = Array.isArray(res.data) ? res.data : [];
        const names = Array.from(
          new Set(
            list
              .map((c) => (c && (c.name || c.title) ? String(c.name || c.title) : ""))
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));
        if (names.length) {
          setCategoryOptions(names);
          return;
        }
        // If backend has no categories, fall back to local base data
      } catch (e) {
        console.warn("[Analytics] Failed to fetch categories, falling back to local dataset", e);
      }
      // Fallback: derive categories from initial data (router) or mock
      const base =
        (initialDataRef.current && initialDataRef.current.length
          ? initialDataRef.current
          : DEV_MOCK_COMPLAINTS) || [];
      const derived = Array.from(
        new Set(
          base
            .map((c) => {
              const n = c?.category?.name || c?.category?.title || c?.category_id?.name;
              return n ? String(n) : "";
            })
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));
      setCategoryOptions(derived);
    };
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!complaintChartRef.current) return;
    const el = complaintChartRef.current;
    let chart = null;
    let onResize = null;
    let retryId = null;

    const init = () => {
      chart = echarts.getInstanceByDom(el) || echarts.init(el);
      const applyComplaintOption = () => {
        const isWide = el.clientWidth >= 768; 
        const option = {
          animation: false,
          tooltip: {
            trigger: "item",
            formatter: (params) =>
              `${params.seriesName} <br/>${params.name}: ${params.value} (${params.percent}%)`,
          },
          legend: isWide
            ? {
                orient: "vertical",
                right: 10,
                top: "middle",
                type: "scroll",
                data: [], // will be filled dynamically
              }
            : {
                orient: "horizontal",
                bottom: 0,
                left: "center",
                type: "scroll",
                data: [], // will be filled dynamically
              },
          series: [
            {
              name: "Complaint Distribution",
              type: "pie",
              radius: ["48%", "68%"],
              center: isWide ? ["35%", "50%"] : ["50%", "45%"], // leave room for legend
              avoidLabelOverlap: true,
              itemStyle: {
                borderRadius: 10,
                borderColor: "#fff",
                borderWidth: 2,
              },
              label: { show: false },
              labelLine: { show: false },
              data: [], // will be updated by updateChartsWithData
            },
          ],
        };
        chart.setOption(option, true); // replace to apply layout changes
        chart.resize();
      };
      applyComplaintOption();
      onResize = () => applyComplaintOption();
      window.addEventListener("resize", onResize);
    };

    const attemptInit = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        init();
      } else {
        retryId = setTimeout(attemptInit, 100);
      }
    };
    attemptInit();

    return () => {
      if (retryId) clearTimeout(retryId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (chart) chart.dispose();
    };
  }, []);
  useEffect(() => {
    if (!trendChartRef.current) return;
    const el = trendChartRef.current;
    let chart = null;
    let onResize = null;
    let retryId = null;

    const init = () => {
      chart = echarts.getInstanceByDom(el) || echarts.init(el);
      const trendOption = {
        animation: false,
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: ["Total"],
          bottom: 0,
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          top: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: [],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Total",
            type: "line",
            data: [],
            smooth: true,
            lineStyle: {
              width: 3,
            },
          },
        ],
      };
      chart.setOption(trendOption);
      onResize = () => chart && chart.resize();
      window.addEventListener("resize", onResize);
    };

    const attemptInit = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        init();
      } else {
        retryId = setTimeout(attemptInit, 100);
      }
    };
    attemptInit();

    return () => {
      if (retryId) clearTimeout(retryId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (chart) chart.dispose();
    };
  }, []);
  // Initialize large Trends chart (Trends tab) separately to avoid ref conflicts
  // Initialize large Trends chart when the Trends tab becomes active
  useEffect(() => {
    if (activeTab !== "trends" || !trendChartLargeRef.current) return;
    const el = trendChartLargeRef.current;
    let chart = echarts.getInstanceByDom(el);
    if (!chart) {
      chart = echarts.init(el);
      const baseOption = {
        animation: false,
        tooltip: { trigger: "axis" },
        legend: { data: ["Total"], bottom: 0, type: "scroll" },
        grid: { left: "3%", right: "4%", bottom: "15%", top: "3%", containLabel: true },
        xAxis: { type: "category", boundaryGap: false, data: [] },
        yAxis: { type: "value" },
        series: [ { name: "Total", type: "line", data: [], smooth: true, lineStyle: { width: 3 } } ],
      };
      chart.setOption(baseOption);
    }
    chart.resize();
  }, [activeTab]);
  useEffect(() => {
    if (!locationChartRef.current) return;
    const el = locationChartRef.current;
    let chart = null;
    let onResize = null;
    let retryId = null;

    const init = () => {
      chart = echarts.getInstanceByDom(el) || echarts.init(el);
      const locationOption = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const param = params[0];
            return `${param.name}: ${param.value}`;
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
          boundaryGap: [0, 0.01],
        },
        yAxis: {
          type: "category",
          data: [
            "Science Bldg 302",
            "Library Entrance",
            "Engineering Bldg",
            "Cafeteria",
            "Arts Bldg 105",
            "Law Building",
            "Student Center",
            "Parking Lot A",
            "Dormitory B",
            "Admin Office",
          ],
        },
        series: [
          {
            name: "Complaints",
            type: "bar",
            data: [35, 25, 22, 20, 18, 15, 12, 10, 8, 5],
            itemStyle: {
              color: function (params) {
                const colorList = [
                  "#5470c6",
                  "#91cc75",
                  "#fac858",
                  "#ee6666",
                  "#73c0de",
                  "#3ba272",
                  "#fc8452",
                  "#9a60b4",
                  "#ea7ccc",
                  "#c23531",
                ];
                return colorList[params.dataIndex % colorList.length];
              },
            },
          },
        ],
      };
      chart.setOption(locationOption);
      onResize = () => chart && chart.resize();
      window.addEventListener("resize", onResize);
    };

    const attemptInit = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        init();
      } else {
        retryId = setTimeout(attemptInit, 100);
      }
    };
    attemptInit();

    return () => {
      if (retryId) clearTimeout(retryId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (chart) chart.dispose();
    };
  }, []);
  useEffect(() => {
    if (!performanceChartRef.current) return;
    const el = performanceChartRef.current;
    let chart = null;
    let onResize = null;
    let retryId = null;

    const init = () => {
      chart = echarts.getInstanceByDom(el) || echarts.init(el);
      const performanceOption = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            return params
              .map((param) => {
                return `${param.seriesName}: ${param.value}${
                  param.seriesName.includes("Rate") ? "%" : ""
                }`;
              })
              .join("<br/>");
          },
        },
        legend: {
          data: ["Resolution Rate", "Resolution Time (hrs)"],
          bottom: 10,
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: [
          {
            type: "category",
            data: [
              "John Smith",
              "Emma Davis",
              "Sarah Johnson",
              "Michael Brown",
              "Team Average",
            ],
            axisLabel: {
              interval: 0,
              rotate: 30,
            },
          },
        ],
        yAxis: [
          {
            type: "value",
            name: "Resolution Rate",
            min: 0,
            max: 100,
            interval: 20,
            axisLabel: {
              formatter: "{value}%",
            },
          },
          {
            type: "value",
            name: "Resolution Time",
            min: 0,
            max: 100,
            interval: 20,
            axisLabel: {
              formatter: "{value}h",
            },
          },
        ],
        series: [
          {
            name: "Resolution Rate",
            type: "bar",
            data: [85, 78, 92, 80, 84],
            itemStyle: {
              color: "#5470c6",
            },
          },
          {
            name: "Resolution Time (hrs)",
            type: "line",
            yAxisIndex: 1,
            data: [77, 60, 98, 91, 82],
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "#91cc75",
            },
            lineStyle: {
              width: 3,
            },
          },
        ],
      };
      chart.setOption(performanceOption);
      onResize = () => chart && chart.resize();
      window.addEventListener("resize", onResize);
    };

    const attemptInit = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        init();
      } else {
        retryId = setTimeout(attemptInit, 100);
      }
    };
    attemptInit();

    return () => {
      if (retryId) clearTimeout(retryId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (chart) chart.dispose();
    };
  }, []);

  // Initialize Open Case Age Distribution chart
  useEffect(() => {
    if (!ageChartRef.current) return;
    const el = ageChartRef.current;
    let chart = null;
    let onResize = null;
    let retryId = null;

    const init = () => {
      chart = echarts.getInstanceByDom(el) || echarts.init(el);
      const buckets = ["0-1d", "2-3d", "4-7d", "8-14d", "15-30d", ">30d"];
      const option = {
        animation: false,
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "10%", top: "6%", containLabel: true },
        xAxis: { type: "category", data: buckets, axisLabel: { interval: 0 } },
        yAxis: { type: "value", min: 0 },
        series: [{ name: "Open Cases", type: "bar", data: [0, 0, 0, 0, 0, 0], itemStyle: { color: "#60a5fa" } }],
      };
      chart.setOption(option);
      onResize = () => chart && chart.resize();
      window.addEventListener("resize", onResize);
    };

    const attemptInit = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        init();
      } else {
        retryId = setTimeout(attemptInit, 100);
      }
    };
    attemptInit();

    return () => {
      if (retryId) clearTimeout(retryId);
      if (onResize) window.removeEventListener("resize", onResize);
      if (chart) chart.dispose();
    };
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [hasData, setHasData] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);



  // Utility to apply current filters to a dataset
  const filterData = (data) => {
    const fromTs = dateRange.from ? Date.parse(dateRange.from) : null;
    const toTs = dateRange.to ? Date.parse(dateRange.to) : null;
    return (data || []).filter((c) => {
      try {
        const created = c.createdAt
          ? Date.parse(c.createdAt)
          : c.created_at
          ? Date.parse(c.created_at)
          : NaN;
        if (!isNaN(created)) {
          if (fromTs && created < fromTs) return false;
          if (toTs && created > toTs + 24 * 60 * 60 * 1000) return false;
        }
        if (selectedCategory && selectedCategory !== "all") {
          const cat =
            (c.category && (c.category.name || c.category.title)) ||
            c.category_id?.name ||
            "";
          if (!cat.toLowerCase().includes(selectedCategory.toLowerCase()))
            return false;
        }
        // Hierarchical location filtering: block and room
        if (selectedBlock && selectedBlock !== "all") {
          const blockName = c.facultyLocation?.facultyBlock || c.facultyLocation?.block || "";
          if (String(blockName).toLowerCase() !== String(selectedBlock).toLowerCase()) return false;
        }
        if (selectedRoom && selectedRoom !== "all") {
          const roomName = c.facultyLocation?.facultyBlockRoom || c.facultyLocation?.room || "";
          if (String(roomName).toLowerCase() !== String(selectedRoom).toLowerCase()) return false;
        }
        if (selectedOfficer && selectedOfficer !== "all") {
          const officerIdOrValue = c.adminId || c.assignedTo || c.assigned_to || "";
          if (String(selectedOfficer).toLowerCase() === "unassigned") {
            if (officerIdOrValue && String(officerIdOrValue).toLowerCase() !== "unassigned") return false;
          } else {
            // Match by id or by name (fallback) if we can resolve name
            const chosen = officerOptions.find((o) => String(o._id) === String(selectedOfficer));
            const chosenName = chosen?.name?.toLowerCase();
            const officerName = (c.adminName || c.assignedName || "").toLowerCase();
            const idMatch = String(officerIdOrValue) === String(selectedOfficer);
            const nameMatch = chosenName && officerName && officerName.includes(chosenName);
            if (!idMatch && !nameMatch) return false;
          }
        }
        if (selectedStatus && selectedStatus !== "") {
          const s = (c.status || "").toString();
          if (!s.toLowerCase().includes(String(selectedStatus).toLowerCase()))
            return false;
        }
        if (selectedPriority && selectedPriority !== "") {
          const p = (c.priority || c.category?.priority || "").toString();
          if (!p.toLowerCase().includes(String(selectedPriority).toLowerCase()))
            return false;
        }
        return true;
      } catch (e) {
        return true;
      }
    });
  };

  // Fetch complaints from backend and apply client-side filters
  const fetchComplaints = async (
    showToastFlag = false,
    message = "Data refreshed"
  ) => {
    setIsLoading(true);
    setFetchError(null);
    if (showToastFlag) {
      setToastMessage(message);
      setShowToast(true);
    }
    // If we prefer router/mock data, just (re)filter it and skip API
    if (preferLocationData) {
      const base =
        initialDataRef.current && initialDataRef.current.length
          ? initialDataRef.current
          : DEV_MOCK_COMPLAINTS;
      console.log(
        "[Analytics] fetchComplaints using local base (router/mock). base count:",
        Array.isArray(base) ? base.length : 0,
        "dateRange:",
        dateRange
      );
      const filtered = filterData(base);
      console.log("[Analytics] fetchComplaints filtered count:", filtered.length);
      setComplaints(filtered);
      setHasData(filtered.length > 0);
      updateChartsWithData(filtered);
      setLastUpdatedAt(new Date());
      setIsLoading(false);
      if (showToastFlag) {
        setTimeout(() => setShowToast(false), 2000);
      }
      return;
    }
    try {
      const res = await api.get("/complaints");
      const data = res.data || [];

      const filtered = filterData(data);

      setComplaints(filtered);
      setHasData(filtered.length > 0);
      updateChartsWithData(filtered);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error("Failed to load complaints for analytics, using local demo data:", err);
      setFetchError(err.message || "Failed to fetch (using local demo data)");
      const fallback = filterData(DEV_MOCK_COMPLAINTS);
      setComplaints(fallback);
      setHasData(fallback.length > 0);
      if (fallback.length > 0) {
        updateChartsWithData(fallback);
        setLastUpdatedAt(new Date());
      }
    } finally {
      setIsLoading(false);
      if (showToastFlag) {
        setTimeout(() => setShowToast(false), 2000);
      }
    }
  };

  const resetFilters = () => {
    // reset filter state
    const defaultRange = getDefaultDateRange();
    setDateRange(defaultRange);
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedBlock("all");
    setSelectedRoom("all");
    setSelectedStatus("");
    setSelectedPriority("");
    setSelectedOfficer("all");

    // reset DOM inputs (if present)
    const dateFromInput = document.getElementById("date-from");
    const dateToInput = document.getElementById("date-to");
    const categorySelect = document.getElementById("category-filter");
    const blockSelect = document.getElementById("block-filter");
    const roomSelect = document.getElementById("room-filter");
    const officerSelect = document.getElementById("officer-filter");
    if (dateFromInput) dateFromInput.value = defaultRange.from;
    if (dateToInput) dateToInput.value = defaultRange.to;
    if (categorySelect) categorySelect.value = "all";
    if (blockSelect) blockSelect.value = "all";
    if (roomSelect) roomSelect.value = "all";
    const statusSelect = document.getElementById("status-filter");
    const prioritySelect = document.getElementById("priority-filter");
    if (officerSelect) officerSelect.value = "all";
    if (statusSelect) statusSelect.value = "";
    if (prioritySelect) prioritySelect.value = "";

    // re-fetch using default filters and show reset message
    fetchComplaints(true, "Filters have been reset to default values");
  };

  // Seed from router state if available (preferred). If none, fall back to DEV_MOCK_COMPLAINTS so the summary cards show data.
  useEffect(() => {
    if (USE_MOCK_ANALYTICS) {
      // Always seed from local mock data
      initialDataRef.current = DEV_MOCK_COMPLAINTS;
      console.log("[Analytics] Seed complaints from DEV_MOCK_COMPLAINTS. count:", initialDataRef.current.length);
      const filtered = filterData(initialDataRef.current);
      console.log("[Analytics] Seed filtered complaints (count):", filtered.length, "dateRange:", dateRange);
      setComplaints(filtered);
      setHasData(filtered.length > 0);
      if (filtered.length > 0) updateChartsWithData(filtered);
      setLastUpdatedAt(new Date());
      setPreferLocationData(true);
      return;
    }
    const state = location?.state;
    console.log("[Analytics] Enter AnalyticsDashboard with router state:", state);
    let locComplaints = null;
    if (Array.isArray(state)) {
      locComplaints = state;
    } else if (state && typeof state === "object") {
      locComplaints =
        state.complaints ||
        state.filteredComplaints ||
        state.list ||
        state.items ||
        state.data ||
        (state.complaint ? [state.complaint] : null);
    }
    const hasRouterData = Array.isArray(locComplaints);
    // Prefer router data; otherwise use local mock while backend isn’t connected
    initialDataRef.current = hasRouterData ? locComplaints : DEV_MOCK_COMPLAINTS;
    console.log(
      "[Analytics] Seed complaints (router?",
      hasRouterData,
      ") count:",
      Array.isArray(initialDataRef.current) ? initialDataRef.current.length : 0
    );
    const filtered = filterData(initialDataRef.current);
    console.log(
      "[Analytics] Seed filtered complaints (count):",
      filtered.length,
      "dateRange:",
      dateRange
    );
    setComplaints(filtered);
    setHasData(filtered.length > 0);
    if (filtered.length > 0) updateChartsWithData(filtered);
    setLastUpdatedAt(new Date());
    // Prefer local/router data only if router actually provided complaints; otherwise use backend
    setPreferLocationData(hasRouterData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // No API load for now when preferLocationData is true; data comes from router or mock

  // Re-fetch immediately (debounced) whenever filters change so summary cards reflect current filters
  useEffect(() => {
    if (filterRefetchTimer.current) clearTimeout(filterRefetchTimer.current);
    filterRefetchTimer.current = setTimeout(() => {
      fetchComplaints(false);
    }, 300);
    return () => {
      if (filterRefetchTimer.current) clearTimeout(filterRefetchTimer.current);
    };
  }, [dateRange, selectedCategory, selectedLocation, selectedBlock, selectedRoom, selectedOfficer, selectedStatus, selectedPriority]);

  // Build and apply chart options from complaints
  const updateChartsWithData = (data) => {
    // Category distribution (pie chart on Overview)
    const catMap = {};
    data.forEach((c) => {
      const name =
        (c.category && (c.category.name || c.category.title)) ||
        c.category_id?.name ||
        "Unknown";
      catMap[name] = (catMap[name] || 0) + 1;
    });
    const categoryData = Object.keys(catMap).map((k) => ({
      name: k,
      value: catMap[k],
    }));
    if (complaintChartRef.current) {
      const chart = echarts.getInstanceByDom(complaintChartRef.current);
      chart?.setOption({
        series: [{ data: categoryData }],
        legend: { data: Object.keys(catMap) },
      });
    }

    // Trend chart dynamic granularity: daily if <= 45 days span, else monthly
    const makeTrendData = (list) => {
      const createdDates = list
        .map((c) => (c.createdAt ? new Date(c.createdAt) : c.created_at ? new Date(c.created_at) : null))
        .filter((d) => d && !isNaN(d.getTime()))
        .sort((a, b) => a - b);
      if (createdDates.length === 0) return { labels: [], series: [] };
      const first = createdDates[0];
      const last = createdDates[createdDates.length - 1];
      const oneDay = 24 * 60 * 60 * 1000;
      const daySpan = Math.floor((last.getTime() - first.getTime()) / oneDay) + 1;
      const categorySet = new Set();
      list.forEach((c) => {
        const catName = (c.category && (c.category.name || c.category.title)) || c.category_id?.name || "Unknown";
        categorySet.add(catName);
      });
      const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
      if (daySpan <= 45) {
        // Daily granularity
        const labels = Array.from({ length: daySpan }).map((_, i) => {
          const d = new Date(first.getTime() + i * oneDay);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        });
        const totalCounts = Array(daySpan).fill(0);
        const perCategory = {};
        categories.forEach((cat) => (perCategory[cat] = Array(daySpan).fill(0)));
        list.forEach((c) => {
          const ts = c.createdAt ? Date.parse(c.createdAt) : Date.parse(c.created_at || 0);
            if (isNaN(ts)) return;
          const idx = Math.floor((ts - first.getTime()) / oneDay);
          if (idx < 0 || idx >= daySpan) return;
          totalCounts[idx] += 1;
          const catName = (c.category && (c.category.name || c.category.title)) || c.category_id?.name || "Unknown";
          if (!perCategory[catName]) perCategory[catName] = Array(daySpan).fill(0);
          perCategory[catName][idx] += 1;
        });
        const series = [
          { name: "Total", type: "line", data: totalCounts, smooth: true },
          ...categories.map((cat) => ({ name: cat, type: "line", data: perCategory[cat], smooth: true })),
        ];
        return { labels, series };
      }
      // Monthly granularity fallback
      const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthSet = new Set();
      list.forEach((c) => {
        const dt = c.createdAt ? new Date(c.createdAt) : c.created_at ? new Date(c.created_at) : null;
        if (!dt) return; monthSet.add(monthKey(dt));
      });
      const labels = Array.from(monthSet).sort();
      const totalCounts = Array(labels.length).fill(0);
      const perCategory = {};
      categories.forEach((cat) => (perCategory[cat] = Array(labels.length).fill(0)));
      list.forEach((c) => {
        const dt = c.createdAt ? new Date(c.createdAt) : c.created_at ? new Date(c.created_at) : null;
        if (!dt) return; const key = monthKey(dt); const idx = labels.indexOf(key); if (idx < 0) return;
        totalCounts[idx] += 1;
        const catName = (c.category && (c.category.name || c.category.title)) || c.category_id?.name || "Unknown";
        if (!perCategory[catName]) perCategory[catName] = Array(labels.length).fill(0);
        perCategory[catName][idx] += 1;
      });
      const series = [
        { name: "Total", type: "line", data: totalCounts, smooth: true },
        ...categories.map((cat) => ({ name: cat, type: "line", data: perCategory[cat], smooth: true })),
      ];
      return { labels, series };
    };

    const trend = makeTrendData(data);
    const trendLabels = trend.labels;
    const series = trend.series;
    const categoryNames = series.filter((s) => s.name !== "Total").map((s) => s.name);
    if (trendChartRef.current) {
      const chart = echarts.getInstanceByDom(trendChartRef.current);
      chart?.setOption({
        legend: { data: ["Total", ...categoryNames], bottom: 0, type: "scroll" },
        xAxis: { data: trendLabels },
        series,
      });
    }
    if (trendChartLargeRef.current && activeTab === "trends") {
      const chart = echarts.getInstanceByDom(trendChartLargeRef.current) || echarts.init(trendChartLargeRef.current);
      chart?.setOption({
        legend: { data: ["Total", ...categoryNames], bottom: 0, type: "scroll" },
        xAxis: { data: trendLabels },
        series,
      });
    }

    // Locations
    const locMap = {};
    data.forEach((c) => {
      const loc =
        (c.facultyLocation &&
          (c.facultyLocation.faculty ||
            c.facultyLocation.facultyBlock ||
            c.facultyLocation.facultyBlockRoom)) ||
        c.location ||
        "Unknown";
      locMap[loc] = (locMap[loc] || 0) + 1;
    });
    const locNames = Object.keys(locMap).slice(0, 10);
    const locVals = locNames.map((n) => locMap[n]);
    if (locationChartRef.current) {
      const chart = echarts.getInstanceByDom(locationChartRef.current);
      chart?.setOption({
        yAxis: { data: locNames },
        series: [{ data: locVals }],
      });
    }

    // Open Case Age Distribution (active = not resolved/closed/rejected/completed)
    const now = Date.now();
    const ageBuckets = ["0-1d", "2-3d", "4-7d", "8-14d", "15-30d", ">30d"];
    const ageCounts = [0, 0, 0, 0, 0, 0];
    const isTerminal = (s) => {
      const v = String(s || "").toLowerCase();
      return v === "resolved" || v === "closed" || v === "completed" || v === "rejected";
    };
    data.forEach((c) => {
      if (isTerminal(c.status)) return;
      const ts = c.createdAt ? Date.parse(c.createdAt) : Date.parse(c.created_at || 0);
      if (isNaN(ts)) return;
      const days = Math.max(0, Math.floor((now - ts) / (24 * 60 * 60 * 1000)));
      let idx = 0;
      if (days <= 1) idx = 0;
      else if (days <= 3) idx = 1;
      else if (days <= 7) idx = 2;
      else if (days <= 14) idx = 3;
      else if (days <= 30) idx = 4;
      else idx = 5;
      ageCounts[idx] += 1;
    });
    if (ageChartRef.current) {
      const chart = echarts.getInstanceByDom(ageChartRef.current);
      chart?.setOption({ xAxis: { data: ageBuckets }, series: [{ name: "Open Cases", data: ageCounts }] });
    }

    // Performance per officer (assignedTo) - resolution rate and average resolution time
    const officerMap = {};
    data.forEach((c) => {
      const officer =
        c.assignedTo || c.adminId || c.assigned_to || "Unassigned";
      officerMap[officer] = officerMap[officer] || {
        total: 0,
        resolved: 0,
        times: [],
      };
      officerMap[officer].total += 1;
      const status = (c.status || "").toLowerCase();
      if (status === "resolved" || status === "closed")
        officerMap[officer].resolved += 1;
      // resolution time if resolved
      if (c.resolvedAt || c.resolved_at) {
        const created = c.createdAt
          ? Date.parse(c.createdAt)
          : Date.parse(c.created_at || c.created);
        const resolved = c.resolvedAt
          ? Date.parse(c.resolvedAt)
          : Date.parse(c.resolved_at || 0);
        if (!isNaN(created) && !isNaN(resolved) && resolved > created) {
          const hours = (resolved - created) / (1000 * 60 * 60);
          officerMap[officer].times.push(hours);
        }
      }
    });
    const officers = Object.keys(officerMap).slice(0, 5);
    const resolutionRates = officers.map((o) =>
      Math.round(
        (officerMap[o].resolved / Math.max(1, officerMap[o].total)) * 100
      )
    );
    const avgResTimes = officers.map((o) => {
      const arr = officerMap[o].times;
      if (!arr || arr.length === 0) return 0;
      const s = arr.reduce((a, b) => a + b, 0);
      return Math.round((s / arr.length) * 10) / 10;
    });
    if (performanceChartRef.current) {
      const chart = echarts.getInstanceByDom(performanceChartRef.current);
      chart?.setOption({
        xAxis: [{ data: officers }],
        series: [
          { name: "Resolution Rate", data: resolutionRates },
          { name: "Resolution Time (hrs)", data: avgResTimes },
        ],
      });
    }
  };
  
  // UI helpers: quick date presets and active filter chips
  const clearFilter = (key) => {
    switch (key) {
      case "date":
        setDateRange(getDefaultDateRange());
        break;
      case "category":
        setSelectedCategory("all");
        break;
      case "block":
        setSelectedBlock("all");
        setSelectedRoom("all");
        break;
      case "room":
        setSelectedRoom("all");
        break;
      case "status":
        setSelectedStatus("");
        break;
      case "priority":
        setSelectedPriority("");
        break;
      case "officer":
        setSelectedOfficer("all");
        break;
      default:
        break;
    }
  };

  const defaultDateRange = getDefaultDateRange();
  const hasCustomDateRange =
    dateRange.from !== defaultDateRange.from || dateRange.to !== defaultDateRange.to;
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    overview: true,
    trends: true,
    students: true,
    performance: true,
    filename: `Analytics_Report_${new Date().toISOString().split("T")[0]}`,
    orientation: "portrait",
    quality: "high",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFileUrl, setExportedFileUrl] = useState("");
  const exportToPDF = () => {
    setIsExportModalOpen(true);
  };
  const handleExport = () => {
    setIsExporting(true);
    setExportedFileUrl("");
    // Create export notification
    const notification = {
      id: notifications.length + 1,
      message:
        "Analytics report is being generated. You'll be notified when ready.",
      time: "Just now",
      read: false,
    };
    setNotifications([notification, ...notifications]);
    // Simulate PDF generation delay
    setTimeout(() => {
      setIsExporting(false);
      setExportedFileUrl("example-report.pdf");
      const downloadNotification = {
        id: notifications.length + 2,
        message: "Analytics report is ready for download",
        time: "Just now",
        read: false,
      };
      setNotifications([downloadNotification, ...notifications]);
    }, 2000);
  };

  // derive summary metrics from complaints state
  const metrics = useMemo(() => {
    const total = complaints?.length || 0;
    const resolved =
      complaints?.filter((c) => {
        const s = (c.status || "").toLowerCase();
        return (
          s === "resolved" || s === "closed" || s === "rejected" || c.resolvedAt || c.resolved_at
        );
      }).length || 0;
    const inProgress =
      complaints?.filter((c) => {
        const s = (c.status || "").toLowerCase();
        return (
          s === "inprogress" ||
          s === "in progress" ||
          s === "assigned" ||
          s === "pending" ||
          s === "in_review"
        );
      }).length || 0;
    const open = Math.max(0, total - resolved - inProgress);
    const resolutionRate = total
      ? Math.round((resolved / total) * 1000) / 10
      : 0; // one decimal
    return { total, resolved, inProgress, open, resolutionRate };
  }, [complaints]);

  // Month/period-over-period growth for Total Complaints based on current filters
  const totalGrowth = useMemo(() => {
    try {
      const base = (initialDataRef.current && initialDataRef.current.length)
        ? initialDataRef.current
        : (Array.isArray(complaints) ? complaints : []);

      if (!Array.isArray(base) || base.length === 0) {
        return { delta: 0, dir: "flat", current: 0, previous: 0, percent: 0 };
      }

      // Build current period from state dateRange
      const fromStr = dateRange?.from;
      const toStr = dateRange?.to;
  if (!fromStr || !toStr) return { delta: 0, dir: "flat", current: 0, previous: 0, percent: 0 };
      const from = new Date(fromStr);
      const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return { delta: 0, dir: "flat", current: 0, previous: 0, percent: 0 };

      // Normalize to start/end of day and compute inclusive length
      const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
      const oneDay = 24 * 60 * 60 * 1000;
      const periodMs = Math.max(oneDay, (end.getTime() - start.getTime()) + oneDay);

      const prevEnd = new Date(start.getTime() - oneDay);
      const prevStart = new Date(prevEnd.getTime() - (periodMs - oneDay));

      const passesNonDateFilters = (c) => {
        try {
          // Category
          if (selectedCategory && selectedCategory !== "all") {
            const cat = (c.category && (c.category.name || c.category.title)) || c.category_id?.name || "";
            if (!String(cat).toLowerCase().includes(String(selectedCategory).toLowerCase())) return false;
          }
          // Location (block/room)
          if (selectedBlock && selectedBlock !== "all") {
            const blockName = c.facultyLocation?.facultyBlock || c.facultyLocation?.block || "";
            if (String(blockName).toLowerCase() !== String(selectedBlock).toLowerCase()) return false;
          }
          if (selectedRoom && selectedRoom !== "all") {
            const roomName = c.facultyLocation?.facultyBlockRoom || c.facultyLocation?.room || "";
            if (String(roomName).toLowerCase() !== String(selectedRoom).toLowerCase()) return false;
          }
          // Officer
          if (selectedOfficer && selectedOfficer !== "all") {
            const officerIdOrValue = c.adminId || c.assignedTo || c.assigned_to || "";
            if (String(selectedOfficer).toLowerCase() === "unassigned") {
              if (officerIdOrValue && String(officerIdOrValue).toLowerCase() !== "unassigned") return false;
            } else {
              const chosen = officerOptions.find((o) => String(o._id) === String(selectedOfficer));
              const chosenName = chosen?.name?.toLowerCase();
              const officerName = (c.adminName || c.assignedName || "").toLowerCase();
              const idMatch = String(officerIdOrValue) === String(selectedOfficer);
              const nameMatch = chosenName && officerName && officerName.includes(chosenName);
              if (!idMatch && !nameMatch) return false;
            }
          }
          // Status
          if (selectedStatus && selectedStatus !== "") {
            const s = (c.status || "").toString();
            if (!s.toLowerCase().includes(String(selectedStatus).toLowerCase())) return false;
          }
          // Priority
          if (selectedPriority && selectedPriority !== "") {
            const p = (c.priority || c.category?.priority || "").toString();
            if (!p.toLowerCase().includes(String(selectedPriority).toLowerCase())) return false;
          }
          return true;
        } catch (_) {
          return true;
        }
      };

      const createdTs = (c) => {
        const v = c.createdAt || c.created_at;
        const t = v ? Date.parse(v) : NaN;
        return t;
      };

      const inRange = (t, a, b) => t >= a.getTime() && t <= (b.getTime() + (oneDay - 1));

      const currentCount = base.filter((c) => {
        const t = createdTs(c);
        if (isNaN(t)) return false;
        if (!inRange(t, start, end)) return false;
        return passesNonDateFilters(c);
      }).length;

      const previousCount = base.filter((c) => {
        const t = createdTs(c);
        if (isNaN(t)) return false;
        if (!inRange(t, prevStart, prevEnd)) return false;
        return passesNonDateFilters(c);
      }).length;

      if (previousCount === 0) {
        if (currentCount === 0) return { delta: 0, dir: "flat", current: 0, previous: 0, percent: 0 };
        return { delta: currentCount, dir: "up", current: currentCount, previous: 0, percent: 100 };
      }
      const diff = currentCount - previousCount;
      const pct = Math.round(((diff / previousCount) * 100) * 10) / 10;
      return { delta: diff, dir: diff > 0 ? "up" : diff < 0 ? "down" : "flat", current: currentCount, previous: previousCount, percent: Math.abs(pct) };
    } catch {
      return { delta: 0, dir: "flat", current: 0, previous: 0, percent: 0 };
    }
  }, [complaints, dateRange.from, dateRange.to, selectedCategory, selectedBlock, selectedRoom, selectedOfficer, selectedStatus, selectedPriority, officerOptions]);

  // Dynamic growth metrics (Year/Quarter/Month/Week over same preceding period)
  const growthMetrics = useMemo(() => {
    const base = complaints || [];
    const now = dateRange?.to ? new Date(dateRange.to) : new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const countBetween = (start, end) => {
      const sTs = start.getTime();
      const eTs = end.getTime() + (oneDay - 1);
      return base.filter((c) => {
        const ts = c.createdAt ? Date.parse(c.createdAt) : Date.parse(c.created_at || 0);
        return !isNaN(ts) && ts >= sTs && ts <= eTs;
      }).length;
    };
    const build = (label, days) => {
      const endCurrent = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startCurrent = new Date(endCurrent.getTime() - (days - 1) * oneDay);
      const endPrev = new Date(startCurrent.getTime() - oneDay);
      const startPrev = new Date(endPrev.getTime() - (days - 1) * oneDay);
      const current = countBetween(startCurrent, endCurrent);
      const previous = countBetween(startPrev, endPrev);
      let percent = 0;
      let direction = 'flat';
      if (previous === 0) {
        percent = current > 0 ? 100 : 0;
        direction = current > 0 ? 'up' : 'flat';
      } else {
        percent = ((current - previous) / previous) * 100;
        direction = current > previous ? 'up' : current < previous ? 'down' : 'flat';
      }
      percent = Math.round(percent * 10) / 10; // one decimal
      return { label, current, previous, percent, direction };
    };
    return [
      build('Year-over-Year', 365),
      build('Quarter-over-Quarter', 90),
      build('Month-over-Month', 30),
      build('Week-over-Week', 7),
    ];
  }, [complaints, dateRange.to]);

  // Compute feedback-derived metrics (if complaints include feedback/rating fields)
  const feedbackMetrics = useMemo(() => {
    const ratings = [];
    const resolutionRatings = [];
    const responseRatings = [];
    (complaints || []).forEach((c) => {
      const r =
        c.feedback?.overallRating ?? c.feedback?.overall ?? c.rating ?? c.satisfaction ?? c.overallRating;
      const rr = c.feedback?.resolutionRating ?? c.feedback?.resolution_rating ?? c.resolutionRating;
      const resp = c.feedback?.responseRating ?? c.feedback?.response_rating ?? c.responseRating;
      if (r !== undefined && r !== null && r !== "") {
        const num = Number(r);
        if (!isNaN(num)) ratings.push(Math.max(1, Math.min(5, Math.round(num))));
      }
      if (rr !== undefined && rr !== null && rr !== "") {
        const num = Number(rr);
        if (!isNaN(num)) resolutionRatings.push(Math.max(1, Math.min(5, Math.round(num))));
      }
      if (resp !== undefined && resp !== null && resp !== "") {
        const num = Number(resp);
        if (!isNaN(num)) responseRatings.push(Math.max(1, Math.min(5, Math.round(num))));
      }
    });
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((v) => (dist[v] = (dist[v] || 0) + 1));
    const total = ratings.length;
    const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);
    const avg = total ? Math.round((ratings.reduce((a, b) => a + b, 0) / total) * 10) / 10 : null;
    const avgResolution = resolutionRatings.length
      ? Math.round((resolutionRatings.reduce((a, b) => a + b, 0) / resolutionRatings.length) * 10) / 10
      : null;
    const avgResponse = responseRatings.length
      ? Math.round((responseRatings.reduce((a, b) => a + b, 0) / responseRatings.length) * 10) / 10
      : null;
    return {
      total,
      dist,
      pct,
      avg,
      avgResolution,
      avgResponse,
    };
  }, [complaints]);

  // Compute officer performance stats from complaints (used to render performance table)
  const officerStats = useMemo(() => {
    const map = {};
    (complaints || []).forEach((c) => {
      const officerKey = c.assignedTo || c.adminId || c.assigned_to || "Unassigned";
      if (!map[officerKey]) map[officerKey] = { total: 0, resolved: 0, times: [], sats: [] };
      map[officerKey].total += 1;
      const s = (c.status || "").toString().toLowerCase();
      if (s === "resolved" || s === "closed") map[officerKey].resolved += 1;
      const created = c.createdAt ? Date.parse(c.createdAt) : Date.parse(c.created_at || 0);
      const resolvedAt = c.resolvedAt ? Date.parse(c.resolvedAt) : Date.parse(c.resolved_at || 0);
      if (!isNaN(created) && !isNaN(resolvedAt) && resolvedAt > created) {
        const hrs = (resolvedAt - created) / (1000 * 60 * 60);
        map[officerKey].times.push(hrs);
      }
      const fsat = c.feedback?.overallRating ?? c.feedback?.overall ?? c.rating ?? c.satisfaction ?? c.overallRating;
      if (fsat !== undefined && fsat !== null && fsat !== "") {
        const num = Number(fsat);
        if (!isNaN(num)) map[officerKey].sats.push(Math.max(1, Math.min(5, Math.round(num))));
      }
    });
    const list = Object.keys(map).map((k) => {
      const item = map[k];
      const name = officerOptions.find((o) => String(o._id) === String(k))?.name || k;
      const resolutionRate = Math.round((item.resolved / Math.max(1, item.total)) * 1000) / 10;
      const avgResTime = item.times.length ? Math.round((item.times.reduce((a, b) => a + b, 0) / item.times.length) * 10) / 10 : 0;
      const avgSat = item.sats.length ? Math.round((item.sats.reduce((a, b) => a + b, 0) / item.sats.length) * 10) / 10 : null;
      return {
        id: k,
        name,
        total: item.total,
        resolved: item.resolved,
        resolutionRate,
        avgResTime,
        avgSat,
      };
    });
    list.sort((a, b) => b.total - a.total);
    // Team averages
    const totals = list.reduce((acc, it) => ({ total: acc.total + it.total, resolved: acc.resolved + it.resolved, timesSum: acc.timesSum + (it.avgResTime * it.total), satSum: acc.satSum + ((it.avgSat || 0) * it.total) }), { total: 0, resolved: 0, timesSum: 0, satSum: 0 });
    const teamAvg = {
      total: totals.total ? Math.round((totals.total / Math.max(1, list.length)) * 10) / 10 : 0,
      resolved: totals.resolved ? Math.round((totals.resolved / Math.max(1, list.length)) * 10) / 10 : 0,
      resolutionRate: totals.total ? Math.round((totals.resolved / totals.total) * 1000) / 10 : 0,
      avgResTime: totals.total ? Math.round((totals.timesSum / totals.total) * 10) / 10 : 0,
      avgSat: totals.total ? Math.round((totals.satSum / totals.total) * 10) / 10 : null,
    };
    return { list: list.slice(0, 10), teamAvg };
  }, [complaints, officerOptions]);

  // Small helper to render star icons for a 1-5 integer rating (may be null)
  const renderStars = (rating) => {
    const r = rating == null ? 0 : Math.max(0, Math.min(5, Math.round(rating)));
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= r) stars.push(<FontAwesomeIcon key={i} icon={faStarSolid} />);
      else stars.push(<FontAwesomeIcon key={i} icon={faStarRegular} />);
    }
    return <div className="flex items-center text-yellow-400">{stars}</div>;
  };

  const recentFeedbacks = useMemo(() => {
    const list = (complaints || []).filter((c) => {
      return (
        c.isFeedbackProvided ||
        c.feedback ||
        c.rating !== undefined ||
        c.satisfaction !== undefined ||
        c.overallRating !== undefined
      );
    });
    list.sort((a, b) => {
      const ta = Date.parse(a.createdAt || a.created_at || 0);
      const tb = Date.parse(b.createdAt || b.created_at || 0);
      return tb - ta;
    });
    return list.slice(0, 6);
  }, [complaints]);

  const formatFriendlyDate = (iso) => {
    const d = iso ? new Date(iso) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString() : "-";
  };

  // derive priority metrics for summary cards
  const priorityMetrics = useMemo(() => {
    let high = 0,
      medium = 0,
      low = 0;
    (complaints || []).forEach((c) => {
      const raw = (
        c.priority || c.category?.priority || c.category_id?.priority || ""
      )
        .toString()
        .toLowerCase();
      if (raw.includes("high")) high += 1;
      else if (raw.includes("medium")) medium += 1;
      else if (raw.includes("low")) low += 1;
    });
    return { high, medium, low, total: (complaints || []).length };
  }, [complaints]);

  // Log whenever filtered complaints state updates
  useEffect(() => {
    console.log("[Analytics] complaints state updated:", complaints.length);
  }, [complaints]);

  // update charts whenever complaints state changes (keeps UI in sync)
  useEffect(() => {
    if (complaints && complaints.length) updateChartsWithData(complaints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints]);

  // When switching to Trends tab, ensure large trend chart is populated (if complaints already loaded)
  useEffect(() => {
    if (activeTab === 'trends' && complaints && complaints.length && trendChartLargeRef.current) {
      try { updateChartsWithData(complaints); } catch (_) {}
    }
  }, [activeTab, complaints]);

  // When switching back to Overview tab, re-initialize and populate all overview charts
  useEffect(() => {
    if (activeTab === 'overview' && complaints && complaints.length) {
      // Small delay to ensure DOM is ready after tab switch
      const timer = setTimeout(() => {
        try {
          // Re-initialize each chart if it doesn't exist
          if (complaintChartRef.current) {
            let chart = echarts.getInstanceByDom(complaintChartRef.current);
            if (!chart) chart = echarts.init(complaintChartRef.current);
            chart.resize();
          }
          if (trendChartRef.current) {
            let chart = echarts.getInstanceByDom(trendChartRef.current);
            if (!chart) chart = echarts.init(trendChartRef.current);
            chart.resize();
          }
          if (locationChartRef.current) {
            let chart = echarts.getInstanceByDom(locationChartRef.current);
            if (!chart) chart = echarts.init(locationChartRef.current);
            chart.resize();
          }
          if (ageChartRef.current) {
            let chart = echarts.getInstanceByDom(ageChartRef.current);
            if (!chart) chart = echarts.init(ageChartRef.current);
            chart.resize();
          }
          // Re-populate all charts with current data
          updateChartsWithData(complaints);
        } catch (err) {
          console.warn('[Analytics] Error re-initializing overview charts:', err);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, complaints]);

  // When data visibility toggles on, ensure charts recalc size
  useEffect(() => {
    if (hasData) {
      try {
        if (complaintChartRef.current) {
          const chart = echarts.getInstanceByDom(complaintChartRef.current);
          chart && chart.resize();
        }
        if (trendChartRef.current) {
          const chart = echarts.getInstanceByDom(trendChartRef.current);
          chart && chart.resize();
        }
        if (trendChartLargeRef.current) {
          const chart = echarts.getInstanceByDom(trendChartLargeRef.current);
          chart && chart.resize();
        }
        if (performanceChartRef.current) {
          const chart = echarts.getInstanceByDom(performanceChartRef.current);
          chart && chart.resize();
        }
        if (ageChartRef.current) {
          const chart = echarts.getInstanceByDom(ageChartRef.current);
          chart && chart.resize();
        }
      } catch (_) {}
    }
  }, [hasData]);

  // Ensure age chart resizes when it becomes visible due to active cases appearing
  useEffect(() => {
    const active = (metrics.total || 0) - (metrics.resolved || 0);
    if (active > 0 && ageChartRef.current) {
      try {
        const chart = echarts.getInstanceByDom(ageChartRef.current);
        chart && chart.resize();
      } catch (_) {}
    }
  }, [metrics.total, metrics.resolved]);

  // polling to approximate real-time updates (every 30s); skip if using router-provided data
  useEffect(() => {
    if (preferLocationData) return;
    const id = setInterval(() => fetchComplaints(), 30000);
    return () => clearInterval(id);
    // re-create interval when filters change
  }, [
    preferLocationData,
    dateRange,
    selectedCategory,
    selectedLocation,
    selectedBlock,
    selectedRoom,
    selectedOfficer,
    selectedStatus,
    selectedPriority,
  ]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex items-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-2xl mr-3" />
            <span className="text-gray-700">Applying filters...</span>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-up">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {/* Header */}

      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Analytics Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Visualize and analyze complaint data - {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer"
                  onClick={exportToPDF}
                >
                  <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                  Export to PDF
                </button>
              </div>
            </div>
            {/* Filter Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-800">
                    Filter Analytics
                  </h2>
                    <button
                    onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  >
                      <FontAwesomeIcon icon={isFilterCollapsed ? faChevronDown : faChevronUp} className="text-sm" />
                  </button>
                </div>
                {!isFilterCollapsed && (
                  <>
                    {/* Quick date presets */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 mr-1">Quick range:</span>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        onClick={() => {
                          const today = new Date();
                          const from = new Date();
                          from.setDate(today.getDate() - 6);
                          setDateRange({ from: formatDate(from), to: formatDate(today) });
                        }}
                      >
                        Last 7 days
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        onClick={() => {
                          const today = new Date();
                          const from = new Date();
                          from.setDate(today.getDate() - 29);
                          setDateRange({ from: formatDate(from), to: formatDate(today) });
                        }}
                      >
                        Last 30 days
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        onClick={() => {
                          const today = new Date();
                          const from = new Date(today.getFullYear(), today.getMonth(), 1);
                          setDateRange({ from: formatDate(from), to: formatDate(today) });
                        }}
                      >
                        This month
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        onClick={() => {
                          const today = new Date();
                          const from = new Date(today.getFullYear(), 0, 1);
                          setDateRange({ from: formatDate(from), to: formatDate(today) });
                        }}
                      >
                        This year
                      </button>
                    </div>

                    {/* Active filter chips */}
                    {(hasCustomDateRange || selectedCategory !== "all" || selectedBlock !== "all" || selectedRoom !== "all" || selectedStatus || selectedPriority || selectedOfficer !== "all") && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {hasCustomDateRange && (
                          <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            Date: {dateRange.from} → {dateRange.to}
                              <button className="ml-2 text-blue-600 hover:text-blue-800" onClick={() => clearFilter("date")} aria-label="Clear date filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                        {selectedCategory !== "all" && (
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Category: {selectedCategory}
                              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => clearFilter("category")} aria-label="Clear category filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                        {selectedBlock !== "all" && (
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Block: {selectedBlock}
                              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => clearFilter("block")} aria-label="Clear block filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                        {selectedRoom !== "all" && (
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Room: {selectedRoom}
                              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => clearFilter("room")} aria-label="Clear room filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                        {selectedStatus && (
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Status: {selectedStatus}
                              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => clearFilter("status")} aria-label="Clear status filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                        {selectedPriority && (
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Priority: {selectedPriority}
                              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => clearFilter("priority")} aria-label="Clear priority filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                        {selectedOfficer !== "all" && (
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            Assigned: {(
                              officerOptions.find((o) => String(o._id) === String(selectedOfficer))?.name || selectedOfficer
                            )}
                              <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => clearFilter("officer")} aria-label="Clear officer filter">
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                          </span>
                        )}
                      </div>
                    )}
                    {/* Unified responsive filter grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                      <div>
                        <label
                          htmlFor="date-from"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          From Date
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type="date"
                            id="date-from"
                            className="pl-9 h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                            value={dateRange.from}
                            onChange={(e) =>
                              setDateRange({ ...dateRange, from: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="date-to"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          To Date
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faCalendarCheck} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <input
                            type="date"
                            id="date-to"
                            className="pl-9 h-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                            value={dateRange.to}
                            onChange={(e) =>
                              setDateRange({ ...dateRange, to: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="category-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Category
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faTags} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <select
                            id="category-filter"
                            className="peer block w-full pl-9 pr-10 h-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                          >
                            <option value="all">All Categories</option>
                            {categoryOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 peer-focus:rotate-180">
                            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 transition-colors duration-200 peer-focus:text-blue-500" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="block-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Block
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faLayerGroup} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <select
                            id="block-filter"
                            className="peer block w-full pl-9 pr-10 h-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                            value={selectedBlock}
                            onChange={(e) => setSelectedBlock(e.target.value)}
                          >
                            <option value="all">All Blocks</option>
                            {blockOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 peer-focus:rotate-180">
                            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 transition-colors duration-200 peer-focus:text-blue-500" />
                          </div>
                        </div>
                      </div>
                      {/* Room */}
                      <div>
                        <label
                          htmlFor="room-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Room
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faDoorClosed} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <select
                            id="room-filter"
                            className="peer block w-full pl-9 pr-10 h-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e.target.value)}
                            disabled={selectedBlock === "all" || roomOptions.length === 0}
                          >
                            <option value="all">All Rooms</option>
                            {roomOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 ${selectedBlock === "all" || roomOptions.length === 0 ? "opacity-40" : "peer-focus:rotate-180"}`}>
                            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 transition-colors duration-200 peer-focus:text-blue-500" />
                          </div>
                        </div>
                        {selectedBlock === "all" && (
                          <p className="mt-1 text-xs text-gray-400">Select a block to choose rooms</p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="status-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Status
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <select
                            id="status-filter"
                            className="peer block w-full pl-9 pr-10 h-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                          >
                            <option value="">All</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 peer-focus:rotate-180">
                            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 transition-colors duration-200 peer-focus:text-blue-500" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="priority-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Priority
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <select
                            id="priority-filter"
                            className="peer block w-full pl-9 pr-10 h-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                            value={selectedPriority}
                            onChange={(e) =>
                              setSelectedPriority(e.target.value)
                            }
                          >
                            <option value="">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 peer-focus:rotate-180">
                            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 transition-colors duration-200 peer-focus:text-blue-500" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="officer-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Assigned To
                        </label>
                        <div className="relative">
                          <FontAwesomeIcon icon={faUserShield} className="text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                          <select
                            id="officer-filter"
                            className="peer block w-full pl-9 pr-10 h-10 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(e.target.value)}
                          >
                            <option value="all">All</option>
                            <option value="Unassigned">Unassigned</option>
                            {officerOptions.map((o) => (
                              <option key={o._id} value={o._id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-200 peer-focus:rotate-180">
                            <FontAwesomeIcon icon={faChevronDown} className="text-gray-400 transition-colors duration-200 peer-focus:text-blue-500" />
                          </div>
                        </div>
                      </div>
                      {/* Reset button (visible on all tabs; stick to end/right of grid) */}
                      <div className="col-span-full sm:col-start-[-1] justify-self-end">
                        <button
                          onClick={resetFilters}
                          className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faUndo} className="mr-2" />
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`!rounded-button whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                      activeTab === "overview"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faChartPie} className="mr-1" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("trends")}
                    className={`!rounded-button whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                      activeTab === "trends"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                    Trends
                  </button>
                  <button
                    onClick={() => setActiveTab("locations")}
                    className={`!rounded-button whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                      activeTab === "locations"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faUsers} className="mr-1" />
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab("performance")}
                    className={`!rounded-button whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                      activeTab === "performance"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                    Performance
                  </button>
                </div>
              </div>
            </div>
            {/* Dashboard Content */}
            {activeTab === "overview" && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
                        <FontAwesomeIcon icon={faClipboardList} className="text-blue-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Total Complaints
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics.total}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      {totalGrowth.dir === "up" && (
                        <span className="text-green-600 font-medium flex items-center">
                          <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                          +{totalGrowth.delta}
                        </span>
                      )}
                      {totalGrowth.dir === "down" && (
                        <span className="text-red-600 font-medium flex items-center">
                          <FontAwesomeIcon icon={faArrowUp} className="mr-1 transform rotate-180" />
                          -{Math.abs(totalGrowth.delta)}
                        </span>
                      )}
                      {totalGrowth.dir === "flat" && (
                        <span className="text-gray-600 font-medium flex items-center">0</span>
                      )}
                      <span className="text-gray-500 ml-2">vs previous period</span>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Resolved
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics.resolved}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">
                        {metrics.resolutionRate}%
                      </span>
                      <span className="text-gray-500 ml-2">
                        resolution rate
                      </span>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
                        <FontAwesomeIcon icon={faSpinner} className="text-yellow-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          In Progress
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics.inProgress}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">
                        {metrics.total
                          ? Math.round(
                              (metrics.inProgress / metrics.total) * 1000
                            ) / 10
                          : 0}
                        %
                      </span>
                      <span className="text-gray-500 ml-2">
                        of total complaints
                      </span>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-red-100 p-3">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Open
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics.open}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">
                        {metrics.total
                          ? Math.round((metrics.open / metrics.total) * 1000) /
                            10
                          : 0}
                        %
                      </span>
                      <span className="text-gray-500 ml-2">
                        of total complaints
                      </span>
                    </div>
                  </div>
                </div>
                {/* Main Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Complaint Type Distribution
                    </h3>
                    <div
                      ref={complaintChartRef}
                      className="w-full"
                      style={{ height: "350px", display: hasData ? "block" : "none" }}
                    ></div>
                    {!hasData && (
                      <div className="h-[350px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <FontAwesomeIcon icon={faChartPie} className="text-4xl mb-2" />
                          <p>No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Time-Based Trend Analysis
                    </h3>
                    <div
                      ref={trendChartRef}
                      className="w-full"
                      style={{ height: "350px", display: hasData ? "block" : "none" }}
                    ></div>
                    {!hasData && (
                      <div className="h-[350px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <FontAwesomeIcon icon={faChartLine} className="text-4xl mb-2" />
                          <p>No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Response Time & Priority Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Open Case Age Distribution
                    </h3>
                    <div
                      ref={ageChartRef}
                      className="w-full"
                      style={{ height: "350px", display: metrics.total - metrics.resolved > 0 ? "block" : "none" }}
                    ></div>
                    {metrics.total - metrics.resolved === 0 && (
                      <div className="h-[350px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <FontAwesomeIcon icon={faHourglassHalf} className="text-4xl mb-2" />
                          <p>No active (non-resolved) cases to analyze</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Complaints by Priority
                    </h3>
                    {hasData ? (
                      <div className="grid grid-cols-1 sm:grid-rows-3 sm:grid-flow-col gap-4">
                        <div className="rounded-lg p-4 text-center border border-red-100 bg-red-50">
                          <div className="text-2xl md:text-3xl font-bold text-red-600 mb-1">
                            {priorityMetrics.high}
                          </div>
                          <div className="text-sm font-medium text-gray-700">High Priority</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {priorityMetrics.total > 0 ? ((priorityMetrics.high / priorityMetrics.total) * 100).toFixed(1) : 0}% of total
                          </div>
                          <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${priorityMetrics.total > 0 ? (priorityMetrics.high / priorityMetrics.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="rounded-lg p-4 text-center border border-yellow-100 bg-yellow-50">
                          <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">
                            {priorityMetrics.medium}
                          </div>
                          <div className="text-sm font-medium text-gray-700">Medium Priority</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {priorityMetrics.total > 0 ? ((priorityMetrics.medium / priorityMetrics.total) * 100).toFixed(1) : 0}% of total
                          </div>
                          <div className="w-full bg-yellow-100 rounded-full h-2 mt-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{ width: `${priorityMetrics.total > 0 ? (priorityMetrics.medium / priorityMetrics.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="rounded-lg p-4 text-center border border-green-100 bg-green-50">
                          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                            {priorityMetrics.low}
                          </div>
                          <div className="text-sm font-medium text-gray-700">Low Priority</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {priorityMetrics.total > 0 ? ((priorityMetrics.low / priorityMetrics.total) * 100).toFixed(1) : 0}% of total
                          </div>
                          <div className="w-full bg-green-100 rounded-full h-2 mt-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${priorityMetrics.total > 0 ? (priorityMetrics.low / priorityMetrics.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <FontAwesomeIcon icon={faSignal} className="text-2xl mb-2" />
                          <p>No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {activeTab === "trends" && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  Complaint Trends Over Time
                </h3>
                <div ref={trendChartLargeRef} className="w-full" style={{ height: "600px" }}></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">
                      Growth Trends
                    </h4>
                    <ul className="space-y-2">
                      {growthMetrics.map((g) => (
                        <li key={g.label} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{g.label}:</span>
                          <span className={`text-sm font-medium ${g.direction === 'up' ? 'text-green-600' : g.direction === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                            {g.direction === 'down' ? '' : g.percent >= 0 ? '+' : ''}{g.percent}%
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-gray-500">Comparison windows use trailing periods (7/30/90/365 days) ending at the current To date filter.</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "locations" && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  Student Feedback Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-blue-900 mb-2">
                      Overall Satisfaction
                    </h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarHalfAlt} />
                    </div>
                    <p className="text-3xl font-bold text-blue-900">4.5/5.0</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Based on {metrics.total} responses
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-purple-900 mb-2">
                      Resolution Satisfaction
                    </h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarRegular} />
                    </div>
                    <p className="text-3xl font-bold text-purple-900">
                      4.2/5.0
                    </p>
                    <p className="text-sm text-purple-700 mt-2">
                      Based on {metrics.resolved} resolved cases
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-green-900 mb-2">
                      Response Time Rating
                    </h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarSolid} />
                      <FontAwesomeIcon icon={faStarRegular} />
                    </div>
                    <p className="text-3xl font-bold text-green-900">4.0/5.0</p>
                    <p className="text-sm text-green-700 mt-2">
                      Average response rating
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">
                      Recent Student Feedback
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Complaint ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overall Satisfaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Resolution Rating
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Comments
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #2025-042
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            IT Services
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarRegular} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            Quick response and effective resolution of Wi-Fi
                            connectivity issues.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            May 16, 2025
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #2025-041
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Facilities
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarRegular} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            The maintenance team fixed the AC issue promptly.
                            Very satisfied with the service.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            May 15, 2025
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #2025-040
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Academic
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarRegular} />
                              <FontAwesomeIcon icon={faStarRegular} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            Resolution took longer than expected, but the issue
                            was eventually resolved.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            May 15, 2025
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #2025-039
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Administrative
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarHalfAlt} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            Very professional handling of my registration issue.
                            Thank you!
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            May 14, 2025
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #2025-038
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Services
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarRegular} />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarRegular} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            Good service overall, but could be a bit faster in
                            responding.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            May 14, 2025
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Satisfaction Distribution
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center text-yellow-400">
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarSolid} />
                              <FontAwesomeIcon icon={faStarRegular} />
                              <FontAwesomeIcon icon={faStarRegular} />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            45%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: "45%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center text-yellow-400">
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <span className="ml-2 text-gray-700">4 stars</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            30%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: "30%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center text-yellow-400">
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <span className="ml-2 text-gray-700">3 stars</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            15%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: "15%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center text-yellow-400">
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <span className="ml-2 text-gray-700">2 stars</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            7%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: "7%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center text-yellow-400">
                            <FontAwesomeIcon icon={faStarSolid} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <FontAwesomeIcon icon={faStarRegular} />
                            <span className="ml-2 text-gray-700">1 star</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            3%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: "3%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Common Feedback Themes
                    </h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h5 className="text-sm font-medium text-green-800 mb-2">
                          Positive Feedback
                        </h5>
                        <ul className="space-y-2 text-sm text-green-700">
                          <li className="flex items-center">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                            Quick response time
                          </li>
                          <li className="flex items-center">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                            Professional staff
                          </li>
                          <li className="flex items-center">
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                            Effective solutions
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h5 className="text-sm font-medium text-red-800 mb-2">
                          Areas for Improvement
                        </h5>
                        <ul className="space-y-2 text-sm text-red-700">
                          <li className="flex items-center">
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                            Communication updates
                          </li>
                          <li className="flex items-center">
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                            Resolution time
                          </li>
                          <li className="flex items-center">
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                            Follow-up process
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              
            )}
            {activeTab === "performance" && (
              <>
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Officer Performance Dashboard
                  </h3>
                  <div
                    ref={performanceChartRef}
                    className="w-full"
                    style={{ height: "500px", display: hasData ? "block" : "none" }}
                  ></div>
                  {!hasData && (
                        <div className="h-[500px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <FontAwesomeIcon icon={faUserCheck} className="text-4xl mb-2" />
                        <p>No data available for the selected filters</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detailed Performance Metrics
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Officer
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Total Cases
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Resolved
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Resolution Rate
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Avg. Response Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Avg. Resolution Time
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Satisfaction
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            John Smith
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            42
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            36
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            85.7%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            12h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            3.2 days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            4.2/5
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Emma Davis
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            36
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            28
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            77.8%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            8h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            2.5 days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            4.5/5
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Sarah Johnson
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            28
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            26
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            92.9%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            15h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            4.1 days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            4.7/5
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Michael Brown
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            32
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            25
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            78.1%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            10h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            3.8 days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            4.0/5
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Team Average
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            34.5
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            28.8
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            83.5%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            11h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            3.4 days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            4.3/5
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Export Report
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="export-filename"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Filename
                  </label>
                  <input
                    type="text"
                    id="export-filename"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={exportSettings.filename}
                    onChange={(e) =>
                      setExportSettings({
                        ...exportSettings,
                        filename: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Include Sections
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        id="export-overview"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.overview}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            overview: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Overview
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        id="export-trends"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.trends}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            trends: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">Trends</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        id="export-students"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.students}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            students: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Students
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        id="export-performance"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.performance}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            performance: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Performance
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="export-orientation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Page Orientation
                  </label>
                  <select
                    id="export-orientation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={exportSettings.orientation}
                    onChange={(e) =>
                      setExportSettings({
                        ...exportSettings,
                        orientation: e.target.value,
                      })
                    }
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="export-quality"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quality
                  </label>
                  <select
                    id="export-quality"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={exportSettings.quality}
                    onChange={(e) =>
                      setExportSettings({
                        ...exportSettings,
                        quality: e.target.value,
                      })
                    }
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="!rounded-button whitespace-nowrap px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                    Export
                  </>
                )}
              </button>
            </div>
            {exportedFileUrl && (
              <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                  <span className="text-green-700">
                    Report generated successfully!
                  </span>
                </div>
                <a
                  href={exportedFileUrl}
                  download
                  className="!rounded-button whitespace-nowrap mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download Report
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
