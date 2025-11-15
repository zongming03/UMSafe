import React, { useState, useEffect } from "react";
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
import showNotification from "../utils/showNotification";
import AddCategoryModal from "../components/AddCategoryModal";
import EditCategoryModal from "../components/EditCategoryModal";
import DeleteCategoryModal from "../components/DeleteCategoryModal";
import ErrorModal from "../components/ErrorModal";
import BulkDeleteCategoryModal from "../components/BulkDeleteCategoryModal";
import {
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  fetchReports,
} from "../services/api";
import LoadingOverlay from "../components/LoadingOverlay";

const ComplaintCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    priority: "low",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const itemsPerPage = 8;

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

  const handleSelectCategory = (id) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(
        selectedCategories.filter((categoryId) => categoryId !== id)
      );
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCategories(
        filteredCategories.map((category) => category._id || category.id)
      );
    } else {
      setSelectedCategories([]);
    }
  };

  const fetchAndSetCategories = async () => {
    setIsLoading(true);
    try {
      // Fetch categories and reports in parallel
      const [categoriesRes, reportsRes] = await Promise.all([
        fetchCategories(),
        fetchReports()
      ]);
      
      const categoriesData = categoriesRes.data;
      const reportsData = reportsRes.data?.reports || reportsRes.data?.data || reportsRes.data || [];
      
      console.log("📂 Categories fetched:", categoriesData);
      console.log("📋 Reports fetched:", reportsData);
      
      // Count complaints for each category
      const categoryComplaintsCount = {};
      reportsData.forEach(report => {
        const categoryName = report.category?.name;
        if (categoryName) {
          categoryComplaintsCount[categoryName] = (categoryComplaintsCount[categoryName] || 0) + 1;
        }
      });
      
      console.log("📊 Complaint counts by category:", categoryComplaintsCount);
      
      // Add complaintsCount to each category
      const categoriesWithCount = categoriesData.map(category => ({
        ...category,
        complaintsCount: categoryComplaintsCount[category.name] || 0
      }));
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setError("Failed to fetch categories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim() || !newCategory.description.trim()) {
      setError("Both category name and description are required.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const categoryName = newCategory.name.trim();
      const categoryDescription = newCategory.description.slice(0, 200);
      const categoryPriority = (newCategory.priority || "low").trim();
      const newCategoryData = {
        name: categoryName,
        description: categoryDescription,
        priority: categoryPriority,
      };
      console.log("[AddCategory] Input:", newCategoryData);

      const res = await addCategory(newCategoryData);
      if (res && (res.status === 200 || res.status === 201)) {
        await fetchAndSetCategories();
        setIsAddModalOpen(false);
        setNewCategory({ name: "", description: "", priority: "low" });
        setCurrentCategory(null);
        showNotification("Category added successfully");
      }
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data &&
        error.response.data.msg === "Category already exists"
      ) {
        setError("Category already exists. Please use a different name.");
      } else {
        setError("Failed to add category. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (
      !currentCategory ||
      typeof currentCategory.name !== "string" ||
      currentCategory.name.trim() === "" ||
      typeof currentCategory.description !== "string" ||
      currentCategory.description.trim() === ""
    ) {
      setError("Both category name and description are required.");
      return;
    }
    const duplicate = categories.find(
      (cat) =>
        (cat._id || cat.id) !== (currentCategory._id || currentCategory.id) &&
        cat.name.trim().toLowerCase() ===
          currentCategory.name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("Category name already exists. Please use a different name.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedCategory = {
        ...currentCategory,
        name:
          typeof currentCategory.name === "string"
            ? currentCategory.name.trim().slice(0, 100)
            : "",
        description:
          typeof currentCategory.description === "string"
            ? currentCategory.description.slice(0, 200)
            : "",
        priority: currentCategory.priority || "low",
      };
      console.log("[EditCategory] Input:", updatedCategory); // <-- log input
      const res = await updateCategory(currentCategory._id, updatedCategory);
      if (res && (res.status === 200 || res.status === 201)) {
        await fetchAndSetCategories();
        setIsEditModalOpen(false);
        showNotification("Category updated successfully");
      }
    } catch (error) {
      console.error("[EditCategory] Error updating category:", error);
      setError("Failed to update category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    setIsLoading(true);
    try {
      const res = await deleteCategory(currentCategory._id);
      if (res && res.status === 200) {
        await fetchAndSetCategories();
        if (paginatedCategories.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        setIsDeleteModalOpen(false);
        showNotification("Category deleted successfully");
      }
    } catch (error) {
      setError("Failed to delete category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedCategories.length === 0) return;
    setIsLoading(true);
    try {
      const res = await bulkDeleteCategories(selectedCategories);
      if (res && res.status === 200) {
        await fetchAndSetCategories();
        if (
          paginatedCategories.length === selectedCategories.length &&
          currentPage > 1
        ) {
          setCurrentPage(currentPage - 1);
        }
        setSelectedCategories([]);
        showNotification(
          `${selectedCategories.length} categories deleted successfully`
        );
        setIsBulkDeleteModalOpen(false);
      }
    } catch (error) {
      setError("Failed to delete categories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  useEffect(() => {
    fetchAndSetCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isLoading && <LoadingOverlay />}
      <div>
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
                incoming complaints.-{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <SearchFilterSection
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategories={selectedCategories}
              handleBulkDelete={() => setIsBulkDeleteModalOpen(true)}
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
                        onClick={() => handleSort("priority")}
                      >
                        <div className="flex items-center"> 
                          Priority {getSortIcon("priority")}
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
                        <tr
                          key={category._id || category.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4  rounded"
                                checked={selectedCategories.includes(
                                  category._id || category.id
                                )}
                                onChange={() =>
                                  handleSelectCategory(
                                    category._id || category.id
                                  )
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
                            <span
                              className={`text-sm font-medium ${getPriorityColor(
                                category.priority
                              )}`}
                            >
                              {category.priority}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {category.complaintsCount}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.createdAt
                              ? new Date(category.createdAt).toLocaleDateString(
                                  "en-CA"
                                )
                              : ""}
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
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onAdd={handleAddCategory}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        onEdit={handleEditCategory}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        currentCategory={currentCategory}
        onDelete={handleDeleteCategory}
      />

      <BulkDeleteCategoryModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        count={selectedCategories.length}
      />
    </div>
  );
};
export default ComplaintCategory;
