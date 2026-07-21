import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, Save, Shield, CheckCircle } from 'lucide-react';
import laboratoryService from '../../services/laboratoryService';
import { toast } from '../../lib/toast';

const LaboratoryForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    letterheadAddressLine: '',
    gstNumber: '',
    licenseNumber: '',
    logo: '',
    status: 'active',
  });

  useEffect(() => {
    if (isEdit) {
      fetchLaboratory();
    }
  }, [id]);

  const fetchLaboratory = async () => {
    try {
      const res = await laboratoryService.getLaboratoryById(id);
      if (res.success && res.data) {
        setFormData({
          name: res.data.name || '',
          code: res.data.code || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          letterheadAddressLine: res.data.letterheadAddressLine || '',
          gstNumber: res.data.gstNumber || '',
          licenseNumber: res.data.licenseNumber || '',
          logo: res.data.logo || '',
          status: res.data.status || 'active',
        });
      }
    } catch (err) {
      toast.error('Failed to load laboratory details');
      navigate('/laboratories');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Laboratory Name and Code are required');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await laboratoryService.updateLaboratory(id, formData);
        if (res.success) {
          toast.success('Laboratory updated successfully');
          navigate('/laboratories');
        }
      } else {
        const res = await laboratoryService.createLaboratory(formData);
        if (res.success) {
          toast.success('Laboratory created successfully');
          navigate('/laboratories');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        Loading laboratory details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/laboratories"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            {isEdit ? 'Edit Laboratory' : 'Create New Laboratory'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isEdit
              ? 'Update configuration and contact information for this laboratory'
              : 'Add a new isolated multi-tenant laboratory organization'}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Lab Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Laboratory Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. City Path Lab"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Lab Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Laboratory Code *
            </label>
            <input
              type="text"
              name="code"
              required
              disabled={isEdit}
              placeholder="e.g. CITYPATH"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono uppercase disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contact Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="contact@citypath.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Contact Phone
            </label>
            <input
              type="text"
              name="phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              placeholder="123 Health Street, Medical District, City"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Letterhead Address Line */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Print Letterhead Address Line
            </label>
            <input
              type="text"
              name="letterheadAddressLine"
              placeholder="Full address formatted for report header prints"
              value={formData.letterheadAddressLine}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              GST Number
            </label>
            <input
              type="text"
              name="gstNumber"
              placeholder="22AAAAA0000A1Z5"
              value={formData.gstNumber}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          {/* License Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Medical License Number
            </label>
            <input
              type="text"
              name="licenseNumber"
              placeholder="LIC-2026-9908"
              value={formData.licenseNumber}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Status (if Edit) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to="/laboratories"
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : isEdit ? 'Update Laboratory' : 'Create Laboratory'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LaboratoryForm;
