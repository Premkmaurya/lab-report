const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const config = require("../config/config");
const asyncHandler = require("../utils/asyncHandler");
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require("../utils/errors");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      laboratoryId: user.laboratoryId || null,
    },
    config.JWT_SECRET || "report-secret-key",
    {
      expiresIn: "7d",
    },
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
      permissions: user.permissions || [],
      laboratoryId: user.laboratoryId || null,
    },
  });
};

const signup = asyncHandler(async (req, res) => {
  throw new ForbiddenError("Public registration is disabled. Please contact your System Administrator to receive an account.");
});

const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const loginIdentifier = email || username;

  if (!loginIdentifier) {
    throw new BadRequestError("Please provide username or email");
  }

  if (!password) {
    throw new BadRequestError("Please provide password");
  }

  const user = await User.findOne({
    $or: [{ email: loginIdentifier.toLowerCase() }, { username: loginIdentifier }],
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new UnauthorizedError("Invalid credentials");
  }

  sendTokenResponse(user, 200, res);
});

const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: "Logged out successfully" });
};

const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
      permissions: user.permissions || [],
      laboratoryId: user.laboratoryId || null,
    },
  });
});

// admin functions

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, permissions, laboratoryId } = req.body;

  if (!username || !email || !password) {
    throw new BadRequestError("Please provide username, email and password");
  }

  let targetLabId = req.user.laboratoryId;
  if (req.user.role === 'system_admin') {
    if (role !== 'system_admin' && !laboratoryId) {
      throw new BadRequestError("Please select a laboratory for this user");
    }
    targetLabId = role === 'system_admin' ? null : laboratoryId;
  }

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (existingUser) {
    throw new BadRequestError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const sanitizedPermissions = (permissions || []).filter(p => p !== 'create_user');

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || 'user',
    laboratoryId: targetLabId,
    isAuthorized: true,
    permissions: sanitizedPermissions,
  });

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
      permissions: user.permissions || [],
      laboratoryId: user.laboratoryId,
    },
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const query = {
    _id: { $ne: req.user._id },
    ...req.tenantFilter,
  };

  const users = await User.find(query).populate('laboratoryId', 'name code');

  res.status(200).json({
    success: true,
    users: users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
      permissions: user.permissions || [],
      laboratoryId: user.laboratoryId,
      laboratory: user.laboratoryId ? { id: user.laboratoryId._id, name: user.laboratoryId.name, code: user.laboratoryId.code } : null,
    })),
  });
});

const getUserById = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ForbiddenError("You cannot access your own account here");
  }

  const query = { _id: req.params.id, ...req.tenantFilter };
  const user = await User.findOne(query).populate('laboratoryId', 'name code');
  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
      permissions: user.permissions || [],
      laboratoryId: user.laboratoryId,
      laboratory: user.laboratoryId ? { id: user.laboratoryId._id, name: user.laboratoryId.name, code: user.laboratoryId.code } : null,
    },
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ForbiddenError("You cannot update your own account status");
  }

  const { status, permissions, role } = req.body;

  const query = { _id: req.params.id, ...req.tenantFilter };
  const user = await User.findOne(query);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (typeof status === "boolean") {
    user.isAuthorized = status;
  }

  if (permissions !== undefined) {
    user.permissions = (permissions || []).filter(p => p !== 'create_user');
  }

  if (role !== undefined && ['user', 'admin', 'lab_technician', 'receptionist'].includes(role)) {
    user.role = role;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `User status updated successfully`,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
      permissions: user.permissions || [],
      laboratoryId: user.laboratoryId,
    },
  });
});

module.exports = {
  login,
  signup,
  logout,
  getMe,
  createUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
};
