import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";

const ComplaintsSidebar = ({ allComplaints, currentComplaintId }) => {
  const navigate = useNavigate();
  const [showResolved, setShowResolved] = useState(true);
  const [showClosed, setShowClosed] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  const handleComplaintClick = (complaint) => {
    navigate(`/complaints/${complaint.id}`, {
      state: {
        complaint,
        allComplaints,
      },
    });
  };

  // Get unique assignees for filter dropdown
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set();
    allComplaints?.forEach((c) => {
      const assigneeName = c.adminName || c.adminId || "Unassigned";
      uniqueAssignees.add(assigneeName);
    });
    return Array.from(uniqueAssignees).sort();
  }, [allComplaints]);

  // Filter complaints based on user selections
  const filteredComplaints = useMemo(() => {
    if (!allComplaints) return [];
    
    return allComplaints.filter((complaint) => {
      const status = complaint.status?.toLowerCase();
      
      // Filter by status checkboxes
      if (status === "resolved" && !showResolved) return false;
      if (status === "closed" && !showClosed) return false;
      
      // Filter by assignee
      if (selectedAssignee !== "all") {
        const assigneeName = complaint.adminName || complaint.adminId || "Unassigned";
        if (assigneeName !== selectedAssignee) return false;
      }
      
      return true;
    });
  }, [allComplaints, showResolved, showClosed, selectedAssignee]);

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "open":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "in progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-300";
      case "closed":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          All Complaints
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {filteredComplaints?.length || 0} of {allComplaints?.length || 0}
        </p>
      </div>

      {/* Filters Section */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faFilter} className="text-gray-600 text-xs" />
          <span className="text-xs font-semibold text-gray-700 uppercase">Filters</span>
        </div>
        
        {/* Status Checkboxes */}
        <div className="mb-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:bg-gray-100 p-1 rounded">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span>Show Resolved</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:bg-gray-100 p-1 rounded">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
              className="w-3.5 h-3.5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <span>Show Closed</span>
          </label>
        </div>

        {/* Assignee Dropdown */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Assignees</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {filteredComplaints && filteredComplaints.length > 0 ? (
          <div className="p-2 space-y-2">
            {filteredComplaints.map((complaint) => {
              const isActive = complaint.id === currentComplaintId;
              return (
                <button
                  key={complaint.id}
                  onClick={() => handleComplaintClick(complaint)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${
                    isActive
                      ? "bg-blue-50 border-blue-400 shadow-md"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {/* Complaint ID */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      #{complaint.id}
                    </span>
                    {isActive && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="text-xs text-gray-600 mb-1 truncate">
                    {complaint.category?.name || "Uncategorized"}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No complaints available
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsSidebar;
