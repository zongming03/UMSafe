import { useEffect, useCallback } from "react";
import { getSocket } from "../services/socket";

/**
 * Custom hook to listen for real-time chat updates via Socket.IO
 * @param {string} reportId - The complaint/report ID
 * @param {string} chatroomId - The chatroom ID
 * @param {Function} onNewMessage - Callback when new message is received
 * @param {Function} onMessageDelivered - Callback when message is delivered
 */
export const useChatUpdates = ({
  reportId,
  chatroomId,
  onNewMessage,
  onMessageDelivered,
}) => {
  const handleNewMessage = useCallback(
    (payload) => {
      if (onNewMessage) onNewMessage(payload);
    },
    [onNewMessage]
  );

  const handleMessageDelivered = useCallback(
    (payload) => {
      if (onMessageDelivered) onMessageDelivered(payload);
    },
    [onMessageDelivered]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !reportId || !chatroomId) return;

    // Listen for new messages in the current chatroom
    const messageEventName = `chat:${reportId}:${chatroomId}:new-message`;
    const deliveryEventName = `chat:${reportId}:${chatroomId}:message-delivered`;

    socket.on(messageEventName, handleNewMessage);
    socket.on(deliveryEventName, handleMessageDelivered);

    // Also listen for general chat events as fallback
    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:message-delivered", handleMessageDelivered);

    return () => {
      socket.off(messageEventName, handleNewMessage);
      socket.off(deliveryEventName, handleMessageDelivered);
      socket.off("chat:new-message", handleNewMessage);
      socket.off("chat:message-delivered", handleMessageDelivered);
    };
  }, [reportId, chatroomId, handleNewMessage, handleMessageDelivered]);
};
