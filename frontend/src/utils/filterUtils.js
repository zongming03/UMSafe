/**
 * Complaint filtering and sorting utilities
 */

import { capitalizeStatus } from './statusUtils';
import { isDateInRange } from './dateUtils';

export const filterComplaints = (
  complaints,
  searchTerm,
  activeFilter,
  selectedCategory,
  dateRange,
  customStartDate,
  customEndDate
) => {
  return complaints.filter((complaint) => {
    // Search filter
    if (searchTerm && !complaint.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (activeFilter !== "all" && !complaint.status.toLowerCase().includes(activeFilter.toLowerCase())) {
      return false;
    }

    // Category filter - compare by ID or name
    if (selectedCategory !== "all") {
      const categoryMatch =complaint.category?.name === selectedCategory;
      if (!categoryMatch) {
        return false;
      }
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      if (!isDateInRange(complaint.createdAt, dateRange.start, dateRange.end)) {
        return false;
      }
    }

    // Custom date range filter
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59);
      if (!isDateInRange(complaint.createdAt, start, end)) {
        return false;
      }
    }

    return true;
  });
};

export const sortComplaints = (complaints, sortConfig) => {
  if (!sortConfig) return complaints;

  const { key, direction } = sortConfig;
  const sorted = [...complaints].sort((a, b) => {
    let aValue = a[key];
    let bValue = b[key];

    if (key === "createdAt" || key === "updatedAt") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (key === "status") {
      aValue = capitalizeStatus(aValue);
      bValue = capitalizeStatus(bValue);
    }

    if (aValue < bValue) return direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return direction === "ascending" ? 1 : -1;
    return 0;
  });

  return sorted;
};

export const getSortIcon = (key, sortConfig) => {
  if (!sortConfig || sortConfig.key !== key) return "⇅";
  return sortConfig.direction === "ascending" ? "↑" : "↓";
};
