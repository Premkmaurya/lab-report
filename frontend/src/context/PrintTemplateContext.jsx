import React, { createContext, useContext, useState, useEffect } from "react";
import { printTemplateService } from "../services/printTemplateService";
import { useAuth } from "../hooks/useAuth";

const PrintTemplateContext = createContext();

export const usePrintTemplate = () => useContext(PrintTemplateContext);

export const PrintTemplateProvider = ({ children }) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTemplate = async () => {
    try {
      const res = await printTemplateService.getTemplate();
      if (res.success && res.data) {
        setTemplate(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch print template:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTemplate();
    }
  }, [user]);

  const updateTemplate = async (templateData) => {
    try {
      const res = await printTemplateService.updateTemplate(templateData);
      if (res.success && res.data) {
        setTemplate(res.data);
      }
      return res;
    } catch (error) {
      console.error("Failed to update print template:", error);
      throw error;
    }
  };

  const resetTemplate = async () => {
    try {
      const res = await printTemplateService.resetTemplate();
      if (res.success && res.data) {
        setTemplate(res.data);
      }
      return res;
    } catch (error) {
      console.error("Failed to reset print template:", error);
      throw error;
    }
  };

  return (
    <PrintTemplateContext.Provider value={{ template, loading, updateTemplate, resetTemplate, fetchTemplate, setTemplate }}>
      {children}
    </PrintTemplateContext.Provider>
  );
};
