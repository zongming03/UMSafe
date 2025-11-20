// Mock chat data for testing chatrooms
// Format matches the backend API response structure

export const MOCK_CHATROOMS = {
  // Chatroom for CMP-1093 (Dirty Classroom Floor)
  "FAKE-ROOM-1093": {
    chatroom: {
      id: "FAKE-ROOM-1093",
      reportId: "CMP-1093",
      createdAt: "2025-10-23T16:00:00.000Z",
      updatedAt: "2025-10-23T16:30:00.000Z",
      version: 0
    },
    chats: [
      {
        id: "chat-1093-001",
        senderId: "system",
        receiverId: null,
        message: "Conversation started regarding complaint #CMP-1093",
        system: true,
        createdAt: "2025-10-23T16:00:00.000Z",
        updatedAt: "2025-10-23T16:00:00.000Z",
        version: 0
      },
      {
        id: "chat-1093-002",
        senderId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        receiverId: "68af04187c2e6f499854e2da",
        message: "Hello, the classroom floor in Room 101 is still very dirty. When can someone come to clean it?",
        createdAt: "2025-10-23T16:05:12.000Z",
        updatedAt: "2025-10-23T16:05:12.000Z",
        version: 0
      },
      {
        id: "chat-1093-003",
        senderId: "68af04187c2e6f499854e2da",
        receiverId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        message: "Hi! Thank you for reporting this issue. I've forwarded this to the maintenance team. They should be able to clean it by tomorrow morning.",
        createdAt: "2025-10-23T16:10:45.000Z",
        updatedAt: "2025-10-23T16:10:45.000Z",
        version: 0
      },
      {
        id: "chat-1093-004",
        senderId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        receiverId: "68af04187c2e6f499854e2da",
        message: "That would be great! The students have been complaining about it for a few days now.",
        createdAt: "2025-10-23T16:12:20.000Z",
        updatedAt: "2025-10-23T16:12:20.000Z",
        version: 0
      },
      {
        id: "chat-1093-005",
        senderId: "68af04187c2e6f499854e2da",
        receiverId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        message: "I understand. I'll make sure they prioritize this. You can expect the classroom to be cleaned by 8 AM tomorrow. I'll update you once it's done.",
        createdAt: "2025-10-23T16:15:33.000Z",
        updatedAt: "2025-10-23T16:15:33.000Z",
        version: 0
      },
      {
        id: "chat-1093-006",
        senderId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        receiverId: "68af04187c2e6f499854e2da",
        message: "Perfect! Thank you so much for your help! 😊",
        createdAt: "2025-10-23T16:17:10.000Z",
        updatedAt: "2025-10-23T16:17:10.000Z",
        version: 0
      }
    ]
  },

  // Chatroom for CMP-1094 (Student Harassment Incident)
  "FAKE-ROOM-1094": {
    chatroom: {
      id: "FAKE-ROOM-1094",
      reportId: "CMP-1094",
      createdAt: "2025-10-22T17:05:00.000Z",
      updatedAt: "2025-10-23T10:30:00.000Z",
      version: 0
    },
    chats: [
      {
        id: "chat-1094-001",
        senderId: "system",
        receiverId: null,
        message: "Conversation started regarding complaint #CMP-1094",
        system: true,
        createdAt: "2025-10-22T17:05:00.000Z",
        updatedAt: "2025-10-22T17:05:00.000Z",
        version: 0
      },
      {
        id: "chat-1094-002",
        senderId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        receiverId: "admin-002",
        message: "I witnessed some students bullying another student in the cafeteria today during lunch. It looked serious and I think someone should intervene.",
        createdAt: "2025-10-22T17:08:25.000Z",
        updatedAt: "2025-10-22T17:08:25.000Z",
        version: 0
      },
      {
        id: "chat-1094-003",
        senderId: "admin-002",
        receiverId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        message: "Thank you for bringing this to our attention. This is a serious matter. Can you provide more details about the incident? What time did this happen and do you know the students involved?",
        createdAt: "2025-10-22T17:15:40.000Z",
        updatedAt: "2025-10-22T17:15:40.000Z",
        version: 0
      },
      {
        id: "chat-1094-004",
        senderId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        receiverId: "admin-002",
        message: "It happened around 12:30 PM near the main cafeteria entrance. I don't know all their names, but I can recognize their faces. There were about 3-4 students involved.",
        createdAt: "2025-10-22T17:20:15.000Z",
        updatedAt: "2025-10-22T17:20:15.000Z",
        version: 0
      },
      {
        id: "chat-1094-005",
        senderId: "admin-002",
        receiverId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        message: "Thank you for the information. I'm escalating this to the student affairs office immediately. They will review the cafeteria CCTV footage and take appropriate action. Would you be willing to provide a statement if needed?",
        createdAt: "2025-10-22T17:25:50.000Z",
        updatedAt: "2025-10-22T17:25:50.000Z",
        version: 0
      },
      {
        id: "chat-1094-006",
        senderId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        receiverId: "admin-002",
        message: "Yes, I'm willing to help if needed. I just want to make sure the victim is okay and this doesn't happen again.",
        createdAt: "2025-10-22T17:28:33.000Z",
        updatedAt: "2025-10-22T17:28:33.000Z",
        version: 0
      },
      {
        id: "chat-1094-007",
        senderId: "admin-002",
        receiverId: "0199d751-fbb6-742e-b052-e4a05b2d57bc",
        message: "We really appreciate your courage in reporting this. The student affairs office will contact you within 24 hours. In the meantime, I'm marking this case as high priority. Status updated to In Progress.",
        createdAt: "2025-10-23T10:30:00.000Z",
        updatedAt: "2025-10-23T10:30:00.000Z",
        version: 0
      }
    ]
  }
};

// Helper function to get chatroom data by chatroomId
export const getMockChatroomData = (chatroomId) => {
  return MOCK_CHATROOMS[chatroomId] || null;
};

// Helper function to get all chats for a specific chatroom
export const getMockChats = (chatroomId) => {
  const chatroomData = MOCK_CHATROOMS[chatroomId];
  return chatroomData ? chatroomData.chats : [];
};
