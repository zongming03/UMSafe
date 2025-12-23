import { io } from "socket.io-client";

let socket = null;

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
  if (socket) return socket;

  // Don't initialize socket if no token available
  if (!token) {
    console.warn("Socket.io: No token available, skipping connection");
    return null;
  }

  const authToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

  socket = io(getSocketBaseUrl(), {
    // Ensure default path; server typically serves at '/socket.io'
    path: "/socket.io",
    auth: { token: authToken },
    transports: ["websocket"],
    withCredentials: true,
    // Be gentle with reconnects to avoid noisy errors
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2000,
  });

  socket.on("connect_error", (err) => {
    // Suppress hard errors for expected cases like logout/expired token
    const msg = (err && err.message) || "unknown error";
    if (msg === "Unauthorized") {
      console.warn("Socket auth failed (likely logged out or expired)");
    } else {
      console.warn("Socket connection issue:", msg);
    }
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.removeAllListeners();
    } catch {}
    socket.disconnect();
    socket = null;
  }
};
