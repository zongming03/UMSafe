# Analytics Dashboard PDF Export Guide

## Overview

The Analytics Dashboard now includes a comprehensive PDF export feature that allows users to generate detailed analytics reports with customizable sections based on their specific needs.

## Features

### 1. **Include Sections** - Selective Report Generation
Users can customize which sections appear in the exported PDF:

- ✅ **Summary Overview** - Executive summary with key metrics
- ✅ **Status Distribution** - Breakdown of complaint statuses
- ✅ **Charts & Visualizations** - Trend analysis and officer performance charts
- ✅ **Officer Performance** - Detailed performance metrics table

### 2. **Enhanced Analytics Sections**

#### Summary Overview
- Total Cases
- Resolved Cases (with percentage)
- In-Progress Cases
- Open/Pending Cases
- Average Response Time (hours)
- Average Resolution Time (hours)
- Student Satisfaction Rating (/5.0)
- **Priority Breakdown** (High/Normal/Low)

#### Status Distribution
- Complete breakdown of complaint statuses
- Percentage distribution for each status
- Top statuses highlighted

#### Category-Wise Distribution *(New)*
- Top complaint categories
- Count and percentage for each category
- Up to 10 most common categories shown

#### Location-Wise Breakdown *(New)*
- Complaint distribution by block/location
- Shows which areas have most complaints
- Up to 8 locations displayed

#### Charts & Visualizations
- Trend Analysis Chart (historical complaint submissions)
- Officer Performance Chart (workload and resolution metrics)
- Charts are included only when selected by user

#### Officer Performance Analysis
- Detailed performance table showing:
  - Officer name
  - Total cases handled
  - Resolved cases
  - Resolution rate (%)
  - Average response time (hours)
  - Average resolution time (hours)
  - Customer satisfaction rating
- **Performance Insights** (Top performer, team averages)
- Shows top 8 officers

#### Feedback & Satisfaction Metrics *(New)*
- Average satisfaction rating
- Total feedback responses
- Breakdown by sentiment:
  - Positive feedback
  - Neutral feedback
  - Negative feedback
- Percentages for each sentiment type

### 3. **Report Customization Options**

#### Filename
- Customizable report name
- Default: `Analytics_Report_YYYY-MM-DD`
- Timestamp automatically appended to filename

#### Page Orientation
- **Portrait** - Standard vertical layout
- **Landscape** (Recommended) - Better for tables and wide content

### 4. **Filter Information in PDF**
The PDF includes:
- **Report Period** - Date range of analysis
- **Applied Filters**:
  - Selected Category
  - Selected Block/Location
  - Selected Room
  - Complaint Status
  - Priority Level
  - Assigned Officer

## How to Use

### Step 1: Navigate to Analytics Dashboard
1. Login to UMSafe application
2. Go to Analytics Dashboard page
3. Apply desired filters (date range, category, location, etc.)

### Step 2: Select Sections to Include
1. Click the **"Export PDF"** button
2. In the export modal, check/uncheck desired sections:
   - ☐ Summary Overview
   - ☐ Status Distribution
   - ☐ Charts & Visualizations
   - ☐ Officer Performance

### Step 3: Configure Export Settings
1. **Filename**: Enter custom filename or use default
2. **Orientation**: Choose Portrait or Landscape
3. All selected sections will be included in the PDF

### Step 4: Generate PDF
1. Click **"Generate PDF"** button
2. Wait for processing (shows "Generating..." status)
3. PDF automatically downloads to your default downloads folder

## Technical Implementation

### Files Modified

#### Frontend
- **`src/pages/AnalyticDashboard.js`**
  - Export settings state management
  - Export modal UI
  - PDF generation handler
  
- **`src/utils/analyticsPDFGenerator.js`**
  - Main PDF generation logic
  - Conditional section rendering based on `include` flags
  - Data formatting and layout

### Data Flow

```
User selects sections in UI
         ↓
AnalyticDashboard.js collects:
- exportSettings (which sections to include)
- dateRange
- filters
- complaints data
- metrics
- officerStats
- feedbackMetrics
- chart images
         ↓
generateAnalyticsPDF() processes data:
- Creates jsPDF instance
- Checks include flags for each section
- Renders only selected sections
- Adds headers, footers, page numbers
         ↓
PDF saved to user's device
```

### Include Flags

Each section is controlled by an `include` flag:

```javascript
{
  summary: true,              // Executive Summary + Priority + Category + Location + Feedback
  statusDistribution: true,   // Status Breakdown
  charts: true,               // Charts & Visualizations
  performance: true           // Officer Performance Analysis
}
```

## PDF Sections - What's Included

### When "Summary Overview" is checked ✅
- Executive Summary metrics
- Priority Breakdown
- Category-Wise Distribution
- Location-Wise Breakdown
- Feedback & Satisfaction Metrics

### When "Status Distribution" is checked ✅
- Status Distribution section with percentages

### When "Charts & Visualizations" is checked ✅
- Trend Analysis Chart (if available)
- Officer Performance Chart (if available)

### When "Officer Performance" is checked ✅
- Detailed officer performance table
- Performance insights summary

## Example PDF Structure

```
┌────────────────────────────────┐
│   UMSAFE ANALYTICS REPORT      │
├────────────────────────────────┤
│ Report Generated: [Date/Time]  │
│ Analysis Period: [Date Range]  │
│ Applied Filters: [Filters]     │
├────────────────────────────────┤
│ EXECUTIVE SUMMARY              │
│ - Key metrics                  │
│ - Priority Breakdown           │
├────────────────────────────────┤
│ STATUS DISTRIBUTION            │
│ - Status breakdown             │
├────────────────────────────────┤
│ CATEGORY-WISE DISTRIBUTION     │
│ - Top categories               │
├────────────────────────────────┤
│ LOCATION-WISE BREAKDOWN        │
│ - Location statistics          │
├────────────────────────────────┤
│ CHARTS & VISUALIZATIONS        │
│ - Trend Analysis               │
│ - Officer Performance          │
├────────────────────────────────┤
│ OFFICER PERFORMANCE ANALYSIS   │
│ - Performance table            │
│ - Insights                     │
├────────────────────────────────┤
│ FEEDBACK & SATISFACTION        │
│ - Satisfaction metrics         │
├────────────────────────────────┤
│ Page 1 of X | UMSafe Report    │
└────────────────────────────────┘
```

## Tips for Best Results

1. **Select Landscape Orientation** for reports with many charts and tables
2. **Include Summary** for quick overview of key metrics
3. **Include Charts** to visualize trends and performance
4. **Use meaningful filenames** for easy identification
5. **Filter before exporting** to get focused reports
6. **Check date range** to ensure correct analysis period

## Troubleshooting

### PDF not generating?
- Ensure all required data has loaded (check for loading spinner)
- Try clearing browser cache
- Ensure your browser allows PDF downloads

### Some sections appear empty?
- Data for that section might not be available
- For charts to appear, trend chart must be rendered first
- Officer statistics require performance data

### PDF looks cut off?
- Try Landscape orientation
- Reduce number of included sections
- Check your PDF viewer zoom level

## Version Information

- **Release Date**: January 2025
- **Features Added**:
  - Priority breakdown in summary
  - Category-wise distribution
  - Location analytics
  - Enhanced feedback metrics
  - Performance insights

## Support

For issues or feature requests related to PDF export:
1. Check this guide first
2. Verify all filters are set correctly
3. Ensure you have sufficient data in the selected period
4. Contact system administrator if problems persist
