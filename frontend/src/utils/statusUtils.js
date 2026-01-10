/**
 * Status and priority utility functions
 */

export const capitalizeStatus = (status) => {
  if (!status) return "Opened";
  
  const statusMap = {
    'opened': 'Opened',
    'open': 'Opened',
    'inprogress': 'InProgress',
    'in progress': 'InProgress',
    'in_progress': 'InProgress',
    'in-progress': 'InProgress',
    'resolved': 'Resolved',
    'resolve': 'Resolved',
    'closed': 'Closed'
  };
  
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
};

export const getStatusColor = (status) => {
  switch (status) {
    case "Opened":
      return "bg-yellow-100 text-yellow-800";
    case "InProgress":
      return "bg-blue-100 text-blue-800";
    case "Resolved":
      return "bg-green-100 text-green-800";
    case "Closed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "text-red-600";
    case "Medium":
      return "text-orange-500";
    case "Low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};
