import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { testService } from "../../services/testService";

export const TestList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState({});

  const toggleDept = (deptName) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await testService.getAllTests();
      setTests(data.tests || []);
    } catch (err) {
      setError("Failed to load test catalog.");
    } finally {
      setLoading(false);
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
    <div className="space-y-8 max-w-4xl mx-auto py-10">
      <div className="text-center space-y-3">
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block">
          TEST MODULE
        </span>
        <h1 className="font-martinaplantijn text-5xl text-ink-navy">
          Laboratory <span className="italic font-light">Tests</span>
        </h1>
        <p className="font-inter text-stone text-base">
          Manage your test catalog, pricing, and report parameters.
        </p>
      </div>

      {isAdmin && (
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
                  {!isAdmin && <span className="text-base text-stone font-sans ml-3 px-3 py-1 bg-warm-canvas rounded-full border border-cream-border">Viewing Reference Catalog</span>}
                </h2>
                <p className="text-sm text-stone mt-2">
                  {isAdmin ? "View and manage all configured laboratory tests." : "Browse available tests, parameters, and normal ranges."}
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
                            
                            {/* Test Rows */}
                            {isExpanded && deptTests.map(test => {
                              const totalPrice = test.subTests?.reduce((sum, st) => sum + (st.price || 0), 0) || 0;
                              return (
                              <tr key={test._id} className="hover:bg-warm-canvas/50 transition-colors group bg-paper-white/50 cursor-pointer" onClick={() => navigate(isAdmin ? `/tests/edit/${test._id}` : `/tests/view/${test._id}`)}>
                                  <td className="px-6 py-3 text-sm font-medium text-charcoal pl-12 group-hover:text-electric-cobalt transition-colors">
                                    {test.name}
                                  </td>
                                  <td className="px-6 py-3 text-sm text-stone text-center">
                                    <span className="bg-cream-border/30 px-2 py-1 rounded text-xs">
                                      {test.subTests?.length || 0}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3 text-sm text-charcoal font-medium text-right font-inter">
                                    ₹{totalPrice.toFixed(2)}
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
    </div>
  );
};

export default TestList;
