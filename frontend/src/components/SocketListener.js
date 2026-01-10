import { useContext, useEffect } from "react";
import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { initSocket, disconnectSocket } from "../services/socket";

const SocketListener = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!user || !token) {
      disconnectSocket();
      return undefined;
    }

    const socket = initSocket(token);
    
    // If socket initialization failed (e.g., no token), skip event listeners
    if (!socket) {
      return undefined;
    }

    const handleNewComplaint = (payload) => {
      const title = payload?.title ? `: ${payload.title}` : "";
      toast.success(`New complaint ${payload?.complaintId || ""}${title}`);
    };

    const handleStatusChange = (payload) => {
      const id = payload?.complaintId || "complaint";
      const status = payload?.status || "updated";
    };

    const handleAssignment = (payload) => {
      const id = payload?.complaintId || "complaint";
      const assigneeId = payload?.adminId;
      const assigneeName = payload?.adminName || assigneeId || "Unassigned";
      const currentUserId = user?.id || user?._id;

      if (!assigneeId) {
        toast(`Complaint ${id} is now unassigned`);
        return;
      }

      if (currentUserId && String(currentUserId) === String(assigneeId)) {
        toast.success(`Complaint ${id} assigned to you`);
      } else {
        toast(`Complaint ${id} assigned to ${assigneeName}`);
      }
    };

    const handleMockEvent = (evt) => {
      const { event, payload } = evt.detail || {};
      if (!event) return;
      if (event === "complaint:new") handleNewComplaint(payload);
      if (event === "complaint:status") handleStatusChange(payload);
      if (event === "complaint:assignment") handleAssignment(payload);
    };

    window.addEventListener("mock:socket", handleMockEvent);
    // Ensure clean shutdown on page unload/navigation
    const handleBeforeUnload = () => {
      disconnectSocket();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    socket.on("complaint:new", handleNewComplaint);
    socket.on("complaint:status", handleStatusChange);
    socket.on("complaint:assignment", handleAssignment);

    return () => {
      window.removeEventListener("mock:socket", handleMockEvent);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.off("complaint:new", handleNewComplaint);
      socket.off("complaint:status", handleStatusChange);
      socket.off("complaint:assignment", handleAssignment);
      disconnectSocket();
    };
  }, [user]);

  return null;
};

export default SocketListener;
