import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronDown,
  faChevronUp,
  faTachometerAlt,
  faClipboardList,
  faChartBar,
  faUsers,
  faDoorOpen,
  faThLarge,
} from "@fortawesome/free-solid-svg-icons";

const CollapsibleMainMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: faTachometerAlt },
    { path: "/complaints", label: "Complaints", icon: faClipboardList },
    { path: "/analytics", label: "Analytics", icon: faChartBar },
    { path: "/categories", label: "Categories", icon: faThLarge },
    { path: "/users", label: "User Management", icon: faUsers },
    { path: "/rooms", label: "Room Management", icon: faDoorOpen },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const currentPage = menuItems.find((item) => item.path === location.pathname);

  return (
    <div className="relative" ref={menuRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
      >
        <FontAwesomeIcon icon={faBars} className="text-gray-600 w-5 h-5" />
        <span className="font-medium text-gray-700">
          {currentPage ? currentPage.label : "Menu"}
        </span>
        <FontAwesomeIcon
          icon={isOpen ? faChevronUp : faChevronDown}
          className="text-gray-500 w-4 h-4 ml-2"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600"
                    : "hover:bg-gray-50 text-gray-700 border-l-4 border-transparent"
                }`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`w-5 h-5 ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                />
                <span className={`font-medium ${isActive ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollapsibleMainMenu;
