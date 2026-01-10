import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import showNotification from "../utils/showNotification";
import {
  createMobileAdmin,
  fetchMobileAdmins,
  deleteMobileAdmin,
} from "../services/api.js";

const MobileAdminSection = () => {
  const [mobileAdmins, setMobileAdmins] = useState([]);
  const [mobileForm, setMobileForm] = useState({
    name: "",
    email: "",
    facultyid: "",
    password: "",
  });
  const [mobileSubmitting, setMobileSubmitting] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchAndSetMobileAdmins();
    const getCurrentUserFacultyId = () => {
      const userData =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          return user.facultyId || user.facultyid || "";
        } catch (err) {
          return "";
        }
      }
      return "";
    };
    const facultyId = getCurrentUserFacultyId();
    setMobileForm((prev) => ({ ...prev, facultyid: facultyId }));
  }, []);

  const handleMobileInputChange = (e) => {
    const { name, value } = e.target;
    setMobileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitMobileAdmin = async (e) => {
    e.preventDefault();
    if (
      !mobileForm.name.trim() ||
      !mobileForm.email.trim() ||
      !mobileForm.password.trim()
    ) {
      showNotification("Name, email, and password are required");
      return;
    }

    if (!mobileForm.facultyid?.trim()) {
      showNotification("Faculty ID is required");
      return;
    }

    setMobileSubmitting(true);
    try {
      const payload = {
        name: mobileForm.name.trim(),
        email: mobileForm.email.trim(),
        facultyId: mobileForm.facultyid.trim(),
        password: mobileForm.password,
      };
      const res = await createMobileAdmin(payload);
      if (res?.status === 200 || res?.status === 201) {
        showNotification("Mobile admin created successfully", "success");
        // Reset form but keep facultyid
        const currentFacultyId = mobileForm.facultyid;
        setMobileForm({
          name: "",
          email: "",
          facultyid: currentFacultyId,
          password: "",
        });
        await fetchAndSetMobileAdmins();
      }
    } catch (err) {
      console.error("Failed to create mobile admin", err);
      // Handle validation errors from API
      if (
        err?.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const errorMessages = err.response.data.errors
          .map((e) => `${e.field}: ${e.message}`)
          .join(", ");
        showNotification(errorMessages);
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to create mobile admin";
        showNotification(msg);
      }
    } finally {
      setMobileSubmitting(false);
    }
  };

  const fetchAndSetMobileAdmins = async () => {
    try {
      const res = await fetchMobileAdmins();
      const admins =
        res.data?.admins || res.data?.data || res.data?.users || res.data || [];
      setMobileAdmins(admins);
    } catch (err) {
      console.error("Failed to fetch mobile admins", err);
      showNotification("Failed to fetch mobile admins");
    }
  };

  const handleDeleteMobileAdmin = (adminToDeleteItem) => {
    setAdminToDelete(adminToDeleteItem);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMobileAdmin = async () => {
    if (!adminToDelete) return;
    try {
      await deleteMobileAdmin(adminToDelete.id || adminToDelete._id);
      showNotification("Mobile admin deleted", "success");
      await fetchAndSetMobileAdmins();
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    } catch (err) {
      console.error("Failed to delete mobile admin", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        "Failed to delete mobile admin";
      showNotification(msg);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Mobile Admins{" "}
          </h3>
          <p className="text-sm text-gray-600">
            Create admins on mobile side and view/delete existing mobile admins.
          </p>
        </div>
        <button
          onClick={() => setShowMobileForm((v) => !v)}
          className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50"
        >
          {showMobileForm ? "Hide Create Form" : "Show Create Form"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {showMobileForm && (
          <div className="md:w-1/2">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Create Mobile Admin
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Calls partner endpoint to create a mobile admin stored on partner.
            </p>
            <form className="space-y-3" onSubmit={handleSubmitMobileAdmin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  name="name"
                  value={mobileForm.name}
                  onChange={handleMobileInputChange}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Admin name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={mobileForm.email}
                  onChange={handleMobileInputChange}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Faculty ID *
                </label>
                <input
                  name="facultyid"
                  value={mobileForm.facultyid}
                  onChange={handleMobileInputChange}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"
                  placeholder="Auto-filled from your profile"
                  disabled
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically set from your account
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={mobileForm.password}
                    onChange={handleMobileInputChange}
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Temporary password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none mt-0.5"
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="text-sm"
                    />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={mobileSubmitting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {mobileSubmitting ? "Creating..." : "Create Mobile Admin"}
              </button>
            </form>
          </div>
        )}

        {!showMobileForm && (
          <div className="md:w-1/2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-900">List </h4>
              <button
                onClick={fetchAndSetMobileAdmins}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Refresh
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mobileAdmins.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-center text-gray-500"
                      >
                        No mobile admins found.
                      </td>
                    </tr>
                  )}
                  {mobileAdmins.map((a, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-gray-900 font-medium">
                        {a.name}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{a.email}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDeleteMobileAdmin(a)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && adminToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Mobile Admin
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <strong>{adminToDelete.name}</strong>? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setAdminToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMobileAdmin}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileAdminSection;
