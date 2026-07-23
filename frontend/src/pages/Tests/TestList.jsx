import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit2, Search, ChevronDown, ChevronRight, Globe, FlaskConical, Pencil, Loader2, Check, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { canManageTests } from "../../config/permissions";
import { useGetTestsQuery, useUpdateTestMutation } from "../../services/testApi";
import GlobalTestLibrary from "./GlobalTestLibrary";
import { toast } from "../../lib/toast";

export const TestList = () => {
  const { user } = useAuth();
  const isSystemAdmin = user?.role === "system_admin";
  const canUpdatePrice = canManageTests(user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("local"); // "local" | "global"
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState({});

  // Inline Price Editing State
  const [editingTestId, setEditingTestId] = useState(null);
  const [inlinePriceValue, setInlinePriceValue] = useState("");
  const [isSavingInlinePrice, setIsSavingInlinePrice] = useState(false);

  const [updateTestMutation] = useUpdateTestMutation();

  const toggleDept = (deptName) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  const { data, isLoading: loading, error: fetchError, refetch } = useGetTestsQuery();

  const tests = data?.tests || [];
  const error = fetchError ? "Failed to load test catalog." : "";

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
  };

  const handleStartInlineEdit = (test, currentTotalPrice) => {
    setEditingTestId(test._id);
    setInlinePriceValue(currentTotalPrice.toString());
  };

  const handleCancelInlineEdit = () => {
    setEditingTestId(null);
    setInlinePriceValue("");
  };

  const handleSaveInlinePrice = async (test) => {
    const newPrice = parseFloat(inlinePriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid non-negative price.");
      return;
    }

    setIsSavingInlinePrice(true);

    try {
      const subTests = test.subTests || [];
      let updatedSubTests = undefined;

      if (subTests.length > 0) {
        const currentTotal = subTests.reduce((sum, st) => sum + (st.price || 0), 0);
        if (currentTotal > 0) {
          const ratio = newPrice / currentTotal;
          updatedSubTests = subTests.map((st) => ({
            ...st,
            price: Math.round((st.price || 0) * ratio * 100) / 100,
          }));
          const newSubTotal = updatedSubTests.reduce((sum, st) => sum + (st.price || 0), 0);
          const diff = Math.round((newPrice - newSubTotal) * 100) / 100;
          if (diff !== 0 && updatedSubTests.length > 0) {
            updatedSubTests[updatedSubTests.length - 1].price =
              Math.round((updatedSubTests[updatedSubTests.length - 1].price + diff) * 100) / 100;
          }
        } else {
          updatedSubTests = subTests.map((st, idx) => ({
            ...st,
            price: idx === 0 ? newPrice : 0,
          }));
        }
      }

      const payload = {
        id: test._id,
        price: newPrice,
      };
      if (updatedSubTests) {
        payload.subTests = updatedSubTests;
      }

      await updateTestMutation(payload).unwrap();
      toast.success(`Price updated to ₹${newPrice.toFixed(2)} for ${test.name}`);
      setEditingTestId(null);
    } catch (err) {
      toast.error(err.data?.message || err.response?.data?.message || "Failed to update price.");
    } finally {
      setIsSavingInlinePrice(false);
    }
  };

  const filteredTests = tests.filter((test) => {
    const searchLower = searchQuery.toLowerCase();
    const testMatch = test.name.toLowerCase().includes(searchLower);
    const deptMatch = (test.departmentId?.name || "General").toLowerCase().includes(searchLower);
    return testMatch || deptMatch;
  });

  const groupedTests = filteredTests.reduce((acc, test) => {
    const deptName = test.departmentId?.name || "General";
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(test);
    return acc;
  }, {});

  // By default expand all if search is active, else expand all initially
  useEffect(() => {
    if (Object.keys(groupedTests).length > 0 && Object.keys(expandedDepts).length === 0) {
      const initial = {};
      Object.keys(groupedTests).forEach(k => initial[k] = true);
      setExpandedDepts(initial);
    }
  }, [groupedTests, expandedDepts]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div className="text-center space-y-3">
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block">
          TEST MANAGEMENT
        </span>
        <h1 className="font-martinaplantijn text-5xl text-ink-navy">
          Laboratory <span className="italic font-light">Tests</span>
        </h1>
        <p className="font-inter text-stone text-base max-w-xl mx-auto">
          Manage your laboratory test catalog, configure custom parameters, or import standardized global test templates.
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex items-center p-1.5 bg-paper-white border border-cream-border rounded-full shadow-sm mt-4">
          <button
            onClick={() => handleTabChange("local")}
            className={`inline-flex items-center space-x-2 px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === "local"
                ? "bg-electric-cobalt text-paper-white shadow-sm"
                : "text-stone hover:text-charcoal"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Laboratory Tests ({tests.length})</span>
          </button>
          <button
            onClick={() => handleTabChange("global")}
            className={`inline-flex items-center space-x-2 px-6 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
              activeTab === "global"
                ? "bg-electric-cobalt text-paper-white shadow-sm"
                : "text-stone hover:text-charcoal"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global Test Library</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "global" ? (
        <GlobalTestLibrary onImportSuccess={() => refetch()} />
      ) : (
        <>
          {/* Add New Test & Edit Existing Test cards strictly for system_admin only */}
          {isSystemAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
              <Link
                to="/tests/create"
                className="group bg-paper-white border border-cream-border rounded-cards p-8 hover:border-electric-cobalt hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="h-24 w-24 bg-warm-canvas rounded-full flex items-center justify-center group-hover:bg-electric-cobalt/10 transition-colors">
                  <Plus size={48} className="text-electric-cobalt" />
                </div>
                <div>
                  <h3 className="font-abcfavoritvariable font-bold text-xl text-charcoal">Add New Test</h3>
                  <p className="text-sm text-stone mt-2">Create a new laboratory test profile and configure its parameters.</p>
                </div>
              </Link>

              <Link
                to="/tests/edit"
                className="group bg-paper-white border border-cream-border rounded-cards p-8 hover:border-electric-cobalt hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="h-24 w-24 bg-warm-canvas rounded-full flex items-center justify-center group-hover:bg-electric-cobalt/10 transition-colors">
                  <Edit2 size={48} className="text-electric-cobalt" />
                </div>
                <div>
                  <h3 className="font-abcfavoritvariable font-bold text-xl text-charcoal">Edit Existing Test</h3>
                  <p className="text-sm text-stone mt-2">Modify an existing test profile, update its parameters, or change its pricing.</p>
                </div>
              </Link>
            </div>
          )}

          <div className="mt-16 space-y-6 pt-10 border-t border-cream-border">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
              <div className="flex-1">
                <h2 className="font-martinaplantijn text-3xl text-ink-navy">
                  Test <span className="italic font-light">Catalog</span>
                  {!isSystemAdmin && (
                    <span className="text-base text-stone font-sans ml-3 px-3 py-1 bg-warm-canvas rounded-full border border-cream-border">
                      Laboratory Pricing Catalog
                    </span>
                  )}
                </h2>
                <p className="text-sm text-stone mt-2">
                  {isSystemAdmin
                    ? "View and manage all configured laboratory tests."
                    : "Browse laboratory tests and click price to edit inline."}
                </p>
              </div>
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="w-full pl-10 pr-4 py-2 border border-cream-border rounded-lg text-sm focus:border-electric-cobalt focus:ring-1 focus:ring-electric-cobalt"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-paper-white border border-cream-border rounded-cards overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500 text-sm">{error}</div>
              ) : filteredTests.length === 0 ? (
                <div className="p-12 text-center text-stone text-sm">No tests found in the catalog.</div>
              ) : (
                <div className="overflow-x-auto w-full block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-warm-canvas border-b border-cream-border">
                        <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">Test Name</th>
                        <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-center">Parameters</th>
                        <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">Total Price (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {Object.keys(groupedTests).sort().map(deptName => {
                        const deptTests = groupedTests[deptName];
                        const isExpanded = expandedDepts[deptName] !== false; // default true
                        
                        return (
                          <React.Fragment key={deptName}>
                            {/* Department Header Row */}
                            <tr 
                              className="bg-paper-white cursor-pointer hover:bg-warm-canvas/50 transition-colors"
                              onClick={() => toggleDept(deptName)}
                            >
                              <td colSpan="3" className="px-6 py-3 border-t-4 border-t-cream-border/50">
                                <div className="flex items-center space-x-2 text-charcoal font-semibold">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  <span>{deptName}</span>
                                  <span className="text-xs text-stone font-normal ml-2">({deptTests.length} tests)</span>
                                </div>
                              </td>
                            </tr>
                            
                            {isExpanded && deptTests.map(test => {
                              const totalPrice = test.subTests?.reduce((sum, st) => sum + (st.price || 0), 0) || test.price || 0;
                              const isEditingThis = editingTestId === test._id;
                              
                              return (
                                <tr
                                  key={test._id}
                                  className="hover:bg-warm-canvas/50 transition-colors group bg-paper-white/50 cursor-pointer"
                                  onClick={() => {
                                    if (!isEditingThis) {
                                      navigate(isSystemAdmin ? `/tests/edit/${test._id}` : `/tests/view/${test._id}`);
                                    }
                                  }}
                                >
                                  <td className="px-6 py-3 text-sm font-medium text-charcoal pl-12 group-hover:text-electric-cobalt transition-colors">
                                    {test.name}
                                    <div className="text-[10px] text-stone mt-0.5 font-normal">
                                      {test.createdBy && <span>Owner: {test.createdBy.username}</span>}
                                      {test.updatedBy && test.updatedBy._id !== test.createdBy?._id && <span className="ml-2">• Last Updated by: {test.updatedBy.username}</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-3 text-sm text-stone text-center">
                                    <span className="bg-cream-border/30 px-2 py-1 rounded text-xs">
                                      {test.subTests?.length || 0}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-sm text-charcoal font-medium text-right font-inter">
                                    {isEditingThis ? (
                                      <div
                                        className="inline-flex items-center gap-3 justify-end min-w-[250px]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="relative flex items-center shrink-0">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone font-mono pointer-events-none select-none z-10">₹</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            autoFocus
                                            disabled={isSavingInlinePrice}
                                            value={inlinePriceValue}
                                            onChange={(e) => setInlinePriceValue(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSaveInlinePrice(test);
                                              } else if (e.key === "Escape") {
                                                e.preventDefault();
                                                handleCancelInlineEdit();
                                              }
                                            }}
                                            className="w-36 min-w-[140px] h-10 pl-10 pr-3 bg-paper-white border-2 border-electric-cobalt rounded-lg text-base font-bold text-charcoal font-mono outline-none shadow-sm focus:ring-2 focus:ring-electric-cobalt/20 disabled:opacity-50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          />
                                        </div>

                                        {isSavingInlinePrice ? (
                                          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-lavender-mist/50 text-electric-cobalt shrink-0">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 shrink-0">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveInlinePrice(test);
                                              }}
                                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md transition-all cursor-pointer shrink-0"
                                              title="Save Price (Enter)"
                                            >
                                              <Check className="w-6 h-6 stroke-[2.5]" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelInlineEdit();
                                              }}
                                              className="w-10 h-10 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-red-100 active:bg-red-200 text-stone-700 hover:text-red-700 border border-cream-border transition-all cursor-pointer shrink-0"
                                              title="Cancel (Esc)"
                                            >
                                              <X className="w-6 h-6 stroke-[2.5]" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div
                                        className={`inline-flex items-center gap-3 justify-end group/price ${
                                          canUpdatePrice ? "cursor-pointer" : ""
                                        }`}
                                        onClick={(e) => {
                                          if (canUpdatePrice) {
                                            e.stopPropagation();
                                            handleStartInlineEdit(test, totalPrice);
                                          }
                                        }}
                                        title={canUpdatePrice ? "Click to edit price inline" : undefined}
                                      >
                                        <span className="text-lg font-bold text-charcoal font-mono group-hover/price:text-electric-cobalt transition-colors">
                                          ₹{totalPrice.toFixed(2)}
                                        </span>
                                        {canUpdatePrice && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleStartInlineEdit(test, totalPrice);
                                            }}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-electric-cobalt text-white hover:bg-opacity-90 transition-all duration-150 cursor-pointer shadow-sm shrink-0"
                                            title="Edit price inline"
                                          >
                                            <Pencil className="w-5 h-5 stroke-[2.2]" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TestList;
