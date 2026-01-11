import React, { useState } from "react";
import { toast } from "react-hot-toast";

const CloseReportModal = ({ isOpen, onClose, onConfirm, reportId }) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate reason is not empty
    if (!reason.trim()) {
      toast.error("Please provide a reason for closing the report");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the onConfirm callback with the reason
      await onConfirm(reason.trim());
      // Reset form
      setReason("");
    } catch (err) {
      console.error("Error confirming close:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Close Report</h2>
        
        <p className="text-gray-600 mb-6">
          Please provide a reason for closing this report (Report ID: {reportId}). This is mandatory.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="reason"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Closure Reason *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for closing this report..."
              rows="5"
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {reason.trim().length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Characters: {reason.length}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {isSubmitting ? "Closing..." : "Close Report"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloseReportModal;
