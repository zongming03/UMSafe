import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

const StatusBanner = ({ currentStatus, statusColors, priorityColor }) => (
  <div className={`mb-6 p-4 rounded-lg border ${statusColors[currentStatus]}`}>
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <FontAwesomeIcon
          icon={faExclamationCircle}
          className={`mr-2 ${
            currentStatus === "Open"
              ? "text-yellow-600"
              : currentStatus === "In Progress"
              ? "text-blue-600"
              : "text-green-600"
          }`}
        />
        <span className="font-medium">
          Status: {currentStatus}
        </span>
      </div>
      <div className="flex items-center">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColor["High"]}`}
        >
          High Priority
        </span>
      </div>
    </div>
  </div>
);

export default StatusBanner;