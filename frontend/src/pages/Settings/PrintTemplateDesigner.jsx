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
  patientName: {
    fontSize: "16px",
    fontWeight: "600",
    textAlign: "left",
    textTransform: "capitalize",
    textDecoration: "none",
    color: "",
  },
  profileName: {
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "left",
    textTransform: "capitalize",
    textDecoration: "none",
    color: "",
  },
  testHeading: {
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "left",
    textTransform: "uppercase",
    textDecoration: "underline",
    color: "",
  },
  sectionHeader: {
    fontSize: "16px",
    fontWeight: "700",
    textAlign: "left",
    textTransform: "uppercase",
    textDecoration: "none",
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
  tableHeader: {
    fontSize: "20px",
    fontWeight: "500",
    textAlign: "center",
    textTransform: "uppercase",
    textDecoration: "underline",
    color: "",
  },
  parameter: {
    fontSize: "20px",
    fontWeight: "500",
    textAlign: "left",
    textTransform: "capitalize",
    textDecoration: "none",
    color: "",
  },
  result: {
    fontSize: "20px",
    fontWeight: "400",
    textAlign: "center",
    textTransform: "uppercase",
    textDecoration: "none",
    color: "",
  },
  unit: {
    fontSize: "20px",
    fontWeight: "400",
    textAlign: "center",
    textTransform: "capitalize",
    textDecoration: "none",
    color: "",
  },
  footer: {
    fontSize: "12px",
    fontWeight: "400",
    color: "",
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
    updateTemplate,
    resetTemplate,
    fetchTemplate,
    loading,
    error: contextError,
  } = usePrintTemplate();

  const [selectedLabId, setSelectedLabId] = useState(globalSelectedLabId || "");

  const [template, setTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState("page"); // page, typography, elements, footer
  const [selectedElement, setSelectedElement] = useState("patientName");
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (isSystemAdmin) {
      const initialLabId = selectedLabId || globalSelectedLabId || (laboratories[0]?._id || "");
      if (initialLabId && initialLabId !== selectedLabId) {
        setSelectedLabId(initialLabId);
        fetchTemplate(initialLabId);
      }
    }
  }, [isSystemAdmin, globalSelectedLabId, laboratories]);

  const handleLabChange = (newLabId) => {
    setSelectedLabId(newLabId);
    fetchTemplate(newLabId);
  };

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(1);
  const workspaceRef = React.useRef(null);

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      await fetchTemplate(isSystemAdmin ? selectedLabId : undefined);
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
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
    return DEFAULT_ELEMENT_STYLES[elementKey]?.[field] || "";
  };

  const getBarcodeValue = (field) => getElementValue(field, "barcode");

  const handleElementChange = (field, value, elementKey = selectedElement) => {
    setTemplate((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementKey]: {
          ...prev.elements[elementKey],
          [field]: value,
        },
      },
    }));
  };

  const updateBarcodeSetting = (key, value) => {
    setTemplate((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        barcode: {
          ...prev.elements.barcode,
          [key]: value,
        },
      },
    }));
  };

  // Initialize local state with context template or fallback to default template
  useEffect(() => {
    if (!loading) {
      // Use savedTemplate if available, otherwise construct default template
      const baseTemplate = savedTemplate || {
        page: { ...DEFAULT_PAGE_SETTINGS },
        typography: { baseFont: "Times New Roman, serif", lineHeight: "1.5" },
        elements: JSON.parse(JSON.stringify(DEFAULT_ELEMENT_STYLES)),
        signatures: {
          technician: { name: "Lab Technician", designation: "System Admin", show: true, signatureImage: "", showSignatureImage: false },
          pathologist: { name: "", designation: "Pathologist", qualification: "", registrationNumber: "", show: true, signatureImage: "", showSignatureImage: false }
        }
      };

      const initialTemplate = JSON.parse(JSON.stringify(baseTemplate));

      // Ensure the elements object exists
      initialTemplate.elements = initialTemplate.elements || {};

      // Merge each element with its schema defaults
      Object.keys(DEFAULT_ELEMENT_STYLES).forEach((elementKey) => {
        initialTemplate.elements[elementKey] = {
          ...DEFAULT_ELEMENT_STYLES[elementKey],
          ...(initialTemplate.elements[elementKey] || {}),
        };
      });

      // Apply page defaults for print margins
      initialTemplate.page = {
        ...DEFAULT_PAGE_SETTINGS,
        ...(initialTemplate.page || {}),
      };

      const savedBarcode = baseTemplate.elements?.barcode || {};
      if (savedBarcode.show !== undefined)
        initialTemplate.elements.barcode.enabled = savedBarcode.show;
      if (savedBarcode.barcodeType)
        initialTemplate.elements.barcode.format = savedBarcode.barcodeType;
      if (savedBarcode.x === undefined)
        initialTemplate.elements.barcode.x = 620;
      if (savedBarcode.y === undefined)
        initialTemplate.elements.barcode.y = 30;

      setTemplate(initialTemplate);
      setError(null);
    }
  }, [loading, savedTemplate, contextError]);

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
    toast.promise(updateTemplate(template, isSystemAdmin ? selectedLabId : undefined), {
      loading: "Saving template...",
      success: "Template saved successfully!",
      error: "Failed to save template.",
    });
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to restore the factory default layout? This cannot be undone.",
      )
    ) {
      toast.promise(resetTemplate(isSystemAdmin ? selectedLabId : undefined), {
        loading: "Resetting template...",
        success: "Template reset to default!",
        error: "Failed to reset template.",
      });
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

  if (loading) return <div className="p-8 text-slate-600 font-medium">Loading template designer...</div>;
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
    { value: "patientName", label: "Patient Name" },
    { value: "departmentHeading", label: "Department Heading" },
    { value: "testHeading", label: "Test Heading" },
    { value: "sectionHeader", label: "Section Header" },
    { value: "profileName", label: "Profile Name" },
    { value: "tableHeader", label: "Table Header" },
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
                </>
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
