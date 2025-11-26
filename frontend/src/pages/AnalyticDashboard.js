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
  const USE_MOCK_ANALYTICS = true;

  // Development mock complaints data
  const DEV_MOCK_COMPLAINTS = [
    {
      id: "019a926d-e235-710f-a590-735375474e5f",
      displayId: "RPT-202511-1",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      username: "Testing1.",
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Dirty Classroom Floor",
      description: "The classroom floor has not been cleaned for days. There are food wrappers and dust everywhere.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e5f-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e5f",
          actionTitle: "Report Submitted",
          actionDetails: "Complaint submitted by user Testing1.",
          initiator: "Testing1.",
          createdAt: "2025-10-23T15:59:35.599Z",
          updatedAt: "2025-10-23T15:59:35.599Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e5f-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e5f",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin Teoh Zong Ming assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-23T16:05:00.000Z",
          updatedAt: "2025-10-23T16:05:00.000Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e5f-evt-3",
          reportId: "019a926d-e235-710f-a590-735375474e5f",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to InProgress.",
          initiator: "Teoh Zong Ming",
          createdAt: "2025-10-23T16:05:01.000Z",
          updatedAt: "2025-10-23T16:05:01.000Z",
          version: 1,
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
      id: "019a926d-e235-710f-a590-735375474e60",
      displayId: "RPT-202511-2",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: null,
      adminName: "Unassigned",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Student Harassment Incident",
      description: "Witnessed bullying behavior in the cafeteria during lunch hour. Multiple students involved.",
      category: { name: "Bullying", priority: "High" },
      media: [
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e60-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e60",
          actionTitle: "Report Submitted",
          actionDetails: "Complaint submitted regarding bullying in cafeteria.",
          initiator: "Testing1.",
          createdAt: "2025-10-22T16:07:10.441Z",
          updatedAt: "2025-10-22T16:07:10.441Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e60-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e60",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-10-22T16:07:11.000Z",
          updatedAt: "2025-10-22T16:07:11.000Z",
          version: 1,
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
      id: "019a926d-e235-710f-a590-735375474e61",
      displayId: "RPT-202511-3",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: null,
      adminName: "Unassigned",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Overflowing Trash Bins",
      description: "Trash bins near the library entrance are overflowing. Bad smell and attracting flies.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80",
        "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e61-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e61",
          actionTitle: "Report Submitted",
          actionDetails: "Overflowing trash bins reported near library entrance.",
          initiator: "Testing1.",
          createdAt: "2025-10-22T16:02:30.647Z",
          updatedAt: "2025-10-22T16:02:30.647Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e61-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e61",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-10-22T16:02:31.000Z",
          updatedAt: "2025-10-22T16:02:31.000Z",
          version: 1,
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
      id: "019a926d-e235-710f-a590-735375474e62",
      displayId: "RPT-202511-4",
      userId: "testing",
      adminId: null,
      adminName: "Unassigned",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Graffiti on Wall",
      description: "Graffiti spotted near the main entrance of the lecture hall. Contains inappropriate content.",
      category: { name: "Vandalism", priority: "Medium" },
      media: [
        "https://images.unsplash.com/photo-1604509988450-70f2e6827eb6?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e62-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e62",
          actionTitle: "Report Submitted",
          actionDetails: "Graffiti reported at lecture hall entrance.",
          initiator: "testing",
          createdAt: "2025-06-14T12:15:00.000Z",
          updatedAt: "2025-06-14T12:15:00.000Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e62-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e62",
          actionTitle: "Status Updated",
          actionDetails: "Status set to Opened.",
          initiator: "System",
          createdAt: "2025-06-14T12:15:05.000Z",
          updatedAt: "2025-06-14T12:15:05.000Z",
          version: 1,
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
      id: "019a926d-e235-710f-a590-735375474e63",
      displayId: "RPT-202511-5",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Resolved",
      title: "Broken Window in Lecture Hall",
      description: "Window on the third floor is cracked and poses safety risk. Needs immediate attention.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e63-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e63",
          actionTitle: "Report Submitted",
          actionDetails: "Broken window reported in lecture hall.",
          initiator: "Testing1.",
          createdAt: "2025-10-20T14:59:08.106Z",
          updatedAt: "2025-10-20T14:59:08.106Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e63-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e63",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin Teoh Zong Ming assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-20T15:10:08.106Z",
          updatedAt: "2025-10-20T15:10:08.106Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e63-evt-3",
          reportId: "019a926d-e235-710f-a590-735375474e63",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to InProgress.",
          initiator: "Teoh Zong Ming",
          createdAt: "2025-10-20T15:10:09.000Z",
          updatedAt: "2025-10-20T15:10:09.000Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e63-evt-4",
          reportId: "019a926d-e235-710f-a590-735375474e63",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to Resolved.",
          initiator: "Teoh Zong Ming",
          createdAt: "2025-10-20T15:50:33.823Z",
          updatedAt: "2025-10-20T15:50:33.823Z",
          version: 1,
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
      isFeedbackProvided: true,
      chatroomId: "019a0236-cdb6-74dc-878a-b6e675995c1d",
      createdAt: "2025-10-20T14:59:08.106Z",
      updatedAt: "2025-10-20T15:50:33.823Z",
      version: 9,
      feedback: {
        id: "019b0abc-aaaa-71f1-b100-123456789001",
        reportId: "019a926d-e235-710f-a590-735375474e63",
        q1Rating: 4,
        q2Rating: 5,
        overallComment: "Prompt fix. Window replaced quickly.",
        createdAt: "2025-10-20T15:55:00.000Z",
        updatedAt: "2025-10-20T15:55:00.000Z",
        version: 1
      },
    },
    {
      id: "019a926d-e235-710f-a590-735375474e64",
      displayId: "RPT-202511-6",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Opened",
      title: "Stained Carpet in Study Area",
      description: "Large stain on carpet in the main study area. Looks like coffee spill that was never cleaned properly.",
      category: { name: "Cleanliness", priority: "Low" },
      media: [
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e64-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e64",
          actionTitle: "Report Submitted",
          actionDetails: "Carpet stain reported in study area.",
          initiator: "Testing1.",
          createdAt: "2025-10-18T13:52:48.107Z",
          updatedAt: "2025-10-18T13:52:48.107Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e64-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e64",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin Teoh Zong Ming assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-18T14:00:00.000Z",
          updatedAt: "2025-10-18T14:00:00.000Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e64-evt-3",
          reportId: "019a926d-e235-710f-a590-735375474e64",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to InProgress.",
          initiator: "Teoh Zong Ming",
          createdAt: "2025-10-18T14:00:01.000Z",
          updatedAt: "2025-10-18T14:00:01.000Z",
          version: 1,
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
      id: "019a926d-e235-710f-a590-735375474e65",
      displayId: "RPT-202511-7",
      userId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
      adminId: "68af04187c2e6f499854e2da",
      adminName: "Teoh Zong Ming",
      facultyid: "6915cd5e4297c05ff2598c55",
      status: "Resolved",
      title: "Cheating During Exam",
      description: "Witnessed student using unauthorized materials during final examination. Multiple instances observed.",
      category: { name: "Academic Misconduct", priority: "High" },
      media: [
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
      ],
      timelineHistory: [
        {
          id: "019a926d-e235-710f-a590-735375474e65-evt-1",
          reportId: "019a926d-e235-710f-a590-735375474e65",
          actionTitle: "Report Submitted",
          actionDetails: "Academic misconduct reported during exam.",
          initiator: "Testing1.",
          createdAt: "2025-10-12T13:28:06.371Z",
          updatedAt: "2025-10-12T13:28:06.371Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e65-evt-2",
          reportId: "019a926d-e235-710f-a590-735375474e65",
          actionTitle: "Admin Assigned",
          actionDetails: "Admin Teoh Zong Ming assigned to complaint.",
          initiator: "System",
          createdAt: "2025-10-12T14:00:06.371Z",
          updatedAt: "2025-10-12T14:00:06.371Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e65-evt-3",
          reportId: "019a926d-e235-710f-a590-735375474e65",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to InProgress.",
          initiator: "Teoh Zong Ming",
          createdAt: "2025-10-12T14:00:07.000Z",
          updatedAt: "2025-10-12T14:00:07.000Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e65-evt-4",
          reportId: "019a926d-e235-710f-a590-735375474e65",
          actionTitle: "Status Updated",
          actionDetails: "Status changed to Resolved.",
          initiator: "Teoh Zong Ming",
          createdAt: "2025-10-13T16:59:48.850Z",
          updatedAt: "2025-10-13T16:59:48.850Z",
          version: 1,
        },
        {
          id: "019a926d-e235-710f-a590-735375474e65-evt-5",
          reportId: "019a926d-e235-710f-a590-735375474e65",
          actionTitle: "Feedback Provided",
          actionDetails: "User submitted feedback after resolution.",
          initiator: "Testing1.",
          createdAt: "2025-10-13T17:10:00.000Z",
          updatedAt: "2025-10-13T17:10:00.000Z",
          version: 1,
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
      feedback: {
        id: "019b0abc-bbbb-71f1-b100-123456789002",
        reportId: "019a926d-e235-710f-a590-735375474e65",
        q1Rating: 3,
        q2Rating: 4,
        overallComment: "Investigation handled well, appreciate transparency.",
        createdAt: "2025-10-13T17:12:00.000Z",
        updatedAt: "2025-10-13T17:12:00.000Z",
        version: 1
      },
    },
  ];;

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
            : DEV_MOCK_COMPLAINTS) || [];
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
            : DEV_MOCK_COMPLAINTS) || [];
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
  }, [user?.facultyid]);

  useEffect(() => {
    const refreshRoomsForBlock = async () => {
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
    return { positive, improvement, recent, topPhrases };
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
      resolved: totals.resolved && officersWithCases.length ? Math.round((totals.resolved / officersWithCases.length) * 10) / 10 : 0,
      resolutionRate: totals.total ? Math.round((totals.resolved / totals.total) * 1000) / 10 : 0,
      avgResponseTime: totals.total ? Math.round((totals.responseTimeSum / totals.total) * 10) / 10 : 0,
      avgResolutionTime: totals.total ? Math.round((totals.resolutionTimeSum / totals.total) * 10) / 10 : 0,
      avgSat: totals.total ? Math.round((totals.satSum / totals.total) * 10) / 10 : null,
    };
    return { list, teamAvg };
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
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
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
                        {officerStats.list.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                              No officer performance data available for current filters.
                            </td>
                          </tr>
                        )}
                        {officerStats.list.map((officer) => (
                          <tr key={officer.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {officer.total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {officer.resolved}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {officer.resolutionRate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {officer.avgResponseTime ? `${officer.avgResponseTime}h` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {officer.avgResolutionTime ? `${officer.avgResolutionTime}h` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {officer.avgSat ? `${officer.avgSat}/5` : '—'}
                            </td>
                          </tr>
                        ))}
                        {officerStats.list.length > 0 && (
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              Team Average
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officerStats.teamAvg.total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officerStats.teamAvg.resolved}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officerStats.teamAvg.resolutionRate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officerStats.teamAvg.avgResponseTime ? `${officerStats.teamAvg.avgResponseTime}h` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officerStats.teamAvg.avgResolutionTime ? `${officerStats.teamAvg.avgResolutionTime}h` : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {officerStats.teamAvg.avgSat ? `${officerStats.teamAvg.avgSat}/5` : '—'}
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
