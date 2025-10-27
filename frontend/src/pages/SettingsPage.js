import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faLock,
  faInfoCircle,
  faCamera,
  faCheckCircle,
  faTimes,
  faEdit,
  faKey,
  faEyeSlash,
  faEye,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import DTC from "../assets/dewan_tunku_chancelor.jpg";
import DefaultBackground from "../assets/default_profile_background.png";
import { getProfile, updateProfile, changePassword } from "../services/api.js";
import Spinner from "../components/Spinner";

const SettingsPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    contactNumber: "",
    faculty: "",
    profileImage: "",
    notifications: {
      emailNotifications: false,
      newComplaints: false,
      statusUpdates: false,
      weeklyReports: false,
    },
  });

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Add image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const [previewImage, setPreviewImage] = useState(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [failureMessage, setFailureMessage] = useState("");

  // Form validation
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Refs for modals
  const passwordModalRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setHasChanges(true);
  };
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    // Update local state immediately
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [name]: checked },
    }));
    setHasChanges(true);

    // Save to backend immediately
    const saveNotificationSetting = async () => {
      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append(
          "notifications",
          JSON.stringify({ ...formData.notifications, [name]: checked })
        );
        // Only send image if editing profile image
        if (selectedImage) {
          formDataToSend.append("profileImage", selectedImage);
        }
        const response = await updateProfile(formDataToSend);
        if (response.data?.user?.notifications) {
          setFormData((prev) => ({
            ...prev,
            notifications: response.data.user.notifications,
          }));
        }
      } catch (error) {
        setFailureMessage("Failed to update notification setting. Please try again.");
        setIsFailureModalOpen(true);
      }
    };
    saveNotificationSetting();
  };

  const openPasswordModal = () => {
    // Reset password input fields
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setPreviewImage(null);
      setSelectedImage(null);
      setHasChanges(false);
    } else {
      setIsEditing(true);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append(
        "notifications",
        JSON.stringify(formData.notifications)
      );

      if (selectedImage) {
        formDataToSend.append("profileImage", selectedImage);
      }

      const response = await updateProfile(formDataToSend);

      console.log("✅ Profile updated:", response.data);
      if (response.data?.user?.profileImage) {
        setFormData((prev) => ({
          ...prev,
          profileImage: response.data.user.profileImage,
        }));
        setPreviewImage(null);
        setSelectedImage(null);
      } else if (response.data?.profileImage) {
        setFormData((prev) => ({
          ...prev,
          profileImage: response.data.profileImage,
        }));
        setPreviewImage(null);
      }
      setIsEditing(false);
      setHasChanges(false);
      setSuccessMessage("Profile updated successfully!");
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error("❌ Failed to update profile:", error);
      setFailureMessage("Failed to update profile. Please try again.");
      setIsFailureModalOpen(true);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      try {
        const response = await changePassword(passwordData);
        console.log("Password change response:", response);
        if (response.status === 200) {
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setSuccessMessage("Password changed successfully!");
          setIsSuccessModalOpen(true);
          setTimeout(() => {
            setIsPasswordModalOpen(false);
          }, 3000);
        } else {
          setFailureMessage(
            response.data.message || "Failed to change password."
          );
          setIsSuccessModalOpen(true);
        }
      } catch (error) {
        setFailureMessage("Failed to change password. Please try again.");
        setIsFailureModalOpen(true);
      }
    }
  };

  // Handle click outside of password modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        passwordModalRef.current &&
        !passwordModalRef.current.contains(event.target)
      ) {
        setIsPasswordModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close success modal after 3 seconds
  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => {
        setIsSuccessModalOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  useEffect(() => {
    if (isFailureModalOpen) {
      const timer = setTimeout(() => {
        setIsFailureModalOpen(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isFailureModalOpen]);

  useEffect(() => {
    // Fetch profile data from API
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getProfile();
        console.log("Profile API response:", response);
        if (response.data?.profileImage) {
          setFormData((prev) => ({
            ...prev,
            profileImage: response.data.profileImage,
          }));
        }
        setFormData({
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role,
          contactNumber: response.data.user.phone || "",
          faculty: response.data.facultyName || "",
          profileImage: response.data.user.profileImage || formData.profileImage,
          notifications: {
            emailNotifications: response.data.user.notifications.emailNotifications,
            newComplaints: response.data.user.notifications.newComplaints,
            statusUpdates: response.data.user.notifications.statusUpdates,
            weeklyReports: response.data.user.notifications.weeklyReports,
          },
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  if (!formData) {
    return <div className="text-center p-6">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative mb-12">
              <div className="absolute -left-20 top-1/2 transform -translate-y-1/2">
                <button
                  onClick={() => navigate(-1)} // navigate back one page
                  className="!rounded-button whitespace-nowrap flex items-center justify-center w-12 h-12 bg-white shadow-lg rounded-full text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                </button>
              </div>
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Your Profile
                </h1>
                <div className="w-20 h-1 bg-blue-600 mx-auto rounded-full mb-4"></div>
                <p className="text-gray-600">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
            {/* Profile Header */}
            <div className="bg-white shadow-lg rounded-2xl mb-8 overflow-hidden transform transition-all duration-300 hover:shadow-xl">
              <div
                className="relative h-48 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${DTC})`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/80 via-blue-500/80 to-indigo-600/80"></div>

                <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
                  <div className="relative h-40 w-40 rounded-full border-[6px] border-white bg-white shadow-xl overflow-hidden">
                    {/* Profile Image */}
                    {isLoading ? (
                      <Spinner />
                    ) : (
                      <div
                        className="relative h-full w-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            previewImage
                              ? previewImage
                              : formData?.profileImage
                              ? formData.profileImage.startsWith("data:")
                                ? formData.profileImage
                                : `http://localhost:5000${formData.profileImage}`
                              : DefaultBackground
                          })`,
                        }}
                      ></div>
                    )}
                    {/* Camera Overlay */}
                    {isEditing && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FontAwesomeIcon
                          icon={faCamera}
                          className="text-white text-2xl"
                        />
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-24 pb-8 px-6 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {formData.name}
                </h2>
                <p className="text-lg text-blue-600 font-medium mb-6">
                  {formData.role}
                </p>
                <button
                  onClick={toggleEditMode}
                  className="!rounded-button whitespace-nowrap inline-flex items-center px-6 py-3 bg-gray-50 border-2 border-gray-200 text-sm font-medium rounded-full text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 focus:outline-none cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <FontAwesomeIcon icon={faTimes} className="mr-2" />
                      Cancel Editing
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faEdit} className="mr-2" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Personal Information Card */}
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md text-sm mb-4 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                Some profile fields are locked. Contact your administrator to
                request changes.
              </div>

              <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Personal Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={(e) => {
                            handleInputChange(e);
                            const value = e.target.value;
                            if (!value.trim()) {
                              setErrors((prev) => ({
                                ...prev,
                                name: "Name is required",
                              }));
                            } else {
                              setErrors((prev) => ({ ...prev, name: "" }));
                            }
                          }}
                          disabled={!isEditing}
                          className={`border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-9 px-4 ${
                            !isEditing ? "bg-gray-50" : ""
                          }`}
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.name}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Email Address */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          disabled
                          className={`border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-9 px-4 `}
                        />
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>
                    {/* Role */}
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Role <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="role"
                          value={formData.role}
                          disabled
                          className={`border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-9 px-4 bg-gray-50`}
                        />
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>
                    {/* Contact Number */}
                    <div>
                      <label
                        htmlFor="contactNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="contactNumber"
                          name="contactNumber"
                          value={formData.contactNumber}
                          placeholder="012-3456789"
                          disabled
                          className={`border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-9 px-4 `}
                        />
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Format: xxx-xxxxxxx or xxx-xxxxxxxx
                      </p>
                    </div>
                    {/* Faculty */}
                    <div>
                      <label
                        htmlFor="faculty"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Faculty
                      </label>
                      <div className="relative">
                        <textarea
                          id="faculty"
                          name="faculty"
                          value={formData.faculty ?? ""}
                          disabled
                          className="bg-gray-50 border-gray-300 rounded-md shadow-sm block w-full sm:text-sm h-9 px-4 min-w-[300px] max-w-full "
                        />
                        <FontAwesomeIcon
                          icon={faLock}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Account Settings Card */}
              <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account Settings
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Password Section */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Password
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">
                          Password must be at least 8 characters and include a
                          mix of letters, numbers, and symbols
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openPasswordModal}
                        className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faKey} className="mr-2" />
                        Change Password
                      </button>
                    </div>
                  </div>
                  {/* Email Notifications */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      Email Notifications
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="emailNotifications"
                            name="emailNotifications"
                            type="checkbox"
                            checked={formData.notifications.emailNotifications}
                            onChange={handleNotificationChange}
                            disabled={!isEditing}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="emailNotifications"
                            className="font-medium text-gray-700"
                          >
                            Email Notifications
                          </label>
                          <p className="text-gray-500">
                            Receive email notifications for important updates
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Save Changes Button */}
              {isEditing && (
                <div className="flex justify-end space-x-4 mb-8">
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!hasChanges}
                    className={`!rounded-button whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none cursor-pointer ${
                      hasChanges
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-400 cursor-not-allowed"
                    }`}
                  >
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closePasswordModal}
              ></div>
            </div>
            <div
              ref={passwordModalRef}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <form onSubmit={handlePasswordSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Change Password
                    </h3>
                    <button
                      type="button"
                      onClick={closePasswordModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-12 px-4"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          <FontAwesomeIcon
                            icon={showCurrentPassword ? faEyeSlash : faEye}
                            className="text-gray-400 cursor-pointer"
                          />
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>
                    {/* New Password */}
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-12 px-4"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          <FontAwesomeIcon
                            icon={showNewPassword ? faEyeSlash : faEye}
                            className="text-gray-400 cursor-pointer"
                          />
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.newPassword}
                        </p>
                      )}
                    </div>
                    {/* Confirm Password */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm h-12 px-4"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          <FontAwesomeIcon
                            icon={showConfirmPassword ? faEyeSlash : faEye}
                            className="text-gray-400 cursor-pointer"
                          />
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="!rounded-button whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="!rounded-button whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Success Notification */}
      {isSuccessModalOpen && (
        <div className="fixed bottom-4 right-4 bg-green-50 border-l-4 border-green-400 p-4 shadow-md rounded-md z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-400"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="!rounded-button whitespace-nowrap inline-flex bg-green-50 text-green-500 rounded-md p-1.5 hover:bg-green-100 focus:outline-none cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFailureModalOpen && (
        <div className="fixed bottom-4 right-4 bg-red-50 border-l-4 border-red-400 p-4 shadow-md rounded-md z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon icon={faTimes} className="text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {failureMessage}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setIsFailureModalOpen(false)}
                  className="!rounded-button whitespace-nowrap inline-flex bg-red-50 text-red-500 rounded-md p-1.5 hover:bg-red-100 focus:outline-none cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
