import React, { useState, useEffect, useRef, useContext } from "react";
import "../styles/ComplaintChat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast } from "react-hot-toast";
import {
  faInfoCircle,
  faFile,
  faFilePdf,
  faImage,
  faTimes,
  faSmile,
  faPaperclip,
  faPaperPlane,
  faArrowUp,
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
import { NotificationService } from "../utils/NotificationService";

const ComplaintChat = () => {
  const { reportId, chatroomId } = useParams();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminIds, setAdminIds] = useState(new Set());
  const [adminProfiles, setAdminProfiles] = useState(new Map()); 
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [hasFetchedMessages, setHasFetchedMessages] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
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

  // Handle scroll to show/hide back-to-top button (supports window or container scroll)
  useEffect(() => {
    const container = chatContainerRef.current;

    const computeShouldShow = () => {
      const containerScrollable = !!container && container.scrollHeight > container.clientHeight;
      if (containerScrollable) {
        const scrollTop = container.scrollTop;
        const shouldShow = scrollTop > 150;

        setShowBackToTop(shouldShow);
      } else {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const shouldShow = scrollTop > 150;

        setShowBackToTop(shouldShow);
      }
    };

    // Initial check
    computeShouldShow();

    const containerHandler = () => computeShouldShow();
    const windowHandler = () => computeShouldShow();

    if (container) {
      container.addEventListener('scroll', containerHandler, { passive: true });
    }
    window.addEventListener('scroll', windowHandler, { passive: true });

    return () => {
      if (container) container.removeEventListener('scroll', containerHandler);
      window.removeEventListener('scroll', windowHandler);
    };
  }, []);

  const scrollToTop = () => {
    const container = chatContainerRef.current;
    const containerScrollable = container && container.scrollHeight > container.clientHeight;
    if (containerScrollable && container.scrollTop > 0) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

  // 🔄 Poll for new messages from partner API every 3 seconds
  useEffect(() => {
    if (!reportId || !chatroomId || !hasFetchedMessages) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await getChatMessages(reportId, chatroomId);
        
        let chats = [];
        if (response?.chat) {
          chats = Array.isArray(response.chat) ? response.chat : [response.chat];
        } else if (response?.chats) {
          chats = Array.isArray(response.chats) ? response.chats : [response.chats];
        } else if (Array.isArray(response)) {
          chats = response;
        }

        if (chats.length === 0) return;

        // Map the fetched messages
        const getAvatar = (senderId) => {
          if (adminIds.has(senderId)) {
            const adminProfile = adminProfiles.get(senderId);
            if (adminProfile?.profileImage) {
              return adminProfile.profileImage.startsWith('http')
                ? adminProfile.profileImage
                : `${((process.env.REACT_APP_API_BASE_URL).replace(/\/$/, "")).replace(/\/admin$/, "")}${adminProfile.profileImage}`;
            }
            return man;
          }
          return profile;
        };

        const mapped = chats.map((c, idx) => {
          const single = c.attachment;
          const plural = Array.isArray(c.attachments) ? c.attachments : [];

          const normalizedAttachments = single
            ? [{
                url: single.url,
                type: single.type,
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

        // Update messages if there are new ones (compare by ID or timestamp)
        setMessages((prevMessages) => {
          // Create a set of existing message IDs/timestamps to avoid duplicates
          const existingIds = new Set(prevMessages.map(m => m.id || m.createdAt));
          const newMessages = mapped.filter(m => !existingIds.has(m.id || m.createdAt));
          
          if (newMessages.length > 0) {
            console.log(`📨 Polling: Found ${newMessages.length} new message(s)`);
            
            // Show notification for each new message (excluding system messages)
            newMessages.forEach(msg => {
              if (!msg.system && msg.content) {
                const senderName = msg.senderName || (msg.isAdmin ? "Admin" : complaint?.username || "User");
                NotificationService.showNewMessageNotification(senderName, msg.content);
              }
            });
            
            return [...prevMessages, ...newMessages];
          }
          return prevMessages;
        });
      } catch (error) {
        console.warn("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [reportId, chatroomId, hasFetchedMessages, adminIds, adminProfiles]);

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
  useChatUpdates(
    {
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
    },
    {
      showNotifications: true,
      reportDisplayId: complaint?.displayId || reportId,
    }
  );

  const handleSendMessage = async () => {
    // Check if complaint is in a terminal state (Resolved or Closed)
    const complaintStatus = complaint?.status?.toLowerCase();
    const isTerminalStatus = complaintStatus === 'resolved' || complaintStatus === 'closed';
    
    if (isTerminalStatus) {
      toast.error(`Cannot send messages - this complaint is ${complaint.status}. The chatroom is read-only.`);
      return;
    }

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
    content: message, 
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
  
        const receiverId = complaint?.userId || "student-001";
        
        const hasFiles = attachmentsToSend && attachmentsToSend.length > 0 && attachmentsToSend[0] instanceof File;
        let uploadedAttachments = [];
        
        if (hasFiles) {
          try {
            // Upload files to Cloudinary via backend
            console.log("📤 Uploading files to Cloudinary...");
            setUploadingAttachments(true);
            const uploadForm = new FormData();
            attachmentsToSend.forEach((file) => uploadForm.append("files", file));
            
            // Upload to Cloudinary endpoint
            const uploadResponse = await api.post("/upload/cloudinary", uploadForm);
            
            uploadedAttachments = uploadResponse.data?.files || [];
            console.log("✅ Files uploaded to Cloudinary successfully:", uploadedAttachments);
            setUploadingAttachments(false);
            
            if (!uploadedAttachments.length) {
              throw new Error('No files returned from Cloudinary upload');
            }
          } catch (uploadErr) {
            console.error("❌ File upload to Cloudinary failed:", uploadErr);
            setUploadingAttachments(false);
            const errorMsg = uploadErr.response?.data?.error || uploadErr.message || 'File upload failed';
            toast.error(`Failed to upload to Cloudinary: ${errorMsg}`);
            // Continue with message send even if file upload fails
          }
        }
        
        // Build payload with senderId, receiverId, and optional attachment
        // Partner API schema: { senderId, receiverId, message?, attachment? }
        // attachment: { url (required), type: "image"|"video"|"pdf" (required) }
        
        // Helper to map MIME type to partner API type enum
        const getMimeTypeCategory = (mimeType) => {
          if (!mimeType) return null;
          if (mimeType.startsWith('image/')) return 'image';
          if (mimeType.startsWith('video/')) return 'video';
          if (mimeType.includes('pdf')) return 'pdf';
          return null; // Unsupported type
        };
        
        // If we have files, send message with first attachment only
        // (Partner API accepts one attachment per message)
        if (uploadedAttachments.length > 0) {

          const firstFile = uploadedAttachments[0];
          const attachmentType = getMimeTypeCategory(firstFile.mimetype);
          
          if (attachmentType) {
            // Send with attachment
            const payload = {
              senderId: currentUserId,
              receiverId: receiverId,
              message: newMessage.message || undefined, // Only include if not empty
              attachment: {
                url: firstFile.url || firstFile.path,
                type: attachmentType,
              },
            };
            // Remove undefined fields to match strict schema
            if (!payload.message) delete payload.message;
            
            const response = await sendMessage(reportId, roomId, payload);
            console.log("✅ Message sent successfully - Response:", response);
            
            // Queue remaining files as separate messages without text
            for (let i = 1; i < uploadedAttachments.length; i++) {
              const file = uploadedAttachments[i];
              const fileType = getMimeTypeCategory(file.mimetype);
              if (fileType) {
                const followUpPayload = {
                  senderId: currentUserId,
                  receiverId: receiverId,
                  attachment: {
                    url: file.url || file.path,
                    type: fileType,
                  },
                };
                await sendMessage(reportId, roomId, followUpPayload);
                console.log("📎 Additional file sent");
              }
            }
            
            // Update the message with the actual chat ID from backend
            if (response?.chat) {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].id === newMessage.id) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    ...response.chat,
                    content: response.chat.message || updated[lastIndex].content,
                    message: response.chat.message || updated[lastIndex].message,
                  };
                }
                return updated;
              });
            }
          } else {
            // Unsupported file type - send message without attachment
            console.warn("⚠️ Unsupported file type, sending message without attachment");
            const payload = {
              senderId: currentUserId,
              receiverId: receiverId,
              message: newMessage.message,
            };
            const response = await sendMessage(reportId, roomId, payload);
            console.log("✅ Message sent successfully (without attachment) - Response:", response);
            
            if (response?.chat) {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].id === newMessage.id) {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    ...response.chat,
                    content: response.chat.message || updated[lastIndex].content,
                    message: response.chat.message || updated[lastIndex].message,
                  };
                }
                return updated;
              });
            }
          }
        } else {
          // No files - just send message
          const payload = {
            senderId: currentUserId,
            receiverId: receiverId,
            message: newMessage.message,
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
    
    // For Cloudinary URLs, ensure they have the fl_attachment flag for proper downloads
    let downloadUrl = attachment.url;
    if (downloadUrl.includes('cloudinary.com') && !downloadUrl.includes('fl_attachment')) {
      const urlParts = downloadUrl.split('/upload/');
      if (urlParts.length === 2) {
        downloadUrl = urlParts[0] + '/upload/fl_attachment/' + urlParts[1];
      }
    }
    
    // For PDFs from Cloudinary, open in new tab to allow browser viewing or downloading
    if (contentType.includes('pdf') && downloadUrl.includes('cloudinary.com')) {
      // Create URL with fl_attachment for download or viewer can choose to view
      window.open(downloadUrl, '_blank');
      return;
    }
    
    // Fetch and download the file
    fetch(downloadUrl)
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
        window.open(downloadUrl, '_blank');
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

  const complaintStatus = complaint?.status?.toLowerCase();
  const isTerminalStatus = complaintStatus === 'resolved' || complaintStatus === 'closed';

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

      {/* Read-Only Banner for Resolved/Closed Complaints */}
      {isTerminalStatus && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-yellow-800">
            <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-600" />
            <span className="text-sm font-medium">
              This chatroom is read-only because the complaint status is <strong>{complaint.status}</strong>. You can view messages but cannot send new ones.
            </span>
          </div>
        </div>
      )}

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
                  {uploadingAttachments ? (
                    <span className="mr-2 animate-spin">
                      <svg className="w-4 h-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) : (
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
                  )}
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                  {uploadingAttachments ? (
                    <span className="ml-2 text-xs text-blue-600">Uploading...</span>
                  ) : (
                    <button
                      onClick={() => removeAttachment(index)}
                      className="!rounded-button whitespace-nowrap ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end rounded-2xl bg-[#F8FAFC] overflow-visible shadow-sm border-0">
            <div className="relative">
              <button
                ref={emojiButtonRef}
                onClick={() => {
                  const complaintStatus = complaint?.status?.toLowerCase();
                  const isTerminalStatus = complaintStatus === 'resolved' || complaintStatus === 'closed';
                  if (isTerminalStatus) {
                    toast.error(`Cannot send messages - this complaint is ${complaint.status}. The chatroom is read-only.`);
                    return;
                  }
                  setShowEmojiPicker(!showEmojiPicker);
                }}
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
              onClick={() => {
                const complaintStatus = complaint?.status?.toLowerCase();
                const isTerminalStatus = complaintStatus === 'resolved' || complaintStatus === 'closed';
                if (isTerminalStatus) {
                  toast.error(`Cannot send attachments - this complaint is ${complaint.status}. The chatroom is read-only.`);
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="!rounded-button whitespace-nowrap p-3 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
            </button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={complaint?.status?.toLowerCase() === 'resolved' || complaint?.status?.toLowerCase() === 'closed'}
              className="flex-1 py-3 px-4 focus:outline-none text-gray-700 resize-none border-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder={complaint?.status?.toLowerCase() === 'resolved' || complaint?.status?.toLowerCase() === 'closed' ? `Chatroom is read-only (${complaint.status})` : "Type a message..."}
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

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-32 right-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-3 shadow-2xl transition-all duration-300 z-[9999] hover:scale-110 border-2 border-white"
        aria-label="Back to top"
        style={{ 
          boxShadow: '0 10px 40px rgba(37, 99, 235, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.8)',
          width: '48px',
          height: '48px'
        }}
      >
        <FontAwesomeIcon icon={faArrowUp} className="text-xl" />
      </button>

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
