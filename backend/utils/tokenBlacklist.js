
const tokenBlacklist = new Set();

/**
 * Add a token to the blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} expiryTime - Token expiry timestamp (seconds since epoch)
 */
export const blacklistToken = (token, expiryTime) => {
  try {
    tokenBlacklist.add(token);
    console.log(`🚫 Token blacklisted. Expires in ${Math.ceil((expiryTime * 1000 - Date.now()) / 1000)}s`);

    // Auto-remove from blacklist after token expiry to free memory
    const delayMs = expiryTime * 1000 - Date.now();
    if (delayMs > 0) {
      setTimeout(() => {
        tokenBlacklist.delete(token);
        console.log("🧹 Expired token removed from blacklist");
      }, delayMs + 1000); // +1s buffer
    }
  } catch (err) {
    console.error("Error blacklisting token:", err);
  }
};

/**
 * Check if a token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is blacklisted
 */
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Get blacklist size (for monitoring)
 * @returns {number} Number of blacklisted tokens
 */
export const getBlacklistSize = () => {
  return tokenBlacklist.size;
};

/**
 * Clear all blacklisted tokens (for testing/admin)
 */
export const clearBlacklist = () => {
  tokenBlacklist.clear();
  console.log("🧹 Token blacklist cleared");
};

export default {
  blacklistToken,
  isTokenBlacklisted,
  getBlacklistSize,
  clearBlacklist,
};
