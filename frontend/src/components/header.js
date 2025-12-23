import React, { useState, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UMSafeLogo from "../assets/UMSafeLogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faChevronDown,
  faCog,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src={UMSafeLogo} alt="UMSafe Logo" className="h-14 w-auto" />
            <h1 className="ml-3 text-M font-semibold text-gray-800">UMSafe</h1>
          </div>

          {/* User Profile */}
          <div className="flex items-center">
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage.startsWith('http') ? user.profileImage : `${process.env.REACT_APP_API_URL}${user.profileImage}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <FontAwesomeIcon icon={faUserCircle} className={user?.profileImage ? 'hidden' : ''} />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user ? user.name : "Guest"}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-xs text-gray-500 transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FontAwesomeIcon icon={faCog} className="mr-2" />
                      Settings
                    </button>

                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        try {
                          await logout();
                          // Use hard redirect to avoid any router race
                          window.location.replace("/login");
                        } catch (err) {
                          console.error("Logout error:", err);
                          // Still redirect even if logout API fails
                          window.location.replace("/login");
                        }
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
