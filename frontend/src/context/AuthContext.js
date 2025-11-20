import React, { createContext, useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiryTimestamp, setExpiryTimestamp] = useState(null); // seconds since epoch (JWT exp)
  const [timeLeft, setTimeLeft] = useState(null); // milliseconds
  const [sessionExpiring, setSessionExpiring] = useState(false);
  const sessionIntervalRef = useRef(null);

  // Threshold (ms) before expiry to show banner
  const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  // Helper to format UNIX timestamp into readable date
  const formatDate = (unixTime) => {
    return new Date(unixTime * 1000).toLocaleString();
  };

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const userData =
      localStorage.getItem("user") || sessionStorage.getItem("user");

    if (token && userData) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        console.log("🔑 Token decoded:", decoded);
        console.log(
          "⏳ Current time:",
          currentTime,
          "-",
          formatDate(currentTime)
        );
        console.log(
          "📅 Token expiry time:",
          decoded.exp,
          "-",
          formatDate(decoded.exp)
        );

        if (decoded.exp > currentTime) {
          setUser(JSON.parse(userData));
          setExpiryTimestamp(decoded.exp);

          const remainingTime = (decoded.exp - currentTime) * 1000;
          console.log(
            `✅ Token valid. Logging out in ${Math.floor(
              remainingTime / 1000
            )} seconds (at ${formatDate(decoded.exp)})`
          );

          const timer = setTimeout(() => {
            console.log("⏰ Token expired. Logging out...");
            logout();
          }, remainingTime);
          localStorage.setItem("logoutTimerId", timer);
          startSessionCountdown(decoded.exp);
        } else {
          console.log("❌ Token already expired. Logging out...");
          logout();
        }
      } catch (err) {
        console.error("⚠️ Token decode error:", err);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData, token, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(userData));

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const remainingTime = (decoded.exp - currentTime) * 1000;

      console.log("🔑 Login success - token decoded:", decoded);

      setExpiryTimestamp(decoded.exp);
      startSessionCountdown(decoded.exp);
      const timer = setTimeout(() => {
        console.log("⏰ Token expired. Logging out...");
        logout();
      }, remainingTime);
      localStorage.setItem("logoutTimerId", timer);
    } catch (err) {
      console.error("⚠️ Invalid token:", err);
      logout();
      throw err;
    }

    // Wait for React state update to complete before resolving
    return new Promise((resolve) => {
      setUser(userData);
      // Use setTimeout to ensure state update has been batched and processed
      setTimeout(() => {
        console.log("✅ User state updated, ready to navigate");
        resolve(true);
      }, 0);
    });
  };

  const logout = () => {
    console.log("🚪 Logging out user...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }

    const timerId = localStorage.getItem("logoutTimerId");
    if (timerId) {
      clearTimeout(timerId);
      console.log("🧹 Cleared logout timer");
    }
    localStorage.removeItem("logoutTimerId");

    setUser(null);
    setExpiryTimestamp(null);
    setTimeLeft(null);
    setSessionExpiring(false);
  };

  const startSessionCountdown = (expSeconds) => {
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
    sessionIntervalRef.current = setInterval(() => {
      const nowMs = Date.now();
      const expMs = expSeconds * 1000;
      const remaining = expMs - nowMs;
      setTimeLeft(remaining > 0 ? remaining : 0);
      const shouldWarn = remaining > 0 && remaining <= EXPIRY_WARNING_THRESHOLD;
      setSessionExpiring(shouldWarn);
      if (remaining <= 0) {
        clearInterval(sessionIntervalRef.current);
        sessionIntervalRef.current = null;
      }
    }, 1000);
  };

  const extendSession = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return logout();
      const response = await fetch("http://localhost:5000/admin/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to refresh token");
      const data = await response.json();
      if (!data.token || !data.exp) throw new Error("Malformed refresh response");
      const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      // Preserve existing user
      const storedUser = storage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      setExpiryTimestamp(data.exp);
      setSessionExpiring(false);
      startSessionCountdown(data.exp);
      // Clear old logout timer first to prevent race condition
      const oldTimerId = localStorage.getItem("logoutTimerId");
      if (oldTimerId) {
        clearTimeout(Number(oldTimerId));
        console.log("🧹 Cleared old logout timer before setting new one");
      }
      // Reset logout timer
      const decoded = jwtDecode(data.token);
      const currentTime = Date.now() / 1000;
      const remainingTime = (decoded.exp - currentTime) * 1000;
      const timer = setTimeout(() => {
        console.log("⏰ Token expired. Logging out...");
        logout();
      }, remainingTime);
      localStorage.setItem("logoutTimerId", timer);
      return true;
    } catch (err) {
      console.error("Failed to extend session:", err);
      return false;
    }
  };

  const formattedTimeLeft = () => {
    if (timeLeft == null) return null;
    const totalSeconds = Math.floor(timeLeft / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, sessionExpiring, timeLeft, formattedTimeLeft, extendSession }}>
      {children}
    </AuthContext.Provider>
  );
};
