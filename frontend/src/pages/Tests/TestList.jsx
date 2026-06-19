import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { testService } from "../../services/testService";
import { Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";

export const TestList = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const isAdmin = user?.role === "admin";

  const fetchTests = async () => {
    try {
      const data = await testService.getAllTests();
      setTests(data.tests || []);
    } catch (err) {
      setErrorMsg("Failed to load laboratory tests catalog.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDeleteTest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test from the catalog?")) {
      return;
    }
    try {
      setErrorMsg("");
      await testService.deleteTest(id);
      setTests((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to delete test from catalog."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
            SERVICES
          </span>
          <h1 className="font-martinaplantijn text-4xl text-ink-navy">
            Test <span className="italic font-light">Catalog</span>
          </h1>
          <p className="font-inter text-stone text-sm mt-1">
            Manage test profiles, laboratory fees, and available metrics.
          </p>
        </div>
        {isAdmin && (
          <div>
            <Link
              to="/tests/create"
              className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Test</span>
            </Link>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tests Table */}
      <div className="bg-paper-white border border-cream-border rounded-cards overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-canvas border-b border-cream-border">
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Price (INR)
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Registered On
                </th>
                {isAdmin && (
                  <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-stone text-sm">
                    No tests found.
                  </td>
                </tr>
              ) : (
                tests.map((testItem) => (
                  <tr key={testItem._id} className="hover:bg-warm-canvas/30 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                      {testItem.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal font-mono">
                      ₹{testItem.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone font-mono">
                      {new Date(testItem.createdAt || testItem.updatedAt).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/tests/edit/${testItem._id}`}
                            className="inline-flex items-center space-x-1 border border-cream-border text-graphite bg-paper-white hover:bg-warm-canvas px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteTest(testItem._id)}
                            className="inline-flex items-center space-x-1 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default TestList;
