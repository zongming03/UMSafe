# Performance Metrics Calculation Enhancement

## Overview
Enhanced the Analytics Dashboard to calculate accurate performance metrics using timeline history data instead of static fields. The system now provides precise measurements of response times, resolution times, and satisfaction scores based on actual event timestamps.

## Changes Implemented

### 1. Average Response Time
**Definition**: Time elapsed from when a complaint is submitted to when an admin is assigned.

**Calculation Method**:
- Extract `timelineHistory` events from each complaint
- Find "Report Submitted" event → get submission timestamp
- Find "Admin Assigned" event → get assignment timestamp
- Calculate difference in hours: `(assignedTime - submittedTime) / (1000 * 60 * 60)`
- Average across all complaints assigned to each officer

**Data Source**: `complaint.timelineHistory`
```javascript
const submittedEvent = complaint.timelineHistory.find(evt => evt.actionTitle === "Report Submitted");
const assignedEvent = complaint.timelineHistory.find(evt => evt.actionTitle === "Admin Assigned");
const responseHrs = (assignedTime - submittedTime) / (1000 * 60 * 60);
```

### 2. Average Resolution Time
**Definition**: Time elapsed from when an admin is assigned to when the complaint is marked as resolved or closed.

**Calculation Method**:
- Extract `timelineHistory` events from each complaint
- Find "Admin Assigned" event → get assignment timestamp
- Find "Status Updated" event with "Resolved" or "Closed" → get resolution timestamp
- Calculate difference in hours: `(resolvedTime - assignedTime) / (1000 * 60 * 60)`
- Only includes resolved/closed cases
- Average across all resolved/closed complaints per officer

**Data Source**: `complaint.timelineHistory`
```javascript
const assignedEvent = complaint.timelineHistory.find(evt => evt.actionTitle === "Admin Assigned");
const resolvedEvent = complaint.timelineHistory.find(evt => 
  evt.actionTitle === "Status Updated" && 
  (evt.actionDetails?.includes("Resolved") || evt.actionDetails?.includes("Closed"))
);
const resolutionHrs = (resolvedTime - assignedTime) / (1000 * 60 * 60);
```

### 3. Satisfaction Score
**Definition**: Average satisfaction rating based on student feedback questions Q1 and Q2.

**Calculation Method**:
- Extract feedback data from complaints with `isFeedbackProvided === true`
- Get `q1Rating` (Resolution Satisfaction) and `q2Rating` (Staff Support Satisfaction)
- Calculate average per complaint: `(q1Rating + q2Rating) / 2`
- Average across all complaints with feedback per officer
- Score range: 1-5

**Data Source**: `complaint.feedback`
```javascript
if (complaint.feedback && complaint.isFeedbackProvided === true) {
  const q1 = Number(complaint.feedback.q1Rating);
  const q2 = Number(complaint.feedback.q2Rating);
  const avgFeedback = (q1 + q2) / 2;
  // Add to officer's satisfaction scores
}
```

## Updated Components

### 1. `officerStats` useMemo (Line ~1993)
Enhanced to calculate three separate metrics arrays:
- `responseTimes[]` - Array of response times per officer
- `resolutionTimes[]` - Array of resolution times per officer
- `sats[]` - Array of satisfaction scores per officer

Returns:
```javascript
{
  id: officerId,
  name: officerName,
  total: totalCases,
  resolved: resolvedCases,
  resolutionRate: percentage,
  avgResponseTime: hours,
  avgResolutionTime: hours,
  avgSat: score (1-5 or null)
}
```

### 2. Performance Chart (Line ~1599)
Updated chart data calculation in `updateChartsWithData()` function:
- Now shows 3 series instead of 2
- **Resolution Rate (%)** - Bar chart (left Y-axis)
- **Avg Response Time (hrs)** - Line chart (right Y-axis, green)
- **Avg Resolution Time (hrs)** - Line chart (right Y-axis, yellow)

### 3. Performance Table (Line ~3178)
Updated table columns to display:
- **Avg. Response Time** - Shows `officer.avgResponseTime` in hours
- **Avg. Resolution Time** - Shows `officer.avgResolutionTime` in hours
- **Satisfaction** - Shows `officer.avgSat/5` or '—' if no feedback

### 4. Team Averages (Line ~2032)
Enhanced team average calculation:
- Weighted averages based on total cases per officer
- `avgResponseTime`: Total response time / total cases
- `avgResolutionTime`: Total resolution time / total cases
- `avgSat`: Total satisfaction score / total cases

## Benefits

### 1. Accuracy
- Uses actual event timestamps from timeline history
- No reliance on hardcoded or estimated values
- Reflects true system performance

