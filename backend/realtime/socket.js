import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const normalizedToken = token.startsWith('Bearer ')
      ? token.slice(7)
      : token;

    try {
      const decoded = jwt.verify(normalizedToken, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };
      return next();
    } catch (err) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userLabel = socket.user?.email || socket.id;
    console.log(`🔌 Socket connected: ${userLabel} (ID: ${socket.user?.id})`);
    
    // Join user to their personal room for targeted messaging
    if (socket.user?.id) {
      socket.join(socket.user.id.toString());
      console.log(`✅ User ${userLabel} joined room: ${socket.user.id}`);
    }

    // Acknowledge connection
    socket.emit('connect_success', { userId: socket.user?.id, message: 'Connected to server' });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${userLabel} (reason: ${reason})`);
    });

    // Listen for explicit room join (for chatrooms)
    socket.on('join-chatroom', (data) => {
      const { reportId, chatroomId } = data;
      if (reportId && chatroomId) {
        const roomName = `chat:${reportId}:${chatroomId}`;
        socket.join(roomName);
        console.log(`✅ ${userLabel} joined chatroom: ${roomName}`);
      }
    });

    // Listen for explicit room leave
    socket.on('leave-chatroom', (data) => {
      const { reportId, chatroomId } = data;
      if (reportId && chatroomId) {
        const roomName = `chat:${reportId}:${chatroomId}`;
        socket.leave(roomName);
        console.log(`✅ ${userLabel} left chatroom: ${roomName}`);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitEvent = (event, payload) => {
  if (!io) return;
  console.log(`📡 Broadcasting event: ${event}`, payload);
  io.emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  const userRoom = userId.toString();
  console.log(`📡 Emitting to user ${userRoom}: ${event}`, payload);
  io.to(userRoom).emit(event, payload);
};

/**
 * Emit chat message to a specific chatroom and involved users
 * This ensures both participants receive the message in real-time
 */
export const emitChatMessage = (reportId, chatroomId, payload) => {
  if (!io || !reportId || !chatroomId) {
    console.warn('⚠️ Cannot emit chat message - missing io, reportId, or chatroomId');
    return;
  }
  
  // Emit to the chatroom (for all users in that conversation)
  const chatroomName = `chat:${reportId}:${chatroomId}`;
  const chatroomEvent = `${chatroomName}:new-message`;
  
  console.log(`📡 Emitting to chatroom ${chatroomName}: ${chatroomEvent}`, payload);
  io.to(chatroomName).emit(chatroomEvent, payload);
  
  // Also emit to general chat channel as fallback
  io.emit('chat:new-message', payload);
  
  // Emit to both sender and receiver's personal rooms
  if (payload.senderId) {
    io.to(payload.senderId.toString()).emit(chatroomEvent, payload);
  }
  if (payload.receiverId) {
    io.to(payload.receiverId.toString()).emit(chatroomEvent, payload);
  }
};

/**
 * Get all connected users in a specific chatroom
 */
export const getChatroomUsers = (reportId, chatroomId) => {
  if (!io) return [];
  const chatroomName = `chat:${reportId}:${chatroomId}`;
  const room = io.sockets.adapter.rooms.get(chatroomName);
  return room ? Array.from(room) : [];
