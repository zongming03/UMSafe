import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const StatsCard = ({ icon, iconBg, iconColor, title, value }) => (
  <div className="bg-white shadow rounded-lg p-6">
    <div className="flex items-center">
      <div className={`flex-shrink-0 rounded-md p-3 ${iconBg}`}>
        <FontAwesomeIcon icon={icon} className={`${iconColor} text-xl`} />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default StatsCard;