import toast from "react-hot-toast";

/**
 * Notification Service
 * Provides centralized notification functionality for complaints and messages
 */
export const NotificationService = {
  /**
   * Show notification for new complaint
   */
  showNewComplaintNotification: (complaint) => {
    const title = complaint.title || "New Complaint";
    const displayId = complaint.displayId || complaint.id;
    const message = `New complaint #${displayId}: ${title}`;

    toast.success(message, {
      duration: 5000,
      position: "top-right",
      icon: "📝",
    });
  },

  /**
   * Show notification for complaint status change
   */
  showStatusChangeNotification: (complaintId, oldStatus, newStatus) => {
    const message = `Complaint status: ${oldStatus} → ${newStatus}`;

    const getIcon = (status) => {
      switch (status?.toLowerCase()) {
        case "resolved":
          return "✅";
        case "inprogress":
          return "⏳";
        case "opened":
          return "📂";
        default:
          return "🔄";
      }
    };

    toast.success(message, {
      duration: 4000,
      position: "top-right",
      icon: getIcon(newStatus),
    });
  },

  /**
   * Show notification for complaint assignment
   */
  showAssignmentNotification: (complaintId, adminName) => {
    const message =
      adminName && adminName !== "Unassigned"
        ? `Complaint assigned to ${adminName}`
        : `Complaint unassigned`;

    toast(message, {
      duration: 4000,
      position: "top-right",
      icon: "👤",
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
  },

  /**
   * Show notification for new message
   */
  showNewMessageNotification: (senderName, messagePreview = "New message") => {
    const displayName = senderName || "Unknown User";
    const message = `💬 ${displayName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? "..." : ""}`;

    toast.success(message, {
      duration: 4000,
      position: "top-right",
    });
  },

  /**
   * Show error notification
   */
  showError: (errorMessage) => {
    toast.error(errorMessage || "An error occurred", {
      duration: 4000,
      position: "top-right",
      icon: "❌",
    });
  },

  /**
   * Show info notification
   */
  showInfo: (infoMessage) => {
    toast(infoMessage, {
      duration: 4000,
      position: "top-right",
      icon: "ℹ️",
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
  },

  /**
   * Show warning notification
   */
  showWarning: (warningMessage) => {
    toast((t) => (
      <span>
        <strong>⚠️ Warning:</strong> {warningMessage}
      </span>
    ), {
      duration: 4000,
      position: "top-right",
    });
  },
};

export default NotificationService;
