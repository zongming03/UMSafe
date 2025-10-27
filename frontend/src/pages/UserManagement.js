import React, { useState, useEffect } from "react";
import "../styles/UserManagement.css";
import StatsCard from "../components/UserStatsCard";
import SelectFilter from "../components/SelectFilter";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import ErrorModal from "../components/ErrorModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faTrashAlt,
  faChevronDown,
  faUser,
  faCog,
  faUserPlus,
  faSearch,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import showNotification from "../utils/showNotification";
import LoadingOverlay from "../components/LoadingOverlay";
import {
  addOfficer,
  getAllOfficers,
  deleteOfficer,
  updateOfficer,
  bulkDeleteOfficers,
} from "../services/api.js";

const UserManagement = () => {
  // User state management
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userForm, setUserForm] = useState({
    name: "",
    staffid: "",
    role: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentLoggedInUserId = localStorage.getItem("userId"); 

  // Filtered users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const usersPerPage = 8;
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage)
  );

  // Event handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };
  const handleAddUser = () => {
    setUserForm({
      name: "",
      staffid: "",
      role: "",
      email: "",
      phone: "",
    });
    setIsAddUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    console.log(currentUser);
    setUserForm({
      name: user.name,
      staffid: user.staffid,
      role: user.role,
      email: user.email,
      phone: user.phone,
    });
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAddUser = async (e) => {
    e.preventDefault();
    if (
      !userForm.name.trim() ||
      !userForm.email.trim() ||
      !userForm.role.trim() ||
      !userForm.staffid.trim() ||
      !userForm.phone.trim()
    ) {
      showNotification("Please fill in all fields");
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const res = await addOfficer(userForm);
      if (res && (res.status === 200 || res.status === 201)) {
        await fetchAndSetUsers();
        setIsAddUserModalOpen(false);
        setUserForm({
          name: "",
          staffid: "",
          role: "",
          email: "",
          phone: "",
        });
        showNotification("User added successfully");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      setError("Failed to add user. Please check the details .");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEditUser = async (e) => {
    e.preventDefault();
    console.log("[Submit Edit] User form data:", userForm); // ✅ Log userForm content
    setIsLoading(true);
    if (
      !userForm.name?.trim() ||
      !userForm.email?.trim() ||
      !userForm.role?.trim() ||
      !userForm.phone?.trim()
    ) {
      showNotification("Please fill in all fields");
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: userForm.name,
      staffid: userForm.staffid,
      role: userForm.role,
      email: userForm.email,
      phone: userForm.phone,
    };

    try {
      const res = await updateOfficer(currentUser._id, updatedUser);
      if (res && (res.status === 200 || res.status === 201)) {
        showNotification("User updated successfully");
        await fetchAndSetUsers();
        setIsEditUserModalOpen(false);
        setUserForm({
          name: "",
          staffid: "",
          role: "",
          email: "",
          phone: "",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user. Please check the details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    console.log("Aaaaa:", userToDelete);
    if (!userToDelete) return showNotification("User to delete is empty...");
    setIsLoading(true);

    if (
      !Array.isArray(userToDelete) &&
      userToDelete._id === currentLoggedInUserId
    ) {
      showNotification("You cannot delete your own account.");
      setIsDeleteModalOpen(false);
      setIsLoading(false);
      return;
    }

    try {
      if (Array.isArray(userToDelete)) {
        await bulkDeleteOfficers(userToDelete.map((user) => user._id));
        showNotification(`${userToDelete.length} users deleted successfully`);
      } else {
        if (userToDelete.role === "admin" && isLastAdmin(userToDelete)) {
          showNotification("At least one Admin must remain in the system.");
          setIsDeleteModalOpen(false);
          setIsLoading(false);
          return;
        } else {
          await deleteOfficer(userToDelete._id);
          showNotification("User deleted successfully");
        }
      }
      await fetchAndSetUsers();
      setSelectedUsers([]);
      setUserToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError("Failed to delete user(s). Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = () => {
    const usersToDelete = users.filter((user) =>
      selectedUsers.includes(user._id)
    );

    if (usersToDelete.length === 0) {
      showNotification("No users selected for deletion");
      return;
    }

    setUserToDelete(usersToDelete);
    setIsDeleteModalOpen(true);
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentUsers.map((user) => user._id));
    }
    setIsAllSelected(!isAllSelected);
  };

  const isLastAdmin = (userId) => {
    const adminUsers = users.filter(
      (user) => user.role.toLowerCase() === "admin"
    );
    return adminUsers.length === 1 && adminUsers[0]._id === userId;
  };

  const fetchAndSetUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getAllOfficers();
      const users = res.data;
      setUsers(users);
    } catch {
      setError("Failed to fetch users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect to fetch users on mount
  useEffect(() => {
    fetchAndSetUsers();
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="main-container">
          <div className="main-box">
            {/* Page Header */}
            <div className="page-header">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage system users and permissions -{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex space-x-3">
                <div className="relative">
                  {selectedUsers.length > 1 && (
                    <>
                      <button
                        onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
                        className={`!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none cursor-pointer ${
                          selectedUsers.length < 2
                            ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <FontAwesomeIcon icon={faCog} className="mr-2" />
                        Bulk Actions
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={`ml-2 text-xs transition-transform ${
                            isBulkActionsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isBulkActionsOpen && selectedUsers.length > 1 && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <div className="py-1">
                            <button
                              onClick={handleBulkDelete}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                            >
                              <FontAwesomeIcon
                                icon={faTrashAlt}
                                className="mr-2"
                              />
                              Delete Selected
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={handleAddUser}
                  className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                  Add New User
                </button>
              </div>
            </div>

            {/* User Stats Cards */}
            <div className="user-stats-card">
              <StatsCard
                icon={faUser}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Total Users"
                value={users.length}
              />
              <StatsCard
                icon={faUserShield}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                title="Officer Users"
                value={users.filter((user) => user.role === "officer").length}
              />
            </div>

            {/* Search and Filters */}
            <div className="search-and-filter-container">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-grow mr-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="text-gray-400"
                      />
                    </div>
                    <input
                      type="text"
                      className="border-gray-300 pl-10 pr-4 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500  w-full sm:text-sm"
                      placeholder="Search users by name, email, or department..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="mt-4 md:mt-0 flex-shrink-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                    <SelectFilter
                      value={roleFilter}
                      onChange={handleRoleFilterChange}
                      options={[
                        { value: "all", label: "All Roles" },
                        { value: "admin", label: "Admin" },
                        { value: "officer", label: "Officer" },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="user-table-container">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Contact
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                              checked={selectedUsers.includes(user._id)}
                              onChange={() => handleSelectUser(user._id)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <FontAwesomeIcon icon={faUser} />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-900 cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className={`text-red-600 hover:text-red-900 cursor-pointer ${
                                isLastAdmin(user._id)
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={
                                isLastAdmin(user._id) ||
                                user._id === currentLoggedInUserId
                              }
                            >
                              <FontAwesomeIcon icon={faTrashAlt} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={usersPerPage}
                totalItems={filteredUsers.length}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </main>
      </div>

      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleSubmitAddUser}
        userForm={userForm}
        onFormChange={handleFormChange}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        onSubmit={handleSubmitEditUser}
        userForm={userForm}
        onFormChange={handleFormChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
export default UserManagement;
