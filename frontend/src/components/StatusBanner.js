import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

const StatusBanner = ({ currentStatus, statusColor, priorityColor, priority }) => {
  // Normalize status display text
  const normalizeStatusText = (status) => {
    const statusMap = {
      'opened': 'Open',
      'open': 'Open',
      'inprogress': 'In Progress',
      'in progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed',
      'Open': 'Open',
      'InProgress': 'In Progress',
      'In Progress': 'In Progress',
      'Resolved': 'Resolved',
      'Closed': 'Closed',
    };
    return statusMap[status] || status;
  };

  const displayStatus = normalizeStatusText(currentStatus);

  return (
    <div className={`mb-6 p-4 rounded-lg border ${statusColor}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className={`mr-2 ${
              displayStatus === "Open"
                ? "text-yellow-600"
                : displayStatus === "In Progress"
                ? "text-blue-600"
                : "text-green-600"
            }`}
          />
          <span className="font-medium">
            Status: {displayStatus}
          </span>
      </div>
      <div className="flex items-center">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            priorityColor[priority] || ""
          }`}
        >
          {priority} Priority
        </span>
      </div>
    </div>
  </div>
  );
};

export default StatusBanner;
