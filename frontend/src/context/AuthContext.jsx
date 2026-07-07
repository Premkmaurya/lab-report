import React, { createContext, useState, useEffect } from "react";
import API from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // Logged in but not authorized yet
        setUser({ isAuthorized: false });
        setIsAuthorizedUser(false);
        setAuthError(
          error.response.data.message ||
            "Your account is not authorized yet. Please contact the administrator."
        );
      } else {
        // Not authenticated
        setUser(null);
        setIsAuthorizedUser(false);
        setAuthError("");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError("");
    try {
      const response = await API.post("/auth/login", { email, password });
      if (response.data?.success) {
        const loggedUser = response.data.user;
        setUser(loggedUser);
        setIsAuthorizedUser(loggedUser.isAuthorized);
        if (!loggedUser.isAuthorized) {
          setAuthError(
            "Your account is not authorized yet. Please contact the administrator."
          );
        }
        return response.data;
      }
    } catch (error) {
      setUser(null);
      setIsAuthorizedUser(false);
      const msg = error.response?.data?.message || "Login failed";
      setAuthError(msg);
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
        setAuthError(
          "Your account is not authorized yet. Please contact the administrator."
        );
        return response.data;
      }
    } catch (error) {
      setUser(null);
      setIsAuthorizedUser(false);
      const msg = error.response?.data?.message || "Signup failed";
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthorizedUser(false);
      setAuthError("");
      setLoading(false);
    }
  };

  const hasPermission = (permName) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return (user.permissions || []).includes(permName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthorizedUser,
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
