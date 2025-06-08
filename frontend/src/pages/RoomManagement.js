import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import LoadingOverlay from "../components/LoadingOverlay";
import Pagination from "../components/Pagination";
import "../styles/RoomManagement.css";
import ErrorModal from "../components/ErrorModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrashAlt,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import SearchFilterSection from "../components/SearchFilterSection";
import {
  fetchRooms,
  addRoom,
  editRoom,
  deleteRoom,
  bulkDeleteRooms,
} from "../services/api";
import AddRoomModal from "../components/AddRoomModal";
import EditRoomModal from "../components/EditRoomModal";
import DeleteRoomModal from "../components/DeleteRoomModal";
import showNotification from "../utils/showNotification";

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
  const [error, setError] = useState(null);
  const [rooms, setRoom] = useState([]);
  const [newRoom, setNewRoom] = useState({
    building: "",
    roomName: "",
  });
  // Example: Assume you have user info from context, props, or API
  const userFacultyName =
    "Faculty of Computer Science and Information Technology"; // Replace with real user faculty

    
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
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRooms(filteredRooms.map((room) => room.id));
    } else {
      setSelectedRooms([]);
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
  const handleSelectRoom = (id) => {
    if (selectedRooms.includes(id)) {
      setSelectedRooms(selectedRooms.filter((roomId) => roomId !== id));
    } else {
      setSelectedRooms([...selectedRooms, id]);
    }
  };

  const handleAddRoom = () => {
    setIsAddRoomModalOpen(true);
  };
  
  const handleEditRoomClick = (room) => {
    console.log("Edit clicked:", room);
    setCurrentRoom(room);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setIsDeleteModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setCurrentRoom(null);
  };

  const closeAddRoomModal = () => {
    setIsAddRoomModalOpen(false);
    setNewRoom({
      building: "",
      roomName: "",
    });
  };

  const fetchAndSetRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetchRooms();
      const faculties = res.data;
      const userFaculty = faculties.find((fac) => fac.name === userFacultyName);
      if (!userFaculty) {
        setRoom([]);
        setIsLoading(false);
        return;
      }
      const allRooms = [];
      userFaculty.faculty_blocks.forEach((block) => {
        (block.faculty_block_rooms || []).forEach((room) => {
          allRooms.push({
            id: room.code,
            roomId: room._id,
            blockId: block._id,
            building: block.name,
            roomName: room.name,
          });
        });
      });
      setRoom(allRooms);
    } catch {
      setError("Failed to fetch rooms. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNewRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const facultyId = "6842ad78c4d2971c14fd13c1"; // 之后Replace with actual faculty ID
      const blockName = newRoom.building;
      const roomName = newRoom.roomName;

      if (!facultyId || !blockName || !roomName) {
        setError("Please fill in all fields.");
        setIsLoading(false);
        return;
      }

      await addRoom({ facultyId, blockName, roomName });
      await fetchAndSetRooms();
      closeAddRoomModal();
      showNotification("Room added successfully");
    } catch (err) {
      setError("Failed to add room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !currentRoom ||
      !currentRoom.roomName ||
      currentRoom.roomName.trim() === "" ||
      !currentRoom.building ||
      currentRoom.building.trim() === ""
    ) {
      setError("Block and Room name cannot be empty.");
      setIsLoading(false);
      return;
    }

    const facultyId = "6842ad78c4d2971c14fd13c1"; // 之后Replace with actual faculty ID if dynamic
    const blockId = currentRoom.blockId;
    const roomId = currentRoom.roomId;

    try {
      await editRoom(facultyId, blockId, roomId, {
        newBlockName: currentRoom.building,
        newRoomName: currentRoom.roomName,
      });

      await fetchAndSetRooms();
      setIsEditModalOpen(false);
      showNotification("Room updated successfully");
    } catch (err) {
      setError("Failed to update room. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRoomToDelete(null);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;
    setIsLoading(true);
    try {
      const facultyId = "6842ad78c4d2971c14fd13c1"; // 之后Replace with actual faculty ID 

      if (Array.isArray(roomToDelete)) {
        await bulkDeleteRooms(
          facultyId,
          roomToDelete.map((room) => ({
            blockId: room.blockId,
            roomId: room.roomId,
          }))
        );
        showNotification(`${roomToDelete.length} rooms deleted successfully`);
      } else {
        await deleteRoom(facultyId, roomToDelete.blockId, roomToDelete.roomId);
        showNotification("Room deleted successfully");
      }
      await fetchAndSetRooms();
      closeDeleteModal();
      setSelectedRooms([]);
    } catch (err) {
      setError("Failed to delete room(s). Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = (rooms) => {
    if (!rooms || rooms.length === 0) return;
    setRoomToDelete(rooms);
    setIsDeleteModalOpen(true);
  };

  useEffect(() => {
    fetchAndSetRooms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isLoading && <LoadingOverlay />}
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
              handleBulkDelete={() =>
                handleBulkDelete(
                  rooms.filter((room) => selectedRooms.includes(room.id))
                )
              }
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
                        onClick={() => handleSort("roomName")}
                      >
                        <div className="flex items-center">
                          Room Name {getSortIcon("roomName")}
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
                          <td className="px-1 py-4 whitespace-nowrap text-sm text-gray-900">
                            {room.roomName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-3">
                              <button
                                onClick={() => handleEditRoomClick(room)}
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
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={closeAddRoomModal}
        onSubmit={handleSubmitNewRoom}
        newRoom={newRoom}
        setNewRoom={setNewRoom}
      />
      <EditRoomModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
        onEdit={handleEditRoom}
      />
      <DeleteRoomModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        roomToDelete={roomToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
export default RoomManagement;
