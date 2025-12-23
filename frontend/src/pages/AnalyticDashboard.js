import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import * as echarts from "echarts";
import jsPDF from "jspdf";
import api, { fetchReports } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MOCK_COMPLAINTS from "../mock/mockComplaints";
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
  faMapMarkerAlt,
  faClock
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";


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
  // MOCK DATA & CONFIGURATION
  // ============================================================================
  
  // Force analytics to use local mock data (set to false to enable backend API)
  const USE_MOCK_ANALYTICS = false;

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
  const filterRefetchTimer = useRef(null);
  const location = useLocation();
  const initialDataRef = useRef(null);
  const [preferLocationData, setPreferLocationData] = useState(true);
  const [notifications, setNotifications] = useState([]);

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
      if (USE_MOCK_ANALYTICS) {
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : MOCK_COMPLAINTS) || [];
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
        return;
      }
      try {
        const res = await api.get("/users");
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped = list
          .filter((u) => u && u._id && u.name && (u.role === "officer" || u.role === "admin"))
          .map((u) => ({ _id: u._id, name: u.name }));
        setOfficerOptions(mapped);
      } catch (e) {
        console.warn("[Analytics] Failed to fetch officers, will fallback to deriving from complaints", e);
        // Fallback: derive unique adminId-like values from current dataset if needed
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : MOCK_COMPLAINTS) || [];
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
            : MOCK_COMPLAINTS) || [];
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
  }, [user?.facultyid]);

  useEffect(() => {
    const refreshRoomsForBlock = async () => {
      if (USE_MOCK_ANALYTICS) {
        const base =
          (initialDataRef.current && initialDataRef.current.length
            ? initialDataRef.current
            : MOCK_COMPLAINTS) || [];
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
            : MOCK_COMPLAINTS) || [];
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
          : MOCK_COMPLAINTS) || [];
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
  const [isLoading, setIsLoading] = useState(false);
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
    if (preferLocationData) {
      const base =
        initialDataRef.current && initialDataRef.current.length
          ? initialDataRef.current
          : MOCK_COMPLAINTS;
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
      const res = await fetchReports();
      const data = res.data?.reports || res.data?.data || res.data || [];
      console.log("[Analytics] Fetched reports from API:", data.length);

      const filtered = filterData(data);

      setComplaints(filtered);
      setHasData(filtered.length > 0);
      updateChartsWithData(filtered);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error("Failed to load complaints for analytics, using local demo data:", err);
      setFetchError(err.message || "Failed to fetch (using local demo data)");
      const fallback = filterData(MOCK_COMPLAINTS);
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

  // Seed from router state if available (preferred). If none, fall back to MOCK_COMPLAINTS so the summary cards show data.
  useEffect(() => {
    if (USE_MOCK_ANALYTICS) {
      // Always seed from local mock data
      initialDataRef.current = MOCK_COMPLAINTS;
      console.log("[Analytics] Seed complaints from MOCK_COMPLAINTS. count:", initialDataRef.current.length);
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
    initialDataRef.current = hasRouterData ? locComplaints : MOCK_COMPLAINTS;
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
    setPreferLocationData(hasRouterData);
  }, [location]);


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

    // Performance per officer (assignedTo) - resolution rate, response time and resolution time
    const officerMap = {};
    data.forEach((c) => {
      const officer =
        c.assignedTo || c.adminId || c.assigned_to || "Unassigned";
      officerMap[officer] = officerMap[officer] || {
        total: 0,
        resolved: 0,
        responseTimes: [],
        resolutionTimes: [],
      };
      officerMap[officer].total += 1;
      const status = (c.status || "").toLowerCase();
      if (status === "resolved" || status === "closed")
        officerMap[officer].resolved += 1;
      
      // Calculate Response Time and Resolution Time from timelineHistory
      if (c.timelineHistory && Array.isArray(c.timelineHistory)) {
        const submittedEvent = c.timelineHistory.find(evt => evt.actionTitle === "Report Submitted");
        const assignedEvent = c.timelineHistory.find(evt => evt.actionTitle === "Admin Assigned");
        
        // Response Time: from submitted to assigned
        if (submittedEvent && assignedEvent) {
          const submittedTime = Date.parse(submittedEvent.createdAt);
          const assignedTime = Date.parse(assignedEvent.createdAt);
          if (!isNaN(submittedTime) && !isNaN(assignedTime) && assignedTime > submittedTime) {
            const responseHrs = (assignedTime - submittedTime) / (1000 * 60 * 60);
            officerMap[officer].responseTimes.push(responseHrs);
          }
        }

        // Resolution Time: from assigned to resolved/closed
        if ((status === "resolved" || status === "closed") && assignedEvent) {
          const resolvedEvent = c.timelineHistory.find(evt => 
            evt.actionTitle === "Status Updated" && 
            (evt.actionDetails?.includes("Resolved") || evt.actionDetails?.includes("Closed"))
          );
          
          if (resolvedEvent) {
            const assignedTime = Date.parse(assignedEvent.createdAt);
            const resolvedTime = Date.parse(resolvedEvent.createdAt);
            if (!isNaN(assignedTime) && !isNaN(resolvedTime) && resolvedTime > assignedTime) {
              const resolutionHrs = (resolvedTime - assignedTime) / (1000 * 60 * 60);
              officerMap[officer].resolutionTimes.push(resolutionHrs);
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
    summary: true,
    statusDistribution: true,
    charts: true,
    performance: true,
    filename: `Analytics_Report_${new Date().toISOString().split("T")[0]}`,
    orientation: "landscape",
  });
  const [isExporting, setIsExporting] = useState(false);
  const exportToPDF = () => {
    setIsExportModalOpen(true);
  };
  
  // Export Analytics PDF - Professional analyst-style report
  const exportAnalyticsPDF = ({
    orientation = 'portrait',
    include = {
      summary: true,
      statusDistribution: true,
      charts: true,
      performance: true
    },
    filename = buildFileName('analytics-report')
  } = {}) => {
    try {
      const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
      const page = { w: doc.internal.pageSize.getWidth(), h: doc.internal.pageSize.getHeight(), margin: 40 };
      const colors = { 
        primary: [37, 99, 235], 
        success: [16, 185, 129], 
        warning: [245, 158, 11],
        danger: [239, 68, 68],
        gray: [107, 114, 128],
        lightGray: [229, 231, 235]
      };
      let y = page.margin;

      const checkSpace = (needed) => {
        if (y + needed > page.h - page.margin) { doc.addPage(); y = page.margin; }
      };

      const drawLine = (y1, color = colors.lightGray) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.line(page.margin, y1, page.w - page.margin, y1);
      };

      // Calculate totals for use throughout the report
      const totalComplaints = (complaints || []).length;

      // ===== HEADER =====
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, page.w, 80, 'F');
      doc.setTextColor(255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('UMSAFE ANALYTICS REPORT', page.margin, 45);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Report Generated: ${formatDMY(new Date())} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, page.margin, 65);
      doc.setTextColor(0);
      y = 100;

      // ===== REPORT PERIOD & FILTERS =====
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('REPORT PERIOD', page.margin, y);
      y += 18;
      drawLine(y);
      y += 15;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Analysis Period: ${formatDMY(dateRange.from)} to ${formatDMY(dateRange.to)}`, page.margin + 10, y);
      y += 20;

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Applied Filters:', page.margin + 10, y);
      y += 15;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const filters = [
        ['Category', selectedCategory !== 'all' ? selectedCategory : 'All Categories'],
        ['Block', selectedBlock !== 'all' ? selectedBlock : 'All Blocks'],
        ['Room', selectedRoom !== 'all' ? selectedRoom : 'All Rooms'],
        ['Status', selectedStatus || 'All Status'],
        ['Priority', selectedPriority || 'All Priorities'],
        ['Assigned To', selectedOfficer !== 'all' ? officerOptions.find(o => o.value === selectedOfficer)?.label || selectedOfficer : 'All Officers']
      ];
      
      filters.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, page.margin + 20, y);
        doc.setFont(undefined, 'normal');
        doc.text(value, page.margin + 120, y);
        y += 12;
      });
      y += 10;

      // ===== EXECUTIVE SUMMARY =====
      if (include.summary) {
        checkSpace(120);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('EXECUTIVE SUMMARY', page.margin, y);
        y += 18;
        drawLine(y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const resolvedPct = metrics.resolutionRate;
        
        // Key findings paragraph
        doc.text(`This report analyzes ${totalComplaints} complaint cases recorded during the specified period.`, page.margin + 10, y);
        y += 14;
        doc.text(`The system achieved a resolution rate of ${resolvedPct}%, with ${metrics.resolved} cases successfully resolved,`, page.margin + 10, y);
        y += 14;
        doc.text(`${metrics.inProgress} cases currently in progress, and ${metrics.open} cases pending assignment.`, page.margin + 10, y);
        y += 20;

        // Key Metrics Table
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Key Performance Indicators:', page.margin + 10, y);
        y += 15;

        const kpiData = [
          ['Metric', 'Value', 'Status'],
          ['Total Cases', String(totalComplaints), '—'],
          ['Resolved Cases', String(metrics.resolved), `${resolvedPct}%`],
          ['In Progress', String(metrics.inProgress), '—'],
          ['Open/Pending', String(metrics.open), '—'],
          ['Avg Response Time', `${isFinite(officerStats.teamAvg.avgResponseTime) ? officerStats.teamAvg.avgResponseTime.toFixed(1) : '0'} hours`, '—'],
          ['Avg Resolution Time', `${isFinite(officerStats.teamAvg.avgResolutionTime) ? officerStats.teamAvg.avgResolutionTime.toFixed(1) : '0'} hours`, '—'],
          ['Student Satisfaction', `${isFinite(feedbackMetrics.avgSatisfaction) ? feedbackMetrics.avgSatisfaction.toFixed(2) : 'N/A'}/5.0`, '—']
        ];

        const colWidths = [180, 120, 100];
        const rowHeight = 18;
        
        // Table header
        doc.setFillColor(240, 240, 240);
        doc.rect(page.margin + 10, y, colWidths.reduce((a,b)=>a+b), rowHeight, 'F');
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        let xPos = page.margin + 15;
        kpiData[0].forEach((header, i) => {
          doc.text(header, xPos, y + 12);
          xPos += colWidths[i];
        });
        y += rowHeight;

        // Table rows
        doc.setFont(undefined, 'normal');
        for (let i = 1; i < kpiData.length; i++) {
          checkSpace(rowHeight + 5);
          if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(page.margin + 10, y, colWidths.reduce((a,b)=>a+b), rowHeight, 'F');
          }
          xPos = page.margin + 15;
          kpiData[i].forEach((cell, j) => {
            doc.text(cell, xPos, y + 12);
            xPos += colWidths[j];
          });
          y += rowHeight;
        }
        y += 20;
      }

      // ===== STATUS DISTRIBUTION =====
      if (include.statusDistribution) {
        checkSpace(100);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('STATUS DISTRIBUTION ANALYSIS', page.margin, y);
        y += 18;
        drawLine(y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Breakdown of cases by current status:', page.margin + 10, y);
        y += 20;

        const statusCounts = {};
        (complaints || []).forEach(c => {
          const status = (c.status || 'Unknown').toString();
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
        
        sortedStatuses.forEach(([status, count]) => {
          checkSpace(16);
          const percentage = totalComplaints > 0 ? ((count / totalComplaints) * 100).toFixed(1) : 0;
          
          doc.setFont(undefined, 'bold');
          doc.text('•', page.margin + 15, y);
          doc.setFont(undefined, 'normal');
          doc.text(`${status}:`, page.margin + 25, y);
          doc.setFont(undefined, 'bold');
          doc.text(`${count} cases`, page.margin + 150, y);
          doc.setFont(undefined, 'normal');
          doc.text(`(${percentage}%)`, page.margin + 220, y);
          y += 14;
        });
        y += 15;
      }

      // ===== CHARTS =====
      if (include.charts) {
        const chartImages = [];
        if (trendChartRef) {
          const img = getChartImage(trendChartRef);
          if (img) chartImages.push({ img, label: 'Trend Analysis', desc: 'Historical pattern of complaint submissions over time' });
        }
        if (performanceChartRef) {
          const img = getChartImage(performanceChartRef);
          if (img) chartImages.push({ img, label: 'Officer Performance Comparison', desc: 'Comparative analysis of officer workload and resolution metrics' });
        }

        chartImages.forEach(({ img, label, desc }) => {
          checkSpace(200);
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          doc.text(label.toUpperCase(), page.margin, y);
          y += 18;
          drawLine(y);
          y += 10;
          
          doc.setFontSize(9);
          doc.setFont(undefined, 'italic');
          doc.text(desc, page.margin + 10, y);
          y += 15;

          const imgW = page.w - page.margin * 2;
          const imgH = 180;
          doc.addImage(img, 'PNG', page.margin, y, imgW, imgH);
          y += imgH + 20;
        });
      }

      // ===== OFFICER PERFORMANCE =====
      if (include.performance && officerStats.list.length > 0) {
        checkSpace(100);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('OFFICER PERFORMANCE ANALYSIS', page.margin, y);
        y += 18;
        drawLine(y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Top performing officers by case volume and resolution efficiency:', page.margin + 10, y);
        y += 20;

        const topOfficers = officerStats.list.filter(o => o.total > 0).slice(0, 10);
        
        if (topOfficers.length > 0) {
          const tableData = [
            ['Officer Name', 'Cases', 'Resolved', 'Rate', 'Resp.(h)', 'Resol.(h)', 'Sat.']
          ];
          
          topOfficers.forEach(officer => {
            const rate = officer.total > 0 ? ((officer.resolved / officer.total) * 100).toFixed(0) : '0';
            tableData.push([
              officer.name.length > 18 ? officer.name.substring(0, 16) + '..' : officer.name,
              String(officer.total),
              String(officer.resolved),
              `${rate}%`,
              (officer.avgResponseTime != null && isFinite(officer.avgResponseTime)) ? officer.avgResponseTime.toFixed(1) : '—',
              (officer.avgResolutionTime != null && isFinite(officer.avgResolutionTime)) ? officer.avgResolutionTime.toFixed(1) : '—',
              (officer.avgSat != null && isFinite(officer.avgSat)) ? officer.avgSat.toFixed(1) : '—'
            ]);
          });

          const perfColWidths = [130, 45, 55, 45, 55, 55, 35];
          const perfRowHeight = 16;

          // Table header
          doc.setFillColor(240, 240, 240);
          doc.rect(page.margin + 10, y, perfColWidths.reduce((a,b)=>a+b), perfRowHeight, 'F');
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          let xPos = page.margin + 13;
          tableData[0].forEach((header, i) => {
            doc.text(header, xPos, y + 11);
            xPos += perfColWidths[i];
          });
          y += perfRowHeight;

          // Table rows
          doc.setFont(undefined, 'normal');
          for (let i = 1; i < tableData.length; i++) {
            checkSpace(perfRowHeight + 5);
            if (i % 2 === 0) {
              doc.setFillColor(250, 250, 250);
              doc.rect(page.margin + 10, y, perfColWidths.reduce((a,b)=>a+b), perfRowHeight, 'F');
            }
            xPos = page.margin + 13;
            tableData[i].forEach((cell, j) => {
              doc.text(cell, xPos, y + 11);
              xPos += perfColWidths[j];
            });
            y += perfRowHeight;
          }
          y += 20;
        }
      }

      // ===== CONCLUSION =====
      checkSpace(80);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('CONCLUSION', page.margin, y);
      y += 18;
      drawLine(y);
      y += 15;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('This report provides a comprehensive overview of the UMSafe complaint management system', page.margin + 10, y);
      y += 14;
      doc.text('performance. The data reflects operational efficiency and areas for continuous improvement.', page.margin + 10, y);
      y += 20;

      // Footer on all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...colors.lightGray);
        doc.setLineWidth(0.5);
        doc.line(page.margin, page.h - 30, page.w - page.margin, page.h - 30);
        doc.setFontSize(8);
        doc.setTextColor(...colors.gray);
        doc.setFont(undefined, 'normal');
        doc.text('UMSafe - Confidential Report', page.margin, page.h - 18);
        doc.text(`Page ${i} of ${totalPages}`, page.w - page.margin - 50, page.h - 18);
      }

      doc.save(filename);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  };
  
  const handleConfirmExport = () => {
    try {
      setIsExporting(true);
      setIsExportModalOpen(false);
      exportAnalyticsPDF({
        orientation: exportSettings.orientation,
        include: {
          summary: exportSettings.summary,
          statusDistribution: exportSettings.statusDistribution,
          charts: exportSettings.charts,
          performance: exportSettings.performance,
        },
        filename: buildFileName(exportSettings.filename || 'analytics-report')
      });
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
  
  // Calculate summary metrics (total, resolved, in-progress, open, resolution rate)
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

  // Filter complaints that have explicit feedback provided flag and feedback object
  const feedbackComplaints = useMemo(() => {
    return (complaints || []).filter(
      (c) => c.isFeedbackProvided === true && c.feedback && (c.feedback.q1Rating || c.feedback.q2Rating || c.feedback.overallComment)
    );
  }, [complaints]);

  // Extract common feedback themes from overallComment text
  const themeMetrics = useMemo(() => {
    const texts = feedbackComplaints
      .map(c => (c.feedback?.overallComment || '').trim())
      .filter(t => t.length > 0);
    if (!texts.length) return { positive: [], improvement: [], recent: [], topPhrases: [] };
    const stop = new Set(['the','and','a','to','of','in','is','it','for','on','at','with','this','that','was','are','be','an','as','by','or','we','i','you','they','but','from','have','has','had','were','not','more','less']);
    const positiveKeywords = ['quick','fast','helpful','professional','clear','responsive','friendly','timely','efficient','resolved','resolution','transparent'];
    const improvementKeywords = ['slow','delayed','unclear','confusing','late','no','lack','status','update','updates','response','detail','details','waiting','wait'];
    const freq = {};
    const nowTs = Date.now();
    const recentWindowMs = 7 * 24 * 60 * 60 * 1000; // last 7 days for emerging
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
      map[officer._id] = { total: 0, resolved: 0, responseTimes: [], resolutionTimes: [], sats: [] };
    });
    
    // Process complaints and update officer stats
    (complaints || []).forEach((c) => {
      const officerKey = c.assignedTo || c.adminId || c.assigned_to;
      
      // Only process if officer is assigned (not Unassigned or null)
      if (officerKey && officerKey !== "Unassigned" && map[officerKey]) {
        map[officerKey].total += 1;
        const s = (c.status || "").toString().toLowerCase();
        if (s === "resolved" || s === "closed") map[officerKey].resolved += 1;

        // Calculate Response Time: from "Report Submitted" to "Admin Assigned" using timelineHistory
        if (c.timelineHistory && Array.isArray(c.timelineHistory)) {
          const submittedEvent = c.timelineHistory.find(evt => evt.actionTitle === "Report Submitted");
          const assignedEvent = c.timelineHistory.find(evt => evt.actionTitle === "Admin Assigned");
          
          if (submittedEvent && assignedEvent) {
            const submittedTime = Date.parse(submittedEvent.createdAt);
            const assignedTime = Date.parse(assignedEvent.createdAt);
            if (!isNaN(submittedTime) && !isNaN(assignedTime) && assignedTime > submittedTime) {
              const responseHrs = (assignedTime - submittedTime) / (1000 * 60 * 60);
              map[officerKey].responseTimes.push(responseHrs);
            }
          }

          // Calculate Resolution Time: from "Admin Assigned" to "Status changed to Resolved/Closed" using timelineHistory
          if ((s === "resolved" || s === "closed") && assignedEvent) {
            const resolvedEvent = c.timelineHistory.find(evt => 
              evt.actionTitle === "Status Updated" && 
              (evt.actionDetails?.includes("Resolved") || evt.actionDetails?.includes("Closed"))
            );
            
            if (resolvedEvent) {
              const assignedTime = Date.parse(assignedEvent.createdAt);
              const resolvedTime = Date.parse(resolvedEvent.createdAt);
              if (!isNaN(assignedTime) && !isNaN(resolvedTime) && resolvedTime > assignedTime) {
                const resolutionHrs = (resolvedTime - assignedTime) / (1000 * 60 * 60);
                map[officerKey].resolutionTimes.push(resolutionHrs);
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

    // Create list from all officers (including those with 0 cases)
    const list = officerOptions.map((officer) => {
      const item = map[officer._id];
      const resolutionRate = item.total > 0 ? Math.round((item.resolved / item.total) * 1000) / 10 : 0;
      const avgResponseTime = item.responseTimes.length ? Math.round((item.responseTimes.reduce((a, b) => a + b, 0) / item.responseTimes.length) * 10) / 10 : 0;
      const avgResolutionTime = item.resolutionTimes.length ? Math.round((item.resolutionTimes.reduce((a, b) => a + b, 0) / item.resolutionTimes.length) * 10) / 10 : 0;
      const avgSat = item.sats.length ? Math.round((item.sats.reduce((a, b) => a + b, 0) / item.sats.length) * 10) / 10 : null;
      return {
        id: officer._id,
        name: officer.name,
        total: item.total,
        resolved: item.resolved,
        resolutionRate,
        avgResponseTime,
        avgResolutionTime,
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
      resolutionTimeSum: acc.resolutionTimeSum + (it.avgResolutionTime * it.total), 
      satSum: acc.satSum + ((it.avgSat || 0) * it.total) 
    }), { total: 0, resolved: 0, responseTimeSum: 0, resolutionTimeSum: 0, satSum: 0 });
    
    const teamAvg = {
      total: totals.total && officersWithCases.length ? Math.round((totals.total / officersWithCases.length) * 10) / 10 : 0,
      resolved: Math.round(totals.resolved),
      resolutionRate: totals.total ? Math.round((totals.resolved / totals.total) * 1000) / 10 : 0,
      avgResponseTime: totals.total ? Math.round((totals.responseTimeSum / totals.total) * 10) / 10 : 0,
      avgResolutionTime: totals.total ? Math.round((totals.resolutionTimeSum / totals.total) * 10) / 10 : 0,
      avgSat: totals.total ? Math.round((totals.satSum / totals.total) * 10) / 10 : null,
    };
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
                            Date: {formatDMY(dateRange.from)} → {formatDMY(dateRange.to)}
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
                            style={{ maxHeight: '300px', overflowY: 'auto' }}
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
                            style={{ maxHeight: '300px', overflowY: 'auto' }}
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
                            style={{ maxHeight: '300px', overflowY: 'auto' }}
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
                {!hasData || complaints.length === 0 ? (
                  <div className="text-center py-20">
                    <FontAwesomeIcon icon={faChartLine} className="text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No data available for the selected filters</p>
                  </div>
                ) : (
                  <>
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

                {/* Top Blocks */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faLayerGroup} className="mr-2 text-purple-600" />
                    Top 10 Blocks by Complaint Volume
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

                {/* Top Rooms */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <FontAwesomeIcon icon={faDoorClosed} className="mr-2 text-red-600" />
                    Top 15 Rooms by Complaint Volume
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
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
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
                        {feedbackMetrics.entries.slice(0, 15).map((c) => {
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
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Common Feedback Themes</h4>
                    {themeMetrics.positive.length === 0 && themeMetrics.improvement.length === 0 && (
                      <p className="text-sm text-gray-500">No recurring themes detected from current feedback comments.</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h5 className="text-sm font-medium text-green-800 mb-3 flex items-center">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />Positive Feedback
                        </h5>
                        <ul className="space-y-2 text-xs text-green-700">
                          {themeMetrics.positive.map(t => (
                            <li key={t.theme} className="flex justify-between">
                              <span className="truncate max-w-[70%]" title={t.theme}>{t.theme}</span>
                              <span className="font-semibold">{t.count}</span>
                            </li>
                          ))}
                          {themeMetrics.positive.length === 0 && <li className="text-green-600 opacity-70">No positive themes</li>}
                        </ul>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h5 className="text-sm font-medium text-red-800 mb-3 flex items-center">
                          <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />Areas for Improvement
                        </h5>
                        <ul className="space-y-2 text-xs text-red-700">
                          {themeMetrics.improvement.map(t => (
                            <li key={t.theme} className="flex justify-between">
                              <span className="truncate max-w-[70%]" title={t.theme}>{t.theme}</span>
                              <span className="font-semibold">{t.count}</span>
                            </li>
                          ))}
                          {themeMetrics.improvement.length === 0 && <li className="text-red-600 opacity-70">No improvement themes</li>}
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h5 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                          <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />Emerging (Last 7 Days)
                        </h5>
                        <ul className="space-y-2 text-xs text-blue-700">
                          {themeMetrics.recent.map(t => (
                            <li key={t.theme} className="flex justify-between">
                              <span className="truncate max-w-[70%]" title={t.theme}>{t.theme}</span>
                              <span className="font-semibold">{t.count}</span>
                            </li>
                          ))}
                          {themeMetrics.recent.length === 0 && <li className="text-blue-600 opacity-70">No recent themes</li>}
                        </ul>
                        {themeMetrics.topPhrases.length > 0 && (
                          <div className="mt-4 border-t pt-3">
                            <h6 className="text-xs font-semibold text-blue-800 mb-2">Top Phrases</h6>
                            <div className="flex flex-wrap gap-2">
                              {themeMetrics.topPhrases.map(p => (
                                <span key={p.phrase} className="px-2 py-1 bg-white border border-blue-200 rounded-full text-[11px] text-blue-700" title={`${p.count} occurrences`}>
                                  {p.phrase} ({p.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-blue-900">SLA Target</h4>
                      <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">24h</p>
                    <p className="text-xs text-blue-700 mt-1">Response Time Goal</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-green-900">Team Avg Response</h4>
                      <FontAwesomeIcon icon={faClock} className="text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">{officerStats.teamAvg.avgResponseTime ? `${officerStats.teamAvg.avgResponseTime.toFixed(1)}h` : '—'}</p>
                    <p className="text-xs text-green-700 mt-1">
                      {officerStats.teamAvg.avgResponseTime > 24 ? (
                        <span className="text-red-600 font-medium">⚠️ {(officerStats.teamAvg.avgResponseTime - 24).toFixed(1)}h over SLA</span>
                      ) : (
                        <span className="text-green-700 font-medium">✓ {(24 - officerStats.teamAvg.avgResponseTime).toFixed(1)}h under SLA</span>
                      )}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-purple-900">Avg Resolution</h4>
                      <FontAwesomeIcon icon={faHourglassHalf} className="text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{officerStats.teamAvg.avgResolutionTime ? `${(officerStats.teamAvg.avgResolutionTime / 24).toFixed(1)}d` : '—'}</p>
                    <p className="text-xs text-purple-700 mt-1">{officerStats.teamAvg.avgResolutionTime ? `${officerStats.teamAvg.avgResolutionTime.toFixed(1)} hours total` : 'No data'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
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
                      Detailed Performance Metrics
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Individual officer performance with SLA compliance indicators</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Officer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Workload
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Resolution Rate
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Resolution Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Satisfaction
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {officerStats.list.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                              No officer performance data available for current filters.
                            </td>
                          </tr>
                        )}
                        {officerStats.list.map((officer) => {
                          const responseStatus = officer.avgResponseTime <= 24 ? 'excellent' : officer.avgResponseTime <= 48 ? 'good' : 'needs-improvement';
                          const resolutionStatus = officer.resolutionRate >= 80 ? 'excellent' : officer.resolutionRate >= 60 ? 'good' : 'needs-improvement';
                          const workloadPercent = officerStats.list.length > 0 ? (officer.total / Math.max(...officerStats.list.map(o => o.total))) * 100 : 0;
                          
                          return (
                            <tr key={officer.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                                <div className="text-xs text-gray-500">{officer.total > 0 ? 'Active' : 'No cases'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{officer.total} cases</div>
                                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${workloadPercent}%` }}></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{officer.resolved} resolved / {officer.total - officer.resolved} active</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`text-sm font-semibold ${resolutionStatus === 'excellent' ? 'text-green-700' : resolutionStatus === 'good' ? 'text-yellow-700' : 'text-red-700'}`}>
                                    {officer.resolutionRate}%
                                  </span>
                                  {resolutionStatus === 'excellent' && <span className="ml-2 text-green-600">✓</span>}
                                  {resolutionStatus === 'needs-improvement' && <span className="ml-2 text-red-600">⚠</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {resolutionStatus === 'excellent' ? 'Excellent' : resolutionStatus === 'good' ? 'Good' : 'Below Target'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${responseStatus === 'excellent' ? 'text-green-700' : responseStatus === 'good' ? 'text-yellow-700' : 'text-red-700'}`}>
                                  {officer.avgResponseTime ? `${officer.avgResponseTime.toFixed(1)}h` : '—'}
                                </div>
                                {officer.avgResponseTime && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {officer.avgResponseTime <= 24 ? (
                                      <span className="text-green-600">✓ Within SLA</span>
                                    ) : (
                                      <span className="text-red-600">⚠ {(officer.avgResponseTime - 24).toFixed(1)}h over</span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {officer.avgResolutionTime ? `${(officer.avgResolutionTime / 24).toFixed(1)}d` : '—'}
                                </div>
                                {officer.avgResolutionTime && (
                                  <div className="text-xs text-gray-500 mt-1">{officer.avgResolutionTime.toFixed(1)} hours</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {officer.avgSat ? (
                                  <div>
                                    <div className="flex items-center text-yellow-400">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <FontAwesomeIcon 
                                          key={star} 
                                          icon={star <= Math.round(officer.avgSat) ? faStarSolid : faStarRegular} 
                                          className="text-xs"
                                        />
                                      ))}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{officer.avgSat.toFixed(1)}/5.0</div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {officer.total > 0 ? (
                                  <div>
                                    {responseStatus === 'excellent' && resolutionStatus === 'excellent' ? (
                                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">⭐ Excellent</span>
                                    ) : responseStatus === 'needs-improvement' || resolutionStatus === 'needs-improvement' ? (
                                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">⚠ Action Needed</span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">✓ Good</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No data</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {officerStats.list.length > 0 && (
                          <tr className="bg-gray-100 font-medium">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Team Average
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.total.toFixed(1)} cases/officer
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.resolutionRate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.avgResponseTime ? `${officerStats.teamAvg.avgResponseTime.toFixed(1)}h` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.avgResolutionTime ? `${(officerStats.teamAvg.avgResolutionTime / 24).toFixed(1)}d` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {officerStats.teamAvg.avgSat ? `${officerStats.teamAvg.avgSat.toFixed(1)}/5` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Benchmark
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Performance Insights */}
                  {officerStats.list.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance Insights</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-sm" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Top Performer</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {officerStats.list.filter(o => o.total > 0).sort((a, b) => b.resolutionRate - a.resolutionRate)[0]?.name || 'N/A'} 
                              {' '}with {officerStats.list.filter(o => o.total > 0).sort((a, b) => b.resolutionRate - a.resolutionRate)[0]?.resolutionRate || 0}% resolution rate
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faClock} className="text-blue-600 text-sm" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Fastest Response</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {officerStats.list.filter(o => o.avgResponseTime > 0).sort((a, b) => a.avgResponseTime - b.avgResponseTime)[0]?.name || 'N/A'}
                              {' '}at {officerStats.list.filter(o => o.avgResponseTime > 0).sort((a, b) => a.avgResponseTime - b.avgResponseTime)[0]?.avgResponseTime?.toFixed(1) || 0}h avg
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faExclamationCircle} className="text-yellow-600 text-sm" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Needs Support</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {officerStats.list.filter(o => o.avgResponseTime > 48).length} officer(s) exceeding 48h response time
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                        Charts & Visualizations
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
