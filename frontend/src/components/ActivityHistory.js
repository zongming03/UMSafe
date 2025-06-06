import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
faHistory
} from "@fortawesome/free-solid-svg-icons";
const ActivityHistory = ({ history }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-medium text-gray-900">Activity History</h2>
    </div>
    <div className="p-6">
      <div className="flow-root">
        <ul className="-mb-8">
          {history.map((item, index) => (
            <li key={index}>
              <div className="relative pb-8">
                {index !== history.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  ></span>
                )}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                      <FontAwesomeIcon icon={faHistory} className="text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-900">{item.action}</p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <div>{item.date}</div>
                      <div>by {item.user}</div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default ActivityHistory;