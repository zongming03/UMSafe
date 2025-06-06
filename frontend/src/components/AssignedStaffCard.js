import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
 faUser,
 faEnvelope
} from "@fortawesome/free-solid-svg-icons";

const AssignedStaffCard = ({ name, role, email }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Assigned Staff</h2>
    </div>
    <div className="p-4">
      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
          <FontAwesomeIcon icon={faUser} className="text-xl" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
          <div className="flex items-center mt-1">
            <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 mr-1 text-sm" />
            <span className="text-xs text-gray-500">{email}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AssignedStaffCard;