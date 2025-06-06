import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faClipboardList,
  faChartBar,
  faUsers,
  faDoorOpen,
  faCog,
  faThLarge
} from "@fortawesome/free-solid-svg-icons";

import "../styles/Sidebar.css"; 


const Sidebar = ({ activeTab, setActiveTab,userRole }) => (
  <aside className="side-bar-container">
    <nav className="mt-5 px-2">
      <div className="space-y-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`sidebar-btn ${
            activeTab === "dashboard"
              ? "bg-blue-100 text-blue-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FontAwesomeIcon
            icon={faTachometerAlt}
            className={`mr-3 text-lg ${
              activeTab === "dashboard"
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-500"
            }`}
          />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          className={`sidebar-btn ${
            activeTab === "complaints"
              ? "bg-blue-100 text-blue-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FontAwesomeIcon
            icon={faClipboardList}
            className={`mr-3 text-lg ${
              activeTab === "complaints"
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-500"
            }`}
          />
          Complaints
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`sidebar-btn ${
            activeTab === "categories"
              ? "bg-blue-100 text-blue-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FontAwesomeIcon
            icon={faThLarge}
            className={`mr-3 text-lg ${
              activeTab === "categories"
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-500"
            }`}
          />
          Categories
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`!rounded-button whitespace-nowrap group w-full flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
            activeTab === "analytics"
              ? "bg-blue-100 text-blue-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FontAwesomeIcon
            icon={faChartBar}
            className={`mr-3 text-lg ${
              activeTab === "analytics"
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-500"
            }`}
          />
          Analytics
        </button>
        {userRole === "Admin" && (
          <button
            onClick={() => setActiveTab("users")}
            className={`sidebar-btn ${
              activeTab === "users"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={faUsers}
              className={`mr-3 text-lg ${
                activeTab === "users"
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            Users
          </button>
        )}
        <button
          onClick={() => setActiveTab("rooms")}
          className={`sidebar-btn ${
            activeTab === "rooms"
              ? "bg-blue-100 text-blue-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FontAwesomeIcon
            icon={faDoorOpen}
            className={`mr-3 text-lg ${
              activeTab === "rooms"
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-500"
            }`}
          />
          Room Management
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`sidebar-btn ${
            activeTab === "settings"
              ? "bg-blue-100 text-blue-800"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FontAwesomeIcon
            icon={faCog}
            className={`mr-3 text-lg ${
              activeTab === "settings"
                ? "text-blue-600"
                : "text-gray-400 group-hover:text-gray-500"
            }`}
          />
          Settings
        </button>
      </div>
    </nav>
  </aside>
);

export default Sidebar;