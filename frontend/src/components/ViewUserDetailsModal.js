import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faUser, faEnvelope, faPhone, faIdCard, faBuilding, faVenusMars } from "@fortawesome/free-solid-svg-icons";
import { getFacultyName } from "../services/api";

const ViewUserDetailsModal = ({ isOpen, onClose, userDetails, isLoading }) => {
  // Hooks must run unconditionally at the top level
  const [facultyName, setFacultyName] = useState("");
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);

  useEffect(() => {
    const fetchFaculty = async () => {
      if (!userDetails?.facultyId) {
        setFacultyName("");
        return;
      }
      setIsLoadingFaculty(true);
      try {
        const res = await getFacultyName(userDetails.facultyId);
        const name = res.data?.name || res.data?.facultyName || "";
        setFacultyName(name);
      } catch (e) {
        setFacultyName("");
      } finally {
        setIsLoadingFaculty(false);
      }
    };
    fetchFaculty();
  }, [userDetails?.facultyId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faUser} className="text-xl" />
            <h2 className="text-xl font-semibold">User Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1"
            aria-label="Close modal"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faUser} className="text-sm" />
                    <span className="text-sm font-medium">Full Name</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{userDetails.name || "N/A"}</p>
                </div>

                {/* Gender */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faVenusMars} className="text-sm" />
                    <span className="text-sm font-medium">Gender</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{userDetails.gender || "N/A"}</p>
                </div>

                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <p className="text-gray-900 font-semibold break-all">{userDetails.email || "N/A"}</p>
                </div>

                {/* Phone Number */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faPhone} className="text-sm" />
                    <span className="text-sm font-medium">Phone Number</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{userDetails.phoneNumber || "N/A"}</p>
                </div>

                {/* Matric Number */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faIdCard} className="text-sm" />
                    <span className="text-sm font-medium">Matric Number</span>
                  </div>
                  <p className="text-gray-900 font-semibold">{userDetails.matricNumber || "N/A"}</p>
                </div>

                {/* Faculty */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FontAwesomeIcon icon={faBuilding} className="text-sm" />
                    <span className="text-sm font-medium">Faculty</span>
                  </div>
                  <p className="text-gray-900 font-semibold break-all">
                    {isLoadingFaculty ? "Loading..." : (facultyName || userDetails.facultyId || "N/A")}
                  </p>
                </div>
              </div>

              
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No user details available</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-lg border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewUserDetailsModal;
