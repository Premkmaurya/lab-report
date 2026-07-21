import React, { createContext, useContext, useState, useEffect } from "react";
import { printTemplateService } from "../services/printTemplateService";
import { useAuth } from "../hooks/useAuth";

const PrintTemplateContext = createContext();

export const usePrintTemplate = () => useContext(PrintTemplateContext);

export const PrintTemplateProvider = ({ children }) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await printTemplateService.getTemplate();

      if (res && res.data) {
        setTemplate(res.data);
      } else if (res && res.template) {
        setTemplate(res.template);
      } else {
        const resetRes = await printTemplateService.resetTemplate();
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
      const errMsg = err.response?.data?.message || err.message || "Failed to fetch print template";
      console.error("[PrintTemplateContext] Fetch template exception:", errMsg, err);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTemplate();
    } else {
      setLoading(false);
    }
  }, [user]);

  const updateTemplate = async (templateData) => {
    try {
      const res = await printTemplateService.updateTemplate(templateData);
      if (res && res.data) {
        setTemplate(res.data);
      }
      return res;
    } catch (err) {
      console.error("[PrintTemplateContext] Failed to update print template:", err.response?.data?.message || err.message || err);
      throw err;
    }
  };

  const resetTemplate = async () => {
    try {
      const res = await printTemplateService.resetTemplate();
      if (res && res.data) {
        setTemplate(res.data);
        setError(null);
      }
      return res;
    } catch (err) {
      console.error("[PrintTemplateContext] Failed to reset print template:", err.response?.data?.message || err.message || err);
      throw err;
    }
  };

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
