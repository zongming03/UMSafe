// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useRef, useEffect } from "react";

const Header = () => (
  <nav className="bg-white shadow-sm border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <img
            src="https://readdy.ai/api/search-image?query=modern%20minimal%20geometric%20logo%20design%20with%20blue%20and%20gray%20colors%20professional%20corporate%20identity%20clean%20simple&width=120&height=40&seq=12&orientation=landscape"
            alt="Logo"
            className="h-8"
          />
          <div className="hidden md:flex items-center space-x-8 ml-10">
            <a
              href="#"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              Dashboard
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              Support
            </a>
            <a
              href="#"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
            >
              Reports
            </a>
            <a href="#" className="text-blue-600 px-3 py-2 text-sm font-medium">
              Messages
            </a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="!rounded-button whitespace-nowrap text-gray-500 hover:text-gray-600">
            <i className="fas fa-bell text-xl"></i>
          </button>
          <button className="!rounded-button whitespace-nowrap text-gray-500 hover:text-gray-600">
            <i className="fas fa-cog text-xl"></i>
          </button>
          <div className="flex items-center space-x-3">
            <img
              src="https://readdy.ai/api/search-image?query=professional%20headshot%20middle%20aged%20man%20with%20short%20brown%20hair%20wearing%20business%20suit%20against%20neutral%20background%20photorealistic%20high%20quality&width=40&height=40&seq=13&orientation=squarish"
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-700">
              John Smith
            </span>
          </div>
        </div>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <img
            src="https://readdy.ai/api/search-image?query=modern%20minimal%20geometric%20logo%20design%20with%20blue%20and%20gray%20colors%20professional%20corporate%20identity%20clean%20simple&width=100&height=32&seq=14&orientation=landscape"
            alt="Logo"
            className="h-6"
          />
          <span className="text-sm text-gray-500">
            © 2025 Support System. All rights reserved.
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Terms of Service
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
            Contact
          </a>
          <div className="flex items-center space-x-4">
            <i className="fab fa-twitter text-gray-400 hover:text-gray-600 cursor-pointer"></i>
            <i className="fab fa-linkedin text-gray-400 hover:text-gray-600 cursor-pointer"></i>
            <i className="fab fa-github text-gray-400 hover:text-gray-600 cursor-pointer"></i>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

const App = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "system",
      content: "Conversation started regarding complaint #CMP-1084",
      timestamp: "2025-05-24 09:30",
    },
    {
      id: 2,
      sender: "student",
      name: "Michael Chen",
      content:
        "Hello, I wanted to follow up on my complaint about the heating in my room. It's been 3 days now and the temperature is still below 60°F at night. It's really difficult to study or sleep.",
      timestamp: "2025-05-24 09:32",
      avatar:
        "https://readdy.ai/api/search-image?query=young%2520asian%2520male%2520college%2520student%2520with%2520short%2520black%2520hair%2520wearing%2520casual%2520clothes%2520professional%2520headshot%2520against%2520neutral%2520background%2520high%2520quality%2520photorealistic%2520portrait&width=40&height=40&seq=10&orientation=squarish",
      read: true,
    },
    {
      id: 3,
      sender: "staff",
      name: "John Smith",
      content:
        "Hi Michael, I'm sorry to hear about the continued issues with your heating. I've escalated this to our maintenance team and they've scheduled a visit to your room tomorrow morning between 9-11 AM. Will you be available during that time?",
      timestamp: "2025-05-24 10:15",
      avatar:
        "https://readdy.ai/api/search-image?query=professional%2520headshot%2520of%2520a%2520middle%2520aged%2520man%2520with%2520short%2520brown%2520hair%2520and%2520glasses%2520wearing%2520a%2520business%2520suit%2520against%2520a%2520neutral%2520background%2520photorealistic%2520high%2520quality%25204k&width=40&height=40&seq=11&orientation=squarish",
      read: true,
    },
    {
      id: 4,
      sender: "student",
      name: "Michael Chen",
      content:
        "Yes, I'll be in class from 8-9:30 AM but I can be back in my room by 9:45 AM. Thank you for the quick response!",
      timestamp: "2025-05-24 10:22",
      avatar:
        "https://readdy.ai/api/search-image?query=young%2520asian%2520male%2520college%2520student%2520with%2520short%2520black%2520hair%2520wearing%2520casual%2520clothes%2520professional%2520headshot%2520against%2520neutral%2520background%2520high%2520quality%2520photorealistic%2520portrait&width=40&height=40&seq=10&orientation=squarish",
      read: true,
    },
    {
      id: 5,
      sender: "staff",
      name: "John Smith",
      content:
        "Perfect, I'll let the maintenance team know. They'll aim to arrive around 10 AM. I've also arranged for a portable heater to be delivered to your room this evening as a temporary solution. Please let me know if you don't receive it by 6 PM.",
      timestamp: "2025-05-24 10:30",
      avatar:
        "https://readdy.ai/api/search-image?query=professional%2520headshot%2520of%2520a%2520middle%2520aged%2520man%2520with%2520short%2520brown%2520hair%2520and%2520glasses%2520wearing%2520a%2520business%2520suit%2520against%2520a%2520neutral%2520background%2520photorealistic%2520high%2520quality%25204k&width=40&height=40&seq=11&orientation=squarish",
      read: true,
    },
    {
      id: 6,
      sender: "student",
      name: "Michael Chen",
      content: "I received the portable heater, thank you! It's helping a lot.",
      timestamp: "2025-05-24 18:45",
      avatar:
        "https://readdy.ai/api/search-image?query=young%2520asian%2520male%2520college%2520student%2520with%2520short%2520black%2520hair%2520wearing%2520casual%2520clothes%2520professional%2520headshot%2520against%2520neutral%2520background%2520high%2520quality%2520photorealistic%2520portrait&width=40&height=40&seq=10&orientation=squarish",
      read: true,
    },
    {
      id: 7,
      sender: "system",
      content: "Maintenance visit scheduled for May 25, 2025, 10:00 AM",
      timestamp: "2025-05-24 19:00",
    },
    {
      id: 8,
      sender: "staff",
      name: "John Smith",
      content:
        "Great! The maintenance team will see you tomorrow at 10 AM. Have a good night.",
      timestamp: "2025-05-24 19:05",
      avatar:
        "https://readdy.ai/api/search-image?query=professional%2520headshot%2520of%2520a%2520middle%2520aged%2520man%2520with%2520short%2520brown%2520hair%2520and%2520glasses%2520wearing%2520a%2520business%2520suit%2520against%2520a%2520neutral%2520background%2520photorealistic%2520high%2520quality%25204k&width=40&height=40&seq=11&orientation=squarish",
      read: true,
    },
  ]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);
  const handleSendMessage = () => {
    if (message.trim() || attachments.length > 0) {
      const newMessage = {
        id: messages.length + 1,
        sender: "staff",
        name: "John Smith",
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
        avatar:
          "https://readdy.ai/api/search-image?query=professional%2520headshot%2520of%2520a%2520middle%2520aged%2520man%2520with%2520short%2520brown%2520hair%2520and%2520glasses%2520wearing%2520a%2520business%2520suit%2520against%2520a%2520neutral%2520background%2520photorealistic%2520high%2520quality%25204k&width=40&height=40&seq=11&orientation=squarish",
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
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  const handleEmojiClick = (emoji: string) => {
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
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      <Header />
      {/* Header */}
      <header className="bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <a
              href="https://readdy.ai/home/8422111f-d6f9-49d4-9769-990442745d9e/2f163c16-62e3-4ac0-862b-ec1dc785fb7a"
              data-readdy="true"
              className="!rounded-button whitespace-nowrap flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <i className="fas fa-arrow-left mr-3 text-gray-500"></i>
            </a>
            <div className="flex-1 flex items-center">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    #CMP-1084
                  </h1>
                  <span className="mx-2 text-gray-400">•</span>
                  <h2 className="text-lg font-medium text-gray-800">
                    Michael Chen
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  Dormitory Heating Problem
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <i className="fas fa-clock mr-1"></i>
                Last active: 10 minutes ago
              </div>
              <div className="relative">
                <button
                  id="menuButton"
                  onClick={() => setShowMenu(!showMenu)}
                  className="!rounded-button whitespace-nowrap p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
                ></button>
                {showMenu && (
                  <div
                    id="dropdownMenu"
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false); /* Add action here */
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-check-circle w-5 text-green-500"></i>
                      <span>Mark as resolved</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false); /* Add action here */
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-exchange-alt w-5 text-blue-500"></i>
                      <span>Transfer to another staff</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false); /* Add action here */
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-star w-5 text-yellow-500"></i>
                      <span>Add to priority</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false); /* Add action here */
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-file-alt w-5 text-gray-500"></i>
                      <span>View complaint details</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false); /* Add action here */
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <i className="fas fa-download w-5 text-indigo-500"></i>
                      <span>Export conversation</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false); /* Add action here */
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center text-red-600"
                    >
                      <i className="fas fa-trash-alt w-5"></i>
                      <span>Delete conversation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Chat Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "system" ? "justify-center" : msg.sender === "staff" ? "justify-end" : "justify-start"} mb-6`}
            >
              {msg.sender === "system" ? (
                <div className="bg-[#F3F4F6] px-4 py-3 rounded-2xl text-sm text-gray-600 max-w-md backdrop-blur-sm bg-opacity-80">
                  <div className="flex items-center justify-center">
                    <i className="fas fa-info-circle mr-2"></i>
                    <span>{msg.content}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {msg.timestamp}
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${msg.sender === "staff" ? "flex-row-reverse" : "flex-row"} max-w-md`}
                >
                  <div className="flex-shrink-0">
                    <img
                      src={msg.avatar}
                      alt={msg.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </div>
                  <div
                    className={`mx-2 ${msg.sender === "staff" ? "text-right" : "text-left"}`}
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
                              <i className="fas fa-file mr-2"></i>
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
                          <i
                            className={`fas fa-check-double ${msg.read ? "text-blue-500" : "text-gray-400"}`}
                          ></i>
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
                  <i
                    className={`fas ${
                      file.type.includes("image")
                        ? "fa-image text-blue-500"
                        : file.type.includes("pdf")
                          ? "fa-file-pdf text-red-500"
                          : "fa-file text-gray-500"
                    } mr-2`}
                  ></i>
                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="!rounded-button whitespace-nowrap ml-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <i className="fas fa-times"></i>
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
                <i className="far fa-smile text-lg"></i>
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
              <i className="fas fa-paperclip text-lg"></i>
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
              onClick={handleSendMessage}
              disabled={!message.trim() && attachments.length === 0}
              className={`!rounded-button whitespace-nowrap p-3 ${
                message.trim() || attachments.length > 0
                  ? "text-blue-600 hover:text-blue-800"
                  : "text-gray-400"
              } cursor-pointer`}
            >
              <i className="fas fa-paper-plane text-lg"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="min-h-screen bg-[#FAFBFC] flex flex-col h-screen">
          {/* Existing chat component content */}
          {/* Header */}
          <header className="bg-white shadow-md z-10">
            {/* ... rest of your existing code ... */}
          </header>
          {/* Main Chat Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-gray-50"
          >
            {/* ... rest of your existing code ... */}
          </div>
          {/* Message Input Area */}
          <div className="bg-white border-t border-gray-100 p-6 shadow-lg">
            {/* ... rest of your existing code ... */}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default App;
