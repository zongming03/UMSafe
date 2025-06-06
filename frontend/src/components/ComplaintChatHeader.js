import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const ComplaintChatHeader = ({
  complaintId,
  studentName,
  complaintTitle,
  lastActive,
  onBack,
}) => (
  <header className="bg-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center h-20">
        <a
          href="#"
          data-readdy="true"
          onClick={onBack}
          className="!rounded-button whitespace-nowrap flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-3 text-gray-500" />
        </a>
        <div className="flex-1 flex items-center">
          <div className="flex flex-col">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {complaintId}
              </h1>
              <span className="mx-2 text-gray-400">•</span>
              <h2 className="text-lg font-medium text-gray-800">
                {studentName}
              </h2>
            </div>
            <p className="text-sm text-gray-500">{complaintTitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            <i className="fas fa-clock mr-1"></i>
            {lastActive}
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default ComplaintChatHeader;