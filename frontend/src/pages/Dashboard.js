import React, { useState, useEffect, useRef } from "react";
import * as echarts from "echarts";

import Sidebar from "../components/Sidebar";
import "../styles/Dashboard.css";
import SummaryCard from "../components/SummaryCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faClipboardList,
  faExclamationCircle,
  faCheckCircle,
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

  const timeRangeOptions = [
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "Last 3 Months",
  ];

  const updateChartData = (range) => {
    const chart = echarts.getInstanceByDom(chartRef.current);
    if (chart) {
      let newData = {
        Today: [
          [2, 3, 1, 4, 2, 1, 0],
          [1, 2, 3, 1, 2, 0, 0],
          [4, 2, 3, 2, 4, 2, 1],
        ],
        "Last 7 Days": [
          [5, 7, 4, 6, 3, 2, 1],
          [3, 4, 5, 3, 4, 1, 0],
          [8, 6, 7, 5, 9, 4, 2],
        ],
        "Last 30 Days": [
          [15, 12, 14, 16, 13, 12, 11],
          [8, 9, 10, 8, 9, 6, 5],
          [18, 16, 17, 15, 19, 14, 12],
        ],
        "Last 3 Months": [
          [25, 22, 24, 26, 23, 22, 21],
          [18, 19, 20, 18, 19, 16, 15],
          [28, 26, 27, 25, 29, 24, 22],
        ],
      };

      const option = chart.getOption();
      option.series[0].data = newData[range][0];
      option.series[1].data = newData[range][1];
      option.series[2].data = newData[range][2];
      chart.setOption(option);
    }
  };
  const [filterValues, setFilterValues] = useState({
    status: "",
    priority: "",
    dateFrom: "",
    dateTo: "",
    assignedTo: "",
  });

  const profileRef = useRef(null);

  const chartRef = useRef(null);
  const filterRef = useRef(null);
  const filterButtonRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [complaints, setComplaints] = useState([
    // Page 1 complaints
    {
      id: "CMP-1092",
      subject: "Facility Maintenance Issue",
      status: "Open",
      date: "2025-04-28",
      priority: "High",
      assignedTo: "John Smith",
    },
    {
      id: "CMP-1091",
      subject: "Course Registration Problem",
      status: "In Progress",
      date: "2025-04-27",
      priority: "Medium",
      assignedTo: "Emma Davis",
    },
    {
      id: "CMP-1090",
      subject: "Library Access Denied",
      status: "Open",
      date: "2025-04-26",
      priority: "Low",
      assignedTo: "Unassigned",
    },
    {
      id: "CMP-1089",
      subject: "Cafeteria Food Quality",
      status: "Resolved",
      date: "2025-04-25",
      priority: "Medium",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "CMP-1088",
      subject: "Wi-Fi Connectivity Issues",
      status: "Open",
      date: "2025-04-24",
      priority: "High",
      assignedTo: "Michael Brown",
    },
    {
      id: "CMP-1087",
      subject: "Scholarship Application Delay",
      status: "In Progress",
      date: "2025-04-23",
      priority: "Medium",
      assignedTo: "Emma Davis",
    },
    // Page 2 complaints
    {
      id: "CMP-1086",
      subject: "Parking Permit Issues",
      status: "Open",
      date: "2025-04-22",
      priority: "Medium",
      assignedTo: "John Smith",
    },
    {
      id: "CMP-1085",
      subject: "Student ID Card Malfunction",
      status: "In Progress",
      date: "2025-04-21",
      priority: "High",
      assignedTo: "Sarah Johnson",
    },
    {
      id: "CMP-1084",
      subject: "Dormitory Heating Problem",
      status: "Open",
      date: "2025-04-20",
      priority: "High",
      assignedTo: "Michael Brown",
    },
    {
      id: "CMP-1083",
      subject: "Course Material Access",
      status: "Resolved",
      date: "2025-04-19",
      priority: "Low",
      assignedTo: "Emma Davis",
    },
    {
      id: "CMP-1082",
      subject: "Sports Facility Booking",
      status: "In Progress",
      date: "2025-04-18",
      priority: "Medium",
      assignedTo: "John Smith",
    },
    {
      id: "CMP-1081",
      subject: "Library Noise Complaint",
      status: "Open",
      date: "2025-04-17",
      priority: "Low",
      assignedTo: "Sarah Johnson",
    },
  ]);
  const itemsPerPage = 6;
  const getCurrentPageComplaints = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return complaints.slice(startIndex, startIndex + itemsPerPage);
  };
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
    // Here implement the actual filtering logic
    setIsFilterOpen(false);
  };
  const handleFilterReset = () => {
    setFilterValues({
      status: "",
      priority: "",
      dateFrom: "",
      dateTo: "",
      assignedTo: "",
    });
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      const option = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {
          data: ["Open", "In Progress", "Resolved"],
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "Open",
            type: "bar",
            stack: "total",
            emphasis: {
              focus: "series",
            },
            data: [5, 7, 4, 6, 3, 2, 1],
            itemStyle: {
              color: "#FCD34D",
            },
          },
          {
            name: "In Progress",
            type: "bar",
            stack: "total",
            emphasis: {
              focus: "series",
            },
            data: [3, 4, 5, 3, 4, 1, 0],
            itemStyle: {
              color: "#60A5FA",
            },
          },
          {
            name: "Resolved",
            type: "bar",
            stack: "total",
            emphasis: {
              focus: "series",
            },
            data: [8, 6, 7, 5, 9, 4, 2],
            itemStyle: {
              color: "#34D399",
            },
          },
        ],
      };
      chart.setOption(option);
      const handleResize = () => {
        chart.resize();
      };
      window.addEventListener("resize", handleResize);
      return () => {
        chart.dispose();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const totalPages = Math.ceil(complaints.length / itemsPerPage);
  const maxPageButtons = 5;

  // Calculate start and end page numbers for pagination
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = startPage + maxPageButtons - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  return (
    <div className="dashboard-container ">


      <div className="flex flex-1">
        {/* SideBar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

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
                value={128}
                change="8.2%"
                changeColor="text-green-600"
                changeIcon={<FontAwesomeIcon icon={faArrowUp} />}
              />
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faExclamationCircle} />}
                iconBg="bg-yellow-500"
                title="Open Cases"
                value={42}
                change="2.5%"
                changeColor="text-red-600"
                changeIcon={<FontAwesomeIcon icon={faArrowUp} />}
              />
              <SummaryCard
                iconClass={<FontAwesomeIcon icon={faCheckCircle} />}
                iconBg="bg-green-500"
                title="Resolved Cases"
                value={86}
                change="12.3%"
                changeColor="text-green-600"
                changeIcon={<FontAwesomeIcon icon={faArrowUp} />}
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
                </div>
                <div ref={chartRef} className="h-48 lg:h-56"></div>
              </div>
            </div>

            {/* Recent Complaints Table */}
            <div className="recent-complaint-table-container">
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
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="text-gray-400"
                      ></FontAwesomeIcon>
                    </div>
                  </div>
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
                  </button>
                  {/* Filter Dropdown */}
                  {isFilterOpen && (
                    <div ref={filterRef} className="filterComplaintContainer">
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Filter Complaints
                        </h3>
                        {/* Filter Fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={filterValues.status}
                              onChange={(e) =>
                                setFilterValues({
                                  ...filterValues,
                                  status: e.target.value,
                                })
                              }
                              className="filterComplaint-field"
                            >
                              <option value="">All</option>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priority
                            </label>
                            <select
                              value={filterValues.priority}
                              onChange={(e) =>
                                setFilterValues({
                                  ...filterValues,
                                  priority: e.target.value,
                                })
                              }
                              className="filterComplaint-field"
                            >
                              <option value="">All</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Assigned To
                            </label>
                            <select
                              value={filterValues.assignedTo}
                              onChange={(e) =>
                                setFilterValues({
                                  ...filterValues,
                                  assignedTo: e.target.value,
                                })
                              }
                              className="filterComplaint-field"
                            >
                              <option value="">All</option>
                              <option value="John Smith">John Smith</option>
                              <option value="Emma Davis">Emma Davis</option>
                              <option value="Sarah Johnson">
                                Sarah Johnson
                              </option>
                              <option value="Michael Brown">
                                Michael Brown
                              </option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
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

              {/* Complaints Table */}
              <div className="complaint-table">
                <table className="complaint-table-details">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="complaint-table-thread">
                        ID
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
                      >
                        <td className="complaint-table-row-id">
                          {complaint.id}
                        </td>
                        <td className="complaint-table-row-subject">
                          {complaint.subject}
                        </td>
                        <td className="complaint-table-row-status">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>
                        </td>
                        <td className="complaint-table-row-date">
                          {complaint.date}
                        </td>
                        <td className="complaint-table-row-status">
                          <span
                            className={`font-medium ${getPriorityColor(
                              complaint.priority
                            )}`}
                          >
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="complaint-table-row-assigned">
                          {complaint.assignedTo}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="complaint-table-row-action-eye">
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            <button className="complaint-table-row-action-trash">
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
                        {(currentPage - 1) * itemsPerPage + 1} -{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          complaints.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{complaints.length}</span>{" "}
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
          </div>
        </main>
      </div>
    </div>
  );
};
export default Dashboard;
