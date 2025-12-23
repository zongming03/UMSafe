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
    console.log(`🔌 Socket connected: ${userLabel}`);
    if (socket.user?.id) {
      socket.join(socket.user.id.toString());
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${userLabel}`);
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
  io.emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userId.toString()).emit(event, payload);
};
