import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { usePrintTemplate } from "../../context/PrintTemplateContext";
import { ReportCanvas } from "../../components/report/ReportCanvas";
import LaboratorySelect from "../../components/LaboratorySelect";
import { useAuth } from "../../hooks/useAuth";
import { useLaboratory } from "../../context/LaboratoryContext";
import { toast } from "../../lib/toast";

// Default element styles derived from backend schema
const DEFAULT_ELEMENT_STYLES = {
  patientHeader: {
    fontSize: "14px",
    color: "#0F172A",
    letterSpacing: "0px",
    textTransform: "none",
    textAlign: "left",
    labelFontWeight: "600",
    labelColor: "#000000",
    valueFontWeight: "400",
    valueColor: "#0F172A",
  },
  testHeading: {
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "left",
    textTransform: "uppercase",
    textDecoration: "underline",
    color: "",
  },
  departmentHeading: {
    fontSize: "25px",
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    textDecoration: "underline",
    color: "",
  },
  parameter: {
    fontSize: "20px",
    fontWeight: "500",
    textAlign: "left",
    textTransform: "none",
    textDecoration: "none",
    color: "",
  },
  result: {
    fontSize: "20px",
    fontWeight: "400",
    textAlign: "center",
    textTransform: "none",
    textDecoration: "none",
    color: "",
  },
  unit: {
    fontSize: "20px",
    fontWeight: "400",
    textAlign: "center",
    textTransform: "none",
    textDecoration: "none",
    color: "",
  },
  footer: {
    fontSize: "12px",
    fontWeight: "400",
    color: "",
    text: "",
  },
  barcode: {
    enabled: true,
    displayValue: true,
    format: "CODE128",
    width: 2,
    height: 50,
    marginTop: 8,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    alignment: "right",
    rotation: 0,
    x: 620,
    y: 30,
    lineColor: "#000000",
    background: "transparent",
  },
};

const DEFAULT_PAGE_SETTINGS = {
  marginTop: 60,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
};