### 2. Granularity
- Separates response time (assignment speed) from resolution time (case handling speed)
- Provides actionable insights for different process improvements
- Response time → Admin resource allocation
- Resolution time → Case complexity or officer efficiency

### 3. Feedback Integration
- Uses dual-question feedback (Q1: Resolution, Q2: Staff Support)
- More comprehensive satisfaction measurement
- Directly correlates to user experience

### 4. Real-time Updates
- Automatically recalculates when filters change
- No manual data refresh needed
- Always reflects current filtered dataset

## Data Requirements

For metrics to be calculated, complaints must have:

### Response Time Calculation:
- `timelineHistory` array with entries:
  - Event with `actionTitle: "Report Submitted"`
  - Event with `actionTitle: "Admin Assigned"`

### Resolution Time Calculation:
- `timelineHistory` array with entries:
  - Event with `actionTitle: "Admin Assigned"`
  - Event with `actionTitle: "Status Updated"` and `actionDetails` containing "Resolved" or "Closed"
- Complaint `status` must be "resolved" or "closed"

### Satisfaction Calculation:
- `isFeedbackProvided: true`
- `feedback` object with:
  - `q1Rating` (number 1-5)
  - `q2Rating` (number 1-5)

## Example Timeline History Structure

```javascript
{
  id: "complaint-123",
  displayId: "RPT-2025-001",
  status: "resolved",
  assignedTo: "officer-id-123",
  isFeedbackProvided: true,
  feedback: {
    q1Rating: 4,
    q2Rating: 5,
    overallComment: "Great service!"
  },
  timelineHistory: [
    {
      id: "evt-1",
      reportId: "complaint-123",
      actionTitle: "Report Submitted",
      actionDetails: "Complaint submitted by user John Doe.",
      initiator: "John Doe",
      createdAt: "2025-01-20T10:00:00.000Z",
      updatedAt: "2025-01-20T10:00:00.000Z",
      version: 1
    },
    {
      id: "evt-2",
      reportId: "complaint-123",
      actionTitle: "Admin Assigned",
      actionDetails: "Admin Jane Smith assigned to complaint.",
      initiator: "System",
      createdAt: "2025-01-20T11:30:00.000Z", // Response Time = 1.5 hours
      updatedAt: "2025-01-20T11:30:00.000Z",
      version: 1
    },
    {
      id: "evt-3",
      reportId: "complaint-123",
      actionTitle: "Status Updated",
      actionDetails: "Status changed to Resolved.",
      initiator: "Jane Smith",
      createdAt: "2025-01-20T15:00:00.000Z", // Resolution Time = 3.5 hours
      updatedAt: "2025-01-20T15:00:00.000Z",
      version: 1
    }
  ]
}
```

**Calculated Metrics**:
- Response Time: 1.5 hours (from 10:00 to 11:30)
- Resolution Time: 3.5 hours (from 11:30 to 15:00)
- Satisfaction: 4.5/5 ((4+5)/2)

## Testing

### Test with Mock Data
The system uses `DEV_MOCK_COMPLAINTS` in development mode with pre-populated timeline history:
1. Navigate to Analytics Dashboard
2. Click on "Performance" tab
3. Verify chart shows 3 series (Resolution Rate, Response Time, Resolution Time)
4. Verify table shows separate columns for each metric
5. Check that Team Average row calculates correctly

### Verify Calculations
1. Select a specific officer from the dropdown filter
2. Check the table values match expected calculations
3. Hover over chart data points to see tooltips
4. Compare with manual calculation from mock data

## Future Enhancements

### Potential Improvements:
1. **SLA Compliance**: Add thresholds for response/resolution times with color coding
2. **Trend Analysis**: Show time-series charts for metrics over time
3. **Comparative Analysis**: Compare officers against team averages
4. **Workload Balancing**: Calculate case distribution equity
5. **Feedback Insights**: Break down satisfaction by question (Q1 vs Q2)
6. **Performance Alerts**: Notify admins when metrics fall below thresholds

## Files Modified

- **frontend/src/pages/AnalyticDashboard.js**
  - Line ~1993: Enhanced `officerStats` useMemo
  - Line ~1599: Updated `updateChartsWithData()` function
  - Line ~1049: Updated performance chart initialization
  - Line ~3178: Updated table column rendering

## Related Documentation

- `EMAIL_NOTIFICATIONS.md` - Email notification system for complaint status changes
- `TESTING_EMAIL_NOTIFICATIONS.md` - Guide for testing email notifications
- `DEFAULT_PROFILE_IMAGE_SETUP.md` - Default profile image configuration

---

**Last Updated**: January 2025  
**Author**: GitHub Copilot  
**Status**: ✅ Implemented and Tested
