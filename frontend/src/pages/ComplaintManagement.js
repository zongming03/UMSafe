import { useState, useRef, useEffect } from "react";
import "../styles/ComplaintManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchReports } from "../services/api";
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

  // Export utility functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getComplaintsForExport = () => {
    return filteredComplaints.filter(complaint => 
      selectedComplaints.includes(complaint.displayId || complaint.id)
    );
  };

  const exportToCSV = () => {
    const complaintsToExport = getComplaintsForExport();
    if (complaintsToExport.length === 0) return;

    // Define CSV headers
    const headers = [
      'Complaint ID',
      'Title',
      'Description',
      'Status',
      'Category',
      'Priority',
      'Reporter',
      'Assigned To',
      'Location',
      'Created Date',
      'Last Updated',
      'Anonymous'
    ];

    // Convert complaints to CSV rows
    const rows = complaintsToExport.map(complaint => [
      complaint.displayId || complaint.id,
      complaint.title,
      complaint.description?.replace(/[\n\r]/g, ' ').replace(/"/g, '""') || 'N/A',
      complaint.status,
      complaint.category?.name || 'N/A',
      complaint.category?.priority || 'N/A',
      complaint.username || 'Unknown',
      complaint.adminName || 'Unassigned',
      `${complaint.facultyLocation?.faculty || ''} ${complaint.facultyLocation?.facultyBlock || ''} ${complaint.facultyLocation?.facultyBlockRoom || ''}`.trim() || 'N/A',
      formatDate(complaint.createdAt),
      formatDate(complaint.updatedAt),
      complaint.isAnonymous ? 'Yes' : 'No'
    ]);

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `UMSafe_Complaints_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const complaintsToExport = getComplaintsForExport();
    if (complaintsToExport.length === 0) return;

    // Create HTML table
    const headers = [
      'Complaint ID', 'Title', 'Description', 'Status', 'Category', 'Priority',
      'Reporter', 'Assigned To', 'Faculty', 'Block', 'Room',
      'Created Date', 'Last Updated', 'Anonymous'
    ];

    const rows = complaintsToExport.map(complaint => [
      complaint.displayId || complaint.id,
      complaint.title,
      complaint.description || 'N/A',
      complaint.status,
      complaint.category?.name || 'N/A',
      complaint.category?.priority || 'N/A',
      complaint.username || 'Unknown',
      complaint.adminName || 'Unassigned',
      complaint.facultyLocation?.faculty || 'N/A',
      complaint.facultyLocation?.facultyBlock || 'N/A',
      complaint.facultyLocation?.facultyBlockRoom || 'N/A',
      formatDate(complaint.createdAt),
      formatDate(complaint.updatedAt),
      complaint.isAnonymous ? 'Yes' : 'No'
    ]);

    // Create Excel-compatible HTML with professional styling
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #4F46E5; color: white; font-weight: bold; padding: 12px 8px; text-align: left; border: 1px solid #ddd; }
          td { padding: 10px 8px; border: 1px solid #ddd; vertical-align: top; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1f2937; }
          .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">UMSafe Complaint Management System - Export Report</div>
        <div class="meta">Generated on: ${new Date().toLocaleString()} | Total Records: ${complaintsToExport.length}</div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create and download file
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `UMSafe_Complaints_${timestamp}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const complaintsToExport = getComplaintsForExport();
    if (complaintsToExport.length === 0) return;

    // Create a print-friendly HTML page
    const printWindow = window.open('', '_blank');
    const timestamp = new Date().toLocaleString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>UMSafe Complaints Export</title>
        <style>
          @media print {
            @page { size: A4 landscape; margin: 1cm; }
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-after: always; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 15px;
          }
          .header h1 {
            margin: 0;
            color: #4F46E5;
            font-size: 24px;
          }
          .header .meta {
            margin-top: 8px;
            font-size: 12px;
            color: #6b7280;
          }
          .complaint-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .complaint-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
            border-bottom: 2px solid #f3f4f6;
            padding-bottom: 10px;
          }
          .complaint-id {
            font-size: 18px;
            font-weight: bold;
            color: #4F46E5;
          }
          .complaint-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-opened { background: #FEF3C7; color: #92400E; }
          .status-inprogress { background: #DBEAFE; color: #1E40AF; }
          .status-resolved { background: #D1FAE5; color: #065F46; }
          .status-closed { background: #E5E7EB; color: #374151; }
          .complaint-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #111827;
          }
          .complaint-description {
            margin-bottom: 15px;
            color: #4b5563;
            line-height: 1.6;
          }
          .complaint-details {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            font-size: 13px;
          }
          .detail-row {
            display: flex;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            width: 130px;
          }
          .detail-value {
            color: #1f2937;
          }
          .print-button {
            background: #4F46E5;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
          }
          .print-button:hover {
            background: #4338CA;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <div class="header">
          <h1>UMSafe Complaint Management System</h1>
          <div class="meta">
            <strong>Export Report</strong><br>
            Generated: ${timestamp} | Total Records: ${complaintsToExport.length}
          </div>
        </div>
        ${complaintsToExport.map((complaint, index) => `
          <div class="complaint-card">
            <div class="complaint-header">
              <div class="complaint-id">${complaint.displayId || complaint.id}</div>
              <div class="complaint-status status-${complaint.status.toLowerCase()}">${complaint.status}</div>
            </div>
            <div class="complaint-title">${complaint.title}</div>
            <div class="complaint-description">${complaint.description || 'No description provided'}</div>
            <div class="complaint-details">
              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${complaint.category?.name || 'N/A'} (${complaint.category?.priority || 'N/A'} Priority)</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reporter:</span>
                <span class="detail-value">${complaint.isAnonymous ? 'Anonymous' : (complaint.username || 'Unknown')}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Assigned To:</span>
                <span class="detail-value">${complaint.adminName || 'Unassigned'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span class="detail-value">${[complaint.facultyLocation?.faculty, complaint.facultyLocation?.facultyBlock, complaint.facultyLocation?.facultyBlockRoom].filter(Boolean).join(', ') || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${formatDate(complaint.createdAt)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Last Updated:</span>
                <span class="detail-value">${formatDate(complaint.updatedAt)}</span>
              </div>
            </div>
          </div>
          ${(index + 1) % 3 === 0 && index !== complaintsToExport.length - 1 ? '<div class="page-break"></div>' : ''}
        `).join('')}
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
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
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);
  const navigate = useNavigate();

  // Fetch complaints from ngrok API
  useEffect(() => {
    const loadComplaints = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchReports();
        console.log("📋 Reports API Response:", response.data);
        
        // Extract reports array from response
        const reportsData = response.data?.reports || response.data?.data || response.data || [];
        
        // Map API response to match component's expected format
        const mappedComplaints = reportsData.map(report => ({
          id: report.displayId || report.id, 
          userId: report.userId,
          username: report.username,
          adminId: report.adminId || "Unassigned",
          adminName: report.adminName || "Unassigned",
          status: capitalizeStatus(report.status), 
          title: report.title,
          description: report.description,
          category: {
            name: report.category?.name || "Unknown",
            priority: report.category?.priority || "Low"
          },
          media: report.media || [],
          latitude: report.latitude,
          longitude: report.longitude,
          facultyLocation: report.facultyLocation || {},
          isAnonymous: report.isAnonymous,
          isFeedbackProvided: report.isFeedbackProvided,
          chatroomId: report.chatroomId || "",
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
          version: report.version,
          comments: report.comments || []
        }));
        
        console.log("✅ Mapped complaints:", mappedComplaints);
        setComplaints(mappedComplaints);
        setUsingMock(false);
      } catch (err) {
        console.error("❌ Error fetching complaints:", err);
        // Fallback to mock data when API is unreachable
        setUsingMock(true);
        setError(null);
        setComplaints(MOCK_COMPLAINTS);
      } finally {
        setIsLoading(false);
      }
    };

    loadComplaints();
  }, []);
  
  // Helper function to capitalize status
  const capitalizeStatus = (status) => {
    if (!status) return "Opened";
    
    // Map backend status to frontend status
    const statusMap = {
      'opened': 'Opened',
      'inprogress': 'InProgress',
      'in progress': 'InProgress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    
    return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  // MOCK DATA (kept as fallback for reference - will be removed after testing)
  const MOCK_COMPLAINTS = [
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
  ];

  const [filteredComplaints, setFilteredComplaints] = useState([]);

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
    // Get current user's faculty ID to fetch only admins from same faculty
    const userDataStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
    const currentUserFacultyId = currentUser?.facultyid;

    if (currentUserFacultyId) {
      // Fetch admins filtered by faculty ID
      fetch(`http://localhost:5000/admin/usersMobile/users/faculty/${currentUserFacultyId}`, {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setAdmins(data.data || []);
        })
        .catch((err) => {
          console.error("Error fetching faculty admins:", err);
          // Fallback to all users if endpoint fails
          fetch("http://localhost:5000/admin/usersMobile/users", {
            credentials: "include",
          })
            .then((res) => res.json())
            .then((data) => setAdmins(data.data || []))
            .catch((err) => console.error(err));
        });
    } else {
      // Fallback to fetch all users if no faculty ID
      fetch("http://localhost:5000/admin/usersMobile/users", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setAdmins(data.data || []);
        })
        .catch((err) => console.error(err));
    }
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
        filteredComplaints.map((complaint) => complaint.displayId)
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
      const displayId = complaint?.displayId || "";
      const adminName = getAdminName(complaint.adminId) || "";

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
    complaints, 
    searchTerm,
    activeFilter,
    selectedCategory,
    selectedDateRange,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Pagination logic
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
    // Pass all complaints for sidebar navigation
    navigate(`/complaints/${complaint.id}`, { 
      state: { 
        complaint, 
        allComplaints: filteredComplaints 
      } 
    });
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
                        const dropdown = document.getElementById("exportDropdown");
                        if (dropdown) {
                          dropdown.classList.toggle("hidden");
                        }
                      }}
                      className={`complaint-export-button ${
                        selectedComplaints.length === 0 || selectedComplaints.length > 10
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      aria-disabled={selectedComplaints.length === 0 || selectedComplaints.length > 10}
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
                              exportToCSV();
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
                            document.getElementById("exportDropdown")?.classList.add("hidden");
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
                            const count = selectedComplaints.length;
                            if (count === 0 || count > 10) return;
                            try {
                              exportToExcel();
                              const n = document.createElement("div");
                              n.className = "export-notification";
                              n.innerHTML = `<span>✅ Successfully exported ${count} complaints as Excel</span>`;
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
                            document.getElementById("exportDropdown")?.classList.add("hidden");
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
                            const count = selectedComplaints.length;
                            if (count === 0 || count > 10) return;
                            try {
                              exportToPDF();
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
                            document.getElementById("exportDropdown")?.classList.add("hidden");
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
              {usingMock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mr-3" />
                    <span className="text-yellow-800">
                      Using mock complaints due to API unavailability. Data is not live.
                    </span>
                  </div>
                </div>
              )}

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

              {/* Loading and Error States */}
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-blue-600 text-3xl mr-3" />
                  <span className="text-gray-600">Loading complaints from database...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 mr-3" />
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
                                    complaint.displayId
                                  )}
                                  onChange={() =>
                                    handleSelectComplaint(complaint.displayId)
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer">
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
                                                    {complaintToDelete.displayId}
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
              )}
            </div>
          </main>
        </div>
      </div>
    );
};
export default ComplaintManagement;
