import "../styles/SearchFilterSection.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTrash } from "@fortawesome/free-solid-svg-icons";

const SearchFilterSection = ({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  handleBulkDelete,
  inputPlaceholder,
}) => (
  <div className="search-filter-section">
    <div className="search-filter-section-header">
      <div className="search-filter-flex">
        <div className="relative flex-grow">
          <input
            type="text"
            className="search-input"
            placeholder={inputPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
          </div>
        </div>
        <div className="flex space-x-2">
          {selectedCategories.length > 1 && (
            <div className="relative">
              <button
                onClick={handleBulkDelete}
                className="rounded-button whitespace-nowrap inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none cursor-pointer"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default SearchFilterSection;