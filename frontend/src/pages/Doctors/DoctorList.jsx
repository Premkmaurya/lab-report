import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { canManageDoctors } from "../../config/permissions";
import { doctorService } from "../../services/doctorService";
import { Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "../../lib/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const DoctorList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const canManage = canManageDoctors(user);

  const { data, isLoading: loading, error: fetchError } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.getAllDoctors(),
    staleTime: 5 * 60 * 1000,
  });

  const doctors = data?.doctors || [];
  
  useEffect(() => {
    if (fetchError) {
      toast.error("Failed to load doctor listings.");
    }
  }, [fetchError]);

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) {
      return;
    }
    
    toast.promise(doctorService.deleteDoctor(id), {
      loading: "Deleting doctor...",
      success: () => {
        queryClient.setQueryData(['doctors'], (old) => {
          if (!old) return old;
          return {
            ...old,
            doctors: old.doctors.filter((d) => d._id !== id)
          };
        });
        return "Doctor removed successfully.";
      },
      error: (err) => err.response?.data?.message || "Failed to delete doctor entry."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
            SPECIALISTS
          </span>
          <h1 className="font-martinaplantijn text-4xl text-ink-navy">
            Referred <span className="italic font-light">Doctors</span>
          </h1>
          <p className="font-inter text-stone text-sm mt-1">
            Manage referring doctors and digital signatures for report printing.
          </p>
        </div>
        {canManage && (
          <div>
            <Link
              to="/doctors/create"
              className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Doctor</span>
            </Link>
          </div>
        )}
      </div>


      {/* Grid of Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.length === 0 ? (
          <div className="col-span-full bg-paper-white border border-cream-border rounded-cards p-10 text-center text-stone text-sm">
            No doctors found.
          </div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc._id}
              className="bg-paper-white border border-cream-border rounded-cards p-6 flex flex-col justify-between hover:border-smoke transition-all duration-200"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-abcfavoritvariable text-base font-semibold text-charcoal">
                      Dr. {doc.name}
                    </h3>
                    <p className="text-xs text-stone font-medium mt-0.5">
                      {doc.qualification}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      doc.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {doc.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Signature Preview */}
                <div className="border border-cream-border bg-warm-canvas/30 rounded-2xl p-3 flex flex-col items-center justify-center min-h-[80px]">
                  <p className="text-[10px] text-stone uppercase tracking-wider font-bold mb-2">
                    Digital Signature
                  </p>
                  {doc.signUrl ? (
                    <img
                      src={doc.signUrl}
                      alt={`Signature of Dr. ${doc.name}`}
                      className="max-h-16 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs text-stone italic">No signature file</span>
                  )}
                </div>
              </div>

              {/* Admin/Owner Actions */}
              {(() => {
                const isOwner = user?.role === 'admin' || user?.role === 'system_admin' || (user?._id && doc.createdBy?._id && user._id === doc.createdBy._id) || (user?.id && doc.createdBy?._id && user.id === doc.createdBy._id);
                
                if (isOwner) {
                  return (
                    <div className="flex flex-col mt-6 pt-4 border-t border-cream-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-stone">
                          {doc.createdBy && <div>Created by: {doc.createdBy.username}</div>}
                          {doc.updatedBy && doc.updatedBy._id !== doc.createdBy?._id && <div>Updated by: {doc.updatedBy.username}</div>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/doctors/edit/${doc._id}`}
                            className="inline-flex items-center space-x-1 border border-cream-border text-graphite bg-paper-white hover:bg-warm-canvas px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDeleteDoctor(doc._id)}
                            className="inline-flex items-center space-x-1 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Not the owner
                return (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-cream-border">
                    <div className="text-[10px] text-stone">
                      {doc.createdBy && <div>Owner: {doc.createdBy.username}</div>}
                      {doc.updatedBy && <div>Last Updated by: {doc.updatedBy.username}</div>}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default DoctorList;
