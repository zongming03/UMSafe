import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faUser } from "@fortawesome/free-solid-svg-icons";

/**
 * Officer Feedback Ratings - Shows average feedback rating per officer
 */
const OfficerFeedbackRatings = ({ officerFeedback = {} }) => {
  // Convert object to sorted array
  const officers = Object.values(officerFeedback)
    .sort((a, b) => b.average - a.average)
    .slice(0, 10); // Top 10 officers

  const getStarColor = (rating) => {
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 3.5) return "text-yellow-500";
    if (rating >= 2.5) return "text-orange-500";
    return "text-red-500";
  };

  if (officers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faUser} className="text-blue-600" />
          Officer Performance
        </h3>
        <div className="text-center py-8 text-gray-500">
          No feedback data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faUser} className="text-blue-600" />
        Officer Performance (Feedback)
      </h3>

      <div className="space-y-3">
        {officers.map((officer, idx) => (
          <div key={officer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">{idx + 1}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{officer.name}</div>
                <div className="text-xs text-gray-500">{officer.count} feedback(s)</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className={`text-lg font-bold ${getStarColor(officer.average)}`}>
                  {officer.average.toFixed(1)}
                </div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    className={i < Math.round(officer.average) ? "text-yellow-400 w-3 h-3" : "text-gray-300 w-3 h-3"}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfficerFeedbackRatings;
