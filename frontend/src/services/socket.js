import { io } from "socket.io-client";

let socket = null;
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 10;

// Derive a socket base URL without app-specific path segments (e.g. '/admin')
const getSocketBaseUrl = () => {
  const envUrl =
    process.env.REACT_APP_SOCKET_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    "http://localhost:5000";
  try {
    const u = new URL(envUrl);
    // Keep only origin (protocol + host + optional port)
    const origin = `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}`;
    return origin;
  } catch {
    return "http://localhost:5000";
  }
};

export const initSocket = (token) => {
  // If socket already exists and is connected, return it
  if (socket && socket.connected) {
    console.log("✅ Socket already connected, reusing existing connection");
    return socket;
  }

  // Don't initialize socket if no token available
  if (!token) {
    console.warn("Socket.io: No token available, skipping connection");
    return null;
  }

  // Send raw token (without "Bearer " prefix) — backend expects just the token
  const authToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

  socket = io(getSocketBaseUrl(), {
    // Ensure default path; server typically serves at '/socket.io'
    path: "/socket.io",
    auth: { token: authToken },
    transports: ["websocket"],
    withCredentials: false,
    // Aggressive reconnection settings for reliability
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Increase timeout to allow slow connections
    connectTimeout: 10000,
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected successfully!");
    reconnectionAttempts = 0;
  });

  socket.on("disconnect", (reason) => {
    console.warn(`🔌 Socket disconnected: ${reason}`);
  });

  socket.on("reconnect_attempt", () => {
    reconnectionAttempts++;
    console.log(`🔄 Attempting to reconnect... (attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
  });

  socket.on("reconnect_failed", () => {
    console.error("❌ Failed to reconnect to socket after multiple attempts");
  });

  socket.on("connect_error", (err) => {
    // Suppress hard errors for expected cases like logout/expired token
    const msg = (err && err.message) || "unknown error";
    if (msg === "Unauthorized") {
      console.warn("⚠️ Socket auth failed (likely logged out or expired)");
    } else {
      console.warn("⚠️ Socket connection issue:", msg);
    }
  });

  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    console.warn("⚠️ Socket not connected. Initialize with initSocket(token) first.");
  }
  return socket;
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};

export const disconnectSocket = () => {
  if (socket) {
    try {
      console.log("🔌 Disconnecting socket...");
      socket.removeAllListeners();
    } catch {}
    socket.disconnect();
    socket = null;
  }
};

// Helper to ensure socket is initialized before using it
export const ensureSocketConnected = (token) => {
  if (!isSocketConnected()) {
    return initSocket(token);
  }
  return socket;
};

