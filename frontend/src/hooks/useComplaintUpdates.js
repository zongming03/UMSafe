import { useEffect, useCallback } from "react";
import { getSocket } from "../services/socket";

/**
 * Custom hook to listen for real-time complaint updates via Socket.IO
 * @param {Function} onNewComplaint - Callback when new complaint is created
 * @param {Function} onStatusChange - Callback when complaint status changes
 * @param {Function} onAssignment - Callback when complaint assignment changes
 */
export const useComplaintUpdates = ({
  onNewComplaint,
  onStatusChange,
  onAssignment,
}) => {
  const handleNewComplaint = useCallback(
    (payload) => {
      if (onNewComplaint) onNewComplaint(payload);
    },
    [onNewComplaint]
  );

  const handleStatusChange = useCallback(
    (payload) => {
      if (onStatusChange) onStatusChange(payload);
    },
    [onStatusChange]
  );

  const handleAssignment = useCallback(
    (payload) => {
      if (onAssignment) onAssignment(payload);
    },
    [onAssignment]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("complaint:new", handleNewComplaint);
    socket.on("complaint:status", handleStatusChange);
    socket.on("complaint:assignment", handleAssignment);

    return () => {
      socket.off("complaint:new", handleNewComplaint);
      socket.off("complaint:status", handleStatusChange);
      socket.off("complaint:assignment", handleAssignment);
    };
  }, [handleNewComplaint, handleStatusChange, handleAssignment]);
};
