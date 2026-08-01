import React, { useState } from "react";
import { Plus, Trash2, X, AlertTriangle, Check } from "lucide-react";
import { validateReferenceRanges } from "../../utils/referenceRangeResolver";

export const ReferenceRangesModal = ({ isOpen, onClose, paramName, initialRules = [], onSave }) => {
  if (!isOpen) return null;

  const [rules, setRules] = useState(
    Array.isArray(initialRules) && initialRules.length > 0
      ? JSON.parse(JSON.stringify(initialRules))
      : []
  );

  const [validationError, setValidationError] = useState("");

  const handleAddRule = () => {
    setValidationError("");
    setRules((prev) => [
      ...prev,
      {
        ageFrom: 0,
        ageTo: 120,
        ageUnit: "Years",
        gender: "Any",
        referenceRange: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    setValidationError("");
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDelete = (index) => {
    setValidationError("");
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const errorMsg = validateReferenceRanges(rules);
    if (errorMsg) {
      setValidationError(errorMsg);
      return;
    }
    onSave(rules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">
              Age & Gender Reference Ranges
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Parameter: <span className="text-indigo-600 font-semibold">{paramName || "Unnamed Parameter"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-red-700 text-xs font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {rules.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <p className="text-xs text-slate-500 mb-3">
                No specific age/gender rules defined. The parameter will use its default Reference Range.
              </p>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Reference Range</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-2">Age From</div>
                <div className="col-span-2">Age To</div>
                <div className="col-span-2">Age Unit</div>
                <div className="col-span-2">Gender</div>
                <div className="col-span-3">Reference Range</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                      value={rule.ageFrom}
                      onChange={(e) => handleChange(idx, "ageFrom", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                      value={rule.ageTo}
                      onChange={(e) => handleChange(idx, "ageTo", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                      value={rule.ageUnit || "Years"}
                      onChange={(e) => handleChange(idx, "ageUnit", e.target.value)}
                    >
                      <option value="Years">Years</option>
                      <option value="Months">Months</option>
                      <option value="Days">Days</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <select
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white"
                      value={rule.gender || "Any"}
                      onChange={(e) => handleChange(idx, "gender", e.target.value)}
                    >
                      <option value="Any">Any</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Child">Child</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="e.g. 13.5 - 17.5"
                      className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 bg-white font-medium"
                      value={rule.referenceRange || ""}
                      onChange={(e) => handleChange(idx, "referenceRange", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddRule}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-700 inline-flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-slate-600" />
            <span>Add Reference Range</span>
          </button>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-medium text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-electric-cobalt hover:bg-opacity-90 text-white rounded text-xs font-semibold inline-flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 text-white" />
              <span>Save Ranges</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
