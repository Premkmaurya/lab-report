const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  hashToken,
  getTokenRemainingTTL,
  blacklistToken,
  isTokenBlacklisted,
  trackUserToken,
  revokeAllUserTokens,
  isUserRevoked,
} = require("../src/services/tokenBlacklist.service");
const { userAuth } = require("../src/middlewares/auth.middleware");

// In-memory Redis mock for unit testing token blacklist functionality deterministic & fast
const createMockRedis = () => {
  const store = new Map();
  const sets = new Map();

  return {
    isReady: true,
    async setEx(key, ttl, value) {
      store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      return "OK";
    },
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async del(key) {
      if (Array.isArray(key)) {
        key.forEach((k) => store.delete(k));
      } else {
        store.delete(key);
      }
      return 1;
    },
    async sAdd(key, member) {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key).add(member);
      return 1;
    },
    async expire(key, ttl) {
      return 1;
    },
    async sMembers(key) {
      if (!sets.has(key)) return [];
      return Array.from(sets.get(key));
    },
  };
};

describe("JWT Token Blacklisting & Revocation Suite", () => {
  const secret = "test-secret-key-12345";
  const userId = "user123";

  test("1. Hash Token generates correct SHA-256 hex digest", () => {
    const sampleToken = "sample.jwt.token";
    const expectedHash = crypto.createHash("sha256").update(sampleToken).digest("hex");
    const hash = hashToken(sampleToken);
    assert.equal(hash, expectedHash);
  });

  test("2. Calculate remaining TTL accurately from JWT exp", () => {
    const token = jwt.sign({ id: userId }, secret, { expiresIn: "1h" });
    const ttl = getTokenRemainingTTL(token);
    assert.ok(ttl > 3500 && ttl <= 3600, `Expected TTL around 3600s, got ${ttl}`);
  });

  test("3. Login & Logout: Blacklisted token returns true for isTokenBlacklisted", async () => {
    const token = jwt.sign({ id: userId }, secret, { expiresIn: "10m" });
    const redisMock = createMockRedis();

    // Replace redisClient in service for test execution
    const redisClient = require("../src/config/redis");
    const originalSetEx = redisClient.setEx;
    const originalGet = redisClient.get;
    const originalIsReady = redisClient.isReady;

    Object.defineProperty(redisClient, "isReady", { get: () => true, configurable: true });
    redisClient.setEx = redisMock.setEx.bind(redisMock);
    redisClient.get = redisMock.get.bind(redisMock);

    try {
      // Verify initial state: not blacklisted
      const isBlacklistedInitial = await isTokenBlacklisted(token);
      assert.equal(isBlacklistedInitial, false);

      // Blacklist token (Logout)
      await blacklistToken(token, userId);

      // Verify blacklisted state
      const isBlacklistedAfter = await isTokenBlacklisted(token);
      assert.equal(isBlacklistedAfter, true);
    } finally {
      redisClient.setEx = originalSetEx;
      redisClient.get = originalGet;
      Object.defineProperty(redisClient, "isReady", { get: () => originalIsReady, configurable: true });
    }
  });

  test("4. Middleware Rejects Blacklisted Token with 401 'Token has been revoked.'", async () => {
    process.env.JWT_SECRET = secret;
    const token = jwt.sign({ id: userId }, secret, { expiresIn: "10m" });
    const redisMock = createMockRedis();

    const redisClient = require("../src/config/redis");
    const User = require("../src/models/user.model");

    const originalGet = redisClient.get;
    const originalSetEx = redisClient.setEx;
    const originalFindById = User.findById;

    Object.defineProperty(redisClient, "isReady", { get: () => true, configurable: true });
    redisClient.get = redisMock.get.bind(redisMock);
    redisClient.setEx = redisMock.setEx.bind(redisMock);
    User.findById = () => ({
      select: () => Promise.resolve({ _id: userId, isAuthorized: true, role: "user" }),
    });

    try {
      // Blacklist token
      await blacklistToken(token, userId);

      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      };

      let statusCode = null;
      let jsonPayload = null;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonPayload = data;
          return this;
        },
      };

      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await userAuth(req, res, next);

      assert.equal(nextCalled, false);
      assert.equal(statusCode, 401);
      assert.equal(jsonPayload.message, "Token has been revoked.");
    } finally {
      redisClient.get = originalGet;
      redisClient.setEx = originalSetEx;
      User.findById = originalFindById;
    }
  });

  test("5. Multi-session revocation (Force Logout & Password Change) invalidates all user tokens", async () => {
    const redisMock = createMockRedis();

    const redisClient = require("../src/config/redis");
    const originalGet = redisClient.get;
    const originalSetEx = redisClient.setEx;
    const originalSAdd = redisClient.sAdd;
    const originalSMembers = redisClient.sMembers;
    const originalExpire = redisClient.expire;
    const originalDel = redisClient.del;

    Object.defineProperty(redisClient, "isReady", { get: () => true, configurable: true });
    redisClient.get = redisMock.get.bind(redisMock);
    redisClient.setEx = redisMock.setEx.bind(redisMock);
    redisClient.sAdd = redisMock.sAdd.bind(redisMock);
    redisClient.sMembers = redisMock.sMembers.bind(redisMock);
    redisClient.expire = redisMock.expire.bind(redisMock);
    redisClient.del = redisMock.del.bind(redisMock);

    try {
      const token1 = jwt.sign({ id: userId, iat: Math.floor(Date.now() / 1000) - 10 }, secret, { expiresIn: "10m" });
      const token2 = jwt.sign({ id: userId, iat: Math.floor(Date.now() / 1000) - 5 }, secret, { expiresIn: "10m" });

      // Track active tokens on login
      await trackUserToken(userId, token1);
      await trackUserToken(userId, token2);

      // Trigger revocation (e.g. Password Change / Admin Disable)
      await revokeAllUserTokens(userId);

      // Verify tokens are blacklisted
      const isToken1Blacklisted = await isTokenBlacklisted(token1);
      const isToken2Blacklisted = await isTokenBlacklisted(token2);

      assert.equal(isToken1Blacklisted, true, "Old token 1 should be blacklisted");
      assert.equal(isToken2Blacklisted, true, "Old token 2 should be blacklisted");
    } finally {
      redisClient.get = originalGet;
      redisClient.setEx = originalSetEx;
      redisClient.sAdd = originalSAdd;
      redisClient.sMembers = originalSMembers;
      redisClient.expire = originalExpire;
      redisClient.del = originalDel;
    }
  });

  test("6. Expired token handling does not throw error and returns false for isTokenBlacklisted", async () => {
    const expiredToken = jwt.sign({ id: userId, exp: Math.floor(Date.now() / 1000) - 100 }, secret);
    const ttl = getTokenRemainingTTL(expiredToken);
    assert.equal(ttl, 0);

    const isBlacklisted = await isTokenBlacklisted(expiredToken);
    assert.equal(isBlacklisted, false);
  });
});
