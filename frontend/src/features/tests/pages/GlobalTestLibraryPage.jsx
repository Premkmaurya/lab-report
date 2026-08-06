import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  CheckCircle2,
  Plus,
  Globe,
  Loader2,
  AlertTriangle,
  RefreshCw,
  List,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { canManageTests } from "../../../config/permissions";
import { toast } from "../../../lib/toast";
import {
  useGetGlobalTestsQuery,
  useImportGlobalTestMutation,
  useUpdateImportedGlobalTestMutation,
  useDeleteTestMutation,
} from "../../../services/testApi";
import { GlobalTestTableView } from "../components/GlobalTestTableView";
import { GlobalTestGridView } from "../components/GlobalTestGridView";

export const GlobalTestLibraryPage = ({ onImportSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSystemAdmin = user?.role === "system_admin";
  const canImport = canManageTests(user) && !isSystemAdmin;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [previewTest, setPreviewTest] = useState(null);
  const [confirmUpdateTest, setConfirmUpdateTest] = useState(null);
  const [importingId, setImportingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, isLoading: loading, error: fetchError, refetch } = useGetGlobalTestsQuery({
    search: searchQuery,
    departmentId: selectedDept !== "ALL" ? selectedDept : undefined,
  });

  const [importGlobalTest] = useImportGlobalTestMutation();
  const [updateImportedGlobalTest] = useUpdateImportedGlobalTestMutation();
  const [deleteTest] = useDeleteTestMutation();

  const globalTests = data?.globalTests || [];
  const updatesAvailableCount = data?.updatesAvailableCount || globalTests.filter(gt => gt.hasUpdateAvailable).length;

  useEffect(() => {
    if (fetchError) {
      toast.error("Failed to load global test library.");
    }
  }, [fetchError]);

  // Extract unique departments for filter
  const departmentsMap = {};
  globalTests.forEach((gt) => {
    if (gt.departmentId?._id) {
      departmentsMap[gt.departmentId._id] = gt.departmentId.name;
    }
  });

  const handleImport = async (globalTest) => {
    setImportingId(globalTest._id);
    try {
      const res = await importGlobalTest(globalTest._id).unwrap();
      toast.success(`Successfully imported "${globalTest.name}" into your laboratory catalog!`);
      if (onImportSuccess) {
        onImportSuccess(res?.test);
      }
      refetch();
    } catch (err) {
      toast.error(err.data?.message || "Failed to import test template.");
    } finally {
      setImportingId(null);
    }
  };

  const handleUpdateFromGlobal = async (globalTest) => {
    setUpdatingId(globalTest._id);
    try {
      const res = await updateImportedGlobalTest(globalTest._id).unwrap();
      toast.success(res.message || `Updated "${globalTest.name}" to version ${globalTest.version}!`);
      if (onImportSuccess) {
        onImportSuccess(res?.test);
      }
      refetch();
    } catch (err) {
      toast.error(err.data?.message || "Failed to update test template.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteGlobal = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete global test template "${name}"?`)) {
      return;
    }
    try {
      await deleteTest(id).unwrap();
      toast.success("Global test template removed.");
    } catch (err) {
      toast.error(err.data?.message || "Failed to delete template.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Banner when updates are available */}
      {updatesAvailableCount > 0 && !isSystemAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-cards p-4 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm font-abcfavoritvariable">
                {updatesAvailableCount} {updatesAvailableCount === 1 ? 'Global Test Update Available' : 'Global Test Updates Available'}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 font-inter">
                New test versions are available. Synchronize the latest test template definition while preserving your laboratory pricing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Header with View Toggle */}
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

        <div className="flex items-center gap-3 flex-wrap">
          {/* Department Filter */}
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

          {/* View Toggle Buttons */}
          <div className="flex items-center space-x-1 border border-cream-border rounded-inputs p-1 bg-paper-white">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-electric-cobalt text-white shadow-2xs"
                  : "text-stone hover:text-charcoal"
              }`}
              title="Rows & Columns Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table View</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-electric-cobalt text-white shadow-2xs"
                  : "text-stone hover:text-charcoal"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid View</span>
            </button>
          </div>

          {/* Create Global Test Button (Admin Only) */}
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

      {/* Global Tests Content View */}
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
      ) : viewMode === "table" ? (
        <GlobalTestTableView
          globalTests={globalTests}
          isSystemAdmin={isSystemAdmin}
          canImport={canImport}
          importingId={importingId}
          updatingId={updatingId}
          onPreview={setPreviewTest}
          onEdit={(gt) => navigate(`/tests/edit/${gt._id}?global=true`)}
          onDelete={handleDeleteGlobal}
          onImport={handleImport}
          onUpdateConfirm={setConfirmUpdateTest}
        />
      ) : (
        <GlobalTestGridView
          globalTests={globalTests}
          isSystemAdmin={isSystemAdmin}
          canImport={canImport}
          importingId={importingId}
          updatingId={updatingId}
          onPreview={setPreviewTest}
          onDelete={handleDeleteGlobal}
          onImport={handleImport}
          onUpdateConfirm={setConfirmUpdateTest}
        />
      )}

      {/* Confirmation Dialog for Update */}
      {confirmUpdateTest && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-white border border-cream-border rounded-cards max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-amber-600 font-bold text-base font-abcfavoritvariable">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Update Global Test Template</span>
              </div>
              <button
                onClick={() => setConfirmUpdateTest(null)}
                className="text-stone hover:text-charcoal text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-charcoal space-y-3 font-inter">
              <p className="font-medium text-stone">
                A newer version of this Global Test is available for <strong className="text-charcoal font-bold">"{confirmUpdateTest.name}"</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-warm-canvas p-3 rounded-md text-xs font-mono border border-cream-border">
                <div>
                  <span className="text-stone block uppercase tracking-wider text-[10px]">Current Version</span>
                  <span className="font-bold text-graphite text-sm">v{confirmUpdateTest.importedVersion || 1}</span>
                </div>
                <div>
                  <span className="text-amber-700 block uppercase tracking-wider text-[10px]">Latest Version</span>
                  <span className="font-bold text-amber-700 text-sm">v{confirmUpdateTest.version}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-stone bg-slate-50 p-3 rounded border border-slate-200">
                <p className="font-semibold text-charcoal">Update details:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Updating will synchronize the latest test template definition.</li>
                  <li>Laboratory-specific values such as pricing will be preserved.</li>
                  <li>Historical reports will NOT be modified.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-cream-border">
              <button
                type="button"
                onClick={() => setConfirmUpdateTest(null)}
                disabled={updatingId === confirmUpdateTest._id}
                className="px-4 py-2 border border-cream-border rounded-buttons text-xs font-semibold text-graphite hover:bg-warm-canvas disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmUpdateTest;
                  setConfirmUpdateTest(null);
                  await handleUpdateFromGlobal(target);
                }}
                disabled={updatingId === confirmUpdateTest._id}
                className="px-4 py-2 bg-amber-600 text-paper-white rounded-buttons text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                {updatingId === confirmUpdateTest._id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Update Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
                {canImport && (
                  previewTest.isImported ? (
                    previewTest.hasUpdateAvailable ? (
                      <button
                        onClick={() => {
                          const target = previewTest;
                          setPreviewTest(null);
                          setConfirmUpdateTest(target);
                        }}
                        disabled={updatingId === previewTest._id}
                        className="px-4 py-2 bg-amber-600 text-paper-white rounded-buttons text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {updatingId === previewTest._id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2 rounded-buttons border border-cream-border bg-paper-white text-stone text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Up to Date ✓</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        const target = previewTest;
                        setPreviewTest(null);
                        handleImport(target);
                      }}
                      disabled={importingId === previewTest._id}
                      className="px-4 py-2 bg-electric-cobalt text-paper-white rounded-buttons text-xs font-semibold hover:bg-opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {importingId === previewTest._id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Import Test</span>
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
