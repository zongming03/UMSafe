import { useState } from "react";
import Footer from "../components/footer";
import Header from "../components/header";
import Sidebar from "../components/Sidebar";
import LoadingOverlay from "../components/LoadingOverlay";
import Pagination from "../components/Pagination";
import "../styles/RoomManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faEdit,
  faTrashAlt,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import SearchFilterSection from "../components/SearchFilterSection";
const RoomManagement = () => {
  const [activeTab, setActiveTab] = useState("rooms");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState(null);

  const [newRoom, setNewRoom] = useState({
    building: "",
    roomName: "",
  });
  const [rooms, setRoom] = useState([
    {
      id: "RM-1001",
      building: "Science Building",
      roomName: "S302",
    },
    {
      id: "RM-1002",
      building: "Engineering Block",
      roomNumber: "E105",
      roomName: "Computer Lab",
    },
    {
      id: "RM-1003",
      building: "Arts Building",
      roomName: "A201",
    },
    {
      id: "RM-1004",
      building: "Library",
      roomName: "L001",
    },
    {
      id: "RM-1005",
      building: "Business School",
      roomName: "B102",
    },
    {
      id: "RM-1006",
      building: "Science Building",
      roomName: "S105",
    },
    {
      id: "RM-1007",
      building: "Medical Center",
      roomName: "M001",
    },
    {
      id: "RM-1008",
      building: "Sports Complex",
      roomName: "SP01",
    },
    {
      id: "RM-1009",
      building: "Engineering Block",
      roomName: "E205",
    },
    {
      id: "RM-1010",
      building: "Arts Building",
      roomName: "A105",
    },
    {
      id: "RM-1011",
      building: "Library",
      roomName: "L102",
    },
    {
      id: "RM-1012",
      building: "Business School",
      roomName: "B205",
    },
  ]);

  const sortedRooms = [...rooms].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (typeof aValue === "string" && typeof bValue === "string") {
      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "ascending"
        ? aValue - bValue
        : bValue - aValue;
    }
    return 0;
  });

  const filteredRooms = sortedRooms.filter(
    (room) =>
      room.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <FontAwesomeIcon
          icon={faSort}
          className="text-gray-300 ml-1"
        ></FontAwesomeIcon>
      );
    }
    return sortConfig.direction === "ascending" ? (
      <FontAwesomeIcon
        icon={faSortUp}
        className="text-blue-500 ml-1"
      ></FontAwesomeIcon>
    ) : (
      <FontAwesomeIcon
        icon={faSortDown}
        className="text-blue-500 ml-1"
      ></FontAwesomeIcon>
    );
  };

  const handleRoomClick = (room) => {
    setCurrentRoom(room);
    setIsEditModalOpen(true);
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRooms(filteredRooms.map((room) => room.id));
    } else {
      setSelectedRooms([]);
    }
  };
  const handleSelectRoom = (id) => {
    if (selectedRooms.includes(id)) {
      setSelectedRooms(selectedRooms.filter((roomId) => roomId !== id));
    } else {
      setSelectedRooms([...selectedRooms, id]);
    }
  };
  const handleSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setCurrentRoom(null);
  };
  const handleAddRoom = () => {
    setIsAddRoomModalOpen(true);
  };
  const closeAddRoomModal = () => {
    setIsAddRoomModalOpen(false);
    setNewRoom({
      building: "",
      roomNumber: "",
      capacity: "",
      roomType: "Lecture Hall",
      facilities: [],
      status: "Available",
    });
  };

  const handleSubmitNewRoom = (e) => {
    e.preventDefault();
    // Here you would typically save the new room to your database
    console.log("New room data:", newRoom);
    closeAddRoomModal();
    showNotification("Rooms added successfully");
  };
  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoomToDelete(null);
  };
  const confirmDelete = () => {
    // Here you would typically delete the room from your database
    console.log("Deleting room:", roomToDelete);
    closeDeleteModal();
    showNotification("Rooms deleted successfully");
  };

  const handleEditRoom = () => {
    if (
      !currentRoom ||
      !currentRoom.roomNumber ||
      currentRoom.roomNumber.trim() === ""
    )
      return;
    setRoom(
      rooms.map((room) => (room.id === currentRoom.id ? currentRoom : room))
    );
    setIsEditModalOpen(false);
    showNotification("Rooms updated successfully");
  };

  const handleBulkDelete = () => {
    if (selectedRooms.length === 0) return;
    setRoom(rooms.filter((rooms) => !selectedRooms.includes(rooms.id)));
    setSelectedRooms([]);
    showNotification(`${selectedRooms.length} categories deleted successfully`);
  };

  const showNotification = (message) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-50 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center";
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isLoading && <LoadingOverlay />}
      {isEditModalOpen && currentRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closeModal}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Room Details
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div>
                    <label
                      htmlFor="building"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Blocks
                    </label>
                    <input
                      type="text"
                      id="building"
                      value={currentRoom.building || ""}
                      onChange={(e) =>
                        setCurrentRoom({
                          ...currentRoom,
                          building: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="roomNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Room Name
                    </label>
                    <input
                      type="text"
                      id="roomName"
                      value={currentRoom.roomNumber}
                      onChange={(e) =>
                        setCurrentRoom({
                          ...currentRoom,
                          roomName: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleEditRoom}
                  className=" whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  Update
                </button>
                <button
                  type="button"
                  className=" whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm cursor-pointer"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closeAddRoomModal}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmitNewRoom}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add New Room
                    </h3>
                    <button
                      type="button"
                      onClick={closeAddRoomModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="building"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Blocks
                        </label>
                        <input
                          type="text"
                          id="building"
                          value={newRoom.building}
                          onChange={(e) =>
                            setNewRoom({ ...newRoom, building: e.target.value })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="roomNumber"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Room Name
                        </label>
                        <input
                          type="text"
                          id="roomNumber"
                          value={newRoom.roomNumber}
                          onChange={(e) =>
                            setNewRoom({
                              ...newRoom,
                              roomNumber: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className=" whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                  >
                    Add Room
                  </button>
                  <button
                    type="button"
                    onClick={closeAddRoomModal}
                    className=" whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && roomToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={closeDeleteModal}
              ></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <i className="fas fa-exclamation-triangle text-red-600"></i>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Are you sure you want to delete this room?
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Room ID: {roomToDelete.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Building: {roomToDelete.building}
                      </p>
                      <p className="text-sm text-gray-500">
                        Room Number: {roomToDelete.roomNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className=" whitespace-nowrap w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                  onClick={confirmDelete}
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  className=" whitespace-nowrap mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white  font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm cursor-pointer"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Room Management
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage and track all rooms in the university -{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={handleAddRoom}
                  className="whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add New Room
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <SearchFilterSection
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategories={selectedRooms}
              handleBulkDelete={handleBulkDelete}
              inputPlaceholder="Search Room by ID, Building, or Room Number..."
            />

            {/* Rooms Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className=""
                            onChange={handleSelectAll}
                            checked={
                              selectedRooms.length === filteredRooms.length &&
                              filteredRooms.length > 0
                            }
                          />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("id")}
                      >
                        <div className="flex items-center">
                          ID {getSortIcon("id")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("building")}
                      >
                        <div className="flex items-center">
                          Blocks {getSortIcon("building")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className=" text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("roomNumber")}
                      >
                        <div className="flex items-center">
                          Room Name {getSortIcon("roomNumber")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedRooms.length > 0 ? (
                      paginatedRooms.map((room) => (
                        <tr key={room.id} className="hover:bg-blue-50">
                          <td className="px-3 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4  rounded"
                                checked={selectedRooms.includes(room.id)}
                                onChange={() => handleSelectRoom(room.id)}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer">
                            {room.id}
                          </td>
                          <td className="px-7 py-4 text-sm text-gray-900">
                            {room.building}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {room.roomNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => handleRoomClick(room)}
                                className="  text-blue-600 hover:text-blue-900 cursor-pointer p-1.5"
                                title="Edit"
                              >
                                <FontAwesomeIcon
                                  icon={faEdit}
                                ></FontAwesomeIcon>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(room)}
                                className="  text-red-600 hover:text-red-900 cursor-pointer p-1.5"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          <FontAwesomeIcon
                            icon={faSearch}
                            className="text-gray-400 text-3xl mb-3"
                          ></FontAwesomeIcon>
                          <p>No rooms added to Room Management.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {filteredRooms.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredRooms.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};
export default RoomManagement;
