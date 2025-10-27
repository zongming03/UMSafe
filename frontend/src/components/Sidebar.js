import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faClipboardList,
  faChartBar,
  faUsers,
  faDoorOpen,
  faCog,
  faThLarge,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  
  const currentPath = location.pathname;

  return (
    <aside className="side-bar-container">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className={`sidebar-btn ${
              currentPath === "/dashboard"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={faTachometerAlt}
              className={`mr-3 text-lg ${
                currentPath === "/dashboard"
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            Dashboard
          </button>

          <button
            onClick={() => navigate("/complaints")}
            className={`sidebar-btn ${
              currentPath === "/complaints"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={faClipboardList}
              className={`mr-3 text-lg ${
                currentPath === "/complaints"
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            Complaints
          </button>

          <button
            onClick={() => navigate("/analytics")}
            className={`sidebar-btn ${
              currentPath === "/analytics"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={faChartBar}
              className={`mr-3 text-lg ${
                currentPath === "/analytics"
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            Analytics
          </button>

          <button
            onClick={() => navigate("/categories")}
            className={`sidebar-btn ${
              currentPath === "/categories"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={faThLarge}
              className={`mr-3 text-lg ${
                currentPath === "/categories"
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            Categories
          </button>

          {userRole === "admin" && (
            <button
              onClick={() => navigate("/users")}
              className={`sidebar-btn ${
                currentPath === "/users"
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <FontAwesomeIcon
                icon={faUsers}
                className={`mr-3 text-lg ${
                  currentPath === "/users"
                    ? "text-blue-600"
                    : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            User Management
          </button>
          )}

          <button
            onClick={() => navigate("/rooms")}
            className={`sidebar-btn ${
              currentPath === "/rooms"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <FontAwesomeIcon
              icon={faDoorOpen}
              className={`mr-3 text-lg ${
                currentPath === "/rooms"
                  ? "text-blue-600"
                  : "text-gray-400 group-hover:text-gray-500"
              }`}
            />
            Room Management
          </button>

        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
