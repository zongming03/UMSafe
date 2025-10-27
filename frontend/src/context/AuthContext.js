import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

    return new Promise((resolve) => {
      setUser(userData);
      resolve(true);
    });
  };

  const logout = () => {
    console.log("🚪 Logging out user...");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    const timerId = localStorage.getItem("logoutTimerId");
    if (timerId) {
      clearTimeout(timerId);
      console.log("🧹 Cleared logout timer");
    }
    localStorage.removeItem("logoutTimerId");

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
