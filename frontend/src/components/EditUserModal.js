import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserEdit,
} from "@fortawesome/free-solid-svg-icons";

const EditUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  userForm,
  onFormChange,
  canCreateSuperAdmin = false,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={onSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <FontAwesomeIcon icon={faUserEdit} className="text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit User
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="edit-name"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={userForm.name}
                        onChange={onFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="staffid"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Staff ID
                      </label>
                      <input
                        type="text"
                        name="staffid"
                        id="staffid"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={userForm.staffid}
                        onChange={onFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="edit-email"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={userForm.email}
                        onChange={onFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        name="role"
                        id="edit-role"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={userForm.role}
                        onChange={onFormChange}
                      >
                        {canCreateSuperAdmin && (
                          <option value="superadmin">Super Admin</option>
                        )}
                        <option value="admin">Admin</option>
                        <option value="officer">Officer</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="edit-phone"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={userForm.phone}
                        onChange={onFormChange}
                        required
                        pattern="^\d{3}-\d{7,8}$"
                        title="Please enter a valid phone number in format: XXX-XXXXXXX or XXX-XXXXXXXX"
                        onInvalid={(e) => {
                          e.target.setCustomValidity(
                            "Please enter a valid phone number in format: XXX-XXXXXXX or XXX-XXXXXXXX"
                          );
                        }}
                        onInput={(e) => {
                          e.target.setCustomValidity("");
                        }}
                      />
                      {!/^(\+\d{1})?\(\d{3}\) \d{3}-\d{4}$/.test(
                        userForm.phone
                      ) &&
                        userForm.phone && (
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-3">
                            <i className="fas fa-exclamation-circle text-red-500"></i>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="!rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="!rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;