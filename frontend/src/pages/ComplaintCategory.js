import React, { useState } from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import "../styles/ComplaintCategory.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSort,
  faSortUp,
  faSortDown,
  faEdit,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import SearchFilterSection from "../components/SearchFilterSection";
const ComplaintCategory = () => {
  const [categories, setCategories] = useState([
    {
      id: 1,
      name: "Academic",
      description:
        "Issues related to courses, curriculum, and academic policies",
      complaintsCount: 42,
      createdAt: "2025-01-15",
    },
    {
      id: 2,
      name: "Facilities",
      description:
        "Problems with buildings, classrooms, and campus infrastructure",
      complaintsCount: 28,
      createdAt: "2025-01-18",
    },
    {
      id: 3,
      name: "IT Services",
      description:
        "Technical issues with university systems, wifi, and software",
      complaintsCount: 35,
      createdAt: "2025-02-03",
    },
    {
      id: 4,
      name: "Administrative",
      description:
        "Issues with university administration, procedures, and policies",
      complaintsCount: 19,
      createdAt: "2025-02-10",
    },
    {
      id: 5,
      name: "Financial",
      description:
        "Problems related to fees, payments, scholarships, and financial aid",
      complaintsCount: 23,
      createdAt: "2025-02-22",
    },
    {
      id: 6,
      name: "Services",
      description:
        "Issues with campus services like cafeteria, library, and transportation",
      complaintsCount: 31,
      createdAt: "2025-03-05",
    },
    {
      id: 7,
      name: "Housing",
      description:
        "Problems with dormitories, student housing, and accommodation",
      complaintsCount: 17,
      createdAt: "2025-03-12",
    },
    {
      id: 8,
      name: "Safety & Security",
      description:
        "Concerns about campus safety, security incidents, and emergency procedures",
      complaintsCount: 9,
      createdAt: "2025-03-20",
    },
    {
      id: 9,
      name: "Staff Conduct",
      description:
        "Issues regarding the behavior or conduct of university staff and faculty",
      complaintsCount: 14,
      createdAt: "2025-04-02",
    },
    {
      id: 10,
      name: "Student Activities",
      description:
        "Problems with clubs, events, and extracurricular activities",
      complaintsCount: 22,
      createdAt: "2025-04-15",
    },
  ]);
    const [activeTab, setActiveTab] = useState("categories");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const handleSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <FontAwesomeIcon icon={faSort} className="text-gray-300 ml-1" />;
    }
    return sortConfig.direction === "ascending" ? (
      <FontAwesomeIcon icon={faSortUp} className="text-blue-500 ml-1" />
    ) : (
      <FontAwesomeIcon icon={faSortDown} className="text-blue-500 ml-1" />
    );
  };
  const sortedCategories = React.useMemo(() => {
    let sortableCategories = [...categories];
    if (sortConfig !== null) {
      sortableCategories.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCategories;
  }, [categories, sortConfig]);
  const filteredCategories = sortedCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCategories(filteredCategories.map((category) => category.id));
    } else {
      setSelectedCategories([]);
    }
  };
  const handleSelectCategory = (id) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(
        selectedCategories.filter((categoryId) => categoryId !== id)
      );
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };
  const handleAddCategory = () => {
    if (newCategory.name.trim() === "") return;
    const newId = Math.max(...categories.map((c) => c.id)) + 1;
    const today = new Date().toISOString().split("T")[0];
    setCategories([
      ...categories,
      {
        id: newId,
        name: newCategory.name,
        description: newCategory.description,
        complaintsCount: 0,
        createdAt: today,
      },
    ]);
    setNewCategory({ name: "", description: "" });
    setIsAddModalOpen(false);
    // Show success notification
    showNotification("Category added successfully");
  };
  const handleEditCategory = () => {
    if (
      !currentCategory ||
      typeof currentCategory.name !== "string" ||
      currentCategory.name.trim() === ""
    )
      return;
    const updatedCategory = {
      ...currentCategory,
      description:
        typeof currentCategory.description === "string"
          ? currentCategory.description.slice(0, 200)
          : "",
    };
    setCategories(
      categories.map((category) =>
        category.id === currentCategory.id ? updatedCategory : category
      )
    );
    setIsEditModalOpen(false);
    // Show success notification
    showNotification("Category updated successfully");
  };
  const handleDeleteCategory = () => {
    if (!currentCategory) return;
    setCategories(
      categories.filter((category) => category.id !== currentCategory.id)
    );
    setIsDeleteModalOpen(false);
    // Show success notification
    showNotification("Category deleted successfully");
  };
  const handleBulkDelete = () => {
    if (selectedCategories.length === 0) return;
    setCategories(
      categories.filter((category) => !selectedCategories.includes(category.id))
    );
    setSelectedCategories([]);
    // Show success notification
    showNotification(
      `${selectedCategories.length} categories deleted successfully`
    );
  };
  const showNotification = (message) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-50 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center";
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar  activeTab={activeTab} setActiveTab={setActiveTab}/>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <div className="category-header">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Category Management
                    </h1>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <a href="#" className="hover:text-blue-600">
                      Dashboard
                    </a>
                    <span className="mx-2">/</span>
                    <span>Categories</span>
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add New Category
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Manage complaint categories to help organize and classify
                incoming complaints. Categories help users select the
                appropriate department for their issues.
              </p>
            </div>

            <SearchFilterSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategories={selectedCategories}
            handleBulkDelete={handleBulkDelete}
            inputPlaceholder="Search categories by name or description...."
            />

            {/* Categories Table */}
            <div className="category-table-container">
              <div className="category-table-scroll">
                <table className="category-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="category-checkbox"
                            onChange={handleSelectAll}
                            checked={
                              selectedCategories.length ===
                                filteredCategories.length &&
                              filteredCategories.length > 0
                            }
                          />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="category-table-th"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Category Name {getSortIcon("name")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="category-table-th"
                        onClick={() => handleSort("description")}
                      >
                        <div className="flex items-center">
                          Description {getSortIcon("description")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="category-table-th"
                        onClick={() => handleSort("complaintsCount")}
                      >
                        <div className="flex items-center">
                          Complaints {getSortIcon("complaintsCount")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="category-table-th"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          Created Date {getSortIcon("createdAt")}
                        </div>
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
                    {paginatedCategories.length > 0 ? (
                      paginatedCategories.map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedCategories.includes(
                                  category.id
                                )}
                                onChange={() =>
                                  handleSelectCategory(category.id)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {category.name}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {category.description}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {category.complaintsCount}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.createdAt}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentCategory(category);
                                  setIsEditModalOpen(true);
                                }}
                                className="!rounded-button whitespace-nowrap text-blue-600 hover:text-blue-900 cursor-pointer"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>

                              <button
                                onClick={() => {
                                  setCurrentCategory(category);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="!rounded-button whitespace-nowrap text-red-600 hover:text-red-900 cursor-pointer"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          <p className="text-lg font-medium">
                            No categories found
                          </p>
                          <p className="text-sm mt-1">
                            Try adjusting your search or add a new category
                          </p>
                          <button
                            onClick={() => {
                              setSearchTerm("");
                              setIsAddModalOpen(true);
                            }}
                            className="!rounded-button whitespace-nowrap mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                          >
                            <FontAwesomeIcon icon={faPlus} className="mr-2" />
                            Add Your First Category
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredCategories.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredCategories.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
                onClick={() => setIsAddModalOpen(false)}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add New Category
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="category-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      className="category-addC-text-box"
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="category-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value.slice(0, 200),
                        })
                      }
                      rows={3}
                      maxLength={200}
                      className="category-addC-text-box"
                      placeholder="Enter category description"
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500 text-right">
                      {newCategory.description.length}/200 characters
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="!rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewCategory({ name: "", description: "" });
                  }}
                  className="!rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Category Modal */}
      {isEditModalOpen && currentCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
                onClick={() => setIsEditModalOpen(false)}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Category
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-category-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-category-name"
                      value={currentCategory.name}
                      onChange={(e) =>
                        setCurrentCategory({
                          ...currentCategory,
                          name: e.target.value,
                        })
                      }
                      className="category-addC-text-box"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-category-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="edit-category-description"
                      value={currentCategory.description}
                      onChange={(e) =>
                        setCurrentCategory({
                          ...currentCategory,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="category-addC-text-box"
                    ></textarea>
                    <p className="mt-1 text-xs text-gray-500 text-right">
                      {currentCategory.description.length}/200 characters
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleEditCategory}
                  className="rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Category Modal */}
      {isDeleteModalOpen && currentCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
                onClick={() => setIsDeleteModalOpen(false)}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Category
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the category{" "}
                        <span className="font-medium">
                          {currentCategory.name}
                        </span>
                        ?
                      </p>
                      {currentCategory.complaintsCount > 0 && (
                        <div className="mt-2 p-3 bg-yellow-50 rounded-md">
                          <p className="text-sm text-yellow-700">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            This category has{" "}
                            <span className="font-bold">
                              {currentCategory.complaintsCount}
                            </span>{" "}
                            associated complaints. Deleting it may affect
                            complaint categorization.
                          </p>
                        </div>
                      )}
                      <p className="mt-2 text-sm text-red-500">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  className="!rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="!rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};
export default ComplaintCategory;
