import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faSmile, faMeh, faFrown } from "@fortawesome/free-solid-svg-icons";

/**
 * Feedback Summary Card - Displays overall feedback metrics
 */
const FeedbackSummaryCard = ({ metrics = {} }) => {
  const {
    totalFeedback = 0,
    overallAverageRating = 0,
    satisfactionRate = 0,
    feedbackRate = 0
  } = metrics;

  const getSentimentIcon = (rating) => {
    if (rating >= 4) return { icon: faSmile, color: "#10B981", label: "Excellent" };
    if (rating >= 3) return { icon: faMeh, color: "#F59E0B", label: "Good" };
    return { icon: faFrown, color: "#EF4444", label: "Needs Improvement" };
  };

  const sentiment = getSentimentIcon(overallAverageRating);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Student Feedback</h3>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          {totalFeedback} responses
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Overall Rating */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            <span className="text-sm text-gray-600">Overall Rating</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {overallAverageRating.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 mt-1">out of 5.0</div>
        </div>

        {/* Satisfaction Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FontAwesomeIcon icon={sentiment.icon} style={{ color: sentiment.color }} />
            <span className="text-sm text-gray-600">Satisfaction</span>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {satisfactionRate}%
          </div>
          <div className="text-xs text-gray-600 mt-1">4-5 stars</div>
        </div>
      </div>

      {/* Feedback Rate */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Feedback Collection Rate</span>
          <span className="text-sm font-bold text-gray-800">{feedbackRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(feedbackRate, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSummaryCard;
