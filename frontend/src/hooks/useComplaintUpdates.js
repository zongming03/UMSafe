import { useEffect, useCallback } from "react";
import { getSocket } from "../services/socket";
import apiCache from "../utils/apiCache";
import { NotificationService } from "../utils/NotificationService";

/**
 * Custom hook to listen for real-time complaint updates via Socket.IO
 * @param {Object} options - Hook options
 * @param {string} options.currentComplaintId - The ID of the complaint currently being viewed
 * @param {Function} options.onNewComplaint - Callback when new complaint is created
 * @param {Function} options.onStatusChange - Callback when complaint status changes
 * @param {Function} options.onAssignment - Callback when complaint assignment changes
 * @param {boolean} options.showNotifications - Whether to show toast notifications (default: true)
 */
export const useComplaintUpdates = ({
  currentComplaintId,
  onNewComplaint,
  onStatusChange,
  onAssignment,
  showNotifications = true,
}) => {
  const handleNewComplaint = useCallback(
    (payload) => {
      // Invalidate cache when new complaint arrives
      apiCache.invalidate('reports_all');
      
      // Show notification for new complaint
      if (showNotifications) {
        NotificationService.showNewComplaintNotification({
          title: payload.title || "New Complaint",
          displayId: payload.displayId || payload.complaintId,
        });
      }
      
      if (onNewComplaint) onNewComplaint(payload);
    },
    [onNewComplaint, showNotifications]
  );

  const handleStatusChange = useCallback(
    (payload) => {
      console.log(`📡 Status change event received for complaint: ${payload.complaintId}, current complaint: ${currentComplaintId}`);
      // Invalidate cache when status changes
      apiCache.invalidate('reports_all');
      if (payload.complaintId) {
        apiCache.invalidate(`report_${payload.complaintId}`);
      }
      
      // Show notification for status change
      if (showNotifications) {
        NotificationService.showStatusChangeNotification(
          payload.displayId || payload.complaintId,
          payload.oldStatus || "Unknown",
          payload.status || "Unknown"
        );
      }
      
      if (onStatusChange) onStatusChange(payload);
    },
    [onStatusChange, currentComplaintId, showNotifications]
  );

  const handleAssignment = useCallback(
    (payload) => {
      console.log(`📡 Assignment change event received for complaint: ${payload.complaintId}, current complaint: ${currentComplaintId}`);
      // Invalidate cache when assignment changes
      apiCache.invalidate('reports_all');
      if (payload.complaintId) {
        apiCache.invalidate(`report_${payload.complaintId}`);
      }
      
      // Show notification for assignment change
      if (showNotifications) {
        NotificationService.showAssignmentNotification(
          payload.displayId || payload.complaintId,
          payload.adminName || "Unassigned"
        );
      }
      
      if (onAssignment) onAssignment(payload);
    },
    [onAssignment, currentComplaintId, showNotifications]
  );

  useEffect(() => {
    let socket = getSocket();
    let retryTimer;
    let listenersAttached = false;

    const attachListeners = (sock) => {
      if (!sock || listenersAttached) return;
      listenersAttached = true;
      console.log(`🔌 Listening for complaint updates for ID: ${currentComplaintId || 'all'}`);
      sock.on("complaint:new", handleNewComplaint);
      sock.on("complaint:status", handleStatusChange);
      sock.on("complaint:assignment", handleAssignment);
    };

    const detachListeners = () => {
      if (!socket || !listenersAttached) return;
      socket.off("complaint:new", handleNewComplaint);
      socket.off("complaint:status", handleStatusChange);
      socket.off("complaint:assignment", handleAssignment);
      listenersAttached = false;
    };

    // Socket may not be ready when the hook mounts; retry until it is.
    if (!socket) {
      console.warn("⚠️ Socket not connected in useComplaintUpdates; retrying...");
      retryTimer = setInterval(() => {
        const candidate = getSocket();
        if (candidate) {
          socket = candidate;
          attachListeners(socket);
          clearInterval(retryTimer);
        }
      }, 500);
    } else {
      attachListeners(socket);
    }

    return () => {
      if (retryTimer) clearInterval(retryTimer);
      detachListeners();
    };
  }, [currentComplaintId, handleNewComplaint, handleStatusChange, handleAssignment]);
};
