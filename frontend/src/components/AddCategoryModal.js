import React from "react";

const AddCategoryModal = ({
  isOpen,
  onClose,
  newCategory,
  setNewCategory,
  onAdd,
}) => {
  if (!isOpen) return null;
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
                  Description<span className="text-red-500"> *</span>
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

              <div>
                <label
                  htmlFor="category-priority"
                  className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Priority<span className="text-red-500"> *</span>
                  </label>
                <select
                  id="category-priority"
                  value={newCategory.priority}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
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
              onClick={onAdd}
              className=" whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
            >
              Add Category
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                setNewCategory({ name: "", description: "" ,priority: "low"});
              }}
              className="whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;
