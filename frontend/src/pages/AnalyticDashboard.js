import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";
function App() {
  const [dateRange, setDateRange] = useState({
    from: "2025-04-01",
    to: "2025-05-02",
  });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedOfficer, setSelectedOfficer] = useState("all");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const complaintChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const locationChartRef = useRef(null);
  const performanceChartRef = useRef(null);
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
    (notification) => !notification.read,
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
  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true })),
    );
  };
  useEffect(() => {
    if (complaintChartRef.current) {
      const complaintChart = echarts.init(complaintChartRef.current);
      const complaintOption = {
        animation: false,
        tooltip: {
          trigger: "item",
          formatter: (params) =>
            `${params.seriesName} <br/>${params.name}: ${params.value} (${params.percent}%)`,
        },
        legend: {
          orient: "vertical",
          right: 10,
          top: "center",
          data: [
            "Facilities",
            "Academic",
            "IT",
            "Financial",
            "Administrative",
            "Services",
          ],
        },
        series: [
          {
            name: "Complaint Distribution",
            type: "pie",
            radius: ["50%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: "18",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: [
              { value: 35, name: "Facilities" },
              { value: 20, name: "Academic" },
              { value: 18, name: "IT" },
              { value: 15, name: "Financial" },
              { value: 8, name: "Administrative" },
              { value: 4, name: "Services" },
            ],
          },
        ],
      };
      complaintChart.setOption(complaintOption);
      window.addEventListener("resize", () => {
        complaintChart.resize();
      });
      return () => {
        complaintChart.dispose();
        window.removeEventListener("resize", () => {
          complaintChart.resize();
        });
      };
    }
  }, [complaintChartRef.current]);
  useEffect(() => {
    if (trendChartRef.current) {
      const trendChart = echarts.init(trendChartRef.current);
      const trendOption = {
        animation: false,
        tooltip: {
          trigger: "axis",
        },
        legend: {
          data: ["Total", "Facilities", "Academic", "IT"],
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
          data: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Total",
            type: "line",
            stack: "Total",
            data: [120, 132, 101, 134, 90, 130, 110],
            smooth: true,
            lineStyle: {
              width: 3,
            },
          },
          {
            name: "Facilities",
            type: "line",
            stack: "Category",
            data: [45, 52, 35, 45, 30, 55, 40],
            smooth: true,
          },
          {
            name: "Academic",
            type: "line",
            stack: "Category",
            data: [30, 25, 20, 35, 25, 30, 25],
            smooth: true,
          },
          {
            name: "IT",
            type: "line",
            stack: "Category",
            data: [25, 30, 20, 25, 15, 20, 15],
            smooth: true,
          },
        ],
      };
      trendChart.setOption(trendOption);
      window.addEventListener("resize", () => {
        trendChart.resize();
      });
      return () => {
        trendChart.dispose();
        window.removeEventListener("resize", () => {
          trendChart.resize();
        });
      };
    }
  }, [trendChartRef.current]);
  useEffect(() => {
    if (locationChartRef.current) {
      const locationChart = echarts.init(locationChartRef.current);
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
      locationChart.setOption(locationOption);
      window.addEventListener("resize", () => {
        locationChart.resize();
      });
      return () => {
        locationChart.dispose();
        window.removeEventListener("resize", () => {
          locationChart.resize();
        });
      };
    }
  }, [locationChartRef.current]);
  useEffect(() => {
    if (performanceChartRef.current) {
      const performanceChart = echarts.init(performanceChartRef.current);
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
                return `${param.seriesName}: ${param.value}${param.seriesName.includes("Rate") ? "%" : ""}`;
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
      performanceChart.setOption(performanceOption);
      window.addEventListener("resize", () => {
        performanceChart.resize();
      });
      return () => {
        performanceChart.dispose();
        window.removeEventListener("resize", () => {
          performanceChart.resize();
        });
      };
    }
  }, [performanceChartRef.current]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hasData, setHasData] = useState(true);
  const applyFilters = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const mockData = Math.random() > 0.2; // 80% chance of having data
      setHasData(mockData);
      if (mockData) {
        // Refresh charts here with new data
        if (complaintChartRef.current) {
          const chart = echarts.getInstanceByDom(complaintChartRef.current);
          chart?.setOption({
            /* updated options */
          });
        }
        if (trendChartRef.current) {
          const chart = echarts.getInstanceByDom(trendChartRef.current);
          chart?.setOption({
            /* updated options */
          });
        }
        if (locationChartRef.current) {
          const chart = echarts.getInstanceByDom(locationChartRef.current);
          chart?.setOption({
            /* updated options */
          });
        }
        if (performanceChartRef.current) {
          const chart = echarts.getInstanceByDom(performanceChartRef.current);
          chart?.setOption({
            /* updated options */
          });
        }
      }
      setIsLoading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };
  const resetFilters = () => {
    // Reset state values
    setDateRange({ from: "2025-04-01", to: "2025-05-02" });
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSelectedOfficer("all");
    // Reset input values using IDs
    const dateFromInput = document.getElementById("date-from");
    const dateToInput = document.getElementById("date-to");
    const categorySelect = document.getElementById("category-filter");
    const locationSelect = document.getElementById("location-filter");
    const officerSelect = document.getElementById("officer-filter");
    if (dateFromInput) dateFromInput.value = "2025-04-01";
    if (dateToInput) dateToInput.value = "2025-05-02";
    if (categorySelect) categorySelect.value = "all";
    if (locationSelect) locationSelect.value = "all";
    if (officerSelect) officerSelect.value = "all";
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
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
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex items-center">
            <i className="fas fa-spinner fa-spin text-blue-600 text-2xl mr-3"></i>
            <span className="text-gray-700">Applying filters...</span>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-up">
          <div className="flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            <span>
              {isLoading
                ? "Applying filters..."
                : "Filters have been reset to default values"}
            </span>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img
                src="https://readdy.ai/api/search-image?query=modern%2520minimalist%2520university%2520logo%2520with%2520abstract%2520geometric%2520shapes%2520in%2520blue%2520and%2520gray%2520colors%2520on%2520a%2520clean%2520white%2520background%252C%2520professional%2520educational%2520institution%2520emblem%252C%2520high%2520quality%2520vector%2520graphic&width=120&height=120&seq=1&orientation=squarish"
                alt="University Logo"
                className="h-10 w-auto"
              />
              <h1 className="ml-3 text-xl font-semibold text-gray-800">
                Complaint Management System
              </h1>
            </div>
            <div className="flex items-center">
              {/* Notifications */}
              <div className="relative mr-4" ref={notificationRef}>
                <button
                  className="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <div className="relative">
                    <i className="fas fa-bell text-xl"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
                {isNotificationsOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          Notifications
                        </h3>
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                          >
                            <p className="text-sm text-gray-800">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-200">
                        <a
                          href="#"
                          className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          View all notifications
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* User Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  className="flex items-center space-x-2 cursor-pointer"
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
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
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
                        href="https://readdy.ai/home/8422111f-d6f9-49d4-9769-990442745d9e/6481d243-3794-401f-ba85-8fea7245876c"
                        data-readdy="true"
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
                href="https://readdy.ai/home/8422111f-d6f9-49d4-9769-990442745d9e/c35b9d3b-f09d-4c10-88ba-a5e051898291"
                data-readdy="true"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-tachometer-alt mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Dashboard
              </a>
              <a
                href="https://readdy.ai/home/8422111f-d6f9-49d4-9769-990442745d9e/aae21122-3dbd-49c7-b2ca-b1b04fbdbc59"
                data-readdy="true"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-clipboard-list mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Complaints
              </a>
              <button className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer bg-blue-100 text-blue-800">
                <i className="fas fa-chart-bar mr-3 text-lg text-blue-600"></i>
                Analytics
              </button>
              <a
                href="https://readdy.ai/home/8422111f-d6f9-49d4-9769-990442745d9e/db6e350c-83e6-495a-a3dc-41e4fd918211"
                data-readdy="true"
                className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <i className="fas fa-users mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Users
              </a>
              <button className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <i className="fas fa-door-open mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Room Management
              </button>
              <button className="!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                <i className="fas fa-cog mr-3 text-lg text-gray-400 group-hover:text-gray-500"></i>
                Settings
              </button>
            </div>
          </nav>
        </aside>
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
                  Visualize and analyze complaint data - Friday, May 2, 2025
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer"
                  onClick={exportToPDF}
                >
                  <i className="fas fa-file-export mr-2"></i>
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
                    <i
                      className={`fas ${isFilterCollapsed ? "fa-chevron-down" : "fa-chevron-up"} text-sm`}
                    ></i>
                  </button>
                </div>
                {!isFilterCollapsed && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label
                          htmlFor="date-from"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          From Date
                        </label>
                        <input
                          type="date"
                          id="date-from"
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                          value={dateRange.from}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, from: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="date-to"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          To Date
                        </label>
                        <input
                          type="date"
                          id="date-to"
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                          value={dateRange.to}
                          onChange={(e) =>
                            setDateRange({ ...dateRange, to: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="category-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Category
                        </label>
                        <div className="relative">
                          <select
                            id="category-filter"
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                          >
                            <option value="all">All Categories</option>
                            <option value="academic">Academic</option>
                            <option value="administrative">
                              Administrative
                            </option>
                            <option value="facilities">Facilities</option>
                            <option value="financial">Financial</option>
                            <option value="it">IT</option>
                            <option value="services">Services</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <i className="fas fa-chevron-down text-gray-400"></i>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="location-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Location
                        </label>
                        <div className="relative">
                          <select
                            id="location-filter"
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={selectedLocation}
                            onChange={(e) =>
                              setSelectedLocation(e.target.value)
                            }
                          >
                            <option value="all">All Locations</option>
                            <option value="science">Science Building</option>
                            <option value="library">Library</option>
                            <option value="engineering">
                              Engineering Building
                            </option>
                            <option value="cafeteria">Cafeteria</option>
                            <option value="arts">Arts Building</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <i className="fas fa-chevron-down text-gray-400"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <label
                          htmlFor="officer-filter"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Assigned Officer
                        </label>
                        <div className="relative">
                          <select
                            id="officer-filter"
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(e.target.value)}
                          >
                            <option value="all">All Officers</option>
                            <option value="john">John Smith</option>
                            <option value="emma">Emma Davis</option>
                            <option value="sarah">Sarah Johnson</option>
                            <option value="michael">Michael Brown</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <i className="fas fa-chevron-down text-gray-400"></i>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-3 flex items-end justify-end space-x-3">
                        <button
                          onClick={resetFilters}
                          className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                        >
                          <i className="fas fa-undo mr-2"></i>
                          Reset Filters
                        </button>
                        <button
                          onClick={applyFilters}
                          className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer"
                        >
                          <i className="fas fa-filter mr-2"></i>
                          Apply Filters
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
                    <i className="fas fa-chart-pie mr-1"></i>
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
                    <i className="fas fa-chart-line mr-1"></i>
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
                    <i className="fas fa-users mr-1"></i>
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
                    <i className="fas fa-user-check mr-1"></i>
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
                        <i className="fas fa-clipboard-list text-blue-600 text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Total Complaints
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          245
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-green-600 font-medium flex items-center">
                        <i className="fas fa-arrow-up mr-1"></i>
                        12%
                      </span>
                      <span className="text-gray-500 ml-2">
                        from last month
                      </span>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                        <i className="fas fa-check-circle text-green-600 text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Resolved
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          187
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">76.3%</span>
                      <span className="text-gray-500 ml-2">
                        resolution rate
                      </span>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
                        <i className="fas fa-spinner text-yellow-600 text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          In Progress
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          42
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">17.1%</span>
                      <span className="text-gray-500 ml-2">
                        of total complaints
                      </span>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-red-100 p-3">
                        <i className="fas fa-exclamation-circle text-red-600 text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">
                          Open
                        </h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          16
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-gray-900 font-medium">6.5%</span>
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
                    {hasData ? (
                      <div
                        ref={complaintChartRef}
                        style={{ height: "350px" }}
                      ></div>
                    ) : (
                      <div className="h-[350px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <i className="fas fa-chart-pie text-4xl mb-2"></i>
                          <p>No data available for the selected filters</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Time-Based Trend Analysis
                    </h3>
                    <div ref={trendChartRef} style={{ height: "350px" }}></div>
                  </div>
                </div>
                {/* Response Time & Priority Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Average Response Time
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            High Priority
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            4.2 hours
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: "25%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Medium Priority
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            8.5 hours
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: "50%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Low Priority
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            16.8 hours
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: "75%" }}
                          ></div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200 mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            Overall Average
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            10.2 hours
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: "60%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Complaints by Priority
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-red-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-red-600 mb-1">
                          58
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          High Priority
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          23.7% of total
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-600 mb-1">
                          124
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Medium Priority
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          50.6% of total
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          63
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Low Priority
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          25.7% of total
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === "trends" && (
              <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  Complaint Trends Over Time
                </h3>
                <div ref={trendChartRef} style={{ height: "600px" }}></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">
                      Growth Trends
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Year-over-Year:
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          +8.2%
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Quarter-over-Quarter:
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          +3.5%
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Month-over-Month:
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          -2.1%
                        </span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Week-over-Week:
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          +5.7%
                        </span>
                      </li>
                    </ul>
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
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">4.5/5.0</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Based on 245 responses
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-purple-900 mb-2">
                      Resolution Satisfaction
                    </h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="far fa-star"></i>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">
                      4.2/5.0
                    </p>
                    <p className="text-sm text-purple-700 mt-2">
                      Based on 187 resolved cases
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-green-900 mb-2">
                      Response Time Rating
                    </h4>
                    <div className="flex items-center space-x-1 text-yellow-400 text-2xl mb-2">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="far fa-star"></i>
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
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="far fa-star"></i>
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
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="far fa-star"></i>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
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
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="far fa-star"></i>
                              <i className="far fa-star"></i>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="far fa-star"></i>
                              <i className="far fa-star"></i>
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
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star-half-alt"></i>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
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
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="far fa-star"></i>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-yellow-400">
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="fas fa-star"></i>
                              <i className="far fa-star"></i>
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
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <span className="ml-2 text-gray-700">5 stars</span>
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
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="far fa-star"></i>
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
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="far fa-star"></i>
                            <i className="far fa-star"></i>
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
                            <i className="fas fa-star"></i>
                            <i className="fas fa-star"></i>
                            <i className="far fa-star"></i>
                            <i className="far fa-star"></i>
                            <i className="far fa-star"></i>
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
                            <i className="fas fa-star"></i>
                            <i className="far fa-star"></i>
                            <i className="far fa-star"></i>
                            <i className="far fa-star"></i>
                            <i className="far fa-star"></i>
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
                            <i className="fas fa-check-circle mr-2"></i>
                            Quick response time
                          </li>
                          <li className="flex items-center">
                            <i className="fas fa-check-circle mr-2"></i>
                            Professional staff
                          </li>
                          <li className="flex items-center">
                            <i className="fas fa-check-circle mr-2"></i>
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
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            Communication updates
                          </li>
                          <li className="flex items-center">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            Resolution time
                          </li>
                          <li className="flex items-center">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            Follow-up process
                          </li>
                        </ul>
                      </div>
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
                    style={{ height: "500px" }}
                  ></div>
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
      <footer className="bg-white py-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} University Complaint Management
              System. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Privacy Policy</span>
                Privacy Policy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Terms of Service</span>
                Terms of Service
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">Help Center</span>
                Help Center
              </a>
            </div>
          </div>
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
                        <span className="ml-2 text-sm text-gray-700">
                          Trends
                        </span>
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
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-export mr-2"></i>
                      Export
                    </>
                  )}
                </button>
              </div>
              {exportedFileUrl && (
                <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                  <div className="flex items-center">
                    <i className="fas fa-check-circle text-green-500 mr-2"></i>
                    <span className="text-green-700">
                      Report generated successfully!
                    </span>
                  </div>
                  <a
                    href={exportedFileUrl}
                    download
                    className="!rounded-button whitespace-nowrap mt-2 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download Report
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}
export default App;
