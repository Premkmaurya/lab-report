import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../../services/userService";
import { Plus, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "../../lib/toast";

import { useLaboratory } from "../../context/LaboratoryContext";

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedLabId } = useLaboratory();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers(selectedLabId ? { laboratoryId: selectedLabId } : {});
      setUsers(data.users || []);
    } catch (err) {
      toast.error("Failed to fetch users list.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedLabId]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    
    toast.promise(userService.updateUserStatus(id, newStatus), {
      loading: "Updating status...",
      success: () => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isAuthorized: newStatus } : u))
        );
        return "User status updated successfully";
      },
      error: (err) => err.response?.data?.message || "Failed to update user authorization status."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case "system_admin":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">System Admin</span>;
      case "admin":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">Lab Admin</span>;
      case "receptionist":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Receptionist</span>;
      case "user":
      case "lab_technician":
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-lavender-mist text-electric-cobalt">Lab Tech</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
            ADMINISTRATION
          </span>
          <h1 className="font-martinaplantijn text-4xl text-ink-navy">
            User <span className="italic font-light">Management</span>
          </h1>
          <p className="font-inter text-stone text-sm mt-1">
            Manage user accounts, laboratory assignments, and access permissions.
          </p>
        </div>
        <div>
          <Link
            to="/users/create"
            className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-paper-white border border-cream-border rounded-cards overflow-hidden">
        <div className="overflow-x-auto w-full block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-canvas border-b border-cream-border">
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Laboratory
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-stone text-sm">
                    No users found for this laboratory.
                  </td>
                </tr>
              ) : (
                users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-warm-canvas/30 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                      {userItem.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {userItem.laboratory ? `${userItem.laboratory.name} (${userItem.laboratory.code})` : 'Global / None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {userItem.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getRoleBadge(userItem.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          userItem.isAuthorized
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {userItem.isAuthorized ? "Authorized" : "Pending Approval"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/users/edit/${userItem.id}`}
                          className="text-xs font-medium text-electric-cobalt hover:underline mr-2"
                        >
                          View details / Edit
                        </Link>
                        {userItem.isAuthorized ? (
                          <button
                            onClick={() => handleToggleStatus(userItem.id, true)}
                            className="inline-flex items-center space-x-1 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(userItem.id, false)}
                            className="inline-flex items-center space-x-1 border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-50 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Authorize</span>
                          </button>
                        )}
                      </div>
                    </td>
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
export default UserList;
