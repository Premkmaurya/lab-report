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

export const GlobalTestTableView = ({
  globalTests = [],
  isSystemAdmin = false,
  canImport = false,
  importingId = null,
  updatingId = null,
  onPreview,
  onEdit,
  onDelete,
  onImport,
  onUpdateConfirm,
}) => {
  return (
    <div className="bg-paper-white border border-cream-border rounded-cards shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-warm-canvas/60 border-b border-cream-border text-xs font-bold text-stone uppercase tracking-wider">
              <th className="py-3.5 px-4 w-[20%]">Department / Version</th>
              <th className="py-3.5 px-4 w-[35%]">Test Name & Parameters</th>
              <th className="py-3.5 px-4 w-[20%]">Usage & Status</th>
              <th className="py-3.5 px-4 w-[12%]">Price</th>
              <th className="py-3.5 px-4 w-[13%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-border">
            {globalTests.map((gt) => {
              const totalPrice =
                gt.subTests?.reduce((sum, st) => sum + (st.price || 0), 0) || gt.price || 0;
              const isThisImporting = importingId === gt._id;
              const isThisUpdating = updatingId === gt._id;

              return (
                <tr key={gt._id} className="hover:bg-warm-canvas/30 transition-colors">
                  {/* Department / Version Column */}
                  <td className="py-3.5 px-4 align-top space-y-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lavender-mist/80 text-electric-cobalt">
                      <Globe className="w-3 h-3" />
                      {gt.departmentId?.name || "General"}
                    </span>
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        Global v{gt.version || 1}
                      </span>
                    </div>
                  </td>

                  {/* Test Name & Parameters Column */}
                  <td className="py-3.5 px-4 align-top space-y-1.5">
                    <div>
                      <h4 className="font-abcfavoritvariable text-base font-bold text-charcoal hover:text-electric-cobalt transition-colors">
                        {gt.name}
                      </h4>
                      <p className="text-xs text-stone font-inter mt-0.5">
                        {gt.subTests?.length || 0} Parameters / Sub-tests
                      </p>
                    </div>
                    {/* Parameter Pills */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {gt.subTests?.slice(0, 3).map((st, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-warm-canvas text-graphite px-2 py-0.5 rounded border border-cream-border font-inter"
                        >
                          {st.name}
                        </span>
                      ))}
                      {gt.subTests?.length > 3 && (
                        <span className="text-[11px] text-stone italic py-0.5 font-inter">
                          +{gt.subTests.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Usage & Status Column */}
                  <td className="py-3.5 px-4 align-top space-y-1.5">
                    {isSystemAdmin ? (
                      <div className="inline-flex items-center gap-1.5 text-xs text-stone font-mono bg-warm-canvas/60 px-2.5 py-1 rounded-md border border-cream-border">
                        <Building2 className="w-3.5 h-3.5 text-electric-cobalt shrink-0" />
                        <span>Imported by {gt.importedCount || 0} labs</span>
                      </div>
                    ) : gt.isImported ? (
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
                    ) : (
                      <span className="text-xs text-stone italic">Not imported yet</span>
                    )}
                  </td>

                  {/* Price Column */}
                  <td className="py-3.5 px-4 align-top font-bold text-charcoal font-inter text-base">
                    ₹{totalPrice.toFixed(2)}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onPreview(gt)}
                        className="p-2 border border-cream-border text-graphite hover:bg-warm-canvas rounded-buttons transition cursor-pointer"
                        title="Preview Parameters"
                      >
                        <Eye className="w-4 h-4 text-stone" />
                      </button>

                      {isSystemAdmin ? (
                        <>
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
                        </>
                      ) : canImport ? (
                        gt.isImported ? (
                          gt.hasUpdateAvailable ? (
                            <button
                              onClick={() => onUpdateConfirm(gt)}
                              disabled={isThisUpdating}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-buttons text-xs font-semibold transition bg-amber-600 text-paper-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                              title="Update template to latest global version"
                            >
                              {isThisUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-buttons border border-cream-border bg-paper-white text-stone text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Up to Date</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => onImport(gt)}
                            disabled={isThisImporting}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-buttons text-xs font-semibold transition bg-electric-cobalt text-paper-white hover:bg-opacity-90 disabled:opacity-50 cursor-pointer"
                          >
                            {isThisImporting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>Import</span>
                              </>
                            )}
                          </button>
                        )
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
