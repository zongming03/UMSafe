import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHistory } from "@fortawesome/free-solid-svg-icons";

// Accepts history in partner timeline format:
// [{ id, actionTitle, actionDetails, initiatorName, createdAt }]
// Gracefully handles legacy format where fields are date/action/user.
const ActivityHistory = ({ history = [] }) => {
  const safeItems = Array.isArray(history) ? history : [];
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Activity History</h2>
      </div>
      <div className="p-6">
        <div className="flow-root">
          {safeItems.length === 0 && (
            <div className="text-sm text-gray-500">No activity recorded yet.</div>
          )}
          <ul className="-mb-8">
            {safeItems.map((item, index) => {
              const id = item.id || index;
              const createdAt = item.createdAt || item.date || "";
              const displayDate = createdAt
                ? (() => {
                    const d = new Date(createdAt);
                    if (isNaN(d.getTime())) return createdAt; // fallback if invalid
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                  })()
                : "";
              const initiatorName = item.initiatorName || item.user || "System";
              const actionTitle = item.actionTitle || item.action || "Activity";
              const details = item.actionDetails || (item.actionTitle ? null : item.details) || null;
              return (
                <li key={id}>
                  <div className="relative pb-8">
                    {index !== safeItems.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <FontAwesomeIcon icon={faHistory} className="text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{actionTitle}</p>
                          {details && (
                            <p className="mt-0.5 text-xs text-gray-600">{details}</p>
                          )}
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-500">
                          <div>{displayDate}</div>
                          <div className="mt-0.5">Initiator: {initiatorName}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistory;