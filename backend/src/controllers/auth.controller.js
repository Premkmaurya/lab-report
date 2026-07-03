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
    },
  });
};

const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new BadRequestError("Please provide username, email and password");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new BadRequestError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  sendTokenResponse(user, 201, res);
});

const login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new BadRequestError("Please provide username or email");
  }

  if (!password) {
    throw new BadRequestError("Please provide password");
  }

  const user = await User.findOne({ email });
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
    },
  });
});

// admin functions

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new BadRequestError("Please provide username, email, password and role");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new BadRequestError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    isAuthorized: true,
  });

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
    },
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({
    _id: { $ne: req.user._id },
  });

  res.status(200).json({
    success: true,
    users: users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
    })),
  });
});

const getUserById = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ForbiddenError("You cannot access your own account here");
  }

  const user = await User.findById(req.params.id);
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
    },
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ForbiddenError("You cannot update your own account status");
  }

  const { status } = req.body;

  if (typeof status !== "boolean") {
    throw new BadRequestError("Please provide a valid status (true or false)");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isAuthorized: status,
    },
    { new: true },
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(200).json({
    success: true,
    message: `User status updated successfully`,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
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
