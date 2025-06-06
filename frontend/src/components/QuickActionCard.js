import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
faChevronCircleDown,
faDownload,
faSpinner,
faComments
} from "@fortawesome/free-solid-svg-icons";

const QuickActionsCard = ({
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
  reportFormat,
  setReportFormat,
  reportContent,
  setReportContent,
  isGenerating,
  handleGenerateReport,
  isAnonymous,
}) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
    </div>
    <div className="p-4">
      <div className="space-y-3">

        {/* Update Status */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <span>Update Status</span>
            <FontAwesomeIcon
              icon={faChevronCircleDown}
              className={`text-gray-500 transition-transform ${
                isStatusDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isStatusDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full text-left block px-4 py-2 text-sm ${
                      currentStatus === status
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assign To */}
        <div className="relative" ref={assignRef}>
          <button
            onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
            className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <span>Reassign Complaint</span>
            <FontAwesomeIcon
              icon={faChevronCircleDown}
              className={`text-gray-500 transition-transform ${
                isAssignDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isAssignDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {staffMembers.map((staff) => (
                  <button
                    key={staff}
                    onClick={() => handleAssignChange(staff)}
                    className={`w-full text-left block px-4 py-2 text-sm ${
                      assignedTo === staff
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {staff}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Download Report */}
        <button
          id="downloadReportBtn"
          onClick={() => setIsReportModalOpen(true)}
          className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <span>Download Report</span>
          <FontAwesomeIcon icon={faDownload} className="text-gray-500" />
        </button>

        {/* Report Modal */}
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Download Report
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["PDF", "Excel", "CSV"].map((format) => (
                      <button
                        key={format}
                        onClick={() => setReportFormat(format)}
                        className={`!rounded-button whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md ${
                          reportFormat === format
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include in Report
                  </label>

                  <div className="space-y-2">
                    {Object.entries({
                      basicDetails: "Basic Details",
                      fullHistory: "Full History",
                      attachments: "Attachments",
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reportContent[key]}
                          onChange={(e) =>
                            setReportContent((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="!rounded-button whitespace-nowrap px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  id="generateReportBtn"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className={`!rounded-button whitespace-nowrap px-4 py-2 ${
                    isGenerating
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white rounded-md shadow-sm text-sm font-medium flex items-center justify-center min-w-[120px]`}
                >
                  {isGenerating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat with Student */}
        {!isAnonymous && (
          <a
            href="#"
            className="!rounded-button whitespace-nowrap w-full flex justify-between items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 cursor-pointer"
          >
            <span>Chat with Student</span>
            <FontAwesomeIcon icon={faComments} className="text-white" />
          </a>
        )}
      </div>
    </div>
  </div>
);

export default QuickActionsCard;