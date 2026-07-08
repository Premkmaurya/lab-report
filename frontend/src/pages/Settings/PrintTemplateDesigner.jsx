import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, RotateCcw } from "lucide-react";
import { usePrintTemplate } from "../../context/PrintTemplateContext";
import { ReportLayout } from "../../components/report/ReportLayout";
import { toast } from "../../lib/toast";

export const PrintTemplateDesigner = () => {
  const navigate = useNavigate();
  const { template: savedTemplate, updateTemplate, resetTemplate, loading } = usePrintTemplate();
  
  const [template, setTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState("page"); // page, typography, elements
  const [selectedElement, setSelectedElement] = useState("patientName");
  const [error, setError] = useState(null);
  
  // Initialize local state with context template
  useEffect(() => {
    if (!loading) {
      if (savedTemplate) {
        setTemplate(JSON.parse(JSON.stringify(savedTemplate))); // Deep copy
        setError(null);
      } else {
        setError("Unable to load template. Please try again or check your backend connection.");
      }
    }
  }, [loading, savedTemplate]);

  const handlePageChange = (field, value) => {
    setTemplate(prev => ({ ...prev, page: { ...prev.page, [field]: value } }));
  };

  const handleTypographyChange = (field, value) => {
    setTemplate(prev => ({ ...prev, typography: { ...prev.typography, [field]: value } }));
  };

  const handleElementChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [selectedElement]: {
          ...prev.elements[selectedElement],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    toast.promise(updateTemplate(template), {
      loading: "Saving template...",
      success: "Template saved successfully!",
      error: "Failed to save template."
    });
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to restore the factory default layout? This cannot be undone.")) {
      toast.promise(resetTemplate(), {
        loading: "Resetting template...",
        success: "Template reset to default!",
        error: "Failed to reset template."
      });
    }
  };

  if (loading) return <div className="p-8">Loading template designer...</div>;
  if (error) return (
    <div className="p-8 flex flex-col items-start space-y-4">
      <div className="text-red-600 font-medium">{error}</div>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium">Retry</button>
    </div>
  );
  if (!template) return <div className="p-8">Loading template designer...</div>;

  // Mock data for live preview
  const mockPatient = {
    name: "John Doe",
    age: 45,
    gender: "Male",
    referredDoctor: "Smith",
    visitId: "VST-2023-001",
    createdAt: new Date().toISOString()
  };

  const mockReport = {
    createdAt: new Date().toISOString(),
    tests: [
      {
        testId: { departmentId: { name: "HEMATOLOGY" } },
        testName: "Complete Blood Count (CBC)",
        result: [
          { parameter: "Hemoglobin", value: "14.5", normalRange: "13.0 - 17.0", unit: "g/dL" },
          { parameter: "WBC Count", value: "8500", normalRange: "4000 - 11000", unit: "cumm" }
        ]
      },
      {
        testId: { departmentId: { name: "BIOCHEMISTRY" } },
        testName: "Lipid Profile",
        result: [
          { parameter: "Total Cholesterol", value: "180", normalRange: "< 200", unit: "mg/dL" },
          { parameter: "Triglycerides", value: "120", normalRange: "< 150", unit: "mg/dL" }
        ]
      }
    ]
  };


  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8 bg-warm-canvas">
      {/* Left Panel: Controls */}
      <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-paper-white border border-cream-border rounded-cards shadow-sm h-full overflow-hidden shrink-0">
        <div className="p-4 border-b border-cream-border bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate("/settings")} className="p-1 hover:bg-slate-100 rounded">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h2 className="font-martinaplantijn text-xl text-ink-navy">Print Designer</h2>
          </div>
          <div className="flex space-x-2">
            <button onClick={handleReset} className="p-2 hover:bg-red-50 text-red-600 rounded" title="Reset to Default">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={handleSave} className="p-2 bg-electric-cobalt text-white hover:bg-opacity-90 rounded flex items-center space-x-1 px-3">
              <Save className="h-4 w-4" />
              <span className="text-xs font-medium">Save</span>
            </button>
          </div>
        </div>

        <div className="flex border-b border-cream-border bg-white text-sm">
          <button 
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === 'page' ? 'border-electric-cobalt text-electric-cobalt' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('page')}
          >
            Page
          </button>
          <button 
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === 'typography' ? 'border-electric-cobalt text-electric-cobalt' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('typography')}
          >
            Typography
          </button>
          <button 
            className={`flex-1 py-3 font-medium border-b-2 ${activeTab === 'elements' ? 'border-electric-cobalt text-electric-cobalt' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('elements')}
          >
            Elements
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'page' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Margins</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Top Margin</label>
                  <input type="text" className="w-full text-sm border-cream-border rounded" value={template.page.marginTop} onChange={(e) => handlePageChange('marginTop', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bottom Margin</label>
                  <input type="text" className="w-full text-sm border-cream-border rounded" value={template.page.marginBottom} onChange={(e) => handlePageChange('marginBottom', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Left Margin</label>
                  <input type="text" className="w-full text-sm border-cream-border rounded" value={template.page.marginLeft} onChange={(e) => handlePageChange('marginLeft', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Right Margin</label>
                  <input type="text" className="w-full text-sm border-cream-border rounded" value={template.page.marginRight} onChange={(e) => handlePageChange('marginRight', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Global Text</h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Base Font Family</label>
                <select className="w-full text-sm border-cream-border rounded" value={template.typography.baseFont} onChange={(e) => handleTypographyChange('baseFont', e.target.value)}>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Base Font Size</label>
                <input type="text" className="w-full text-sm border-cream-border rounded" value={template.typography.baseFontSize} onChange={(e) => handleTypographyChange('baseFontSize', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Line Height</label>
                <input type="text" className="w-full text-sm border-cream-border rounded" value={template.typography.lineHeight} onChange={(e) => handleTypographyChange('lineHeight', e.target.value)} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 bg-slate-200 border border-slate-300 rounded overflow-y-auto flex items-start justify-center p-8">
        {/* We use scale to fit the A4 preview into the container nicely */}
        <div className="origin-top transform scale-90 md:scale-100 shadow-2xl transition-all duration-300">
          <ReportLayout patient={mockPatient} report={mockReport} customTemplate={template} />
        </div>
      </div>
    </div>
  );
};

export default PrintTemplateDesigner;
