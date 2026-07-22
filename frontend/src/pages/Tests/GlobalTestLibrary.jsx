import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  CheckCircle2,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Globe,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { testService } from "../../services/testService";
import { toast } from "../../lib/toast";
import { useQueryClient } from "@tanstack/react-query";

export const GlobalTestLibrary = ({ onImportSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSystemAdmin = user?.role === "system_admin";

  const [globalTests, setGlobalTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [previewTest, setPreviewTest] = useState(null);
  const [importingId, setImportingId] = useState(null);

  const fetchGlobalLibrary = async () => {
    setLoading(true);
    try {
      const res = await testService.getGlobalTests({
        search: searchQuery,
        departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
      });
      if (res.success) {
        setGlobalTests(res.globalTests || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load global test library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLibrary();
  }, [searchQuery, selectedDept]);

  // Extract unique departments for filter
  const departmentsMap = {};
  globalTests.forEach((gt) => {
    if (gt.departmentId?._id) {
      departmentsMap[gt.departmentId._id] = gt.departmentId.name;
    }
  });

  const handleImport = async (globalTest) => {
    setImportingId(globalTest._id);
    toast.promise(testService.importGlobalTest(globalTest._id), {
      loading: `Importing "${globalTest.name}" into your laboratory...`,
      success: (res) => {
        // 1. Refresh local Global Library state badge
        setGlobalTests((prev) =>
          prev.map((item) =>
            item._id === globalTest._id
              ? { ...item, isImported: true, importedCount: (item.importedCount || 0) + 1 }
              : item
          )
        );

        // 2. Instantly update React Query cache for Laboratory Tests
        if (res?.test) {
          queryClient.setQueryData(['tests'], (old) => {
            if (!old?.tests) return { success: true, tests: [res.test] };
            const exists = old.tests.some((t) => t._id === res.test._id);
            if (exists) return old;
            return {
              ...old,
              tests: [res.test, ...old.tests],
            };
          });
        }

        // 3. Invalidate queries to guarantee fresh background refetch
        queryClient.invalidateQueries({ queryKey: ['tests'] });
        queryClient.invalidateQueries({ queryKey: ['summary'] });

        if (onImportSuccess) {
          onImportSuccess(res?.test);
        }

        return `Successfully imported "${globalTest.name}" into your laboratory catalog!`;
      },
      error: (err) => err.response?.data?.message || "Failed to import test template.",
      finally: () => setImportingId(null),
    });
  };

  const handleDeleteGlobal = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete global test template "${name}"?`)) {
      return;
    }
    toast.promise(testService.deleteGlobalTest(id), {
      loading: "Deleting global test template...",
      success: () => {
        setGlobalTests((prev) => prev.filter((item) => item._id !== id));
        return "Global test template removed.";
      },
      error: (err) => err.response?.data?.message || "Failed to delete template.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-paper-white border border-cream-border p-4 rounded-cards shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
          <input
            type="text"
            placeholder="Search global test name or parameter..."
            className="w-full pl-10 pr-4 py-2.5 bg-paper-white border border-cream-border rounded-inputs text-sm outline-none focus:border-electric-cobalt"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            className="bg-paper-white border border-cream-border rounded-inputs px-3 py-2.5 text-sm outline-none focus:border-electric-cobalt text-charcoal font-medium"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {Object.entries(departmentsMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {isSystemAdmin && (
            <Link
              to="/tests/create?global=true"
              className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-semibold px-4 py-2.5 rounded-buttons hover:bg-opacity-90 transition duration-200 text-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Global Test</span>
            </Link>
          )}
        </div>
      </div>

      {/* Global Test Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
        </div>
      ) : globalTests.length === 0 ? (
        <div className="bg-paper-white border border-cream-border rounded-cards p-12 text-center text-stone">
          <Globe className="h-12 w-12 mx-auto text-stone/50 mb-3" />
          <h3 className="font-martinaplantijn text-xl text-ink-navy">No Global Tests Found</h3>
          <p className="text-sm mt-1">
            {searchQuery
              ? `No template matching "${searchQuery}"`
              : "No global test templates have been published yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {globalTests.map((gt) => {
            const totalPrice =
              gt.subTests?.reduce((sum, st) => sum + (st.price || 0), 0) || gt.price || 0;

            return (
              <div
                key={gt._id}
                className="bg-paper-white border border-cream-border rounded-cards p-6 flex flex-col justify-between hover:border-electric-cobalt/40 transition-all duration-200 shadow-sm relative group"
              >
                <div className="space-y-4">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lavender-mist/80 text-electric-cobalt">
                      <Globe className="w-3 h-3" />
                      {gt.departmentId?.name || "General"}
                    </span>

                    {gt.isImported && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Imported
                      </span>
                    )}
                  </div>

                  {/* Test Info */}
                  <div>
                    <h3 className="font-abcfavoritvariable text-lg font-bold text-charcoal group-hover:text-electric-cobalt transition-colors">
                      {gt.name}
                    </h3>
                    <p className="text-xs text-stone mt-1 font-inter">
                      {gt.subTests?.length || 0} Parameters / Sub-tests
                    </p>
                  </div>

                  {/* System Admin Metric */}
                  {isSystemAdmin && (
                    <div className="flex items-center gap-2 text-xs text-stone font-mono bg-warm-canvas/60 px-3 py-1.5 rounded-md">
                      <Building2 className="w-3.5 h-3.5 text-electric-cobalt" />
                      <span>Imported by {gt.importedCount || 0} laboratories</span>
                    </div>
                  )}

                  {/* Sub-tests Summary Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {gt.subTests?.slice(0, 4).map((st, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-warm-canvas text-graphite px-2 py-0.5 rounded border border-cream-border"
                      >
                        {st.name}
                      </span>
                    ))}
                    {gt.subTests?.length > 4 && (
                      <span className="text-[11px] text-stone italic py-0.5">
                        +{gt.subTests.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-cream-border flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-charcoal font-inter">
                    ₹{totalPrice.toFixed(2)}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewTest(gt)}
                      className="p-2 border border-cream-border text-graphite hover:bg-warm-canvas rounded-buttons transition"
                      title="Preview Parameters"
                    >
                      <Eye className="w-4 h-4 text-stone" />
                    </button>

                    {isSystemAdmin ? (
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/tests/edit/${gt._id}?global=true`}
                          className="p-2 border border-cream-border text-electric-cobalt hover:bg-lavender-mist/50 rounded-buttons transition"
                          title="Edit Global Template"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteGlobal(gt._id, gt.name)}
                          className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-buttons transition"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImport(gt)}
                        disabled={importingId === gt._id}
                        className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-buttons text-xs font-semibold transition ${
                          gt.isImported
                            ? "bg-paper-white border border-cream-border text-graphite hover:bg-warm-canvas"
                            : "bg-electric-cobalt text-paper-white hover:bg-opacity-90"
                        } disabled:opacity-50`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{gt.isImported ? "Re-Import" : "Import Test"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewTest && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-cream-border rounded-cards max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-cream-border flex items-center justify-between bg-warm-canvas/30">
              <div>
                <span className="text-[10px] font-bold text-electric-cobalt uppercase tracking-widest block">
                  GLOBAL TEST TEMPLATE PREVIEW
                </span>
                <h3 className="font-martinaplantijn text-2xl text-ink-navy">
                  {previewTest.name}
                </h3>
                <p className="text-xs text-stone mt-0.5">
                  Department: {previewTest.departmentId?.name || "General"}
                </p>
              </div>
              <button
                onClick={() => setPreviewTest(null)}
                className="text-stone hover:text-charcoal p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Parameters List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <h4 className="font-abcfavoritvariable text-xs font-bold uppercase tracking-wider text-stone">
                Parameters & Sub-tests ({previewTest.subTests?.length || 0})
              </h4>

              <div className="border border-cream-border rounded-cards overflow-hidden divide-y divide-cream-border">
                {previewTest.subTests?.map((st, idx) => (
                  <div key={idx} className="p-4 bg-paper-white space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-charcoal text-sm">
                        {st.name}
                      </span>
                      {st.price > 0 && (
                        <span className="text-xs font-mono font-bold text-electric-cobalt">
                          ₹{st.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone">
                      {st.unit && <span>Unit: <strong className="text-graphite">{st.unit}</strong></span>}
                      {st.normalRange && (
                        <span>Normal Range: <strong className="text-graphite">{st.normalRange}</strong></span>
                      )}
                      {st.isListParameter && st.allowedValues?.length > 0 && (
                        <span>
                          Allowed Values:{" "}
                          <span className="font-mono text-electric-cobalt bg-lavender-mist/50 px-1.5 py-0.5 rounded">
                            {st.allowedValues.join(", ")}
                          </span>
                        </span>
                      )}
                      {st.isCalculated && st.formula && (
                        <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          Formula: {st.formula.leftParameterId} {st.formula.operator} {st.formula.rightParameterId}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-cream-border bg-warm-canvas/30 flex items-center justify-between">
              <span className="text-xs text-stone font-inter">
                Importing will create an independent copy in your laboratory.
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPreviewTest(null)}
                  className="px-4 py-2 border border-cream-border rounded-buttons text-xs font-semibold text-graphite hover:bg-warm-canvas"
                >
                  Close
                </button>
                {!isSystemAdmin && (
                  <button
                    onClick={() => {
                      const target = previewTest;
                      setPreviewTest(null);
                      handleImport(target);
                    }}
                    className="px-4 py-2 bg-electric-cobalt text-paper-white rounded-buttons text-xs font-semibold hover:bg-opacity-90"
                  >
                    Import Test
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalTestLibrary;
