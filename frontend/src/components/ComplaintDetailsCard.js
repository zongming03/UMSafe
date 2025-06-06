import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload
} from "@fortawesome/free-solid-svg-icons";

const ComplaintDetailsCard = ({
  title,
  description,
  submittedBy,
  dateSubmitted,
  category,
  location,
  attachments = [],
}) => (
  <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Complaint Details</h2>
    </div>
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-700 mb-4">{description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Submitted by</p>
            <p className="font-medium">{submittedBy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date Submitted</p>
            <p className="font-medium">{dateSubmitted}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{location}</p>
          </div>
        </div>
      </div>

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Attachments</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={file.url}
                    alt={file.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{file.size}</p>
                </div>
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button className="!rounded-button whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                    <FontAwesomeIcon icon={faDownload} className="mr-1" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default ComplaintDetailsCard;