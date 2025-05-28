import React from "react";

const SummaryCard = ({
  iconClass = "",
  iconBg,
  title,
  value,
  change,
  changeColor,
  changeIcon,
  children,
}) => (
  <div className="summary-cards">
    <div className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>
          <span className="text-white text-xl">{iconClass}</span>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              <div
                className={`ml-3 flex items-baseline text-sm font-semibold ${changeColor}`}
              >
                {changeIcon}
                <span className="sr-only">Increased by</span>
                {change}
              </div>
            </dd>
            {children}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

export default SummaryCard;