export const PrintTemplateDesigner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { laboratories, selectedLabId: globalSelectedLabId } = useLaboratory();
  const isSystemAdmin = user?.role === "system_admin";

  const {
    template: savedTemplate,
    setTemplate,
    updateTemplate,
    resetTemplate,
    fetchTemplate,
    loading,
    error: contextError,
  } = usePrintTemplate();

  const [selectedLabId, setSelectedLabId] = useState(globalSelectedLabId || "");

  const [activeTab, setActiveTab] = useState("page"); // page, typography, elements, footer
  const [selectedElement, setSelectedElement] = useState("patientHeader"); // patientHeader, departmentHeading, testHeading, sectionHeader, tableHeader, parameter, result, unit, footer
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  // Resolve the effective laboratory ID for this designer session dynamically.
  const effectiveLabId = React.useMemo(() => {
    if (isSystemAdmin) {
      return selectedLabId || globalSelectedLabId || (laboratories.length > 0 ? laboratories[0]._id : "");
    }
    return user?.laboratoryId || globalSelectedLabId || "";
  }, [isSystemAdmin, selectedLabId, globalSelectedLabId, laboratories, user]);

  // Fetch template on mount and whenever the effective laboratory ID resolves or changes.
  useEffect(() => {
    if (effectiveLabId) {
      fetchTemplate(effectiveLabId);
    }
  }, [effectiveLabId, fetchTemplate]);

  const handleLabChange = (newLabId) => {
    setSelectedLabId(newLabId);
  };

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const workspaceRef = React.useRef(null);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await fetchTemplate(effectiveLabId);
    } catch (err) {
      console.error("[PrintTemplateDesigner] Retry fetch template failed:", err);
      setError(err.message || "Failed to load template");
    } finally {
      setRetrying(false);
    }
  };

  // Helper function to get element value with default fallback
  const getElementValue = (field, elementKey = selectedElement) => {
    const value = template?.elements?.[elementKey]?.[field];
    if (value !== undefined && value !== null) {
      return value;
    }
    return DEFAULT_ELEMENT_STYLES[elementKey]?.[field] ?? "";
  };

  const getBarcodeValue = (field) => getElementValue(field, "barcode");

  const handleElementChange = (field, value, elementKey = selectedElement) => {
    setTemplate((prev) => ({
      ...prev,
      elements: {
        ...(prev?.elements || {}),
        [elementKey]: {
          ...(prev?.elements?.[elementKey] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateBarcodeSetting = (key, value) => {
    setTemplate((prev) => ({
      ...prev,
      elements: {
        ...(prev?.elements || {}),
        barcode: {
          ...(prev?.elements?.barcode || {}),
          [key]: value,
        },
      },
    }));
  };

  /**
   * Build the local template state from a saved (DB) template.
   * 
   * The saved template from the database is the single source of truth.
   * Default values are used ONLY to fill in keys that the DB document
   * does not contain (e.g. a newly added setting that older documents lack).
   */
  const buildTemplateFromSaved = (saved) => {
    // Deep-clone so we never mutate the context's state.
    const base = JSON.parse(JSON.stringify(saved));

    // Page: DB values take priority; defaults fill gaps.
    const page = {
      ...DEFAULT_PAGE_SETTINGS,
      ...(base.page || {}),
    };

    // Typography: DB values take priority.
    const typography = {
      baseFont: "Times New Roman, serif",
      lineHeight: "1.5",
      ...(base.typography || {}),
    };

    // Elements: For each element key, merge defaults first, then DB values on top.
    const elements = {};
    const allElementKeys = new Set([
      ...Object.keys(DEFAULT_ELEMENT_STYLES),
      ...Object.keys(base.elements || {}),
    ]);
    allElementKeys.forEach((key) => {
      elements[key] = {
        ...(DEFAULT_ELEMENT_STYLES[key] || {}),
        ...(base.elements?.[key] || {}),
      };
    });

    // Handle legacy barcode field names.
    if (base.elements?.barcode) {
      if (base.elements.barcode.show !== undefined && base.elements.barcode.enabled === undefined) {
        elements.barcode.enabled = base.elements.barcode.show;
      }
      if (base.elements.barcode.barcodeType && !base.elements.barcode.format) {
        elements.barcode.format = base.elements.barcode.barcodeType;
      }
    }

    // Signatures: DB values take priority.
    const signatures = {
      technician: {
        name: "Lab Technician",
        designation: "Lab Technician",
        show: true,
        signatureImage: "",
        showSignatureImage: false,
        ...(base.signatures?.technician || {}),
      },
      pathologist: {
        name: "",
        designation: "Pathologist",
        qualification: "",
        registrationNumber: "",
        show: true,
        signatureImage: "",
        showSignatureImage: false,
        ...(base.signatures?.pathologist || {}),
      },
    };

    return { ...base, page, typography, elements, signatures };
  };

  const defaultTemplate = React.useMemo(
    () => ({
      page: { ...DEFAULT_PAGE_SETTINGS },
      typography: { baseFont: "Times New Roman, serif", lineHeight: "1.5" },
      elements: JSON.parse(JSON.stringify(DEFAULT_ELEMENT_STYLES)),
      signatures: {
        technician: {
          name: "Lab Technician",
          designation: "Lab Technician",
          show: true,
          signatureImage: "",
          showSignatureImage: false,
        },
        pathologist: {
          name: "",
          designation: "Pathologist",
          qualification: "",
          registrationNumber: "",
          show: true,
          signatureImage: "",
          showSignatureImage: false,
        },
      },
    }),
    []
  );

  const template = React.useMemo(() => {
    if (!savedTemplate) {
      return defaultTemplate;
    }
    return buildTemplateFromSaved(savedTemplate);
  }, [savedTemplate, defaultTemplate]);

  const handlePageChange = (field, value) => {
    setTemplate((prev) => ({
      ...prev,
      page: { ...prev.page, [field]: value },
    }));
  };

  const handleTypographyChange = (field, value) => {
    setTemplate((prev) => ({
      ...prev,
      typography: { ...prev.typography, [field]: value },
    }));
  };

  const handleSignatureChange = (role, field, value) => {
    setTemplate((prev) => {
      const signatures = prev.signatures || {
        technician: {
          name: "Lab Technician",
          designation: "Lab Technician",
          show: true,
        },
        pathologist: {
          name: "",
          designation: "",
          qualification: "",
          registrationNumber: "",
          show: true,
        },
      };
      return {
        ...prev,
        signatures: {
          ...prev.signatures,
          [role]: { ...signatures[role], [field]: value },
        },
      };
    });
  };

  const handleSave = async () => {
    const targetLabId = isSystemAdmin ? effectiveLabId : undefined;
    try {
      await updateTemplate(template, targetLabId);
      // The context's updateTemplate already updates savedTemplate,
      // which triggers the init useEffect to rebuild local state.
      toast.success("Template saved successfully!");
    } catch (err) {
      console.error("[PrintTemplateDesigner] Save error:", err);
      toast.error(err.response?.data?.message || "Failed to save template.");
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to restore the factory default layout? This cannot be undone.",
      )
    ) {
      const targetLabId = isSystemAdmin ? effectiveLabId : undefined;
      try {
        await resetTemplate(targetLabId);
        // The context's resetTemplate already updates savedTemplate,
        // which triggers the init useEffect to rebuild local state.
        toast.success("Template reset to defaults!");
      } catch (err) {
        console.error("[PrintTemplateDesigner] Reset error:", err);
        toast.error("Failed to reset template.");
      }
    }
  };

  const handleZoom = (level) => {
    setZoomLevel(level);
  };

  const handleFitWidth = () => {
    if (workspaceRef.current) {
      // 794 is the A4 width. We leave a 40px padding.
      const containerWidth = workspaceRef.current.clientWidth - 40;
      const newZoom = containerWidth / 794;
      setZoomLevel(Math.min(Math.max(newZoom, 0.25), 3));
    }
  };

  const handleFitPage = () => {
    if (workspaceRef.current) {
      // 1123 is the A4 height. We leave a 40px padding.
      const containerHeight = workspaceRef.current.clientHeight - 40;
      const newZoom = containerHeight / 1123;
      setZoomLevel(Math.min(Math.max(newZoom, 0.25), 3));
    }
  };

  if (loading || !template) return <div className="p-8 text-slate-600 font-medium">Loading template designer...</div>;
  if (error || contextError)
    return (
      <div className="p-8 flex flex-col items-start space-y-4 max-w-xl bg-white rounded-lg shadow-sm border border-slate-200 m-6">
        <div className="text-red-600 font-semibold text-base">
          {error || contextError || "Unable to load template. Please try again or check your backend connection."}
        </div>
        <p className="text-slate-600 text-sm">
          Please check your browser console (F12) for network logs, or click Retry below to re-fetch from the backend.
        </p>
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {retrying ? "Retrying..." : "Retry"}
          </button>
          <button
            onClick={async () => {
              try {
                setRetrying(true);
                await resetTemplate();
                setError(null);
              } catch (e) {
                console.error("[PrintTemplateDesigner] Reset error:", e);
                toast.error("Failed to reset template. Please check backend server.");
              } finally {
                setRetrying(false);
              }
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors border border-slate-300"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );
  if (!template) return <div className="p-8 text-slate-600 font-medium">Loading template designer...</div>;

  // Mock data for live preview
  const mockPatient = {
    name: "John Doe",
    age: 45,
    gender: "Male",
    referredDoctor: "Smith",
    visitId: "1234",
    createdAt: new Date().toISOString(),
  };

  const mockReport = {
    createdAt: new Date().toISOString(),
    tests: [
      {
        testId: { departmentId: { name: "HEMATOLOGY" } },
        testName: "Complete Blood Count (CBC)",
        result: [
          {
            parameter: "Hemoglobin",
            value: "14.5",
            normalRange: "13.0 - 17.0",
            unit: "g/dL",
          },
          {
            parameter: "WBC Count",
            value: "8500",
            normalRange: "4000 - 11000",
            unit: "cumm",
          },
        ],
      },
      {
        testId: { departmentId: { name: "BIOCHEMISTRY" } },
        testName: "Lipid Profile",
        result: [
          {
            parameter: "Total Cholesterol",
            value: "180",
            normalRange: "< 200",
            unit: "mg/dL",
          },
          {
            parameter: "Triglycerides",
            value: "120",
            normalRange: "< 150",
            unit: "mg/dL",
          },
        ],
      },
    ],
  };

  const elementOptions = [
    { value: "patientHeader", label: "Patient Information Header" },
    { value: "departmentHeading", label: "Department Heading" },
    { value: "testHeading", label: "Test Heading" },
    { value: "parameter", label: "Parameter" },
    { value: "result", label: "Result" },
    { value: "unit", label: "Normal Range & Unit" },
    { value: "footer", label: "Footer / Signatures" },
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8 bg-warm-canvas">
      {/* Left Panel: Controls */}
      <div className="w-full md:w-[400px] flex flex-col bg-paper-white border border-cream-border rounded-cards shadow-sm h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-cream-border bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/settings")}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h2 className="font-martinaplantijn text-xl text-ink-navy">
              Print Designer
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="p-2 hover:bg-red-50 text-red-600 rounded"
              title="Reset to Default"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleSave}
              className="p-2 bg-electric-cobalt text-white hover:bg-opacity-90 rounded flex items-center space-x-1 px-3 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span className="text-xs font-medium">Save</span>
            </button>
          </div>
        </div>

        {/* Laboratory Selector for System Admin */}
        {isSystemAdmin && (
          <div className="p-3 border-b border-cream-border bg-warm-canvas/40">
            <LaboratorySelect
              value={selectedLabId}
              onChange={handleLabChange}
              laboratories={laboratories}
              required={false}
            />
          </div>
        )}

        <div className="flex border-b border-cream-border bg-white text-sm">
          <button
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === "page" ? "border-electric-cobalt text-electric-cobalt" : "border-transparent text-slate-500"}`}
            onClick={() => setActiveTab("page")}
          >
            Page
          </button>
          <button
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === "typography" ? "border-electric-cobalt text-electric-cobalt" : "border-transparent text-slate-500"}`}
            onClick={() => setActiveTab("typography")}
          >
            Typography
          </button>
          <button
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === "elements" ? "border-electric-cobalt text-electric-cobalt" : "border-transparent text-slate-500"}`}
            onClick={() => setActiveTab("elements")}
          >
            Elements
          </button>
          <button
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === "footer" ? "border-electric-cobalt text-electric-cobalt" : "border-transparent text-slate-500"}`}
            onClick={() => setActiveTab("footer")}
          >
            Footer
          </button>
          <button
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === "bar-code" ? "border-electric-cobalt text-electric-cobalt" : "border-transparent text-slate-500"}`}
            onClick={() => setActiveTab("bar-code")}
          >
            Bar Code
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === "page" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Margins
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Top Margin
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-cream-border rounded"
                    value={template.page.marginTop}
                    onChange={(e) =>
                      handlePageChange("marginTop", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Bottom Margin
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-cream-border rounded"
                    value={template.page.marginBottom}
                    onChange={(e) =>
                      handlePageChange("marginBottom", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Left Margin
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-cream-border rounded"
                    value={template.page.marginLeft}
                    onChange={(e) =>
                      handlePageChange("marginLeft", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Right Margin
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-cream-border rounded"
                    value={template.page.marginRight}
                    onChange={(e) =>
                      handlePageChange("marginRight", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "typography" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Global Text
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Base Font Family
                </label>
                <select
                  className="w-full text-sm border-cream-border rounded"
                  value={template.typography.baseFont}
                  onChange={(e) =>
                    handleTypographyChange("baseFont", e.target.value)
                  }
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">
                    Times New Roman
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Line Height
                </label>
                <input
                  type="text"
                  className="w-full text-sm border-cream-border rounded"
                  value={template.typography.lineHeight}
                  onChange={(e) =>
                    handleTypographyChange("lineHeight", e.target.value)
                  }
                />
              </div>
            </div>
          )}

          {activeTab === "elements" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Element Styles
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Element to Edit
                </label>
                <select
                  className="w-full text-sm border-electric-cobalt text-electric-cobalt font-medium rounded bg-lavender-mist/30"
                  value={selectedElement}
                  onChange={(e) => setSelectedElement(e.target.value)}
                >
                  {elementOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-4 mt-4">
                {selectedElement === "patientHeader" ? (
                  <>
                    <div className="text-xs font-bold text-electric-cobalt uppercase tracking-wider mb-1 border-b border-slate-200 pb-2">
                      Patient Header Shared Styles
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Font Size
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("fontSize", "patientHeader")}
                          onChange={(e) =>
                            handleElementChange("fontSize", e.target.value, "patientHeader")
                          }
                          placeholder="e.g. 14px"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Font Color
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("color", "patientHeader")}
                          onChange={(e) =>
                            handleElementChange("color", e.target.value, "patientHeader")
                          }
                          placeholder="e.g. #0F172A"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Letter Spacing
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("letterSpacing", "patientHeader")}
                          onChange={(e) =>
                            handleElementChange("letterSpacing", e.target.value, "patientHeader")
                          }
                          placeholder="e.g. 0px"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Text Transform
                        </label>
                        <select
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("textTransform", "patientHeader")}
                          onChange={(e) =>
                            handleElementChange("textTransform", e.target.value, "patientHeader")
                          }
                        >
                          <option value="none">None</option>
                          <option value="uppercase">Uppercase</option>
                          <option value="capitalize">Capitalize</option>
                          <option value="lowercase">Lowercase</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Alignment
                        </label>
                        <select
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("textAlign", "patientHeader")}
                          onChange={(e) =>
                            handleElementChange("textAlign", e.target.value, "patientHeader")
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Label Styles (e.g. Patient Name:)
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                            Label Font Weight
                          </label>
                          <select
                            className="w-full text-sm border-slate-300 rounded"
                            value={getElementValue("labelFontWeight", "patientHeader")}
                            onChange={(e) =>
                              handleElementChange("labelFontWeight", e.target.value, "patientHeader")
                            }
                          >
                            <option value="600">Semibold (600)</option>
                            <option value="400">Normal (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="700">Bold (700)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                            Label Color
                          </label>
                          <input
                            type="text"
                            className="w-full text-sm border-slate-300 rounded"
                            value={getElementValue("labelColor", "patientHeader")}
                            onChange={(e) =>
                              handleElementChange("labelColor", e.target.value, "patientHeader")
                            }
                            placeholder="e.g. #000000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Value Styles (e.g. Mr. John Doe)
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                            Value Font Weight
                          </label>
                          <select
                            className="w-full text-sm border-slate-300 rounded"
                            value={getElementValue("valueFontWeight", "patientHeader")}
                            onChange={(e) =>
                              handleElementChange("valueFontWeight", e.target.value, "patientHeader")
                            }
                          >
                            <option value="400">Normal (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semibold (600)</option>
                            <option value="700">Bold (700)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                            Value Color
                          </label>
                          <input
                            type="text"
                            className="w-full text-sm border-slate-300 rounded"
                            value={getElementValue("valueColor", "patientHeader")}
                            onChange={(e) =>
                              handleElementChange("valueColor", e.target.value, "patientHeader")
                            }
                            placeholder="e.g. #0F172A"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                        Font Size
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm border-slate-300 rounded"
                        value={getElementValue("fontSize")}
                        onChange={(e) =>
                          handleElementChange("fontSize", e.target.value)
                        }
                        placeholder="e.g. 14px"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                        Font Weight
                      </label>
                      <select
                        className="w-full text-sm border-slate-300 rounded"
                        value={getElementValue("fontWeight")}
                        onChange={(e) =>
                          handleElementChange("fontWeight", e.target.value)
                        }
                      >
                        <option value="">Inherit</option>
                        <option value="400">Normal (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semibold (600)</option>
                        <option value="700">Bold (700)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                        Text Color
                      </label>
                      <input
                        type="text"
                        className="w-full text-sm border-slate-300 rounded"
                        value={getElementValue("color")}
                        onChange={(e) =>
                          handleElementChange("color", e.target.value)
                        }
                        placeholder="e.g. #0F172A"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                        Text Alignment
                      </label>
                      <select
                        className="w-full text-sm border-slate-300 rounded"
                        value={getElementValue("textAlign")}
                        onChange={(e) =>
                          handleElementChange("textAlign", e.target.value)
                        }
                      >
                        <option value="">Inherit</option>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Transform
                        </label>
                        <select
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("textTransform")}
                          onChange={(e) =>
                            handleElementChange("textTransform", e.target.value)
                          }
                        >
                          <option value="">None</option>
                          <option value="uppercase">Uppercase</option>
                          <option value="capitalize">Capitalize</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Decoration
                        </label>
                        <select
                          className="w-full text-sm border-slate-300 rounded"
                          value={getElementValue("textDecoration")}
                          onChange={(e) =>
                            handleElementChange("textDecoration", e.target.value)
                          }
                        >
                          <option value="">None</option>
                          <option value="underline">Underline</option>
                        </select>
                      </div>
                    </div>
                    {selectedElement === "footer" && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                          Footer Text
                        </label>
                        <input
                          type="text"
                          className="w-full text-sm border-slate-300 rounded px-2.5 py-1.5"
                          value={getElementValue("text", "footer")}
                          onChange={(e) =>
                            handleElementChange("text", e.target.value, "footer")
                          }
                          placeholder="e.g. Powered by UltraPath"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="space-y-6">
              {/* Technician Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-cream-border pb-2">
                  Lab Technician
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showTechnician"
                    checked={template.signatures?.technician?.show ?? true}
                    onChange={(e) =>
                      handleSignatureChange(
                        "technician",
                        "show",
                        e.target.checked,
                      )
                    }
                    className="rounded border-slate-300 text-electric-cobalt focus:ring-electric-cobalt"
                  />
                  <label
                    htmlFor="showTechnician"
                    className="text-sm font-medium text-slate-700"
                  >
                    Show Technician Signature
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.signatures?.technician?.name || ""}
                    onChange={(e) =>
                      handleSignatureChange(
                        "technician",
                        "name",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. System Admin"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Designation
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.signatures?.technician?.designation || ""}
                    onChange={(e) =>
                      handleSignatureChange(
                        "technician",
                        "designation",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Lab Technician"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="showTechImage"
                    checked={
                      template.signatures?.technician?.showSignatureImage ??
                      false
                    }
                    onChange={(e) =>
                      handleSignatureChange(
                        "technician",
                        "showSignatureImage",
                        e.target.checked,
                      )
                    }
                    className="rounded border-slate-300 text-electric-cobalt focus:ring-electric-cobalt"
                  />
                  <label
                    htmlFor="showTechImage"
                    className="text-[11px] font-medium text-slate-700 uppercase"
                  >
                    Use Image Signature
                  </label>
                </div>
                {template.signatures?.technician?.showSignatureImage && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (upload) => {
                            handleSignatureChange(
                              "technician",
                              "signatureImage",
                              upload.target.result,
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {template.signatures?.technician?.signatureImage && (
                      <div className="mt-2 border border-slate-200 p-2 inline-block rounded bg-white">
                        <img
                          src={template.signatures.technician.signatureImage}
                          alt="Signature"
                          className="h-12 object-contain"
                        />
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700 mt-1 block"
                          onClick={() =>
                            handleSignatureChange(
                              "technician",
                              "signatureImage",
                              "",
                            )
                          }
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pathologist Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-cream-border pb-2 mt-6">
                  Pathologist
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showPathologist"
                    checked={template.signatures?.pathologist?.show ?? true}
                    onChange={(e) =>
                      handleSignatureChange(
                        "pathologist",
                        "show",
                        e.target.checked,
                      )
                    }
                    className="rounded border-slate-300 text-electric-cobalt focus:ring-electric-cobalt"
                  />
                  <label
                    htmlFor="showPathologist"
                    className="text-sm font-medium text-slate-700"
                  >
                    Show Pathologist Signature
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Name *
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.signatures?.pathologist?.name || ""}
                    onChange={(e) =>
                      handleSignatureChange(
                        "pathologist",
                        "name",
                        e.target.value,
                      )
                    }
                    placeholder="Leave empty to use referred doctor"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Designation
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.signatures?.pathologist?.designation || ""}
                    onChange={(e) =>
                      handleSignatureChange(
                        "pathologist",
                        "designation",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Pathologist"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Qualification
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded"
                    value={
                      template.signatures?.pathologist?.qualification || ""
                    }
                    onChange={(e) =>
                      handleSignatureChange(
                        "pathologist",
                        "qualification",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. MBBS, MD (Pathology)"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded"
                    value={
                      template.signatures?.pathologist?.registrationNumber || ""
                    }
                    onChange={(e) =>
                      handleSignatureChange(
                        "pathologist",
                        "registrationNumber",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Reg. No. 123456"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="showPathImage"
                    checked={
                      template.signatures?.pathologist?.showSignatureImage ??
                      false
                    }
                    onChange={(e) =>
                      handleSignatureChange(
                        "pathologist",
                        "showSignatureImage",
                        e.target.checked,
                      )
                    }
                    className="rounded border-slate-300 text-electric-cobalt focus:ring-electric-cobalt"
                  />
                  <label
                    htmlFor="showPathImage"
                    className="text-[11px] font-medium text-slate-700 uppercase"
                  >
                    Use Image Signature
                  </label>
                </div>
                {template.signatures?.pathologist?.showSignatureImage && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (upload) => {
                            handleSignatureChange(
                              "pathologist",
                              "signatureImage",
                              upload.target.result,
                            );
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {template.signatures?.pathologist?.signatureImage && (
                      <div className="mt-2 border border-slate-200 p-2 inline-block rounded bg-white">
                        <img
                          src={template.signatures.pathologist.signatureImage}
                          alt="Signature"
                          className="h-12 object-contain"
                        />
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700 mt-1 block"
                          onClick={() =>
                            handleSignatureChange(
                              "pathologist",
                              "signatureImage",
                              "",
                            )
                          }
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Custom Text / Note */}
              <div className="space-y-4 pt-4 border-t border-cream-border">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Footer Custom Text / Note
                </h3>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    className="w-full text-sm border-slate-300 rounded px-3 py-2"
                    value={getElementValue("text", "footer")}
                    onChange={(e) =>
                      handleElementChange("text", e.target.value, "footer")
                    }
                    placeholder="e.g. Powered by UltraPath / Digitally Signed Report"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "bar-code" && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showBarcode"
                  checked={template.elements.barcode.enabled}
                  onChange={(e) =>
                    updateBarcodeSetting("enabled", e.target.checked)
                  }
                  className="rounded border-slate-300 text-electric-cobalt focus:ring-electric-cobalt"
                />
                <label
                  htmlFor="showBarcode"
                  className="text-[11px] font-medium text-slate-700 uppercase"
                >
                  Show Barcode
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="displayValue"
                  checked={template.elements.barcode.displayValue}
                  onChange={(e) =>
                    updateBarcodeSetting("displayValue", e.target.checked)
                  }
                  className="rounded border-slate-300 text-electric-cobalt focus:ring-electric-cobalt"
                />
                <label
                  htmlFor="displayValue"
                  className="text-[11px] font-medium text-slate-700 uppercase"
                >
                  Show Human-Readable Text
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Width Multiplier
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    step="0.1"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.elements.barcode.width}
                    onChange={(e) =>
                      updateBarcodeSetting("width", e.target.value)
                    }
                    onBlur={(e) => {
                      let val = Number(e.target.value);
                      if (val < 1) val = 1;
                      if (val > 6) val = 6;
                      if (isNaN(val)) val = 2;
                      updateBarcodeSetting("width", val);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="150"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.elements.barcode.height}
                    onChange={(e) =>
                      updateBarcodeSetting("height", e.target.value)
                    }
                    onBlur={(e) => {
                      let val = Number(e.target.value);
                      if (val < 20) val = 20;
                      if (val > 150) val = 150;
                      if (isNaN(val)) val = 50;
                      updateBarcodeSetting("height", val);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                  Alignment
                </label>
                <select
                  className="w-full text-sm border-slate-300 rounded"
                  value={template.elements.barcode.alignment}
                  onChange={(e) =>
                    updateBarcodeSetting("alignment", e.target.value)
                  }
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Margin Top
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.elements.barcode.marginTop}
                    onChange={(e) =>
                      updateBarcodeSetting("marginTop", e.target.value)
                    }
                    onBlur={(e) => {
                      let val = Number(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      if (isNaN(val)) val = 8;
                      updateBarcodeSetting("marginTop", val);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Margin Bottom
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.elements.barcode.marginBottom}
                    onChange={(e) =>
                      updateBarcodeSetting("marginBottom", e.target.value)
                    }
                    onBlur={(e) => {
                      let val = Number(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      if (isNaN(val)) val = 0;
                      updateBarcodeSetting("marginBottom", val);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Margin Left
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.elements.barcode.marginLeft}
                    onChange={(e) =>
                      updateBarcodeSetting("marginLeft", e.target.value)
                    }
                    onBlur={(e) => {
                      let val = Number(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      if (isNaN(val)) val = 0;
                      updateBarcodeSetting("marginLeft", val);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase">
                    Margin Right
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-sm border-slate-300 rounded"
                    value={template.elements.barcode.marginRight}
                    onChange={(e) =>
                      updateBarcodeSetting("marginRight", e.target.value)
                    }
                    onBlur={(e) => {
                      let val = Number(e.target.value);
                      if (val < 0) val = 0;
                      if (val > 100) val = 100;
                      if (isNaN(val)) val = 0;
                      updateBarcodeSetting("marginRight", val);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 bg-slate-100 border border-slate-300 rounded shadow-inner flex flex-col overflow-hidden relative">
        {/* Zoom Toolbar */}
        <div className="h-12 bg-white border-b border-slate-300 flex items-center justify-center px-4 space-x-2 shrink-0 z-10 shadow-sm">
          <button
            onClick={() => handleZoom(Math.max(0.25, zoomLevel - 0.25))}
            className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded font-medium text-sm border border-transparent hover:border-slate-200 transition-colors"
          >
            -
          </button>

          <select
            value={zoomLevel}
            onChange={(e) => handleZoom(parseFloat(e.target.value))}
            className="text-sm font-medium border-slate-300 rounded px-2 py-1 focus:ring-0 cursor-pointer"
          >
            <option value={0.5}>50%</option>
            <option value={0.75}>75%</option>
            <option value={1}>100%</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
          </select>

          <button
            onClick={() => handleZoom(Math.min(3, zoomLevel + 0.25))}
            className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded font-medium text-sm border border-transparent hover:border-slate-200 transition-colors"
          >
            +
          </button>

          <div className="w-px h-6 bg-slate-300 mx-2"></div>

          <button
            onClick={handleFitWidth}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-medium text-xs border border-slate-200 transition-colors"
          >
            Fit Width
          </button>
          <button
            onClick={handleFitPage}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-medium text-xs border border-slate-200 transition-colors"
          >
            Fit Page
          </button>
        </div>

        {/* Scrollable Workspace */}
        <div
          ref={workspaceRef}
          className="flex-1 overflow-auto bg-[#ECECEC] flex items-start justify-center p-8"
        >
          {/* Zoom Wrapper */}
          <div
            className="transition-all duration-200 flex-shrink-0 mx-auto"
            style={{
              width: `${794 * zoomLevel}px`,
              height: `${1123 * zoomLevel}px`,
            }}
          >
            {/* The scaled canvas */}
            <div
              className="origin-top-center transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                width: "794px",
                height: "1123px",
              }}
            >
              <ReportCanvas
                patient={mockPatient}
                report={mockReport}
                customTemplate={template}
                zoom={zoomLevel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintTemplateDesigner;
