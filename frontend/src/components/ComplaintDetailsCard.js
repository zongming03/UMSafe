import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faIdCard, faVenusMars, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";

const ComplaintDetailsCard = ({
  title,
  description,
  submittedBy,
  dateSubmitted,
  category,
  location,
  attachments = [],
  matricNumber,
  gender,
  email,
  phoneNumber,
}) => {
  console.log("✅ ComplaintDetailsCard received props:", {
    matricNumber,
    gender,
    email,
    phoneNumber
  });
  return (
  <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
    {/* Report Details Section */}
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
      <h2 className="text-lg font-medium text-gray-900">Report Details</h2>
    </div>
    <div className="p-6 border-b border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-700 mb-6">{description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Submitted by</p>
            <p className="font-medium">{submittedBy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date Submitted</p>
            <p className="font-medium">{dateSubmitted}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{location}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Student Details Section */}
    {(matricNumber || gender || email || phoneNumber) && (
      <div>
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
          <h2 className="text-lg font-medium text-gray-900">Student Details</h2>
        </div>
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matricNumber && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faIdCard} className="text-sm" />
                  <span className="text-xs font-medium text-gray-500">Matric Number</span>
                </div>
                <p className="font-semibold text-gray-900">{matricNumber}</p>
              </div>
            )}
            {gender && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faVenusMars} className="text-sm" />
                  <span className="text-xs font-medium text-gray-500">Gender</span>
                </div>
                <p className="font-semibold text-gray-900">{gender}</p>
              </div>
            )}
            {email && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                  <span className="text-xs font-medium text-gray-500">Email</span>
                </div>
                <p className="font-semibold text-gray-900 break-all text-sm">{email}</p>
              </div>
            )}
            {phoneNumber && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FontAwesomeIcon icon={faPhone} className="text-sm" />
                  <span className="text-xs font-medium text-gray-500">Phone Number</span>
                </div>
                <p className="font-semibold text-gray-900">{phoneNumber}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Attachments Section */}
    {attachments.length > 0 && (
      <div className="px-6 py-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((file, idx) => {
            const url = typeof file === "string" ? file : file?.url;
            const isVideo = typeof url === "string" && (url.endsWith(".mp4") || url.includes("/video/"));
            return (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {isVideo ? (
                      <video src={url} controls className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={url}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                </a>
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="!rounded-button whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-1" /> Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>
  );
};

export default ComplaintDetailsCard;