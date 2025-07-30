import React from "react";

const EditCategoryModal = ({
  isOpen,
  onClose,
  currentCategory,
  setCurrentCategory,
  onEdit,
}) => {
  if (!isOpen || !currentCategory) return null;
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-gray-500/30 backdrop-blur-sm"
            onClick={onClose}
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

              <div>
                <label
                  htmlFor="category-priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Priority<span className="text-red-500"> *</span>
                  </label>
                <select
                  id="category-priority"
                  value={currentCategory.priority}
                  onChange={(e) =>
                    setCurrentCategory({
                      ...currentCategory,
                      priority: e.target.value,
                    })
                  }
                  className="category-addC-text-box"
                >
                  <option value='low'>Low</option>
                  <option value='medium'>Medium</option>
                  <option value='high'>High</option>
                </select>
              </div>

            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;
