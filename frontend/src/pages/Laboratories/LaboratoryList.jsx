import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search, CheckCircle, XCircle, AlertTriangle, Edit, RefreshCw } from 'lucide-react';
import laboratoryService from '../../services/laboratoryService';
import { toast } from '../../lib/toast';

const LaboratoryList = () => {
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLaboratories = async () => {
    setLoading(true);
    try {
      const res = await laboratoryService.getAllLaboratories({
        search,
        status: statusFilter,
      });
      if (res.success) {
        setLaboratories(res.data || []);
      }
    } catch (err) {
      toast.error('Failed to load laboratories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaboratories();
  }, [search, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await laboratoryService.updateStatus(id, newStatus);
      if (res.success) {
        toast.success(`Laboratory status set to ${newStatus}`);
        fetchLaboratories();
      }
    } catch (err) {
      toast.error('Failed to update laboratory status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Suspended
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Laboratory Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage all independent laboratory tenants, system access, and subscriptions
          </p>
        </div>

        <Link
          to="/laboratories/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Laboratory
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lab name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={fetchLaboratories}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Laboratory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            Loading laboratories...
          </div>
        ) : laboratories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No laboratories found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or create a new laboratory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-3.5 px-4">Laboratory</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laboratories.map((lab) => (
                  <tr key={lab._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{lab.name}</div>
                      <div className="text-xs text-slate-400">{lab.address || 'No address specified'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {lab.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 text-xs">{lab.email || 'N/A'}</div>
                      <div className="text-slate-400 text-xs">{lab.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(lab.status)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(lab.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/laboratories/edit/${lab._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Link>

                      {lab.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(lab._id, 'suspended')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(lab._id, 'active')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaboratoryList;
