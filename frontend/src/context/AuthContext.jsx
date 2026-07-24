import React, { createContext, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { setAuthUser, setAuthError as setReduxAuthError, setUnauthorizedUser, clearAuth } from "../features/auth/authSlice";
import API from "../services/api";
import { toast } from "../lib/toast";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorizedUser, setIsAuthorizedUser] = useState(false);
  const [authError, setAuthError] = useState("");

  const checkAuth = async () => {
    try {
      const response = await API.get("/auth/me");
      if (response.data?.success) {
        const currentUser = response.data.user;
        setUser(currentUser);
        setIsAuthorizedUser(currentUser.isAuthorized);
        setAuthError("");
        dispatch(setAuthUser(currentUser));
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setUser({ isAuthorized: false });
        setIsAuthorizedUser(false);
        const msg = error.response.data.message || "Your account is not authorized yet. Please contact the administrator.";
        setAuthError(msg);
        dispatch(setUnauthorizedUser(msg));
      } else {
        setUser(null);
        setIsAuthorizedUser(false);
        setAuthError("");
        dispatch(clearAuth());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    setLoading(true);
    setAuthError("");
    try {
      const payload = typeof identifier === "object"
        ? identifier
        : { identifier, password };
      const response = await API.post("/auth/login", payload);
      if (response.data?.success) {
        const loggedUser = response.data.user;
        setUser(loggedUser);
        setIsAuthorizedUser(loggedUser.isAuthorized);
        dispatch(setAuthUser(loggedUser));
        if (!loggedUser.isAuthorized) {
          const msg = "Your account is not authorized yet. Please contact the administrator.";
          setAuthError(msg);
          dispatch(setUnauthorizedUser(msg));
        }
        return response.data;
      }
    } catch (error) {
      setUser(null);
      setIsAuthorizedUser(false);
      dispatch(clearAuth());
      const msg = error.response?.data?.message || "Invalid username/email or password.";
      setAuthError(msg);
      dispatch(setReduxAuthError(msg));
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username, email, password) => {
    setLoading(true);
    setAuthError("");
    try {
      const response = await API.post("/auth/signup", {
        username,
        email,
        password,
      });
      if (response.data?.success) {
        const loggedUser = response.data.user;
        setUser(loggedUser);
        setIsAuthorizedUser(loggedUser.isAuthorized);
        dispatch(setAuthUser(loggedUser));
        const msg = "Your account is not authorized yet. Please contact the administrator.";
        setAuthError(msg);
        dispatch(setUnauthorizedUser(msg));
        return response.data;
      }
    } catch (error) {
      setUser(null);
      setIsAuthorizedUser(false);
      dispatch(clearAuth());
      const msg = error.response?.data?.message || "Signup failed";
      setAuthError(msg);
      dispatch(setReduxAuthError(msg));
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await API.post("/auth/logout");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout cleanly, but local session cleared.");
    } finally {
      setUser(null);
      setIsAuthorizedUser(false);
      setAuthError("");
      dispatch(clearAuth());
      setLoading(false);
    }
  };

  const hasPermission = (permName) => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "system_admin") return true;
    return (user.permissions || []).includes(permName);
  };

  const isSystemAdmin = user?.role === 'system_admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthorizedUser,
        isSystemAdmin,
        authError,
        login,
        signup,
        logout,
        checkAuth,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
