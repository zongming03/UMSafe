import React, { useState, useEffect, useRef, useContext } from "react";
import "../styles/ComplaintChat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faFile,
  faFilePdf,
  faImage,
  faTimes,
  faSmile,
  faPaperclip,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import profile from "../assets/profile.png";
import man from "../assets/man.png";
import ComplaintChatHeader from "../components/ComplaintChatHeader";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getChatMessages, sendMessage, initiateChatroom } from "../services/reportsApi.js";
import api from "../services/api.js"; 
import { AuthContext } from "../context/AuthContext";
import LoadingOverlay from "../components/LoadingOverlay";
import { useChatUpdates } from "../hooks/useChatUpdates";

const ComplaintChat = () => {
  const { reportId, chatroomId } = useParams();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [adminIds, setAdminIds] = useState(new Set());
  const [adminProfiles, setAdminProfiles] = useState(new Map()); 
  const [currentUserProfile, setCurrentUserProfile] = useState(null); // Full profile data with latest profileImage
  const [hasFetchedMessages, setHasFetchedMessages] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const complaint = location.state;
  const { user: currentUser } = useContext(AuthContext);

  // Format date/time as 'YYYY-MM-DD HH:MM:SS'
  const formatDateTimeYYYYMMDD_HHMMSS = (input) => {
    if (!input) return "";
    const d = new Date(input);
    if (isNaN(d)) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };


  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const localObjectUrlsRef = useRef([]);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const res = await api.get("/mobile/users");
        const admins = res.data?.data || res.data || [];
        const ids = new Set(admins.map((a) => a._id || a.id));
        const profileMap = new Map(admins.map((a) => [a._id || a.id, a]));
        setAdminIds(ids);
        setAdminProfiles(profileMap);
        
        // Find current user's profile data from the fetched admins
        const currentUserId = currentUser?.id || currentUser?._id;
        if (currentUserId) {
          const currentProfile = admins.find((a) => (a._id || a.id) === currentUserId);
          if (currentProfile) {
            setCurrentUserProfile(currentProfile);
          }
        }
      } catch (err) {
        console.warn("Could not load admin list:", err);
      }
    };
    loadAdmins();
  }, [currentUser]);

  useEffect(() => {
    // Only fetch messages once when admins are loaded and chatroomId is available
    if (hasFetchedMessages || adminIds.size === 0) return;

    const fetchMessages = async () => {
      try {
        // Helper function to get avatar for a sender
        const getAvatar = (senderId) => {
          if (adminIds.has(senderId)) {
            const adminProfile = adminProfiles.get(senderId);
            if (adminProfile?.profileImage) {
              // Check if it's a Cloudinary URL (starts with http) or local path
              return adminProfile.profileImage.startsWith('http') 
                ? adminProfile.profileImage 
                : `${((process.env.REACT_APP_API_BASE_URL).replace(/\/$/, "")).replace(/\/admin$/, "")}${adminProfile.profileImage}`;
            }
            return man; // fallback to default admin avatar
          }
          return profile; // student avatar
        };

        // If we have a reportId but no chatroomId the chat has just been initiated.
        // Show an empty chatroom with a system starter message.
        if (!chatroomId) {
          const now = new Date().toISOString();
          const systemMsg = {
            id: "system-starter",
            senderId: "system",
            message: `Conversation started regarding complaint #${reportId}`,
            createdAt: now,
            system: true,
          };
          const mapped = [
            {
              ...systemMsg,
              timestamp: formatDateTimeYYYYMMDD_HHMMSS(systemMsg.createdAt),
              content: systemMsg.message,
              isAdmin: false,
              avatar: profile,
            },
          ];
          setMessages(mapped);
          setLoading(false);
          return;
        }

        // Fetch live chatroom messages from API
        const response = await getChatMessages(reportId, chatroomId);
        console.log("📨 Chat API response:", response);
        
        // Handle response structure: { chat, chatroom, report }
        let chats = [];
        if (response?.chat) {
          chats = Array.isArray(response.chat) ? response.chat : [response.chat];
        } else if (response?.chats) {
          chats = Array.isArray(response.chats) ? response.chats : [response.chats];
        } else if (Array.isArray(response)) {
          chats = response;
        }
        
        const mapped = chats.map((c, idx) => {
          // Handle both singular attachment and legacy attachments array
          const single = c.attachment;
          const plural = Array.isArray(c.attachments) ? c.attachments : [];

          const normalizedAttachments = single
            ? [{
                url: single.url,
                type: single.type,
                // Give PDFs a friendly name with extension so downloads open correctly
                name: single.name || (single.type?.toLowerCase() === 'pdf' ? `pdf${idx + 1}.pdf` : `${single.type || 'file'}${idx + 1}`),
              }]
            : plural.map((att, aIdx) => ({
                ...att,
                name: att.name || (att.type?.toLowerCase() === 'pdf' ? `pdf${aIdx + 1}.pdf` : `${att.type || 'file'}${aIdx + 1}`),
              }));

          return {
            ...c,
            timestamp: c.createdAt || c.updatedAt,
            content: c.message || c.content,
            isAdmin: adminIds.has(c.senderId),
            avatar: getAvatar(c.senderId),
            attachments: normalizedAttachments,
          };
        });
        setMessages(mapped);
        setHasFetchedMessages(true);
      } catch (error) {
        console.error("Failed to load messages:", error);
        setMessages([]);
        setHasFetchedMessages(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [reportId, chatroomId, adminIds, adminProfiles, hasFetchedMessages]);

  // Reset fetch flag when chatroomId changes
  useEffect(() => {
    setHasFetchedMessages(false);
  }, [chatroomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send system message when chatroom is first opened (has chatroomId and no existing messages except system starter)
  useEffect(() => {
    const sendSystemMessage = async () => {
      if (!reportId || !chatroomId) return; // Only send if both are present
      
      // Check if we should send the system message (only one message and it's the starter)
      const isNewChatroom = messages.length === 1 && messages[0]?.senderId === "system" && messages[0]?.id === "system-starter";
      
      if (!isNewChatroom) return; // Already sent or has other messages
      
      try {
        const systemMessageData = {
          message: `Chatroom opened for complaint #${reportId}. Both parties are now connected.`,
          senderId: "system",
          system: true,
        };
        
        await sendMessage(reportId, chatroomId, systemMessageData);
      } catch (error) {
        console.warn("Failed to send system message:", error);
        // Don't fail the chat if system message fails
      }
    };

    sendSystemMessage();
  }, [reportId, chatroomId, messages]);

  useEffect(() => {
    return () => {
      if (localObjectUrlsRef.current && localObjectUrlsRef.current.length) {
        localObjectUrlsRef.current.forEach((u) => {
          try {
            URL.revokeObjectURL(u);
          } catch (e) {}
        });
        localObjectUrlsRef.current = [];
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Real-time chat updates
  useChatUpdates({
    reportId,
    chatroomId,
    onNewMessage: (payload) => {
      // Add new message to the chat
      const newMessage = {
        id: payload.messageId || `msg-${Date.now()}`,
        senderId: payload.senderId,
        senderName: payload.senderName || "Unknown",
        content: payload.content || payload.message,
        message: payload.content || payload.message,
        timestamp: payload.timestamp || new Date().toISOString(),
        createdAt: payload.timestamp || new Date().toISOString(),
        isAdmin: payload.isAdmin || adminIds.has(payload.senderId),
        avatar: payload.avatar,
        attachments: payload.attachments || [],
        system: false,
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    onMessageDelivered: (payload) => {
      // Update message delivery status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === payload.messageId ? { ...msg, delivered: true } : msg
        )
      );
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;

    const currentUserId =
      currentUser?.id || currentUser?._id || currentUser?.userId || "admin-staff-001";

    // Build optimistic attachments: include local object URL so admin can open before upload
    const optimisticAttachments = attachments.map((file) => {
      try {
        const url = URL.createObjectURL(file);
        localObjectUrlsRef.current.push(url);
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          _local: true,
        };
      } catch (err) {
        return {
          name: file.name,
          size: file.size,
          type: file.type,
        };
      }
    });

    const newMessage = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      isAdmin: true,
      // receiverId could be determined by chatroom participants; keep undefined for backend to resolve
      message: message,
      content: message, // Also include as 'content' for rendering compatibility
      createdAt: new Date().toISOString(),
      attachments: optimisticAttachments,
    };

  // Optimistically append message so UI feels responsive
  setMessages((prev) => [...prev, newMessage]);
  setMessage("");
  // Keep a copy of attachments to send to backend (we'll clear UI attachments right away)
  const attachmentsToSend = attachments.slice();
  setAttachments([]);

    // Persist: if chatroomId missing, create it first
    setIsSending(true);
    try {
      let roomId = chatroomId;
      if (!roomId) {
        // 🔒 VALIDATION: Check if complaint is anonymous before attempting to create chatroom
        if (complaint?.isAnonymous) {
          alert("Chatroom cannot be created for anonymous complaints. The student must be identified first.");
          setIsSending(false);
          // Remove the optimistically added message since we're not sending
          setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
          return;
        }

        const res = await initiateChatroom(reportId);
        roomId = res?.chatroom?.id;
        if (roomId) {
          // update URL so route param contains the new chatroomId and location.state carries updated complaint
          const updatedComplaint = { ...(complaint || {}), chatroomId: roomId };
          navigate(`/complaints/${reportId}/${roomId}`, { state: updatedComplaint });
        }
      }

        if (roomId) {
        // Build payload for partner API (must include senderId and receiverId, no attachments)
        // receiverId is the user who filed the complaint (complaint.userId)
        const receiverId = complaint?.userId || "student-001";
        
        // send message to backend; if attachmentsToSend contains File objects, send as FormData
        const hasFiles = attachmentsToSend && attachmentsToSend.length > 0 && attachmentsToSend[0] instanceof File;
        if (hasFiles) {
          const form = new FormData();
          form.append("message", newMessage.message);
          form.append("senderId", currentUserId);
          form.append("receiverId", receiverId);
          // append files with key 'files' (backend should read from req.files.files or similar)
          attachmentsToSend.forEach((file) => form.append("files", file));
          const response = await sendMessage(reportId, roomId, form);
          console.log("✅ Message sent successfully - Response:", response);
          
          // Update the message with the actual chat ID from backend
          if (response?.chat) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].id === newMessage.id) {
                // Merge the response with the optimistic message, keeping optimistic content as fallback
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  ...response.chat,
                  content: response.chat.message || updated[lastIndex].content, // Ensure content is always available for rendering
                  message: response.chat.message || updated[lastIndex].message,
                };
              }
              return updated;
            });
          }
        } else {
          // Attachments are metadata only (no file objects)
          // Build payload with senderId and receiverId for partner API
          const payload = {
            message: newMessage.message,
            senderId: currentUserId,
            receiverId: receiverId,
          };
          const response = await sendMessage(reportId, roomId, payload);
          console.log("✅ Message sent successfully - Response:", response);
          
          // Update the message with the actual chat ID from backend
          if (response?.chat) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              if (lastIndex >= 0 && updated[lastIndex].id === newMessage.id) {
                // Merge the response with the optimistic message, keeping optimistic content as fallback
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  ...response.chat,
                  content: response.chat.message || updated[lastIndex].content, // Ensure content is always available for rendering
                  message: response.chat.message || updated[lastIndex].message,
                };
              }
              return updated;
            });
          }
        }
      } else {
        console.warn("No chatroomId available after initiation; message not persisted.");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Optionally mark the message as failed in UI (not implemented)
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emoji) => {
    setMessage(message + emoji);
    setShowEmojiPicker(false);
  };

  // Handle file downloads with proper filename and extension
  const handleDownloadAttachment = (attachment) => {
    // Extract file extension from attachment.name or content-type
    let fileName = attachment.name || 'download';
    const contentType = attachment.type || 'application/octet-stream';
    
    // If filename doesn't have an extension, infer from content type
    if (!fileName.includes('.')) {
      if (contentType.includes('pdf')) fileName += '.pdf';
      else if (contentType.includes('image')) {
        const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
        fileName += '.' + ext;
      }
      else if (contentType.includes('video')) {
        const ext = contentType.split('/')[1]?.split(';')[0] || 'mp4';
        fileName += '.' + ext;
      }
      else if (contentType.includes('word')) fileName += '.docx';
      else if (contentType.includes('excel') || contentType.includes('spreadsheet')) fileName += '.xlsx';
      else fileName += '.bin';
    }
    
    // Fetch and download the file
    fetch(attachment.url)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Download failed:', err);
        // Fallback: open in new tab if download fails
        window.open(attachment.url, '_blank');
      });
  };

  // Handle opening video in modal
  const handleOpenVideoModal = (videoAttachment) => {
    setSelectedVideo(videoAttachment);
    setVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setVideoModalOpen(false);
    setSelectedVideo(null);
  };

  const emojis = [
    "😁","😂","🤣","😃","😄","😅","😆","😉","😊","😇","🙂","🙃","😍","😘","😗","😙","😚","😋","😜","😝","😛","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","🔥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😯","😳","😦","😧","😨","😰","😢","😭","😱","😖","😣","😞","😓","😩","😫","😤","😡","😠","🤬","💀","☠️","💩","🤡","👹","👺","👻","👽","🤖","💋","💌","💘","💝","💖","💗","💓","💕","💞","💐","🌸","🌹","🌺","🌻","🌼","🌷","🌱","🌿","🍀","🌵","🎄","🌴","🌲","🌳","🌾","🍁","🍂","🍃","☀️","🌤️","⛅","🌥️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","⚡","🔥","💧","🌊","⭐","🌟","✨","⚽","🏀","🏈","⚾","🎾","🏐","🎱","🏓","🏸","🥅","🏒","🏑","🏏","🎯","🎲","🎮","🎧","🎤","🎵","🎶","🎷","🎸","🎹","�","📷","🎬","🎨","✈️","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚲","🚂","🚀","🛸","🛰️"
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <ComplaintChatHeader
        complaintId={complaint?.displayId || complaint?.id || "ID-Unknown"}
        studentName={
          complaint?.username || "Unknown"
        }
        complaintTitle={complaint?.title || "Complaint Title"}
        /* lastActive removed per request */
        onBack={() => navigate(-1)}
      />

      {/* Main Chat Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {loading && <LoadingOverlay />}
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isSystem = !!msg.system;
            const isAdminSender = !!msg.isAdmin;
            
            const isOutgoing = isAdminSender;

            return (
              <div
                key={msg.id}
                className={`flex ${
                  isSystem ? "justify-center" : isOutgoing ? "justify-end" : "justify-start"
                } mb-6`}
              >
                {isSystem ? (
                  <div className="bg-[#F3F4F6] px-4 py-3 rounded-2xl text-sm text-gray-600 max-w-md backdrop-blur-sm bg-opacity-80">
                    <div className="flex items-center justify-center">
                      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                      <span>{msg.message}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {formatDateTimeYYYYMMDD_HHMMSS(msg.timestamp || msg.createdAt)}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex ${isOutgoing ? "flex-row-reverse" : "flex-row"} max-w-md`}
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={
                          isOutgoing 
                            ? (currentUserProfile?.profileImage 
                              ? (currentUserProfile.profileImage.startsWith('http') 
                                ? currentUserProfile.profileImage 
                                : `${(process.env.REACT_APP_API_BASE_URL).replace(/\/$/, "")}${currentUserProfile.profileImage}`)
                              : man)
                            : (msg.avatar || profile)
                        }
                        alt={msg.senderName || msg.senderId}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </div>
                    <div className={`mx-2 ${isOutgoing ? "text-right" : "text-left"}`}>
                      <div
                        className={`px-6 py-4 rounded-2xl inline-block shadow-sm ${
                          isOutgoing ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white" : "bg-white text-gray-800"
                        }`}
                      >
                        {/* Show message text if not empty */}
                        {(msg.content || msg.message) && (
                          <p className="text-sm">{msg.content || msg.message}</p>
                        )}
                        
                        {/* Show attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`space-y-2 ${(msg.content || msg.message) ? 'mt-3' : ''}`}>
                            {msg.attachments.map((attachment, index) => {
                              const attachmentType = attachment.type?.toLowerCase() || '';
                              
                              return (
                                <div key={index}>
                                  {/* Image attachment */}
                                  {attachmentType === 'image' || attachmentType.startsWith('image') ? (
                                    <a 
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className={isOutgoing ? "block rounded-lg overflow-hidden ring-2 ring-white/50 hover:ring-white transition-all cursor-pointer" : "block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"}
                                    >
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name || 'Image'} 
                                        className="max-w-xs max-h-64 rounded-lg object-cover"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                    </a>
                                  ) : 
                                  /* Video attachment */
                                  attachmentType === 'video' || attachmentType.startsWith('video') ? (
                                    <div 
                                      className="rounded-lg overflow-hidden max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => handleOpenVideoModal(attachment)}
                                      title="Click to view in full screen"
                                    >
                                      <video 
                                        className="w-full max-h-64 rounded-lg bg-black"
                                        preload="metadata"
                                      >
                                        <source src={attachment.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                      </video>
                                    </div>
                                  ) : 
                                  /* PDF and other file attachments */
                                  (
                                    <a 
                                      href="#" 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleDownloadAttachment(attachment);
                                      }}
                                      className={`flex items-center gap-2 p-3 rounded-lg transition-all cursor-pointer ${
                                        isOutgoing 
                                          ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                      }`}
                                    >
                                      <FontAwesomeIcon 
                                        icon={attachmentType === 'pdf' ? faFilePdf : faFile} 
                                        className={`text-lg ${attachmentType === 'pdf' ? 'text-red-500' : ''}`}
                                      />
                                      <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate max-w-[200px]">
                                          {attachment.name || 'Download File'}
                                        </span>
                                        <span className="text-xs opacity-75">
                                          {attachmentType === 'pdf' ? 'PDF Document' : 'File Attachment'}
                                        </span>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span>{formatDateTimeYYYYMMDD_HHMMSS(msg.timestamp || msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input Area */}
      <div className="bg-white border-t border-gray-100 p-6 shadow-lg">
        <div className="max-w-3xl mx-auto">
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 px-3 py-1 rounded-lg border border-gray-200"
                >
                  <span className="mr-2">
                    {file.type.includes("image") ? (
                      <FontAwesomeIcon
                        icon={faImage}
                        className="text-blue-500"
                      />
                    ) : file.type.includes("pdf") ? (
                      <FontAwesomeIcon
                        icon={faFilePdf}
                        className="text-red-500"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={faFile}
                        className="text-gray-500"
                      />
                    )}
                  </span>
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="!rounded-button whitespace-nowrap ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end rounded-2xl bg-[#F8FAFC] overflow-visible shadow-sm border-0">
            <div className="relative">
              <button
                ref={emojiButtonRef}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="!rounded-button whitespace-nowrap p-3 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <FontAwesomeIcon icon={faSmile} className="text-lg" />
              </button>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10 max-h-56 overflow-y-auto w-64"
                >
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        className="!rounded-button whitespace-nowrap p-2 text-xl hover:bg-gray-100 rounded cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="!rounded-button whitespace-nowrap p-3 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
            </button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 py-3 px-4 focus:outline-none text-gray-700 resize-none border-none"
              placeholder="Type a message..."
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            ></textarea>
            <button
              onClick={() => handleSendMessage()}
              disabled={!message.trim() && attachments.length === 0}
              className={`!rounded-button whitespace-nowrap p-3 ${
                message.trim() || attachments.length > 0
                  ? "text-blue-600 hover:text-blue-800"
                  : "text-gray-400"
              } cursor-pointer`}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseVideoModal}
        >
          <div 
            className="bg-black rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">
                {selectedVideo.name || 'Video'}
              </h3>
              <button
                onClick={handleCloseVideoModal}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center">
              <video 
                controls 
                autoPlay
                className="max-w-full max-h-full"
              >
                <source src={selectedVideo.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintChat;
