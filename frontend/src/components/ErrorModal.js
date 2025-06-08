import React from "react";

const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
      <h2 className="text-lg font-bold text-red-600 mb-2">Error</h2>
      <p className="text-gray-700 mb-4">{message}</p>
      <button
        onClick={onClose}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Close
      </button>
    </div>
  </div>
);

export default ErrorModal;