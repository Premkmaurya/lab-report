const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");

/**
 * Computes SHA-256 hash of a raw token.
 * Requirement 7: Store SHA-256 hash of the token in Redis instead of raw JWT.
 * @param {string} token 
 * @returns {string} SHA-256 hex digest
 */
const hashToken = (token) => {
  if (!token) return "";
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Calculates remaining TTL for a JWT in seconds.
 * @param {string} token 
 * @returns {number} remaining TTL in seconds
 */
const getTokenRemainingTTL = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return 7 * 24 * 60 * 60; // Default 7 days if exp not present
    }
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;
    return Math.max(0, ttl);
  } catch (error) {
    logger.error(`Error decoding token for TTL calculation: ${error.message}`);
    return 0;
  }
};

/**
 * Blacklists a JWT token in Redis with remaining TTL.
 * Key: blacklist:<tokenHash>
 * Value: "true"
 * @param {string} token 
 * @param {string} [userId] 
 * @returns {Promise<boolean>}
 */
const blacklistToken = async (token, userId = null) => {
  if (!token) return false;
  if (!redisClient.isReady) {
    logger.warn("Redis client not ready. Unable to blacklist token in Redis.");
    return false;
  }

  try {
    const ttl = getTokenRemainingTTL(token);
    if (ttl <= 0) {
      logger.info("Token already expired, skipping Redis blacklisting.");
      return true;
    }

    const tokenHash = hashToken(token);
    const redisKey = `blacklist:${tokenHash}`;

    await redisClient.setEx(redisKey, ttl, "true");

    logger.info(
      `Token Blacklisted | User: ${userId || "unknown"} | Hash: ${tokenHash.substring(0, 12)}... | TTL: ${ttl}s`
    );
    return true;
  } catch (error) {
    logger.error(`Redis Error during token blacklisting: ${error.message}`);
    return false;
  }
};

/**
 * Checks if a token hash exists in Redis blacklist.
 * @param {string} token 
 * @returns {Promise<boolean>}
 */
const isTokenBlacklisted = async (token) => {
  if (!token) return false;
  if (!redisClient.isReady) {
    // If Redis is unavailable, log and pass through gracefully
    logger.warn("Redis unavailable during blacklist check. Falling through.");
    return false;
  }

  try {
    const tokenHash = hashToken(token);
    const redisKey = `blacklist:${tokenHash}`;
    const result = await redisClient.get(redisKey);
    return result !== null;
  } catch (error) {
    logger.error(`Redis Error during blacklist check: ${error.message}`);
    return false;
  }
};

/**
 * Tracks an active session token hash for a user.
 * Allows multi-session revocation on force logout or password change.
 * @param {string} userId 
 * @param {string} token 
 */
const trackUserToken = async (userId, token) => {
  if (!userId || !token || !redisClient.isReady) return;

  try {
    const tokenHash = hashToken(token);
    const ttl = getTokenRemainingTTL(token);
    const userTokensKey = `user_tokens:${userId}`;

    await redisClient.sAdd(userTokensKey, tokenHash);
    await redisClient.expire(userTokensKey, Math.max(ttl, 7 * 24 * 60 * 60));
  } catch (error) {
    logger.error(`Redis Error tracking user token for ${userId}: ${error.message}`);
  }
};

/**
 * Revokes all active tokens for a user (Force Logout / Password Change).
 * Sets user_revoked_at:<userId> timestamp and blacklists all tracked active tokens.
 * @param {string} userId 
 */
const revokeAllUserTokens = async (userId) => {
  if (!userId) return;
  if (!redisClient.isReady) {
    logger.warn(`Redis unavailable. Cannot revoke all tokens for user ${userId}`);
    return;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const maxTtl = 7 * 24 * 60 * 60; // 7 days matching token lifespan

    // Set user-wide revocation timestamp
    await redisClient.setEx(`user_revoked_at:${userId}`, maxTtl, String(now));

    // Blacklist all tracked token hashes for this user
    const userTokensKey = `user_tokens:${userId}`;
    const tokenHashes = await redisClient.sMembers(userTokensKey);

    if (tokenHashes && tokenHashes.length > 0) {
      for (const tokenHash of tokenHashes) {
        await redisClient.setEx(`blacklist:${tokenHash}`, maxTtl, "true");
      }
      await redisClient.del(userTokensKey);
    }

    logger.info(`Token Blacklisted | All active tokens revoked for user: ${userId}`);
  } catch (error) {
    logger.error(`Redis Error revoking all tokens for user ${userId}: ${error.message}`);
  }
};

/**
 * Checks if a token was issued before the user's revocation timestamp.
 * @param {string} userId 
 * @param {number} tokenIat - Token issued-at timestamp in seconds 
 * @returns {Promise<boolean>}
 */
const isUserRevoked = async (userId, tokenIat) => {
  if (!userId || !redisClient.isReady) return false;

  try {
    const revokedAtStr = await redisClient.get(`user_revoked_at:${userId}`);
    if (!revokedAtStr) return false;

    const revokedAt = parseInt(revokedAtStr, 10);
    // If token was issued at or before revocation timestamp, token is revoked
    return tokenIat ? tokenIat <= revokedAt : true;
  } catch (error) {
    logger.error(`Redis Error checking user revocation timestamp: ${error.message}`);
    return false;
  }
};

/**
 * Stores a Refresh Token in Redis.
 * @param {string} userId 
 * @param {string} refreshToken 
 * @param {number} [ttl=604800] 
 */
const storeRefreshToken = async (userId, refreshToken, ttl = 7 * 24 * 60 * 60) => {
  if (!userId || !refreshToken || !redisClient.isReady) return;
  try {
    const refreshHash = hashToken(refreshToken);
    await redisClient.setEx(`refresh:${refreshHash}`, ttl, String(userId));
  } catch (error) {
    logger.error(`Redis Error storing refresh token: ${error.message}`);
  }
};

/**
 * Deletes a Refresh Token from Redis on logout or revocation.
 * @param {string} refreshToken 
 */
const removeRefreshToken = async (refreshToken) => {
  if (!refreshToken || !redisClient.isReady) return;
  try {
    const refreshHash = hashToken(refreshToken);
    await redisClient.del(`refresh:${refreshHash}`);
  } catch (error) {
    logger.error(`Redis Error removing refresh token: ${error.message}`);
  }
};

/**
 * Checks if a Refresh Token is valid in Redis.
 * @param {string} refreshToken 
 * @returns {Promise<boolean>}
 */
const isRefreshTokenValid = async (refreshToken) => {
  if (!refreshToken || !redisClient.isReady) return false;
  try {
    const refreshHash = hashToken(refreshToken);
    const userId = await redisClient.get(`refresh:${refreshHash}`);
    return userId !== null;
  } catch (error) {
    logger.error(`Redis Error validating refresh token: ${error.message}`);
    return false;
  }
};

module.exports = {
  hashToken,
  getTokenRemainingTTL,
  blacklistToken,
  isTokenBlacklisted,
  trackUserToken,
  revokeAllUserTokens,
  isUserRevoked,
  storeRefreshToken,
  removeRefreshToken,
  isRefreshTokenValid,
};
