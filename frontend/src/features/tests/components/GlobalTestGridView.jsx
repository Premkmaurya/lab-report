import React from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  Download,
} from "lucide-react";

export const GlobalTestGridView = ({
  globalTests = [],
  isSystemAdmin = false,
  canImport = false,
  importingId = null,
  updatingId = null,
  onPreview,
  onDelete,
  onImport,
  onUpdateConfirm,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {globalTests.map((gt) => {
        const totalPrice =
          gt.subTests?.reduce((sum, st) => sum + (st.price || 0), 0) || gt.price || 0;

        const isThisImporting = importingId === gt._id;
        const isThisUpdating = updatingId === gt._id;

        return (
          <div
            key={gt._id}
            className="bg-paper-white border border-cream-border rounded-cards p-6 flex flex-col justify-between hover:border-electric-cobalt/40 transition-all duration-200 shadow-sm relative group"
          >
            <div className="space-y-4">
              {/* Top Badge Row */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lavender-mist/80 text-electric-cobalt">
                    <Globe className="w-3 h-3" />
                    {gt.departmentId?.name || "General"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    Global v{gt.version || 1}
                  </span>
                </div>

                {gt.isImported && (
                  gt.hasUpdateAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Update Available (v{gt.importedVersion || 1})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Up to Date ✓
                    </span>
                  )
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
                  onClick={() => onPreview(gt)}
                  className="p-2 border border-cream-border text-graphite hover:bg-warm-canvas rounded-buttons transition cursor-pointer"
                  title="Preview Parameters"
                >
                  <Eye className="w-4 h-4 text-stone" />
                </button>

                {isSystemAdmin ? (
                  <div className="flex items-center space-x-1">
                    <Link
                      to={`/tests/edit/${gt._id}?global=true`}
                      className="p-2 border border-cream-border text-stone hover:text-charcoal hover:bg-warm-canvas rounded-buttons transition"
                      title="Edit Global Template"
                    >
                      <Edit2 className="w-4 h-4 text-stone" />
                    </Link>
                    <button
                      onClick={() => onDelete(gt._id, gt.name)}
                      className="p-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-buttons transition cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : canImport ? (
                  gt.isImported ? (
                    gt.hasUpdateAvailable ? (
                      <button
                        onClick={() => onUpdateConfirm(gt)}
                        disabled={isThisUpdating}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-buttons text-xs font-semibold transition bg-amber-600 text-paper-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                        title="Update template to latest global version"
                      >
                        {isThisUpdating ? (
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
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-buttons border border-cream-border bg-paper-white text-stone text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Up to Date ✓</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onImport(gt)}
                      disabled={isThisImporting}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-buttons text-xs font-semibold transition bg-electric-cobalt text-paper-white hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {isThisImporting ? (
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
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
