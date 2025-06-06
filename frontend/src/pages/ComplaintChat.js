import React, { useState, useEffect, useRef } from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import "../styles/ComplaintChat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInfoCircle,
  faFile,
  faCheckDouble,
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

const ComplaintChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      content: "Conversation started regarding complaint #CMP-1084",
      timestamp: "2025-05-24 09:30",
      attachments: [],
    },
    {
      id: 2,
      sender: "student",
      name: "Michael Chen",
      content:
        "Hello, I wanted to follow up on my complaint about the heating in my room. It's been 3 days now and the temperature is still below 60°F at night. It's really difficult to study or sleep.",
      timestamp: "2025-05-24 09:32",
      avatar: profile,
      read: true,
      attachments: [],
    },
    {
      id: 3,
      sender: "staff",
      name: "John Smith",
      content:
        "Hi Michael, I'm sorry to hear about the continued issues with your heating. I've escalated this to our maintenance team and they've scheduled a visit to your room tomorrow morning between 9-11 AM. Will you be available during that time?",
      timestamp: "2025-05-24 10:15",
      avatar: man,
      read: true,
      attachments: [],
    },
    {
      id: 4,
      sender: "student",
      name: "Michael Chen",
      content:
        "Yes, I'll be in class from 8-9:30 AM but I can be back in my room by 9:45 AM. Thank you for the quick response!",
      timestamp: "2025-05-24 10:22",
      avatar: profile,
      read: true,
      attachments: [],
    },
    {
      id: 5,
      sender: "staff",
      name: "John Smith",
      content:
        "Perfect, I'll let the maintenance team know. They'll aim to arrive around 10 AM. I've also arranged for a portable heater to be delivered to your room this evening as a temporary solution. Please let me know if you don't receive it by 6 PM.",
      timestamp: "2025-05-24 10:30",
      avatar: man,
      read: true,
      attachments: [],
    },
    {
      id: 6,
      sender: "student",
      name: "Michael Chen",
      content: "I received the portable heater, thank you! It's helping a lot.",
      timestamp: "2025-05-24 18:45",
      avatar: profile,
      read: true,
      attachments: [],
    },
    {
      id: 7,
      sender: "staff",
      name: "John Smith",
      content:
        "Great! The maintenance team will see you tomorrow at 10 AM. Have a good night.",
      timestamp: "2025-05-24 19:05",
      avatar: man,
      read: true,
      attachments: [],
    },
  ]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // Handle click outside emoji picker and menu
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
  const handleSendMessage = ({
    sender = "staff",
    name = "John Smith",
    avatar = man,
  } = {}) => {
    if (message.trim() || attachments.length > 0) {
      const newMessage = {
        id: messages.length + 1,
        sender,
        name,
        content: message,
        timestamp: new Date()
          .toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replace(",", ""),
        avatar,
        attachments: attachments.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
        read: false,
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      setAttachments([]);
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
    "😊",
    "👍",
    "🙏",
    "👋",
    "🔥",
    "❤️",
    "👀",
    "🎉",
    "👏",
    "🤔",
    "😂",
    "😢",
    "😡",
    "🤝",
    "⏰",
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Chat Header */}
      <ComplaintChatHeader
        complaintId="#CMP-1084"
        studentName="Michael Chen"
        complaintTitle="Dormitory Heating Problem"
        lastActive="Last active: 10 minutes ago"
        onBack={() => {
          /* handle back navigation */
        }}
      />

      {/* Main Chat Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "system"
                  ? "justify-center"
                  : msg.sender === "staff"
                  ? "justify-end"
                  : "justify-start"
              } mb-6`}
            >
              {msg.sender === "system" ? (
                <div className="bg-[#F3F4F6] px-4 py-3 rounded-2xl text-sm text-gray-600 max-w-md backdrop-blur-sm bg-opacity-80">
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                    <span>{msg.content}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {msg.timestamp}
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${
                    msg.sender === "staff" ? "flex-row-reverse" : "flex-row"
                  } max-w-md`}
                >
                  <div className="flex-shrink-0">
                    <img
                      src={msg.avatar}
                      alt={msg.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </div>
                  <div
                    className={`mx-2 ${
                      msg.sender === "staff" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`px-6 py-4 rounded-2xl inline-block shadow-sm ${
                        msg.sender === "staff"
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                          : "bg-white text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className={`flex items-center p-2 rounded ${
                                msg.sender === "staff"
                                  ? "bg-blue-700"
                                  : "bg-gray-100"
                              }`}
                            >
                              <FontAwesomeIcon icon={faFile} className="mr-2" />
                              <span className="text-xs truncate">
                                {attachment.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span>{msg.timestamp}</span>
                      {msg.sender === "staff" && (
                        <span className="ml-2 flex items-center">
                          <FontAwesomeIcon
                            icon={faCheckDouble}
                            className={
                              msg.read ? "text-blue-500" : "text-gray-400"
                            }
                          />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
          <div className="flex items-end rounded-2xl bg-[#F8FAFC] overflow-hidden shadow-sm border-0">
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
                  className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-10"
                >
                  <div className="grid grid-cols-5 gap-1">
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
      <Footer />
    </div>
  );
};

export default ComplaintChat;
