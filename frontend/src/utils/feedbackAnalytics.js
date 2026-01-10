/**
 * Utility functions for feedback analytics
 */

/**
 * Calculate feedback metrics from reports data
 * @param {Array} reports - Array of report objects with feedback
 * @returns {Object} Feedback metrics
 */
export const calculateFeedbackMetrics = (reports = []) => {
  if (!Array.isArray(reports) || reports.length === 0) {
    return {
      totalFeedback: 0,
      averageQ1Rating: 0,
      averageQ2Rating: 0,
      overallAverageRating: 0,
      feedbackCount: 0,
      feedbackRate: 0,
      feedbackByRating: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      },
      resolvedWithFeedback: 0,
      resolvedTotal: 0
    };
  }

  // Filter reports that have feedback
  const reportsWithFeedback = reports.filter(r => r.feedback && r.isFeedbackProvided);
  
  // Count resolved reports
  const resolvedReports = reports.filter(r => 
    r.status && (r.status.toLowerCase() === 'resolved' || r.status.toLowerCase() === 'closed')
  );
  
  const resolvedWithFeedback = resolvedReports.filter(r => r.feedback && r.isFeedbackProvided);

  if (reportsWithFeedback.length === 0) {
    return {
      totalFeedback: 0,
      averageQ1Rating: 0,
      averageQ2Rating: 0,
      overallAverageRating: 0,
      feedbackCount: 0,
      feedbackRate: 0,
      feedbackByRating: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      },
      resolvedWithFeedback: resolvedWithFeedback.length,
      resolvedTotal: resolvedReports.length,
      satisfactionRate: 0
    };
  }

  // Calculate average ratings
  const q1Ratings = reportsWithFeedback
    .map(r => r.feedback?.q1Rating)
    .filter(r => typeof r === 'number' && !isNaN(r));
  
  const q2Ratings = reportsWithFeedback
    .map(r => r.feedback?.q2Rating)
    .filter(r => typeof r === 'number' && !isNaN(r));

  const averageQ1 = q1Ratings.length > 0 
    ? (q1Ratings.reduce((a, b) => a + b, 0) / q1Ratings.length)
    : 0;
  
  const averageQ2 = q2Ratings.length > 0 
    ? (q2Ratings.reduce((a, b) => a + b, 0) / q2Ratings.length)
    : 0;

  const overallAverage = (averageQ1 + averageQ2) / 2;

  // Count feedback by rating (using average of q1 and q2)
  const feedbackByRating = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  reportsWithFeedback.forEach(r => {
    const avgRating = ((r.feedback?.q1Rating || 0) + (r.feedback?.q2Rating || 0)) / 2;
    const roundedRating = Math.round(avgRating);
    if (roundedRating >= 1 && roundedRating <= 5) {
      feedbackByRating[roundedRating]++;
    }
  });

  // Calculate satisfaction rate (4-5 stars out of total)
  const satisfiedCount = feedbackByRating[5] + feedbackByRating[4];
  const satisfactionRate = Math.round((satisfiedCount / reportsWithFeedback.length) * 100);

  return {
    totalFeedback: reportsWithFeedback.length,
    averageQ1Rating: Math.round(averageQ1 * 10) / 10,
    averageQ2Rating: Math.round(averageQ2 * 10) / 10,
    overallAverageRating: Math.round(overallAverage * 10) / 10,
    feedbackCount: reportsWithFeedback.length,
    feedbackRate: Math.round((reportsWithFeedback.length / reports.length) * 100),
    feedbackByRating,
    resolvedWithFeedback: resolvedWithFeedback.length,
    resolvedTotal: resolvedReports.length,
    satisfactionRate
  };
};

/**
 * Get feedback by question (q1 and q2 breakdown)
 * @param {Array} reports - Array of report objects with feedback
 * @returns {Object} Breakdown of ratings per question
 */
export const getFeedbackByQuestion = (reports = []) => {
  const reportsWithFeedback = reports.filter(r => r.feedback && r.isFeedbackProvided);
  
  const q1ByRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const q2ByRating = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reportsWithFeedback.forEach(r => {
    const q1 = r.feedback?.q1Rating;
    const q2 = r.feedback?.q2Rating;
    
    if (q1 >= 1 && q1 <= 5) q1ByRating[q1]++;
    if (q2 >= 1 && q2 <= 5) q2ByRating[q2]++;
  });

  return {
    q1: {
      byRating: q1ByRating,
      average: reportsWithFeedback.length > 0 
        ? Math.round((reportsWithFeedback.reduce((sum, r) => sum + (r.feedback?.q1Rating || 0), 0) / reportsWithFeedback.length) * 10) / 10
        : 0
    },
    q2: {
      byRating: q2ByRating,
      average: reportsWithFeedback.length > 0 
        ? Math.round((reportsWithFeedback.reduce((sum, r) => sum + (r.feedback?.q2Rating || 0), 0) / reportsWithFeedback.length) * 10) / 10
        : 0
    }
  };
};

/**
 * Get average feedback rating per officer
 * @param {Array} reports - Array of report objects with feedback
 * @returns {Object} Officer feedback ratings
 */
export const getOfficerFeedbackRatings = (reports = []) => {
  const officerFeedback = {};

  reports.forEach(r => {
    if (r.feedback && r.isFeedbackProvided) {
      const officerId = r.adminId || r.assigned_to || 'Unassigned';
      const officerName = r.adminName || 'Unassigned';

      if (!officerFeedback[officerId]) {
        officerFeedback[officerId] = {
          name: officerName,
          ratings: [],
          count: 0,
          average: 0
        };
      }

      const avgRating = ((r.feedback?.q1Rating || 0) + (r.feedback?.q2Rating || 0)) / 2;
      officerFeedback[officerId].ratings.push(avgRating);
      officerFeedback[officerId].count++;
    }
  });

  // Calculate averages
  Object.keys(officerFeedback).forEach(id => {
    const ratings = officerFeedback[id].ratings;
    if (ratings.length > 0) {
      officerFeedback[id].average = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
    }
  });

  return officerFeedback;
};
