import { useEffect, useCallback } from "react";
import { getSocket } from "../services/socket";
import apiCache from "../utils/apiCache";

/**
 * Custom hook to listen for real-time complaint updates via Socket.IO
 * @param {Object} options - Hook options
 * @param {string} options.currentComplaintId - The ID of the complaint currently being viewed
 * @param {Function} options.onNewComplaint - Callback when new complaint is created
 * @param {Function} options.onStatusChange - Callback when complaint status changes
 * @param {Function} options.onAssignment - Callback when complaint assignment changes
 */
export const useComplaintUpdates = ({
  currentComplaintId,
  onNewComplaint,
  onStatusChange,
  onAssignment,
}) => {
  const handleNewComplaint = useCallback(
    (payload) => {
      // Invalidate cache when new complaint arrives
      apiCache.invalidate('reports_all');
      if (onNewComplaint) onNewComplaint(payload);
    },
    [onNewComplaint]
  );

  const handleStatusChange = useCallback(
    (payload) => {
      console.log(`📡 Status change event received for complaint: ${payload.complaintId}, current complaint: ${currentComplaintId}`);
      // Invalidate cache when status changes
      apiCache.invalidate('reports_all');
      if (payload.complaintId) {
        apiCache.invalidate(`report_${payload.complaintId}`);
      }
      if (onStatusChange) onStatusChange(payload);
    },
    [onStatusChange, currentComplaintId]
  );

  const handleAssignment = useCallback(
    (payload) => {
      console.log(`📡 Assignment change event received for complaint: ${payload.complaintId}, current complaint: ${currentComplaintId}`);
      // Invalidate cache when assignment changes
      apiCache.invalidate('reports_all');
      if (payload.complaintId) {
        apiCache.invalidate(`report_${payload.complaintId}`);
      }
      if (onAssignment) onAssignment(payload);
    },
    [onAssignment, currentComplaintId]
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
