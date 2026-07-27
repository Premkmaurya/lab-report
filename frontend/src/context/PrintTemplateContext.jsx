import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { printTemplateService } from "../services/printTemplateService";
import { useAuth } from "../hooks/useAuth";

const PrintTemplateContext = createContext();

export const usePrintTemplate = () => useContext(PrintTemplateContext);

export const PrintTemplateProvider = ({ children }) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Counter to discard stale async responses.
  // When fetchTemplate is called, it increments this counter and captures
  // the current value.  When the async response arrives, it only updates
  // state if its captured id still matches the latest counter value.
  const fetchIdRef = useRef(0);

  const fetchTemplate = useCallback(async (labId) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await printTemplateService.getTemplate(labId);

      // Discard if a newer fetch was initiated while we were waiting.
      if (id !== fetchIdRef.current) return;

      if (res && res.data) {
        setTemplate(res.data);
      } else if (res && res.template) {
        setTemplate(res.template);
      } else {
        const resetRes = await printTemplateService.resetTemplate(labId);
        if (id !== fetchIdRef.current) return;
        if (resetRes && resetRes.data) {
          setTemplate(resetRes.data);
          setError(null);
        } else {
          const errMsg = "Backend returned template response with empty data";
          console.error("[PrintTemplateContext] Error:", errMsg, res);
          setError(errMsg);
        }
      }
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      const errMsg = err.response?.data?.message || err.message || "Failed to fetch print template";
      console.error("[PrintTemplateContext] Fetch template exception:", errMsg, err);
      setError(errMsg);
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTemplate(user.laboratoryId);
    } else {
      setLoading(false);
    }
  }, [user, fetchTemplate]);

  const updateTemplate = useCallback(async (templateData, labId) => {
    try {
      const res = await printTemplateService.updateTemplate(templateData, labId);
      if (res && res.data) {
        setTemplate(res.data);
      }
      return res;
    } catch (err) {
      console.error("[PrintTemplateContext] Failed to update print template:", err.response?.data?.message || err.message || err);
      throw err;
    }
  }, []);

  const resetTemplate = useCallback(async (labId) => {
    try {
      const res = await printTemplateService.resetTemplate(labId);
      if (res && res.data) {
        setTemplate(res.data);
        setError(null);
      }
      return res;
    } catch (err) {
      console.error("[PrintTemplateContext] Failed to reset print template:", err.response?.data?.message || err.message || err);
      throw err;
    }
  }, []);

  return (
    <PrintTemplateContext.Provider
      value={{
        template,
        loading,
        error,
        updateTemplate,
        resetTemplate,
        fetchTemplate,
        setTemplate,
      }}
    >
      {children}
    </PrintTemplateContext.Provider>
  );
};
