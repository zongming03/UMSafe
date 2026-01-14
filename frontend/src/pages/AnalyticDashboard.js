import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import * as echarts from "echarts";
import api from "../services/api";
import { fetchReports, fetchAdminReports, getReportHistories, fetchReportFeedback } from "../services/reportsApi";
import { fetchFacultyCategories } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { pipeline } from "@xenova/transformers";
import {
  faSpinner,
  faCheckCircle,
  faFileExport,
  faTimes,
  faCalendarAlt,
  faTags,
  faLayerGroup,
  faDoorClosed,
  faInfoCircle,
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
  faMapMarkerAlt,
  faClock,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import LoadingOverlay from "../components/LoadingOverlay";
import { generateAnalyticsPDF } from "../utils/analyticsPDFGenerator";
import { getAllOfficers } from "../services/api";

function App() {
  const { user } = useContext(AuthContext);
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  // Helper to format dates as YYYY-MM-DD
  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to format dates as DD/MM/YYYY for display
  const formatDMY = (input) => {
    if (!input) return "-";
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Build export filename
  const buildFileName = (base = "analytics-report", ext = "pdf") => {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    return `${base}-${stamp}.${ext}`;
  };

  // Capture an ECharts instance by ref and return dataURL
  const getChartImage = (chartRef) => {
    try {
      const inst = chartRef?.current && echarts.getInstanceByDom(chartRef.current);
      if (inst) return inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' });
    } catch(e) {}
    return null;
  };


  
  // Compute default date range: 1 month before today to today
  const getDefaultDateRange = () => {
    const today = new Date();
    const from = new Date(today);
    from.setMonth(from.getMonth() - 1);
    return { from: formatDate(from), to: formatDate(today) };
  };

  

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Filter states
  const [dateRange, setDateRange] = useState(() => getDefaultDateRange());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  // Hierarchical location filters
  const [selectedBlock, setSelectedBlock] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState("all");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [hasCustomDateRange, setHasCustomDateRange] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [blockOptions, setBlockOptions] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [officerOptions, setOfficerOptions] = useState([]); 
  const [userFacultyName, setUserFacultyName] = useState("");
  const [categoryTrendData, setCategoryTrendData] = useState([]);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const complaintChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const trendChartLargeRef = useRef(null);
  const locationChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  const ageChartRef = useRef(null);
  const filterRefetchTimer = useRef(null);
  const historiesCacheRef = useRef(new Map()); 
  const feedbackCacheRef = useRef(new Map());
  const location = useLocation();
  const initialDataRef = useRef(null);
  const [preferLocationData, setPreferLocationData] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // AI-powered feedback analysis state
  const [aiThemeMetrics, setAiThemeMetrics] = useState({
    effectiveSolution: 0,
    ineffectiveSolution: 0,
    fastResponse: 0,
    slowResponse: 0,
    politeStaff: 0,
    rudeStaff: 0,
    total: 0,
    isAnalyzing: false
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
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
  
  // ============================================================================
  // DATA LOADING & SIDE EFFECTS
  // ============================================================================
  
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load officer options for assignment filter
  useEffect(() => {
    const loadOfficers = async () => {
      try {
        const res = await getAllOfficers();
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list
          .filter((u) => u && u._id && u.name && (u.role === "officer" || u.role === "admin" || u.role === "superadmin"))
          .map((u) => ({ _id: u._id, name: u.name }));
        setOfficerOptions(mapped);
      } catch (e) {
        console.warn("[Analytics] Failed to fetch officers, will fallback to deriving from complaints", e);
        // Fallback: derive unique adminId-like values from current dataset if needed
        const base = Array.isArray(initialDataRef.current) ? initialDataRef.current : [];
        const pairs = [];
        base.forEach((c) => {
          const id = String(c.adminId || c.assignedTo || c.assigned_to || "").trim();
          const name = String(c.adminName || c.assignedName || "").trim();
          // Only add if we have a valid ID and name (skip empty/unassigned)
          if (id && name && name !== "Unassigned") {
            pairs.push({ _id: id, name });
          }
        });
        const dedup = Array.from(
          new Map(pairs.map((p) => [String(p._id), p]))
        ).map(([, v]) => v);
        setOfficerOptions(dedup);
      }
    };
    loadOfficers();
  }, []);

  // Load blocks/rooms for current user's faculty
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get("/rooms");
        const faculties = Array.isArray(res.data) ? res.data : [];
        let faculty = null;
        if (user?.facultyid) {
          faculty = faculties.find((f) => String(f._id) === String(user.facultyid));
        }
        if (!faculty && faculties.length) faculty = faculties[0];

        // Capture faculty name for filtering by location later (fallbacks for schema variants)
        const facName = faculty?.name || faculty?.faculty || faculty?.title;
        if (facName) {
          setUserFacultyName(String(facName));
        }

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
  }, [user?.facultyid]);

  // Auto-fetch complaints when filters change
  useEffect(() => {
    fetchComplaints(false, "Filters updated");
  }, [dateRange, selectedCategory, selectedBlock, selectedRoom, selectedStatus, selectedPriority, selectedOfficer]);

  useEffect(() => {
    const refreshRoomsForBlock = async () => {
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
      }
    };
    if (selectedBlock && selectedBlock !== "all") {
      refreshRoomsForBlock();
    }
  }, [selectedBlock]);

  // Load categories from backend to populate the Category filter dynamically
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const userDataStr =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        const userFacultyId = currentUser?.facultyid || user?.facultyid;
        
        if (!userFacultyId) {
          console.warn("[Analytics] No facultyId found for current user");
          setCategoryOptions([]);
          return;
        }

        const res = await fetchFacultyCategories(userFacultyId);
        let categories = Array.isArray(res.data) ? res.data : [];
        console.log("[Analytics] Fetched faculty categories:", categories);
        
        // Check if response contains faculty objects with nested categories or just categories
        if (categories.length > 0 && categories[0].categories && Array.isArray(categories[0].categories)) {
          // Response is faculty objects with nested categories
          categories = categories.flatMap((f) => f.categories || []);
        }
        
        // Extract category names
        const names = Array.from(
          new Set(
            categories
              .map((c) => (c && (c.name || c.title) ? String(c.name || c.title) : ""))
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b));

        console.log("[Analytics] Loaded faculty categories:", names);
        
        if (names.length) {
          setCategoryOptions(names);
          return;
        }
        // If backend has no categories, fall back to local base data
      } catch (e) {
        console.warn("[Analytics] Failed to fetch faculty categories, falling back to local dataset", e);
      }
      // Fallback: derive categories from initial data (router) if available
      const base = Array.isArray(initialDataRef.current) ? initialDataRef.current : [];
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
  }, []);

  // ============================================================================
  // CHART INITIALIZATION
  // ============================================================================
  
  // Initialize complaint distribution chart (pie chart)
  useEffect(() => {
    if (activeTab !== "overview" || !complaintChartRef.current) return;
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
          legend: {
            orient: "horizontal",
            bottom: 5,
            left: "center",
            data: [], // will be filled dynamically
          },
          series: [
            {
              name: "Complaint Distribution",
              type: "pie",
              radius: ["48%", "68%"],
              center: ["50%", "50%"], // center the pie chart
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: "#fff",
                borderWidth: 2,
              },
              label: { 
                show: true,
                formatter: '{d}%',
                fontSize: 10,
                fontWeight: 'bold',
                color: '#faf5f5ff',
                position: 'inside'
              },
              labelLine: { show: false },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 13,
                  fontWeight: 'bold'
                }
              },
              data: [], 
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
  }, [activeTab]);
  
  // Initialize trend chart (line chart - small overview version)
  useEffect(() => {
    if (activeTab !== "overview" || !trendChartRef.current) return;
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
  }, [activeTab]);

  // Initialize large trend chart (trends tab full-size version)
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
  
  // Initialize location chart (horizontal bar chart - not currently used but kept for future)
  useEffect(() => {
    if (activeTab !== "overview" || !locationChartRef.current) return;
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
          data: [],
        },
        series: [
          {
            name: "Complaints",
            type: "bar",
            data: [],
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
  }, [activeTab]);
  
  // Initialize performance chart (combined bar+line chart for officer metrics)
  useEffect(() => {
    if (activeTab !== "performance" || !performanceChartRef.current) return;
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
                  param.seriesName.includes("Rate") ? "%" : "h"
                }`;
              })
              .join("<br/>");
          },
        },
        legend: {
          data: ["Resolution Rate (%)", "Avg Response Time (hrs)", "Avg Resolution Time (hrs)"],
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
            data: [],
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
            name: "Time (hours)",
            min: 0,
            axisLabel: {
              formatter: "{value}h",
            },
          },
        ],
        series: [
          {
            name: "Resolution Rate (%)",
            type: "bar",
            data: [],
            itemStyle: {
              color: "#5470c6",
            },
          },
          {
            name: "Avg Response Time (hrs)",
            type: "line",
            yAxisIndex: 1,
            data: [],
            symbol: "circle",
            symbolSize: 8,
            itemStyle: {
              color: "#91cc75",
            },
            lineStyle: {
              width: 3,
            },
          },
          {
            name: "Avg Resolution Time (hrs)",
            type: "line",
            yAxisIndex: 1,
            data: [],
            symbol: "diamond",
            symbolSize: 8,
            itemStyle: {
              color: "#fac858",
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
  }, [activeTab]);

  // Initialize Open Case Age Distribution chart
  useEffect(() => {
    if (activeTab !== "overview" || !ageChartRef.current) return;
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
  }, [activeTab]);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [hasData, setHasData] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);



  // ============================================================================
  // DATA PROCESSING & FILTERING
  // ============================================================================
  
  // Apply current filter settings to complaint dataset
  const filterData = (data) => {
    const fromTs = dateRange.from ? Date.parse(dateRange.from) : null;
    const toTs = dateRange.to ? Date.parse(dateRange.to) : null;
    const normalizedUserFaculty = (userFacultyName || "").toString().toLowerCase();
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

        // Enforce faculty filter strictly: if user faculty name not resolved yet, show none to avoid mismatch
        if (!normalizedUserFaculty) return false;
        const reportFaculty = (c.facultyLocation?.faculty || c.facultyLocation?.facultyName || "").toString().trim().toLowerCase();
        if (!reportFaculty || reportFaculty !== normalizedUserFaculty) return false;

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

  // Attach report histories via API (cached) so performance metrics can compute timelines
  const attachHistories = async (list) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    const enriched = await Promise.all(
      list.map(async (c) => {
        const id = c.id|| c.displayId;
        if (!id) return c;
        if (c.reportHistories || c.timelineHistory) return c;

        if (historiesCacheRef.current.has(id)) {
          return { ...c, reportHistories: historiesCacheRef.current.get(id) };
        }

        try {
          const res = await getReportHistories(id);
          const histories = res.data?.reportHistories || res.data?.histories || res.data || [];
          historiesCacheRef.current.set(id, histories);
          return { ...c, reportHistories: histories };
        } catch (err) {
          console.warn("[Analytics] Failed to fetch report histories for", id, err);
          return c;
        }
      })
    );
    return enriched;
  };

  // Attach feedback via API (cached) so Student Feedback Analysis can use up-to-date data
  const attachFeedbacks = async (list) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    const enriched = await Promise.all(
      list.map(async (c) => {
        try {
          const id = c.id || c._id || c.reportId || c.displayId;
          // If complaint already has feedback populated, keep it
          const hasFeedback = c.feedback && (c.feedback.q1Rating || c.feedback.q2Rating || c.feedback.overallComment);
          if (!id || hasFeedback) {
            return { ...c, isFeedbackProvided: Boolean(hasFeedback) };
          }

          // Use cache if available
          if (feedbackCacheRef.current.has(id)) {
            const fb = feedbackCacheRef.current.get(id);
            const provided = Boolean(fb && (fb.q1Rating || fb.q2Rating || fb.overallComment));
            return { ...c, feedback: fb || c.feedback, isFeedbackProvided: provided };
          }

          // Fetch from API
          const res = await fetchReportFeedback(id);
          const data = res?.data || {};
          // Support multiple possible response shapes
          const rf = data.reportFeedback || data.feedback || data.data || data;
          let latest = rf;
          if (Array.isArray(rf)) {
            latest = rf
              .slice()
              .sort((a, b) => {
                const ta = Date.parse(a.updatedAt || a.createdAt || 0);
                const tb = Date.parse(b.updatedAt || b.createdAt || 0);
                return tb - ta;
              })[0] || null;
          }

          const feedbackObj = latest
            ? {
                q1Rating: Number(latest.q1Rating ?? latest.question1 ?? latest.q1 ?? 0) || 0,
                q2Rating: Number(latest.q2Rating ?? latest.question2 ?? latest.q2 ?? 0) || 0,
                overallComment: String(latest.overallComment ?? latest.question3 ?? latest.comment ?? "") || "",
                createdAt: latest.createdAt || null,
                updatedAt: latest.updatedAt || null,
              }
            : null;

          if (feedbackObj) {
            feedbackCacheRef.current.set(id, feedbackObj);
   
          }
          const provided = Boolean(
            feedbackObj && (feedbackObj.q1Rating || feedbackObj.q2Rating || feedbackObj.overallComment)
          );

          return { ...c, feedback: feedbackObj || c.feedback, isFeedbackProvided: provided };
        } catch (_) {
          // On failure, return original complaint
          return c;
        }
      })
    );
    return enriched;
  };

  // Fetch complaints from backend and apply client-side filters
  const fetchComplaints = async (
    showToastFlag = false,
    message = "Data refreshed"
  ) => {
    // Avoid flicker: wait until user's faculty name is resolved before updating
    if (!userFacultyName || String(userFacultyName).trim() === "") {
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    if (showToastFlag) {
      setToastMessage(message);
      setShowToast(true);
    }
    if (preferLocationData) {
      const base =
        initialDataRef.current && initialDataRef.current.length
          ? initialDataRef.current
          : [];
      console.log(
        "[Analytics] fetchComplaints using local base (router). base count:",
        Array.isArray(base) ? base.length : 0,
        "dateRange:",
        dateRange
      );
      const filtered = filterData(base);
      const withHistories = await attachHistories(filtered);
      const withFeedback = await attachFeedbacks(withHistories);
      console.log("[Analytics] fetchComplaints filtered count:", withFeedback.length);
      setComplaints(withFeedback);
      setHasData(withFeedback.length > 0);
      updateChartsWithData(withFeedback);
      setLastUpdatedAt(new Date());
      setIsLoading(false);
      if (showToastFlag) {
        setTimeout(() => setShowToast(false), 2000);
      }
      return;
    }
    try {
      // Prefer bulk endpoint with embedded feedback; fallback to base reports
      const res = await fetchAdminReports(true).catch(() => fetchReports());
      const data = res.data?.reports || res.data?.data || res.data || [];
      console.log("[Analytics] Fetched reports (admin/bulk) from API:", data.length);

      const filtered = filterData(data);
      const withHistories = await attachHistories(filtered);
      const withFeedback = await attachFeedbacks(withHistories);

      setComplaints(withFeedback);
      setHasData(withFeedback.length > 0);
      updateChartsWithData(withFeedback);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error("Failed to load complaints for analytics:", err);
      setFetchError(err.message || "Failed to fetch complaints");
      setComplaints([]);
      setHasData(false);
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
    setSelectedPreset(null);
    setHasCustomDateRange(false);

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

  // Seed from router state if available (preferred). If none, start empty.
  useEffect(() => {
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
    initialDataRef.current = hasRouterData ? locComplaints : [];

    const run = async () => {
      const filtered = filterData(initialDataRef.current);
      const withHistories = await attachHistories(filtered);
      console.log(
        "[Analytics] Seed filtered complaints (count):",
        withHistories.length,
        "dateRange:",
        dateRange
      );
      setComplaints(withHistories);
      setHasData(withHistories.length > 0);
      if (withHistories.length > 0) updateChartsWithData(withHistories);
      setLastUpdatedAt(new Date());
      setPreferLocationData(hasRouterData);
    };
    run();
  }, [location]);


  useEffect(() => {
    if (filterRefetchTimer.current) clearTimeout(filterRefetchTimer.current);
    filterRefetchTimer.current = setTimeout(() => {
      fetchComplaints(false);
    }, 300);
    return () => {
      if (filterRefetchTimer.current) clearTimeout(filterRefetchTimer.current);
    };
  }, [dateRange, selectedCategory, selectedLocation, selectedBlock, selectedRoom, selectedOfficer, selectedStatus, selectedPriority, userFacultyName]);

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

    // Performance per officer (assignedTo) - resolution rate, response time and resolution time
    const officerMap = {};
    const normalize = (s) => (s || "").toString().trim().toLowerCase();

    data.forEach((c) => {
      const officer = c.assignedTo || c.adminId || c.assigned_to || "Unassigned";
      const officerName = c.adminName || c.assignedName || officerOptions.find((o) => String(o._id) === String(officer))?.name || "";

      officerMap[officer] = officerMap[officer] || {
        total: 0,
        resolved: 0,
        responseTimes: [],
        resolutionTimes: [],
      };
      officerMap[officer].total += 1;

      const status = (c.status || "").toLowerCase();
      if (status === "resolved" || status === "closed") officerMap[officer].resolved += 1;

      if (c.reportHistories && Array.isArray(c.reportHistories)) {
        const sorted = [...c.reportHistories].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

        const matchesAssignmentToOfficer = (evt) => {
          if (evt.actionTitle !== "Admin Assigned") return false;
          const details = normalize(evt.actionDetails);
          if (officerName && details.includes(normalize(officerName))) return true;
          if (officer && details.includes(normalize(officer))) return true;
          return false;
        };

        // Response Time: Prefer assignment -> chat. If chat predates a later reassignment,
        // fall back to assignment -> first subsequent meaningful event (resolve/close/reassign/revoke).
        const chatEvt = sorted.find((evt) =>
          evt.actionTitle === "Chat initiated");
        const isMeaningfulNextEvent = (evt) => {
          if (!evt || !evt.actionTitle) return false;
          const t = evt.actionTitle.toLowerCase();
          return (
            t.includes("case resolved") ||
            t.includes("case closed") ||
            t.includes("admin assigned") ||
            t.includes("admin revoked")
          );
        };

        const tryFallbackFromLastAssignment = () => {
          const allAssigns = sorted.filter((evt) => matchesAssignmentToOfficer(evt));
          const lastAnyAssign = allAssigns[allAssigns.length - 1];
          if (!lastAnyAssign) return false;
          const assignTsAny = Date.parse(lastAnyAssign.createdAt);
          const nextEvt = sorted.find((h) => Date.parse(h.createdAt) > assignTsAny && isMeaningfulNextEvent(h));
          if (nextEvt) {
            const nextTs = Date.parse(nextEvt.createdAt);
            if (!isNaN(nextTs)) {
              const respHrs = (nextTs - assignTsAny) / (1000 * 60 * 60);
              officerMap[officer].responseTimes.push(respHrs);
              return true;
            }
          }
          return false;
        };

        if (chatEvt) {
          const chatTs = Date.parse(chatEvt.createdAt);
          const assigns = sorted.filter(
            (evt) => matchesAssignmentToOfficer(evt) && Date.parse(evt.createdAt) < chatTs
          );
          const lastAssign = assigns[assigns.length - 1];
          if (lastAssign) {
            const assignTs = Date.parse(lastAssign.createdAt);
            if (!isNaN(assignTs) && !isNaN(chatTs) && chatTs > assignTs) {
              const respHrs = (chatTs - assignTs) / (1000 * 60 * 60);
              officerMap[officer].responseTimes.push(respHrs);
            } else {
              // Chat exists but predates this officer's latest assignment — use fallback
              tryFallbackFromLastAssignment();
            }
          } else {
            // No matching assignment found before chat — use fallback based on latest assignment
            tryFallbackFromLastAssignment();
          }
        } else {
          // No chat event at all — use fallback based on latest assignment
          tryFallbackFromLastAssignment();
        }

        // Resolution Time: most recent Admin Assigned to this officer before Case Resolved/Closed
        if (status === "resolved" || status === "closed") {
          const resolveEvt = sorted.find((evt) =>
            evt.actionTitle === "Case Resolved" ||
            evt.actionTitle === "Case Closed" 
          );
          if (resolveEvt) {
            const resolveTs = Date.parse(resolveEvt.createdAt);
            const assigns = sorted.filter(
              (evt) => matchesAssignmentToOfficer(evt) && Date.parse(evt.createdAt) < resolveTs
            );
            const lastAssign = assigns[assigns.length - 1];
            if (lastAssign) {
              const assignTs = Date.parse(lastAssign.createdAt);
              if (!isNaN(assignTs) && !isNaN(resolveTs) && resolveTs > assignTs) {
                officerMap[officer].resolutionTimes.push((resolveTs - assignTs) / (1000 * 60 * 60));
              }
            }
          }
        }
      }
    });
    // Filter out Unassigned and get staff names for chart
    const officerIds = Object.keys(officerMap).filter(o => o !== "Unassigned");
    const officersWithNames = officerIds.map(id => {
      const name = officerOptions.find((o) => String(o._id) === String(id))?.name || id;
      return { id, name };
    }).slice(0, 5);
    
    const officers = officersWithNames.map(o => o.name);
    const resolutionRates = officersWithNames.map((o) =>
      Math.round(
        (officerMap[o.id].resolved / Math.max(1, officerMap[o.id].total)) * 100
      )
    );
    const avgResponseTimes = officersWithNames.map((o) => {
      const arr = officerMap[o.id].responseTimes;
      if (!arr || arr.length === 0) return 0;
      const s = arr.reduce((a, b) => a + b, 0);
      return Math.round((s / arr.length) * 10) / 10;
    });
    const avgResolutionTimes = officersWithNames.map((o) => {
      const arr = officerMap[o.id].resolutionTimes;
      if (!arr || arr.length === 0) return 0;
      const s = arr.reduce((a, b) => a + b, 0);
      return Math.round((s / arr.length) * 10) / 10;
    });
    if (performanceChartRef.current) {
      const chart = echarts.getInstanceByDom(performanceChartRef.current);
      chart?.setOption({
        xAxis: [{ data: officers }],
        series: [
          { name: "Resolution Rate (%)", data: resolutionRates },
          { name: "Avg Response Time (hrs)", data: avgResponseTimes },
          { name: "Avg Resolution Time (hrs)", data: avgResolutionTimes },
        ],
      });
    }
  };
  
  // UI helpers: quick date presets and active filter chips
  // Derived values for filter options
  const blocks = blockOptions;
  const categories = categoryOptions;
  const officers = officerOptions;
  const filteredRooms = selectedBlock && selectedBlock !== "all" ? roomOptions : [];

  const handleQuickDate = (preset) => {
    const today = new Date();
    let from, to;
    
     if (preset === 'today') {
       from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
       to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
     } else if (preset === 'thisMonth') {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'thisYear') {
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear(), 11, 31);
    } else {
      // preset is number of days
      const days = parseInt(preset);
      to = new Date();
      from = new Date();
      from.setDate(from.getDate() - days);
    }
    
    setDateRange({
      from: formatDate(from),
      to: formatDate(to)
    });
    setHasCustomDateRange(true);
    setSelectedPreset(preset);
  };

  // Ensure date range is valid (no future dates, from <= to)
  const handleDateChange = (key, value) => {
    const todayStr = formatDate(new Date());
    let nextFrom = key === 'from' ? value : dateRange.from;
    let nextTo = key === 'to' ? value : dateRange.to;

    // Clamp to today (no future dates)
    if (nextFrom && nextFrom > todayStr) nextFrom = todayStr;
    if (nextTo && nextTo > todayStr) nextTo = todayStr;

    // Keep range ordered
    if (nextFrom && nextTo && nextFrom > nextTo) {
      if (key === 'from') {
        nextTo = nextFrom;
      } else {
        nextFrom = nextTo;
      }
    }

    setDateRange({ from: nextFrom, to: nextTo });
    setHasCustomDateRange(true);
    setSelectedPreset(null);
  };

  const clearFilter = (key) => {
    switch (key) {
      case "date":
      case "dateRange":
        setDateRange(getDefaultDateRange());
        setHasCustomDateRange(false);
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

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    summary: true,
    statusDistribution: true,
    charts: true,
    performance: true,
    filename: `Analytics_Report_${new Date().toISOString().split("T")[0]}`,
    orientation: "portrait",
  });
  const [isExporting, setIsExporting] = useState(false);
  const exportToPDF = () => {
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = () => {
    try {
      setIsExporting(true);
      setIsExportModalOpen(false);

      // Collect chart images
      const trendChartImage = getChartImage(trendChartRef);
      const performanceChartImage = getChartImage(performanceChartRef);

      // Build filter object
      const filterData = {
        Category: selectedCategory !== 'all' ? selectedCategory : 'All Categories',
        Block: selectedBlock !== 'all' ? selectedBlock : 'All Blocks',
        Room: selectedRoom !== 'all' ? selectedRoom : 'All Rooms',
        Status: selectedStatus || 'All Status',
        Priority: selectedPriority || 'All Priorities',
        'Assigned To': selectedOfficer !== 'all' ? officerOptions.find(o => o.value === selectedOfficer)?.label || selectedOfficer : 'All Officers'
      };

      // Call the modular analytics PDF generator
      generateAnalyticsPDF(
        {
          orientation: exportSettings.orientation,
          include: {
            summary: exportSettings.summary,
            statusDistribution: exportSettings.statusDistribution,
            charts: exportSettings.charts,
            performance: exportSettings.performance,
          },
          filename: buildFileName(exportSettings.filename || 'analytics-report')
        },
        dateRange,
        filterData,
        complaints,
        metrics,
        locationStats,
        officerStats,
        feedbackMetrics,
        trendChartImage,
        performanceChartImage
      );
    } catch (e) {
      console.error('PDF export failed', e);
      alert('Failed to generate PDF: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };


  // ============================================================================
  // COMPUTED METRICS (useMemo)
  // ============================================================================
  
  // Calculate summary metrics (total, resolved, in-progress, open, closed, resolution rate)
  const metrics = useMemo(() => {
    const total = complaints?.length || 0;
    const resolved =
      complaints?.filter((c) => {
        const s = (c.status || "").toLowerCase();
        return s === "resolved";
      }).length || 0;
    const closed =
      complaints?.filter((c) => {
        const s = (c.status || "").toLowerCase();
        return s === "closed";
      }).length || 0;
    const inProgress =
      complaints?.filter((c) => {
        const s = (c.status || "").toLowerCase();
        return (
          s === "inprogress" ||
          s === "in progress" 
        );
      }).length || 0;
    const open = Math.max(0, total - resolved - inProgress - closed);
    const resolutionRate = total
      ? Math.round((resolved / total) * 1000) / 10
      : 0; // one decimal
    return { total, resolved, closed, inProgress, open, resolutionRate };
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


  const feedbackComplaints = useMemo(() => {
    const withFeedback = (complaints || []).filter(
      (c) => c.isFeedbackProvided === true && c.feedback && (c.feedback.q1Rating || c.feedback.q2Rating || c.feedback.overallComment)
    );

    return withFeedback;
  }, [complaints]);

  // AI-powered feedback analysis function
  const analyzeFeedbackAI = async (complaints) => {
    try {
      console.log('[AI Analysis] Starting analysis for', complaints.length, 'complaints');
      setAiThemeMetrics((prev) => ({ ...prev, isAnalyzing: true }));

      // Extract feedback comments
      const texts = complaints
        .map((c) => (c.feedback?.overallComment || '').trim())
        .filter((t) => t.length > 0);

      if (texts.length === 0) {
        console.log('[AI Analysis] No comments to analyze');
        setAiThemeMetrics({
          effectiveSolution: 0,
          ineffectiveSolution: 0,
          fastResponse: 0,
          slowResponse: 0,
          politeStaff: 0,
          rudeStaff: 0,
          total: 0,
          isAnalyzing: false,
        });
        return;
      }

      // Initialize zero-shot classification pipeline (mobile-size model for browser)
      const classifier = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');

      // Admin Performance Labels with natural language hypotheses for better alignment
      const candidateLabels = [
        'Effective Solution',
        'Ineffective Solution',
        'Fast Response',
        'Slow Response',
        'Polite Staff',
        'Rude Staff',
      ];

      const HINT_BOOST = 0.25; // manual nudge when clear keywords appear
      const MIN_CONFIDENCE = 0.35; // require this confidence to count
      const counts = {
        effectiveSolution: 0,
        ineffectiveSolution: 0,
        fastResponse: 0,
        slowResponse: 0,
        politeStaff: 0,
        rudeStaff: 0,
      };

      // Basic heuristic hints to help disambiguate short / slang comments
      const slowRegex = /(slow|late|delay|wait|waiting)/i;
      const fastRegex = /(fast|quick|prompt)/i;
      const rudeRegex = /(rude|laji|lanjiao|shitty|useless|annoying|impolite|lapsap)/i;
      const politeRegex = /(polite|friendly|helpful|kind|respectful)/i;
      const ineffectiveRegex = /(ineffective|no help|not help|useless|did nothing|didnt fix|not fix|no solution)/i;

      for (const text of texts) {
        const result = await classifier(text, candidateLabels, {
          multi_label: true,
          hypothesis_template: 'This feedback is about {label}.',
        });

        // Convert scores to a mutable map so we can nudge with heuristics
        const scores = {};
        result.labels.forEach((lbl, idx) => {
          scores[lbl] = result.scores[idx];
        });

        // Heuristic boosts for extremely short / slang-heavy comments
        if (slowRegex.test(text)) scores['Slow Response'] = (scores['Slow Response'] || 0) + HINT_BOOST;
        if (fastRegex.test(text)) scores['Fast Response'] = (scores['Fast Response'] || 0) + HINT_BOOST;
        if (rudeRegex.test(text)) scores['Rude Staff'] = (scores['Rude Staff'] || 0) + HINT_BOOST;
        if (politeRegex.test(text)) scores['Polite Staff'] = (scores['Polite Staff'] || 0) + HINT_BOOST;
        if (ineffectiveRegex.test(text)) scores['Ineffective Solution'] = (scores['Ineffective Solution'] || 0) + HINT_BOOST;

        // Pick the label with the highest adjusted score
        let bestLabel = null;
        let bestScore = 0;
        Object.entries(scores).forEach(([lbl, sc]) => {
          if (sc > bestScore) {
            bestLabel = lbl;
            bestScore = sc;
          }
        });

        if (bestLabel && bestScore >= MIN_CONFIDENCE) {
          switch (bestLabel) {
            case 'Effective Solution':
              counts.effectiveSolution++;
              break;
            case 'Ineffective Solution':
              counts.ineffectiveSolution++;
              break;
            case 'Fast Response':
              counts.fastResponse++;
              break;
            case 'Slow Response':
              counts.slowResponse++;
              break;
            case 'Polite Staff':
              counts.politeStaff++;
              break;
            case 'Rude Staff':
              counts.rudeStaff++;
              break;
            default:
              break;
          }
        } else {
          console.log('[AI Analysis] Comment fell below confidence threshold:', { text, bestLabel, bestScore });
        }
      }

      console.log('[AI Analysis] Classification complete:', counts);

      setAiThemeMetrics({
        ...counts,
        total: texts.length,
        isAnalyzing: false,
      });
    } catch (error) {
      console.error('[AI Analysis] Error:', error);
      setAiThemeMetrics((prev) => ({ ...prev, isAnalyzing: false }));
    }
  };
  
  // Run AI analysis when feedbackComplaints changes
  useEffect(() => {
    if (feedbackComplaints && feedbackComplaints.length > 0) {
      analyzeFeedbackAI(feedbackComplaints);
    } else {
      setAiThemeMetrics({
        effectiveSolution: 0,
        ineffectiveSolution: 0,
        fastResponse: 0,
        slowResponse: 0,
        politeStaff: 0,
        rudeStaff: 0,
        total: 0,
        isAnalyzing: false
      });
    }
  }, [feedbackComplaints]);

  const themeMetrics = useMemo(() => {
    console.log('[Theme Analysis] Processing', feedbackComplaints.length, 'feedback complaints');
    const texts = feedbackComplaints
      .map(c => (c.feedback?.overallComment || '').trim())
      .filter(t => t.length > 0);
    console.log('[Theme Analysis] Comments to analyze:', texts.length);
    if (!texts.length) {
      console.log('[Theme Analysis] No comments found, returning empty metrics');
      return { positive: [], improvement: [], recent: [], topPhrases: [] };
    }
    const stop = new Set(['the','and','a','to','of','in','is','it','for','on','at','with','this','that','was','are','be','an','as','by','or','we','i','you','they','but','from','have','has','had','were','not','more','less']);
    const positiveKeywords = ['quick','fast','helpful','professional','clear','responsive','friendly','timely','efficient','resolved','resolution','transparent'];
    const improvementKeywords = ['slow','delayed','unclear','confusing','late','no','lack','status','update','updates','response','detail','details','waiting','wait'];
    const freq = {};
    const nowTs = Date.now();
    const recentWindowMs = 7 * 24 * 60 * 60 * 1000;
    const recentSet = new Set();
    texts.forEach((t, idx) => {
      const cleaned = t.toLowerCase().replace(/[^a-z0-9\s]/g,' ');
      const tokens = cleaned.split(/\s+/).filter(w => w && !stop.has(w));
      // single word frequency
      tokens.forEach(w => { freq[w] = (freq[w]||0)+1; });
      // bi-grams for phrase context
      for (let i=0;i<tokens.length-1;i++) {
        const bi = tokens[i] + ' ' + tokens[i+1];
        freq[bi] = (freq[bi]||0)+1;
      }
      // mark recent phrases if complaint updated recently
      const comp = feedbackComplaints[idx];
      const ts = Date.parse(comp.feedback?.updatedAt || comp.feedback?.createdAt || comp.updatedAt || comp.createdAt || 0);
      if (!isNaN(ts) && (nowTs - ts) <= recentWindowMs) {
        tokens.slice(0,5).forEach(w => recentSet.add(w));
      }
    });
    const toArray = (keywords, label) => {
      const out = [];
      keywords.forEach(k => {
        // consider both keyword and its common bigram forms
        const candidates = Object.keys(freq).filter(fk => fk.includes(k));
        let total = 0;
        candidates.forEach(c => { total += freq[c]; });
        if (total > 0) out.push({ theme: k, count: total });
      });
      out.sort((a,b)=> b.count - a.count);
      return out.slice(0,6);
    };
    const positive = toArray(positiveKeywords,'positive');
    const improvement = toArray(improvementKeywords,'improvement');
    const recent = Array.from(recentSet).map(w => ({ theme: w, count: freq[w]||1 })).sort((a,b)=> b.count - a.count).slice(0,6);
    // top phrases (bi-grams prioritized)
    const topPhrases = Object.keys(freq)
      .filter(k => k.includes(' '))
      .map(k => ({ phrase: k, count: freq[k] }))
      .sort((a,b)=> b.count - a.count)
      .slice(0,5);
    console.log('[Theme Analysis] Positive themes:', positive);
    console.log('[Theme Analysis] Improvement themes:', improvement);
    console.log('[Theme Analysis] Recent themes:', recent);
    console.log('[Theme Analysis] Top phrases:', topPhrases);
    // Normalize casing to Title Case for consistent presentation (keep numeric parts intact)
    const titleCase = (s) => s.split(' ').map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : part).join(' ');
    const normalizeThemes = (arr) => arr.map(obj => ({ ...obj, theme: titleCase(obj.theme) }));
    const normalizePhrases = (arr) => arr.map(obj => ({ ...obj, phrase: titleCase(obj.phrase) }));
    return { 
      positive: normalizeThemes(positive), 
      improvement: normalizeThemes(improvement), 
      recent: normalizeThemes(recent), 
      topPhrases: normalizePhrases(topPhrases) 
    };
  }, [feedbackComplaints]);

  // Compute feedback-derived metrics strictly from feedbackComplaints
  const feedbackMetrics = useMemo(() => {
    const q1Values = [];
    const q2Values = [];
    feedbackComplaints.forEach((c) => {
      const q1 = Number(c.feedback.q1Rating);
      const q2 = Number(c.feedback.q2Rating);
      if (!isNaN(q1) && q1 > 0) q1Values.push(Math.max(1, Math.min(5, Math.round(q1))));
      if (!isNaN(q2) && q2 > 0) q2Values.push(Math.max(1, Math.min(5, Math.round(q2))));
    });

    const distQ1 = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    q1Values.forEach((v) => (distQ1[v] = (distQ1[v] || 0) + 1));
    const count = feedbackComplaints.length;
    const avgQ1 = q1Values.length ? Math.round((q1Values.reduce((a, b) => a + b, 0) / q1Values.length) * 10) / 10 : null;
    const avgQ2 = q2Values.length ? Math.round((q2Values.reduce((a, b) => a + b, 0) / q2Values.length) * 10) / 10 : null;
    const avgOverall = avgQ1 != null && avgQ2 != null ? Math.round(((avgQ1 + avgQ2) / 2) * 10) / 10 : (avgQ1 ?? avgQ2);

    const pct = (n) => (q1Values.length ? Math.round((n / q1Values.length) * 1000) / 10 : 0);
    const entries = feedbackComplaints
      .slice()
      .sort((a, b) => {
        const ta = Date.parse(a.feedback.updatedAt || a.feedback.createdAt || a.updatedAt || a.createdAt || 0);
        const tb = Date.parse(b.feedback.updatedAt || b.feedback.createdAt || b.updatedAt || b.createdAt || 0);
        return tb - ta;
      });
    return { entries, count, avgQ1, avgQ2, avgOverall, distQ1, pct };
  }, [feedbackComplaints]);

  // Compute officer performance stats from complaints (used to render performance table)
  const officerStats = useMemo(() => {
    const map = {};
    
    // Initialize all officers from officerOptions with zero values
    officerOptions.forEach((officer) => {
      map[officer._id] = { name: officer.name, total: 0, resolved: 0, responseTimes: [], resolutionTimes: [], sats: [] };
    });
    
    // Process complaints and update officer stats
    (complaints || []).forEach((c) => {
      const officerKey = c.adminId;
      
      // Only process if officer is assigned (not Unassigned or null)
      if (officerKey && officerKey !== "null") {
        if (!map[officerKey]) {
          map[officerKey] = { name: c.adminName || "Unknown", total: 0, resolved: 0, responseTimes: [], resolutionTimes: [], sats: [] };
        }

        map[officerKey].total += 1;
        const s = (c.status || "").toString().toLowerCase();
        if (s === "resolved" || s === "closed") map[officerKey].resolved += 1;

        // Calculate Response Time and Resolution Time using reportHistories
        if (c.reportHistories && Array.isArray(c.reportHistories)) {
          
          // Sort events by createdAt ascending to find most recent assignment before acknowledgment
          const sortedEvents = [...c.reportHistories].sort((a, b) => 
            Date.parse(a.createdAt) - Date.parse(b.createdAt)
          );
          
          // Calculate Response Time: from "Admin Assigned" to "Report Acknowledged"
          // Find the "Report Acknowledged" event in the timeline
          const acknowledgedEvent = sortedEvents.find(evt => 
            evt.actionTitle === "Report Acknowledged"
          );
          
          if (acknowledgedEvent) {
            const acknowledgedTime = Date.parse(acknowledgedEvent.createdAt);
            if (!isNaN(acknowledgedTime)) {
              // Find the most recent "Admin Assigned" event before the acknowledgment time
              const assignedEvents = sortedEvents.filter(evt => 
                evt.actionTitle === "Admin Assigned" && 
                Date.parse(evt.createdAt) < acknowledgedTime
              );
              const mostRecentAssignment = assignedEvents[assignedEvents.length - 1];
              
              if (mostRecentAssignment) {
                const assignedTime = Date.parse(mostRecentAssignment.createdAt);
                if (!isNaN(assignedTime) && acknowledgedTime > assignedTime) {
                  const responseHrs = (acknowledgedTime - assignedTime) / (1000 * 60 * 60);
                  map[officerKey].responseTimes.push(responseHrs);
                } else {
                  console.log('[Officer Stats][Response] Skipped due to invalid/ordered times', {
                    officer: map[officerKey]?.name,
                    assignedTime: assignedTime ? new Date(assignedTime).toISOString() : assignedTime,
                    acknowledgedTime: acknowledgedEvent.createdAt,
                    validAssignedTime: !isNaN(assignedTime),
                    acknowledgedAfterAssigned: acknowledgedTime > assignedTime
                  });
                }
              }
            }
          } else {
            const hasAssignments = sortedEvents.some(evt => evt.actionTitle === "Admin Assigned");
            if (hasAssignments) {
              console.log('[Officer Stats][Response] No "Report Acknowledged" event found', {
                officer: map[officerKey]?.name,
                reportId: c._id,
                adminAssignedCount: sortedEvents.filter(evt => evt.actionTitle === 'Admin Assigned').length,
                historySample: sortedEvents.slice(0, 3).map(evt => ({ actionTitle: evt.actionTitle, createdAt: evt.createdAt }))
              });
            }
          }

          // Calculate Resolution Time: from most recent "Admin Assigned" to "Case Resolved"
          // This handles both cases: with or without chatroom interaction
          if (s === "resolved" || s === "closed") {
    
            
            const resolvedEvent = sortedEvents.find(evt => {
              if (!evt.actionTitle) return false;
              const actionLower = evt.actionTitle.toLowerCase();
              return actionLower.includes("resolved") || 
                     actionLower.includes("closed") ||
                     evt.actionTitle === "Case Resolved" ||
                     evt.actionTitle === "Case Closed";
            });
            
            
            if (resolvedEvent) {
              const resolvedTime = Date.parse(resolvedEvent.createdAt);
              if (!isNaN(resolvedTime)) {
                // Find the most recent "Admin Assigned" event before the resolved event
                const assignedEvents = sortedEvents.filter(evt => 
                  evt.actionTitle === "Admin Assigned" && 
                  Date.parse(evt.createdAt) < resolvedTime
                );
                
                
                const mostRecentAssignment = assignedEvents[assignedEvents.length - 1];
                
                if (mostRecentAssignment) {
                  const assignedTime = Date.parse(mostRecentAssignment.createdAt);
                  if (!isNaN(assignedTime) && resolvedTime > assignedTime) {
                    const resolutionHrs = (resolvedTime - assignedTime) / (1000 * 60 * 60);
                    
                    map[officerKey].resolutionTimes.push(resolutionHrs);
                    console.log(`[Resolution Time] ✓ Added for ${map[officerKey]?.name}:`, {
                      reportId: c._id,
                      hours: resolutionHrs.toFixed(2),
                      from: mostRecentAssignment.createdAt,
                      to: resolvedEvent.createdAt,
                      totalResolutionTimesNow: map[officerKey].resolutionTimes.length
                    });
                  } else {
                    console.log(`[Resolution Time] ✗ Invalid times:`, {
                      assignedTime: new Date(assignedTime).toISOString(),
                      resolvedTime: new Date(resolvedTime).toISOString(),
                      validAssignedTime: !isNaN(assignedTime),
                      resolvedAfterAssigned: resolvedTime > assignedTime
                    });
                  }
                } else {
                  console.log(`[Resolution Time] ✗ No assignment event found before resolution`);
                }
              } else {
                console.log(`[Resolution Time] ✗ Invalid resolved time:`, resolvedEvent.createdAt);
              }
            }
          }
        }

        // Calculate Satisfaction: average of (q1Rating + q2Rating) / 2
        if (c.feedback && c.isFeedbackProvided === true) {
          const q1 = Number(c.feedback.q1Rating);
          const q2 = Number(c.feedback.q2Rating);
          if (!isNaN(q1) && !isNaN(q2) && q1 > 0 && q2 > 0) {
            const avgFeedback = (q1 + q2) / 2;
            map[officerKey].sats.push(Math.max(1, Math.min(5, avgFeedback)));
          }
        }
      }
    });

    // Create list from all officers seen in options or complaints (including those with 0 cases)
    const list = Object.entries(map).map(([id, item]) => {
      const resolutionRate = item.total > 0 ? Math.round((item.resolved / item.total) * 1000) / 10 : 0;
      const avgResponseTime = item.responseTimes.length ? Math.round((item.responseTimes.reduce((a, b) => a + b, 0) / item.responseTimes.length) * 100) / 100 : 0;
      const resolutionTimeSum = item.resolutionTimes.reduce((a, b) => a + b, 0);
      const avgResolutionTime = item.resolutionTimes.length ? Math.round((resolutionTimeSum / item.resolutionTimes.length) * 100) / 100 : 0;
      const avgSat = item.sats.length ? Math.round((item.sats.reduce((a, b) => a + b, 0) / item.sats.length) * 10) / 10 : null;
      
      if (item.total > 0 && item.responseTimes.length === 0) {
        console.log(`[Officer Stats][Response] No response times`, {
          officer: item.name,
          totalCases: item.total,
          acknowledgedEventsSeen: map[id]?.responseTimes?.length || 0,
          hasReportHistories: map[id] ? 'unknown in this scope' : 'unknown'
        });
      }

      if (item.responseTimes.length > 0) {
        const sumResponse = item.responseTimes.reduce((a, b) => a + b, 0);
        const rawAvg = sumResponse / item.responseTimes.length;
        console.log(`[Officer Stats][Response] ${item.name}:`, {
          responseTimesCount: item.responseTimes.length,
          responseTimesHours: item.responseTimes.map(t => t.toFixed(2)),
          sumHours: sumResponse.toFixed(4),
          rawAverage: rawAvg.toFixed(4),
          avgResponseTime
        });
      }

      if (item.resolutionTimes.length > 0) {
        console.log(`[Officer Stats] ${item.name}:`, {
          total: item.total,
          resolved: item.resolved,
          resolutionTimesCount: item.resolutionTimes.length,
          resolutionTimes: item.resolutionTimes.map(t => t.toFixed(2)),
          avgResolutionTime: avgResolutionTime,
          avgResolutionDays: (avgResolutionTime / 24).toFixed(2)
        });
      }
      
      return {
        id,
        name: item.name || "Unknown",
        total: item.total,
        resolved: item.resolved,
        resolutionRate,
        avgResponseTime,
        avgResolutionTime,
        resolutionTimeSum,
        avgSat,
      };
    });
    
    // Sort by total cases (descending), but keep all officers
    list.sort((a, b) => b.total - a.total);
    
    // Team averages (only count officers with cases)
    const officersWithCases = list.filter(o => o.total > 0);
    const totals = officersWithCases.reduce((acc, it) => ({ 
      total: acc.total + it.total, 
      resolved: acc.resolved + it.resolved, 
      responseTimeSum: acc.responseTimeSum + (it.avgResponseTime * it.total), 
      resolutionTimeSum: acc.resolutionTimeSum + it.resolutionTimeSum, 
      satSum: acc.satSum + ((it.avgSat || 0) * it.total) 
    }), { total: 0, resolved: 0, responseTimeSum: 0, resolutionTimeSum: 0, satSum: 0 });
    
    console.log('[Team Averages] Totals:', {
      officersWithCases: officersWithCases.length,
      totalCases: totals.total,
      resolvedCases: totals.resolved,
      responseTimeSum: totals.responseTimeSum.toFixed(2),
      resolutionTimeSum: totals.resolutionTimeSum.toFixed(2),
      avgResolutionTime: totals.total ? (totals.resolutionTimeSum / totals.total).toFixed(2) : 0
    });
    
    const teamAvg = {
      total: totals.total && officersWithCases.length ? Math.round((totals.total / officersWithCases.length) * 10) / 10 : 0,
      resolved: Math.round(totals.resolved),
      resolutionRate: totals.total ? Math.round((totals.resolved / totals.total) * 1000) / 10 : 0,
      avgResponseTime: totals.total ? Math.round((totals.responseTimeSum / totals.total) * 100) / 100 : 0,
      avgResolutionTime: totals.total ? Math.round((totals.resolutionTimeSum / totals.total) * 100) / 100 : 0,
      avgSat: totals.total ? Math.round((totals.satSum / totals.total) * 10) / 10 : null,
    };
    
    console.log('[Team Averages] Final:', {
      avgResolutionTime: teamAvg.avgResolutionTime,
      avgResponseTime: teamAvg.avgResponseTime,
      resolutionRate: teamAvg.resolutionRate
    });
    
    return { list, teamAvg };
  }, [complaints, officerOptions]);

  // Location statistics - faculties, blocks, and rooms with complaint counts
  const locationStats = useMemo(() => {
    const facultyMap = {};
    const blockMap = {};
    const roomMap = {};

    // Get user's faculty
    const userFaculty = user?.facultyLocation?.faculty || user?.facultyLocation?.facultyName || null;

    complaints.forEach((c) => {
      const faculty = c.facultyLocation?.faculty || c.facultyLocation?.facultyName || 'Unknown';
      const block = c.facultyLocation?.facultyBlock || c.facultyLocation?.block || 'Unknown';
      const room = c.facultyLocation?.facultyBlockRoom || c.facultyLocation?.room || 'Unknown';
      const status = String(c.status || '').toLowerCase();

      // Filter: only process complaints from user's faculty
      if (userFaculty && faculty !== userFaculty) {
        return;
      }

      // Normalize status to handle variations (Opened/Open, InProgress/In Progress, etc.)
      const isOpen = status === 'open' || status === 'opened' || status === 'pending';
      const isInProgress = status === 'in progress' || status === 'inprogress' || status === 'in-progress';
      const isResolved = status === 'resolved' || status === 'completed';
      const isClosed = status === 'closed';

      // Faculty stats
      if (!facultyMap[faculty]) {
        facultyMap[faculty] = { name: faculty, total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
      }
      facultyMap[faculty].total += 1;
      if (isOpen) facultyMap[faculty].open += 1;
      else if (isInProgress) facultyMap[faculty].inProgress += 1;
      else if (isResolved) facultyMap[faculty].resolved += 1;
      else if (isClosed) facultyMap[faculty].closed += 1;

      // Block stats
      const blockKey = `${faculty}|${block}`;
      if (!blockMap[blockKey]) {
        blockMap[blockKey] = { faculty, block, total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
      }
      blockMap[blockKey].total += 1;
      if (isOpen) blockMap[blockKey].open += 1;
      else if (isInProgress) blockMap[blockKey].inProgress += 1;
      else if (isResolved) blockMap[blockKey].resolved += 1;
      else if (isClosed) blockMap[blockKey].closed += 1;

      // Room stats
      const roomKey = `${faculty}|${block}|${room}`;
      if (!roomMap[roomKey]) {
        roomMap[roomKey] = { faculty, block, room, total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
      }
      roomMap[roomKey].total += 1;
      if (isOpen) roomMap[roomKey].open += 1;
      else if (isInProgress) roomMap[roomKey].inProgress += 1;
      else if (isResolved) roomMap[roomKey].resolved += 1;
      else if (isClosed) roomMap[roomKey].closed += 1;
    });

    return {
      faculties: Object.values(facultyMap).sort((a, b) => b.total - a.total),
      blocks: Object.values(blockMap).sort((a, b) => b.total - a.total),
      rooms: Object.values(roomMap).sort((a, b) => b.total - a.total),
    };
  }, [complaints, user]);

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
    return formatDMY(iso);
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

  // When switching to Performance tab, re-initialize and populate performance chart
  useEffect(() => {
    if (activeTab === 'performance' && complaints && complaints.length) {
      const timer = setTimeout(() => {
        try {
          if (performanceChartRef.current) {
            let chart = echarts.getInstanceByDom(performanceChartRef.current);
            if (!chart) chart = echarts.init(performanceChartRef.current);
            chart.resize();
          }
          // Re-populate performance chart with current data
          updateChartsWithData(complaints);
        } catch (err) {
          console.warn('[Analytics] Error re-initializing performance chart:', err);
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
      {/* Initial Loading Overlay */}
      {isLoading && <LoadingOverlay />}
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
                  Visualize and analyze complaint data - {formatDMY(new Date())}
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

            {/* Floating Filter Toggle Button */}
            {isFilterCollapsed && (
              <button
                onClick={() => setIsFilterCollapsed(false)}
                className="fixed top-24 right-6 z-40 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Open filters"
              >
                <FontAwesomeIcon icon={faFilter} className="text-lg" />
              </button>
            )}

            {/* Filter Drawer Backdrop */}
            {!isFilterCollapsed && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={() => setIsFilterCollapsed(true)}
                aria-hidden="true"
              />
            )}

            {/* Filter Section - Right Side Drawer */}
            <div
              className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                isFilterCollapsed ? 'translate-x-full' : 'translate-x-0'
              }`}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-5 z-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FontAwesomeIcon icon={faFilter} className="text-blue-600" />
                      Filter Analytics
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Refine your data view</p>
                  </div>
                  <button
                    onClick={() => setIsFilterCollapsed(true)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer transition-colors"
                    aria-label="Close filters"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xl" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-6">
                  {/* Date Range - top priority */}
                  <section className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600" />
                      Date Range
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">Quick presets:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => handleQuickDate('today')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          selectedPreset === 'today'
                            ? 'bg-blue-600 text-white border-2 border-blue-800 font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => handleQuickDate(7)}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          selectedPreset === 7
                            ? 'bg-blue-600 text-white border-2 border-blue-800 font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        Last 7 Days
                      </button>
                      <button
                        onClick={() => handleQuickDate(30)}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          selectedPreset === 30
                            ? 'bg-blue-600 text-white border-2 border-blue-800 font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        Last 30 Days
                      </button>
                      <button
                        onClick={() => handleQuickDate('thisMonth')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          selectedPreset === 'thisMonth'
                            ? 'bg-blue-600 text-white border-2 border-blue-800 font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        This Month
                      </button>
                      <button
                        onClick={() => handleQuickDate('thisYear')}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                          selectedPreset === 'thisYear'
                            ? 'bg-blue-600 text-white border-2 border-blue-800 font-semibold'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                      >
                        This Year
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">From</label>
                        <input
                          type="date"
                          value={dateRange.from}
                          max={dateRange.to || formatDate(new Date())}
                          onChange={(e) => handleDateChange('from', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">To</label>
                        <input
                          type="date"
                          value={dateRange.to}
                          min={dateRange.from || undefined}
                          max={formatDate(new Date())}
                          onChange={(e) => handleDateChange('to', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Location */}
                  <section className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600" />
                      Location
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Block</label>
                        <select
                          value={selectedBlock}
                          onChange={(e) => {
                            setSelectedBlock(e.target.value);
                            setSelectedRoom('');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        >
                          <option value="">All Blocks</option>
                          {blocks.map((block) => (
                            <option key={block} value={block}>
                              {block}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Room</label>
                        <select
                          value={selectedRoom}
                          onChange={(e) => setSelectedRoom(e.target.value)}
                          disabled={!selectedBlock}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="">All Rooms</option>
                          {filteredRooms.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                        {!selectedBlock && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            Select a block to choose rooms
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Complaint Details */}
                  <section className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faClipboardList} className="text-blue-600" />
                      Complaint Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        >
                          <option value="all">All Categories</option>
                          {categories && categories.length > 0 ? (
                            categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))
                          ) : (
                            <option disabled>No categories available</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        >
                          <option value="">All Statuses</option>
                          <option value="opened">Opened</option>
                          <option value="inprogress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Priority</label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        >
                          <option value="">All Priorities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Assigned Officer</label>
                        <select
                          value={selectedOfficer}
                          onChange={(e) => setSelectedOfficer(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                        >
                          <option value="all">All Officers</option>
                          {officers && officers.length > 0 ? (
                            officers.map((officer) => (
                              <option key={officer._id} value={officer._id}>
                                {officer.name}
                              </option>
                            ))
                          ) : (
                            <option disabled>No officers available</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Applied Filters */}
                  <section className="border-b border-gray-200 pb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FontAwesomeIcon icon={faTags} className="text-blue-600" />
                      Applied Filters
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {hasCustomDateRange && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                          {dateRange.from} to {dateRange.to}
                          <button
                            onClick={() => clearFilter('dateRange')}
                            className="hover:text-blue-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {selectedCategory && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                          {selectedCategory}
                          <button
                            onClick={() => clearFilter('category')}
                            className="hover:text-purple-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {selectedBlock && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                          Block: {selectedBlock}
                          <button
                            onClick={() => clearFilter('block')}
                            className="hover:text-green-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {selectedRoom && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-md text-xs font-medium">
                          Room: {selectedRoom}
                          <button
                            onClick={() => clearFilter('room')}
                            className="hover:text-teal-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {selectedStatus && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium">
                          Status: {selectedStatus}
                          <button
                            onClick={() => clearFilter('status')}
                            className="hover:text-yellow-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {selectedPriority && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
                          Priority: {selectedPriority}
                          <button
                            onClick={() => clearFilter('priority')}
                            className="hover:text-red-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {selectedOfficer && selectedOfficer !== "all" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                          Officer: {officers.find((o) => o._id === selectedOfficer)?.name || selectedOfficer}
                          <button
                            onClick={() => clearFilter('officer')}
                            className="hover:text-indigo-900 cursor-pointer"
                          >
                            
                          </button>
                        </span>
                      )}
                      {!hasCustomDateRange &&
                        !selectedCategory &&
                        !selectedBlock &&
                        !selectedRoom &&
                        !selectedStatus &&
                        !selectedPriority &&
                        !selectedOfficer && (
                          <p className="text-xs text-gray-500">No filters applied</p>
                        )}
                    </div>
                  </section>
                </div>
              </div>

              {/* Action Area - Sticky Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <button
                  onClick={resetFilters}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm focus:outline-none cursor-pointer transition-colors"
                >
                  <FontAwesomeIcon icon={faUndo} className="mr-2" />
                  Reset All Filters
                </button>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="p-4 border-b border-gray-200">
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
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                    Locations
                  </button>
                  <button
                    onClick={() => setActiveTab("students")}
                    className={`!rounded-button whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${
                      activeTab === "students"
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
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
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-gray-100 p-3">
                        <FontAwesomeIcon icon={faDoorClosed} className="text-gray-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Closed
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          {metrics.closed}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">
                        {metrics.total
                          ? Math.round((metrics.closed / metrics.total) * 1000) /
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
                <div className="grid grid-cols-1 gap-6 mb-6">
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
                {!hasData || complaints.length === 0 ? (
                  <div className="text-center py-20">
                    <FontAwesomeIcon icon={faChartLine} className="text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No data available for the selected filters</p>
                  </div>
                ) : (
                  <>
                    <div ref={trendChartLargeRef} className="w-full" style={{ height: "600px" }}></div>
                  </>
                )}
              </div>
            )}
            {activeTab === "locations" && (
              <>
                {/* Location Analysis Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Location-Based Complaint Analysis</h3>
                  <p className="text-sm text-gray-600">Analysis of complaints by block and room locations in your faculty</p>
                </div>

                {/* Blocks */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faLayerGroup} className="mr-2 text-purple-600" />
                    Blocks by Complaint Volume
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Distribution</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {locationStats.blocks.slice(0, 10).map((block, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">#{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{block.faculty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{block.block}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{block.total}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex space-x-2">
                                {block.open > 0 && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Open: {block.open}</span>}
                                {block.inProgress > 0 && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Progress: {block.inProgress}</span>}
                                {block.resolved > 0 && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Resolved: {block.resolved}</span>}
                                {block.closed > 0 && <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Closed: {block.closed}</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Rooms */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faDoorClosed} className="mr-2 text-red-600" />
                    Rooms by Complaint Volume
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Breakdown</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {locationStats.rooms.slice(0, 15).map((room, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">#{index + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="font-medium">{room.room}</div>
                              <div className="text-xs text-gray-500">{room.block}, {room.faculty}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{room.total}</td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600 w-20">Open:</span>
                                  <div className="flex-1 bg-gray-200 rounded h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded" style={{ width: `${room.total > 0 ? (room.open / room.total) * 100 : 0}%` }}></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900 w-8">{room.open}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600 w-20">Progress:</span>
                                  <div className="flex-1 bg-gray-200 rounded h-1.5">
                                    <div className="bg-yellow-500 h-1.5 rounded" style={{ width: `${room.total > 0 ? (room.inProgress / room.total) * 100 : 0}%` }}></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900 w-8">{room.inProgress}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600 w-20">Resolved:</span>
                                  <div className="flex-1 bg-gray-200 rounded h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded" style={{ width: `${room.total > 0 ? (room.resolved / room.total) * 100 : 0}%` }}></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900 w-8">{room.resolved}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-600 w-20">Closed:</span>
                                  <div className="flex-1 bg-gray-200 rounded h-1.5">
                                    <div className="bg-gray-500 h-1.5 rounded" style={{ width: `${room.total > 0 ? (room.closed / room.total) * 100 : 0}%` }}></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900 w-8">{room.closed}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            {activeTab === "students" && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Student Feedback Analysis</h3>
                {feedbackMetrics.count === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-2xl mr-3" />
                      <div>
                        <h4 className="text-md font-medium text-blue-900 mb-1">No Feedback Available</h4>
                        <p className="text-sm text-blue-700">There are no student feedback entries for the selected filters. Adjust your filters to view feedback data.</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Summary Cards - Only show if feedback exists */}
                {feedbackMetrics.count > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-blue-900 mb-2">Overall Satisfaction</h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">
                      {renderStars(Math.round(feedbackMetrics.avgOverall || 0))}
                    </div>
                    <p className="text-3xl font-bold text-blue-900">{feedbackMetrics.avgOverall ? `${feedbackMetrics.avgOverall}/5.0` : '–'}</p>
                    <p className="text-sm text-blue-700 mt-2">Based on {feedbackMetrics.count} feedback{feedbackMetrics.count === 1 ? '' : 's'}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-purple-900 mb-2">Resolution Satisfaction (Q1)</h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">{renderStars(Math.round(feedbackMetrics.avgQ1 || 0))}</div>
                    <p className="text-3xl font-bold text-purple-900">{feedbackMetrics.avgQ1 ? `${feedbackMetrics.avgQ1}/5.0` : '–'}</p>
                    <p className="text-sm text-purple-700 mt-2">From {feedbackMetrics.count} entries</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-green-900 mb-2">Response Time Rating (Q2)</h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">{renderStars(Math.round(feedbackMetrics.avgQ2 || 0))}</div>
                    <p className="text-3xl font-bold text-green-900">{feedbackMetrics.avgQ2 ? `${feedbackMetrics.avgQ2}/5.0` : '–'}</p>
                    <p className="text-sm text-green-700 mt-2">Average response rating</p>
                  </div>
                </div>
                )}
                {/* Recent Feedback Table - Only show if feedback exists */}
                {feedbackMetrics.count > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200"><h4 className="text-lg font-medium text-gray-900">Recent Student Feedback</h4></div>
                  <div className="overflow-hidden" style={{ height: `${Math.min(6, feedbackMetrics.entries.length) * 60}px` }}>
                    <div className="overflow-x-auto overflow-y-auto h-full">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1 Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2 Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Comment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {feedbackMetrics.entries.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No feedback available for current filters.</td>
                          </tr>
                        )}
                        {feedbackMetrics.entries.map((c) => {
                          const fb = c.feedback;
                          const dateStr = fb?.updatedAt || fb?.createdAt || c.updatedAt || c.createdAt;
                          const cat = (c.category && (c.category.name || c.category.title)) || 'Unknown';
                          return (
                            <tr key={c.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.displayId || c.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{renderStars(fb?.q1Rating)}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{renderStars(fb?.q2Rating)}</td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={fb?.overallComment}>{fb?.overallComment || '—'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFriendlyDate(dateStr)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                )}
                {/* Distribution & Themes - Only show if feedback exists */}
                {feedbackMetrics.count > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Satisfaction Distribution (Q1)</h4>
                    <div className="space-y-4">
                      {[5,4,3,2,1].map((star) => {
                        const count = feedbackMetrics.distQ1[star] || 0;
                        const percent = feedbackMetrics.pct(count);
                        return (
                          <div key={star}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center text-yellow-400">
                                {renderStars(star)}
                                <span className="ml-2 text-gray-700">{star} star{star>1?'s':''}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {feedbackMetrics.count === 0 && (
                        <p className="text-sm text-gray-500">No feedback entries to build distribution.</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                      <span>Common Feedback Themes (AI-Powered)</span>
                      {aiThemeMetrics.isAnalyzing && (
                        <span className="text-sm text-blue-600 flex items-center">
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                          Analyzing...
                        </span>
                      )}
                    </h4>
                    {aiThemeMetrics.total === 0 && !aiThemeMetrics.isAnalyzing && (
                      <p className="text-sm text-gray-500">No feedback comments to analyze.</p>
                    )}
                    {aiThemeMetrics.total > 0 && (
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600 mb-4">
                          Analyzed {aiThemeMetrics.total} feedback comment{aiThemeMetrics.total !== 1 ? 's' : ''} using AI classification
                        </div>
                        
                        {/* Effective Solution */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-green-700">Effective Solution</span>
                            <span className="text-sm font-semibold text-green-800">
                              {aiThemeMetrics.effectiveSolution} ({Math.round((aiThemeMetrics.effectiveSolution / aiThemeMetrics.total) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${(aiThemeMetrics.effectiveSolution / aiThemeMetrics.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Ineffective Solution */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-red-700">Ineffective Solution</span>
                            <span className="text-sm font-semibold text-red-800">
                              {aiThemeMetrics.ineffectiveSolution} ({Math.round((aiThemeMetrics.ineffectiveSolution / aiThemeMetrics.total) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-red-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${(aiThemeMetrics.ineffectiveSolution / aiThemeMetrics.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Fast Response */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-blue-700">Fast Response</span>
                            <span className="text-sm font-semibold text-blue-800">
                              {aiThemeMetrics.fastResponse} ({Math.round((aiThemeMetrics.fastResponse / aiThemeMetrics.total) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${(aiThemeMetrics.fastResponse / aiThemeMetrics.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Slow Response */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-orange-700">Slow Response</span>
                            <span className="text-sm font-semibold text-orange-800">
                              {aiThemeMetrics.slowResponse} ({Math.round((aiThemeMetrics.slowResponse / aiThemeMetrics.total) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-orange-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${(aiThemeMetrics.slowResponse / aiThemeMetrics.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Polite Staff */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-teal-700">Polite Staff</span>
                            <span className="text-sm font-semibold text-teal-800">
                              {aiThemeMetrics.politeStaff} ({Math.round((aiThemeMetrics.politeStaff / aiThemeMetrics.total) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-teal-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${(aiThemeMetrics.politeStaff / aiThemeMetrics.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Rude Staff */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-purple-700">Rude Staff</span>
                            <span className="text-sm font-semibold text-purple-800">
                              {aiThemeMetrics.rudeStaff} ({Math.round((aiThemeMetrics.rudeStaff / aiThemeMetrics.total) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-purple-500 h-3 rounded-full transition-all duration-500" 
                              style={{ width: `${(aiThemeMetrics.rudeStaff / aiThemeMetrics.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}
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
                {/* Performance Benchmarks */}
                {/** SLA target: 3 days (72 hours) response time */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-blue-900">SLA Target</h4>
                      <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">3d (72h)</p>
                    <p className="text-xs text-blue-700 mt-1">Response Time Goal</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-green-900">Team Avg Response</h4>
                      <FontAwesomeIcon icon={faClock} className="text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">{officerStats.teamAvg.avgResponseTime ? `${officerStats.teamAvg.avgResponseTime.toFixed(1)}h` : '—'}</p>
                    <p className="text-xs text-green-700 mt-1">
                      {officerStats.teamAvg.avgResponseTime > 72 ? (
                        <span className="text-red-600 font-medium">⚠️ {(officerStats.teamAvg.avgResponseTime - 72).toFixed(1)}h over SLA</span>
                      ) : (
                        <span className="text-green-700 font-medium">✓ {(72 - officerStats.teamAvg.avgResponseTime).toFixed(1)}h under SLA</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-purple-900">Avg Resolution</h4>
                      <FontAwesomeIcon icon={faHourglassHalf} className="text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{officerStats.teamAvg.avgResolutionTime ? `${officerStats.teamAvg.avgResolutionTime.toFixed(2)}h` : '—'}</p>
                    <p className="text-xs text-purple-700 mt-1">{officerStats.teamAvg.avgResolutionTime ? `${(officerStats.teamAvg.avgResolutionTime / 24).toFixed(2)} days` : 'No data'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200\">
                    <div className="flex items-center justify-between mb-2\">
                      <h4 className="text-sm font-semibold text-yellow-900">Team Resolution</h4>
                      <FontAwesomeIcon icon={faChartLine} className="text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">{officerStats.teamAvg.resolutionRate.toFixed(2)}%</p>
                    <p className="text-xs text-yellow-700 mt-1">{officerStats.teamAvg.resolved} of {Math.round(officerStats.teamAvg.total * officerStats.list.filter(o => o.total > 0).length)} cases</p>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Officer Performance Summary
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Quick view of each officer's key metrics and overall rating</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-blue-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Officer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Cases
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Resolution Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Avg Response (hours)
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {officerStats.list.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                              No officer performance data available for current filters.
                            </td>
                          </tr>
                        )}
                        {officerStats.list.map((officer) => {
                          const responseStatus = officer.avgResponseTime <= 72 ? 'excellent' : officer.avgResponseTime <= 108 ? 'good' : 'needs-improvement';
                          const resolutionStatus = officer.resolutionRate >= 80 ? 'excellent' : officer.resolutionRate >= 60 ? 'good' : 'needs-improvement';
                          
                          return (
                            <tr key={officer.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{officer.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{officer.total}</div>
                                <div className="text-xs text-gray-500">Assigned</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-sm font-bold ${resolutionStatus === 'excellent' ? 'text-green-700' : resolutionStatus === 'good' ? 'text-yellow-700' : 'text-red-700'}`}>
                                    {officer.resolutionRate}%
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {officer.resolved}/{officer.total} resolved
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-semibold ${responseStatus === 'excellent' ? 'text-green-700' : responseStatus === 'good' ? 'text-yellow-700' : 'text-red-700'}`}>
                                  {officer.avgResponseTime ? `${officer.avgResponseTime.toFixed(1)}h` : '—'}
                                </div>
                                {officer.avgResponseTime && (
                                  <div className="text-xs mt-0.5">
                                    {officer.avgResponseTime <= 72 ? (
                                      <span className="text-green-600">✓ On target</span>
                                    ) : (
                                      <span className="text-red-600">⚠ Slow</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {officer.avgSat ? (
                                  <div className="flex items-center">
                                    <span className="text-sm font-semibold text-gray-900">{officer.avgSat.toFixed(1)}</span>
                                    <span className="text-yellow-400 ml-1">★</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">No data</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {officerStats.list.length > 0 && (
                          <tr className="bg-blue-50 font-semibold">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Team Average
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.total.toFixed(0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.resolutionRate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.avgResponseTime ? `${officerStats.teamAvg.avgResponseTime.toFixed(1)}h` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.avgSat ? `${officerStats.teamAvg.avgSat.toFixed(1)}/5` : '—'}
                            </td>
                          </tr>
                        )}
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
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.summary}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            summary: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Summary Overview
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.statusDistribution}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            statusDistribution: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Status Distribution
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={exportSettings.charts}
                        onChange={(e) =>
                          setExportSettings({
                            ...exportSettings,
                            charts: e.target.checked,
                          })
                        }
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Location Hotspots
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
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
                        Officer Performance
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
                    <option value="landscape">Landscape (Recommended)</option>
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
                onClick={handleConfirmExport}
                disabled={isExporting}
                className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFileExport} className="mr-2" />
                    Generate PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;

