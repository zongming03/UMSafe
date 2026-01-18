import { useEffect, useCallback } from "react";
import { getSocket, isSocketConnected, initSocket } from "../services/socket";
import { NotificationService } from "../utils/NotificationService";

/**
 * Custom hook to listen for real-time chat updates via Socket.IO
 * @param {string} reportId - The complaint/report ID
 * @param {string} chatroomId - The chatroom ID
 * @param {Function} onNewMessage - Callback when new message is received
 * @param {Function} onMessageDelivered - Callback when message is delivered
 * @param {Object} options - Additional options
 * @param {boolean} options.showNotifications - Whether to show toast notifications (default: true)
 * @param {string} options.reportDisplayId - Display ID of the report to show in notification
 */
export const useChatUpdates = (
  {
    reportId,
    chatroomId,
    onNewMessage,
    onMessageDelivered,
  },
  { showNotifications = true, reportDisplayId = "" } = {}
) => {
  const handleNewMessage = useCallback(
    (payload) => {
      console.log("📨 Chat message received via socket:", payload);
      // Show notification for new message
      if (showNotifications && payload.message && !payload.system) {
        const displayName = reportDisplayId ? `Complaint #${reportDisplayId}` : "New message";
        NotificationService.showNewMessageNotification(
          displayName,
          payload.message
        );
      }
      
      if (onNewMessage) onNewMessage(payload);
    },
    [onNewMessage, showNotifications, reportDisplayId]
  );

  const handleMessageDelivered = useCallback(
    (payload) => {
      if (onMessageDelivered) onMessageDelivered(payload);
    },
    [onMessageDelivered]
  );

  useEffect(() => {
    let socket = getSocket();
    
    // If socket doesn't exist, try to get token and initialize it
    if (!socket || !isSocketConnected()) {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        console.log("🔄 Socket not connected, attempting to initialize...");
        socket = initSocket(token);
      }
    }
    
    if (!socket || !reportId || !chatroomId) {
      console.warn("⚠️ Cannot setup chat listeners - socket not connected or missing reportId/chatroomId");
      return;
    }

    console.log(`📡 Setting up chat listeners for report ${reportId}, chatroom ${chatroomId}`);

    // Listen for new messages in the current chatroom
    const messageEventName = `chat:${reportId}:${chatroomId}:new-message`;
    const deliveryEventName = `chat:${reportId}:${chatroomId}:message-delivered`;

    socket.on(messageEventName, handleNewMessage);
    socket.on(deliveryEventName, handleMessageDelivered);

    // Also listen for general chat events as fallback
    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:message-delivered", handleMessageDelivered);

    console.log(`✅ Chat listeners registered for report ${reportId}`);

    return () => {
      if (socket) {
        socket.off(messageEventName, handleNewMessage);
        socket.off(deliveryEventName, handleMessageDelivered);
        socket.off("chat:new-message", handleNewMessage);
        socket.off("chat:message-delivered", handleMessageDelivered);
      }
    };
  }, [reportId, chatroomId, handleNewMessage, handleMessageDelivered]);
};

