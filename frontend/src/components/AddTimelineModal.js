import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";

const AddTimelineModal = ({ isOpen, onClose, onSubmit, isLoading = false, userName = "Admin", currentStatus = "opened" }) => {
  const [formData, setFormData] = useState({
    initiator: userName,
    actionTitle: "",
    actionDetails: "",
  });

  // Update initiator when userName changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      initiator: userName
    }));
  }, [userName]);

  const [errors, setErrors] = useState({});

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper function to format action details (capitalize first letter and ensure period at end)
  const formatActionDetails = (str) => {
    if (!str || !str.trim()) return str;
    const trimmed = str.trim();
    const capitalized = capitalizeFirstLetter(trimmed);
    // Add period at the end if not already there
    if (!capitalized.endsWith('.') && !capitalized.endsWith('!') && !capitalized.endsWith('?')) {
      return capitalized + '.';
    }
    return capitalized;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format actionTitle: capitalize first letter of each word
    if (name === 'actionTitle') {
      processedValue = value.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.initiator.trim()) {
      newErrors.initiator = "Initiator name is required";
    }

    if (!formData.actionTitle.trim()) {
      newErrors.actionTitle = "Action title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Format action details before submitting (null if empty, formatted string otherwise)
      const formattedActionDetails = formData.actionDetails && formData.actionDetails.trim() 
        ? formatActionDetails(formData.actionDetails) 
        : null;

      await onSubmit({
        status: currentStatus,
        initiator: formData.initiator.trim(),
        actionTitle: formData.actionTitle.trim(),
        actionDetails: formattedActionDetails,
      });

      // Reset form after successful submission
      setFormData({
        initiator: userName,
        actionTitle: "",
        actionDetails: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error submitting timeline:", error);
      toast.error(error.message || "Failed to add timeline entry");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Add Timeline Entry</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Initiator */}
          <div>
            <label htmlFor="initiator" className="block text-sm font-medium text-gray-700 mb-1">
              Initiator Name *
            </label>
            <input
              type="text"
              id="initiator"
              name="initiator"
              value={formData.initiator}
              readOnly
              disabled={true}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-filled based on your account</p>
          </div>

          {/* Action Title */}
          <div>
            <label htmlFor="actionTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Action Title *
            </label>
            <input
              type="text"
              id="actionTitle"
              name="actionTitle"
              value={formData.actionTitle}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="e.g., Report Assigned, Update Provided"
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                errors.actionTitle
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white"
              }`}
            />
            {errors.actionTitle && (
              <p className="text-red-500 text-xs mt-1">{errors.actionTitle}</p>
            )}
          </div>

          {/* Action Details */}
          <div>
            <label htmlFor="actionDetails" className="block text-sm font-medium text-gray-700 mb-1">
              Action Details (Optional)
            </label>
            <textarea
              id="actionDetails"
              name="actionDetails"
              value={formData.actionDetails}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Add any additional details about this action..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Adding..." : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTimelineModal;
