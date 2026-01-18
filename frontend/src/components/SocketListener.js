import { useContext, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { initSocket, disconnectSocket, getSocket, isSocketConnected } from "../services/socket";

const SocketListener = () => {
  const { user } = useContext(AuthContext);
  const socketInitializedRef = useRef(false);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    
    if (!user || !token) {
      disconnectSocket();
      socketInitializedRef.current = false;
      return undefined;
    }

    // Initialize socket if not already connected
    const socket = initSocket(token);
    
    // If socket initialization failed (e.g., no token), skip event listeners
    if (!socket) {
      return undefined;
    }

    socketInitializedRef.current = true;

    const handleNewComplaint = (payload) => {
      const title = payload?.title ? `: ${payload.title}` : "";
      toast.success(`New complaint ${payload?.complaintId || ""}${title}`);
    };

    const handleStatusChange = (payload) => {
      const id = payload?.complaintId || "complaint";
      const status = payload?.status || "updated";
      console.log(`📊 Complaint #${id} status changed to ${status}`);
    };

    const handleAssignment = (payload) => {
      const id = payload?.displayId || payload?.complaintId || "complaint";
      const assigneeId = payload?.adminId;
      const assigneeName = payload?.adminName || assigneeId || "Unassigned";
      const currentUserId = user?.id || user?._id;

      if (!assigneeId) {
        toast(`Complaint #${id} is now unassigned`);
        return;
      }

      if (currentUserId && String(currentUserId) === String(assigneeId)) {
        toast.success(`Complaint #${id} assigned to you`);
      } else {
        toast(`Complaint #${id} assigned to ${assigneeName}`);
      }
    };

    const handleMockEvent = (evt) => {
      const { event, payload } = evt.detail || {};
      if (!event) return;
      if (event === "complaint:new") handleNewComplaint(payload);
      if (event === "complaint:status") handleStatusChange(payload);
      if (event === "complaint:assignment") handleAssignment(payload);
    };

    // Register event listeners
    window.addEventListener("mock:socket", handleMockEvent);
    
    // Ensure clean shutdown on page unload/navigation
    const handleBeforeUnload = () => {
      disconnectSocket();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Register socket event listeners
    socket.on("complaint:new", handleNewComplaint);
    socket.on("complaint:status", handleStatusChange);
    socket.on("complaint:assignment", handleAssignment);

    // Monitor connection and attempt to reconnect if lost
    const checkConnection = () => {
      if (!isSocketConnected()) {
        console.log("🔄 Socket disconnected, attempting to reinitialize...");
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = setTimeout(() => {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          if (token && user) {
            initSocket(token);
          }
        }, 3000);
      }
    };

    const connectionCheckInterval = setInterval(checkConnection, 5000);

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      clearInterval(connectionCheckInterval);
      window.removeEventListener("mock:socket", handleMockEvent);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      if (socket) {
        socket.off("complaint:new", handleNewComplaint);
        socket.off("complaint:status", handleStatusChange);
        socket.off("complaint:assignment", handleAssignment);
      }
      
      // Don't disconnect socket on component unmount - keep it alive for other components
    };
  }, [user]);

  return null;
};

export default SocketListener;
