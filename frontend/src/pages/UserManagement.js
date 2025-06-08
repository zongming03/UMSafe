import React, { useState, useRef, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import "../styles/UserManagement.css";
import StatsCard from "../components/UserStatsCard";
import SelectFilter from "../components/SelectFilter";
import AddUserModal from "../components/AddUserModal";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";

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

const UserManagement = () => {
  // User state management
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Smith",
      role: "Admin",
      email: "john.smith@university.edu",
      phone: "(555) 123-4567",
    },
    {
      id: 2,
      name: "Emma Davis",
      role: "Officer",
      email: "emma.davis@university.edu",
      phone: "(555) 234-5678",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      role: "Admin",
      email: "sarah.johnson@university.edu",
      phone: "(555) 345-6789",
    },
    {
      id: 4,
      name: "Michael Brown",
      role: "Officer",
      email: "michael.brown@university.edu",
      phone: "(555) 456-7890",
    },
    {
      id: 5,
      name: "David Wilson",
      role: "Officer",
      email: "david.wilson@university.edu",
      phone: "(555) 567-8901",
    },
    {
      id: 6,
      name: "Jennifer Lee",
      role: "Admin",
      email: "jennifer.lee@university.edu",
      phone: "(555) 678-9012",
    },
    {
      id: 7,
      name: "Robert Taylor",
      role: "Officer",
      email: "robert.taylor@university.edu",
      phone: "(555) 789-0123",
    },
    {
      id: 8,
      name: "Lisa Anderson",
      role: "Officer",
      email: "lisa.anderson@university.edu",
      phone: "(555) 890-1234",
    },
    {
      id: 9,
      name: "James Martin",
      role: "Admin",
      email: "james.martin@university.edu",
      phone: "(555) 901-2345",
    },
    {
      id: 10,
      name: "Patricia White",
      role: "Officer",
      email: "patricia.white@university.edu",
      phone: "(555) 012-3456",
    },
  ]);

  // UI state management
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userForm, setUserForm] = useState({
    name: "",
    role: "Officer",
    email: "",
    phone: "",
  });
  // Refs
  const profileRef = useRef(null);
  const bulkActionsRef = useRef(null);

  // Effect for handling clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (
        bulkActionsRef.current &&
        !bulkActionsRef.current.contains(event.target)
      ) {
        setIsBulkActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      role: "Officer",
      email: "",
      phone: "",
    });
    setIsAddUserModalOpen(true);
  };
  const handleEditUser = (user) => {
    setCurrentUser(user);
    setUserForm({
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
    });
    setIsEditUserModalOpen(true);
  };
  const handleDeleteUser = (user) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmitAddUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: users.length + 1,
      ...userForm,
    };
    setUsers([...users, newUser]);
    setIsAddUserModalOpen(false);
  };
  const handleSubmitEditUser = (e) => {
    e.preventDefault();
    const updatedUsers = users.map((user) =>
      user.id === currentUser.id ? { ...user, ...userForm } : user
    );
    setUsers(updatedUsers);
    setIsEditUserModalOpen(false);
  };
  const handleConfirmDelete = () => {
    if (currentUser.role === "Admin" && isLastAdmin(currentUser.id)) {
      alert("At least one Admin must remain in the system.");
      setIsDeleteModalOpen(false);
      return;
    }
    const updatedUsers = users.filter((user) => user.id !== currentUser.id);
    setUsers(updatedUsers);
    setIsDeleteModalOpen(false);
    if (selectedUsers.includes(currentUser.id)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== currentUser.id));
    }
  };
  const handleBulkDelete = () => {
    const updatedUsers = users.filter(
      (user) => !selectedUsers.includes(user.id)
    );
    setUsers(updatedUsers);
    setSelectedUsers([]);
    setIsAllSelected(false);
    setIsBulkActionsOpen(false);
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
      setSelectedUsers(currentUsers.map((user) => user.id));
    }
    setIsAllSelected(!isAllSelected);
  };
  const isLastAdmin = (userId) => {
    const adminUsers = users.filter((user) => user.role === "Admin");
    return adminUsers.length === 1 && adminUsers[0].id === userId;
  };
  const userRole = "Admin";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
        />
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
                <div className="relative" ref={bulkActionsRef}>
                  <button
                    onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
                    disabled={selectedUsers.length === 0}
                    className={`!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-md focus:outline-none cursor-pointer ${
                      selectedUsers.length === 0
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
                  {isBulkActionsOpen && selectedUsers.length > 0 && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        <button
                          onClick={handleBulkDelete}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="mr-2" />
                          Delete Selected
                        </button>
                      </div>
                    </div>
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
                value={users.filter((user) => user.role === "Officer").length}
              />
            </div>

            {/* Search and Filters */}
            <div className="search-and-filter-container">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FontAwesomeIcon
                        icon={faSearch}
                        className="text-gray-400"
                      />
                    </div>
                    <input
                      type="text"
                      className="border-gray-300 pl-10 pr-4 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                      placeholder="Search users by name, email, or department..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                    <SelectFilter
                      value={roleFilter}
                      onChange={handleRoleFilterChange}
                      options={[
                        { value: "all", label: "All Roles" },
                        { value: "Admin", label: "Admin" },
                        { value: "Officer", label: "Officer" },
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
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
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
                              user.role === "Admin"
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
                                isLastAdmin(user.id)
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={isLastAdmin(user.id)}
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
  

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleSubmitAddUser}
        userForm={userForm}
        onFormChange={handleFormChange}
        title="Add New User"
        submitLabel="Add User"
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
