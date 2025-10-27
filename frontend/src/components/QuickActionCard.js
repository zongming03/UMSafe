import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faComments,
  faUserPlus,
  faExchangeAlt,
  faTimes,
  faSpinner,
  faFilePdf,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

const QuickActionsCard = ({
  complaint,
  statusRef,
  assignRef,
  isStatusDropdownOpen,
  setIsStatusDropdownOpen,
  isAssignDropdownOpen,
  setIsAssignDropdownOpen,
  statusOptions,
  currentStatus,
  handleStatusChange,
  staffMembers,
  assignedTo,
  handleAssignChange,
  isReportModalOpen,
  setIsReportModalOpen,
  isGenerating,
  handleGenerateReport,
  isAnonymous,
  handleOpenChatroom
}) => {
  const [showToast, setShowToast] = useState(false);

  // Show toast after download
  const handleGenerateWithToast = async () => {
    await handleGenerateReport(complaint);
    setShowToast(true);
    setIsReportModalOpen(false);

    // Hide toast after 3 seconds
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
      </div>

      <div className="p-5 space-y-4">
        {/* === Update Status === */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="flex w-full items-center justify-between px-4 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all"
          >
            <span className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faExchangeAlt} className="text-blue-600" />
              <span>Update Status</span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-gray-500 transition-transform ${
                isStatusDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isStatusDropdownOpen && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-md border border-gray-100">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                    currentStatus === status
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === Reassign Complaint === */}
        <div className="relative" ref={assignRef}>
          <button
            onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
            className="flex w-full items-center justify-between px-4 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all"
          >
            <span className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faUserPlus} className="text-blue-600" />
              <span>Reassign Complaint</span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-gray-500 transition-transform ${
                isAssignDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isAssignDropdownOpen && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-md border border-gray-100">
              {staffMembers.map((staff) => (
                <button
                  key={staff.adminId}
                  onClick={() => handleAssignChange(staff)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                    assignedTo === staff.name
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {staff.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === Download Report === */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex w-full items-center justify-between px-4 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-all"
        >
          <span className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faFilePdf} className="text-blue-600" />
            <span>Download Report</span>
          </span>
        </button>

        {/* === Chat with Student === */}
        {!isAnonymous && (
          <button
            onClick={handleOpenChatroom}
            className="flex w-full items-center justify-between px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <span className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faComments} />
              <span>Chat with Student</span>
            </span>
          </button>
        )}
      </div>

      {/* === Report Modal === */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Download Complaint Report
              </h3>
              <button onClick={() => setIsReportModalOpen(false)}>
                <FontAwesomeIcon icon={faTimes} className="text-gray-400" />
              </button>
            </div>

            {/* Complaint Preview */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Complaint Preview
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Title:</strong> {complaint?.title || "N/A"}
                </p>
                <p>
                  <strong>Status:</strong> {complaint?.status || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {complaint?.facultyLocation
                    ? `${complaint.facultyLocation.faculty || ""}, ${
                        complaint.facultyLocation.facultyBlock || ""
                      }, ${complaint.facultyLocation.facultyBlockRoom || ""}`
                    : "N/A"}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {complaint?.category?.name || "N/A"}
                </p>
              </div>
            </div>

            {/* Confirm + Generate */}
            <div className="p-6 text-right bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithToast}
                disabled={isGenerating}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                  isGenerating
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isGenerating ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  "Generate PDF"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Toast Notification === */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
          <FontAwesomeIcon icon={faCheckCircle} className="text-white" />
          <span className="text-sm font-medium">
            Report downloaded successfully!
          </span>
        </div>
      )}
    </div>
  );
};

export default QuickActionsCard;
