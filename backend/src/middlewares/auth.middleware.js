const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const config = require("../config/config");

const userAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET || "report-secret-key");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isAuthorized) {
      return res.status(403).json({ 
        message: "Your account is not authorized yet. Please contact the administrator." 
      });
    }

    req.user = user;
    req.laboratoryId = user.laboratoryId || null;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // system_admin has global access
    if (req.user.role === "system_admin" || roles.includes(req.user.role)) {
      return next();
    }
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  };
};  

const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    // Admin and System Admin always have full access
    if (req.user.role === "admin" || req.user.role === "system_admin") {
      return next();
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: You do not have the required permission" });
    }
    next();
  };
};

const authorizeOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "admin" || req.user.role === "system_admin") {
        return next();
      }

      const resource = await Model.findById(req.params.id).select("createdBy laboratoryId");
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource.laboratoryId && req.user.laboratoryId && resource.laboratoryId.toString() !== req.user.laboratoryId.toString()) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (!resource.createdBy || resource.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to modify this resource."
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: "Server error during authorization" });
    }
  };
};

module.exports = {
  userAuth,
  authorizeRoles,
  authorizePermissions,
  authorizeOwnership,
};
