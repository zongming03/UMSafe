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
import { getChatMessages, sendMessage, initiateChatroom } from "../services/api.js";
import { AuthContext } from "../context/AuthContext";
import LoadingOverlay from "../components/LoadingOverlay";
import partnerSample from "../mock/partnerChatSample";
import { getMockChatroomData } from "../mock/mockChatData";

const ComplaintChat = () => {
  const { reportId, chatroomId } = useParams();

  console.log("🔍 ComplaintChat Params - reportId:", reportId, "chatroomId:", chatroomId);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [adminIds, setAdminIds] = useState(new Set());
  const [adminProfiles, setAdminProfiles] = useState(new Map()); 
    const [currentUserProfile, setCurrentUserProfile] = useState(null); // Full profile data with latest profileImage
  const location = useLocation();
  const navigate = useNavigate();
  const complaint = location.state;
  const { user: currentUser } = useContext(AuthContext);

  console.log("ComplaintChat - complaint:", complaint);

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
        const res = await fetch("http://localhost:5000/admin/usersMobile/users", {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const admins = data.data || [];
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
    const fetchMessages = async () => {
      console.log("🚀 Fetching messages for reportId:", reportId, "chatroomId:", chatroomId);
      try {
        // Helper function to get avatar for a sender
        const getAvatar = (senderId) => {
          if (adminIds.has(senderId)) {
            const adminProfile = adminProfiles.get(senderId);
            if (adminProfile?.profileImage) {
              // Check if it's a Cloudinary URL (starts with http) or local path
              return adminProfile.profileImage.startsWith('http') 
                ? adminProfile.profileImage 
                : `http://localhost:5000${adminProfile.profileImage}`;
            }
            return man; // fallback to default admin avatar
          }
          return profile; // student avatar
        };

        // Development mode: no ids at all -> show full partner sample for UI review
        if (!reportId && !chatroomId) {
          const mapped = partnerSample.chats.map((c) => ({
            ...c,
            timestamp: c.createdAt,
            content: c.message,
            isAdmin: adminIds.has(c.senderId),
            avatar: getAvatar(c.senderId),
          }));
          setMessages(mapped);
          setLoading(false);
          return;
        }

        // If we have a reportId but no chatroomId the chat hasn't started yet.
        // Show the initial system starter message so the UI indicates the conversation context.
        if (!chatroomId) {
          const systemMsg =
            partnerSample.chats.find((c) => c.system) || partnerSample.chats[0];
          const mapped = [
            {
              ...systemMsg,
              timestamp: systemMsg?.createdAt,
              content: systemMsg?.message,
              isAdmin: adminIds.has(systemMsg?.senderId),
              avatar: getAvatar(systemMsg?.senderId),
            },
          ];
          setMessages(mapped);
          setLoading(false);
          return;
        }

        // Check if this is a mock chatroom (FAKE-ROOM-*)
        console.log("🔍 Checking chatroomId:", chatroomId, "Type:", typeof chatroomId);
        console.log("🔍 Does it start with FAKE-ROOM-?", chatroomId && chatroomId.startsWith("FAKE-ROOM-"));
        
        if (chatroomId && chatroomId.startsWith("FAKE-ROOM-")) {
          console.log("📦 Using mock chat data for:", chatroomId);
          const mockData = getMockChatroomData(chatroomId);
          console.log("📋 Mock data retrieved:", mockData);
          
          if (mockData && mockData.chats) {
            const mapped = mockData.chats.map((c) => ({
              ...c,
              timestamp: c.createdAt || c.updatedAt,
              content: c.message || c.content,
              isAdmin: adminIds.has(c.senderId),
              avatar: getAvatar(c.senderId),
            }));
            console.log("✅ Loaded", mapped.length, "mock messages");
            setMessages(mapped);
            setLoading(false);
            return;
          } else {
            console.log("⚠️ No mock data found for:", chatroomId);
          }
        }

        // Real chatroom - fetch from API
        const response = await getChatMessages(reportId, chatroomId);
        const chats =
          response?.chats ||
          (response?.chat ? (Array.isArray(response.chat) ? response.chat : [response.chat]) : []);
        const mapped = chats.map((c) => ({
          ...c,
          timestamp: c.createdAt || c.updatedAt,
          content: c.message || c.content,
          isAdmin: adminIds.has(c.senderId),
          avatar: getAvatar(c.senderId),
        }));
        setMessages(mapped);
      } catch (error) {
        console.error("Failed to load messages:", error);
        
        // Try mock data first if it's a FAKE-ROOM
        const getAvatar = (senderId) => {
          if (adminIds.has(senderId)) {
            const adminProfile = adminProfiles.get(senderId);
            if (adminProfile?.profileImage) {
              return adminProfile.profileImage.startsWith('http') 
                ? adminProfile.profileImage 
                : `http://localhost:5000${adminProfile.profileImage}`;
            }
            return man;
          }
          return profile;
        };

        if (chatroomId && chatroomId.startsWith("FAKE-ROOM-")) {
          const mockData = getMockChatroomData(chatroomId);
          if (mockData && mockData.chats) {
            const mapped = mockData.chats.map((c) => ({
              ...c,
              timestamp: c.createdAt,
              content: c.message,
              isAdmin: adminIds.has(c.senderId),
              avatar: getAvatar(c.senderId),
            }));
            setMessages(mapped);
            setLoading(false);
            return;
          }
        }

        // Final fallback to partner sample
        const mapped = partnerSample.chats.map((c) => ({
          ...c,
          timestamp: c.createdAt,
          content: c.message,
          isAdmin: adminIds.has(c.senderId),
          avatar: getAvatar(c.senderId),
        }));
        setMessages(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [reportId, chatroomId, adminIds, adminProfiles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // cleanup local object URLs when component unmounts or attachments change
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
        const res = await initiateChatroom(reportId);
        roomId = res?.chatroom?.id;
        if (roomId) {
          // update URL so route param contains the new chatroomId and location.state carries updated complaint
          const updatedComplaint = { ...(complaint || {}), chatroomId: roomId };
          navigate(`/complaints/${reportId}/${roomId}`, { state: updatedComplaint });
        }
      }

        if (roomId) {
        // send message to backend; if attachmentsToSend contains File objects, send as FormData
        const hasFiles = attachmentsToSend && attachmentsToSend.length > 0 && attachmentsToSend[0] instanceof File;
        if (hasFiles) {
          const form = new FormData();
          form.append("message", newMessage.message);
          // append files with key 'files' (backend should read from req.files.files or similar)
          attachmentsToSend.forEach((file) => form.append("files", file));
          await sendMessage(reportId, roomId, form);
        } else {
          // Attachments are metadata only (no file objects)
          const payload = {
            message: newMessage.message,
            attachments: newMessage.attachments,
          };
          await sendMessage(reportId, roomId, payload);
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

  const emojis = [
    "😁","😂","🤣","😃","😄","😅","😆","😉","😊","😇","🙂","🙃","😍","😘","😗","😙","😚","😋","😜","😝","😛","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","🔥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","😎","🤓","🧐","😕","😟","🙁","☹️","😯","😳","😦","😧","😨","😰","😢","😭","😱","😖","😣","😞","😓","😩","😫","😤","😡","😠","🤬","💀","☠️","💩","🤡","👹","👺","👻","👽","🤖","💋","💌","💘","💝","💖","💗","💓","💕","💞","💐","🌸","🌹","🌺","🌻","🌼","🌷","🌱","🌿","🍀","🌵","🎄","🌴","🌲","🌳","🌾","🍁","🍂","🍃","☀️","🌤️","⛅","🌥️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","⚡","🔥","💧","🌊","⭐","🌟","✨","⚽","🏀","🏈","⚾","🎾","🏐","🎱","🏓","🏸","🥅","🏒","🏑","🏏","🎯","🎲","🎮","🎧","🎤","🎵","🎶","🎷","🎸","🎹","�","📷","🎬","🎨","✈️","🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚲","🚂","🚀","🛸","🛰️"
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <ComplaintChatHeader
        complaintId={complaint?.id || partnerSample.report?.id || "#CMP-1084"}
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
                                : `http://localhost:5000${currentUserProfile.profileImage}`)
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
                        <p className="text-sm">{msg.content || msg.message}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachment, index) => {
                              const fileBoxClass = isOutgoing
                                ? "flex items-center p-2 rounded bg-blue-700 text-white cursor-pointer"
                                : "flex items-center p-2 rounded bg-gray-100 text-gray-800";
                              const linkClass = isOutgoing
                                ? "text-xs text-white hover:underline cursor-pointer"
                                : "text-xs text-blue-600 hover:underline";

                              return (
                                <div key={index} className="flex items-center gap-2">
                                  {attachment.url ? (
                                   
                                    attachment.type && attachment.type.startsWith("image") ? (
                                      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={isOutgoing ? "rounded-md overflow-hidden ring-2 ring-white cursor-pointer" : "rounded-md overflow-hidden"}>
                                        <img src={attachment.url} alt={attachment.name} className="h-28 rounded-md object-cover" />
                                      </a>
                                    ) : (
                                      
                                      attachment._local ? (
                                        <div
                                          className={fileBoxClass}
                                          onClick={() => {
                                            if (attachment.url) window.open(attachment.url, "_blank", "noopener noreferrer");
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faFile} className="mr-2" />
                                          <span className="text-xs truncate">{attachment.name}</span>
                                        </div>
                                      ) : (
                                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={linkClass} download>
                                          {attachment.name || attachment.url}
                                        </a>
                                      )
                                    )
                                  ) : (
                                    <div className={fileBoxClass}>
                                      <FontAwesomeIcon icon={faFile} className="mr-2" />
                                      <span className="text-xs truncate">{attachment.name}</span>
                                    </div>
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
    </div>
  );
};

export default ComplaintChat;
