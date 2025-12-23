import { useState, useEffect, useContext } from "react";
import LoadingOverlay from "../components/LoadingOverlay";
import Pagination from "../components/Pagination";
import "../styles/RoomManagement.css";
import ErrorModal from "../components/ErrorModal";
import { AuthContext } from "../context/AuthContext";
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
  const { user } = useContext(AuthContext);
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
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    building: "",
    roomName: "",
    latitude: "",
    longitude: "",
  });
  const [userFacultyName, setUserFacultyName] = useState("");
  const [userFacultyId, setUserFacultyId] = useState("");

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
      latitude: "",
      longitude: "",
    });
  };

  const getFacultyAbbreviation = (facultyName) => {
    return facultyName
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 0 &&
          word.toLowerCase() !== "of" &&
          word.toLowerCase() !== "and"
      )
      .map((word) => word[0].toUpperCase())
      .join("");
  };

  const fetchAndSetRooms = async () => {
    setIsLoading(true);
    try {
      const res = await fetchRooms(); 
      const faculties = res.data;
      
      const userFaculty = faculties.find((fac) => {
        const facultyId = fac._id?.toString() || fac._id;
        const userId = userFacultyId?.toString() || userFacultyId;
        return facultyId === userId;
      });

      if (!userFaculty) {

        setRooms([]);
        setIsLoading(false);
        return;
      }
            
      // Store the faculty name for display purposes
      setUserFacultyName(userFaculty.name);

      const allRooms = [];
      const facultyAbbreviation = getFacultyAbbreviation(userFaculty.name);

      let displayCounter = 1;
      
      // Check if faculty_blocks exists
      if (!userFaculty.faculty_blocks || userFaculty.faculty_blocks.length === 0) {
        console.warn("⚠️ No blocks found for this faculty");
        setRooms([]);
        setIsLoading(false);
        return;
      }

      userFaculty.faculty_blocks.forEach((block, blockIndex) => {
        const blockIdentifier = block._id || block.name;
        
        const rooms = block.faculty_block_rooms || [];
        
        rooms.forEach((room) => {
          allRooms.push({
            roomId: room._id,
            blockId: blockIdentifier,
            building: block.name,
            roomName: room.name,
            id: `${facultyAbbreviation}-${String(displayCounter).padStart(
              3,
              "0"
            )}`,
            latitude: room.latitude,
            longitude: room.longitude,
          });
          displayCounter++;
        });
      });
      
      setRooms(allRooms);
    } catch (err) {
      setError("Failed to fetch rooms. Please try again.");
      console.error("❌ Fetch Rooms Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNewRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const facultyId = userFacultyId; 
      const blockName = newRoom.building;
      const roomName = newRoom.roomName;
      const latitude = parseFloat(newRoom.latitude);
      const longitude = parseFloat(newRoom.longitude);

      if (!facultyId || !blockName || !roomName || isNaN(latitude) || isNaN(longitude)) {
        setError("Please fill in all fields with valid values.");
        setIsLoading(false);
        return;
      }

      const res = await addRoom({ facultyId, blockName, roomName, latitude, longitude });

      if (res && (res.status === 200 || res.status === 201)) {
        await fetchAndSetRooms();
        closeAddRoomModal();
        showNotification("Room added successfully");
      } 
    } catch (err) {
      console.error("Add Room Error:", err);
      setError(
        err.response?.data?.msg ||
          err.message ||
          "Failed to add room. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const latitude = parseFloat(currentRoom.latitude);
    const longitude = parseFloat(currentRoom.longitude);

    if (
      !currentRoom ||
      !currentRoom.roomName ||
      currentRoom.roomName.trim() === "" ||
      !currentRoom.building ||
      currentRoom.building.trim() === "" ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      setError("Block, Room name, Latitude, and Longitude are required and must be valid.");
      setIsLoading(false);
      return;
    }

    const facultyId = userFacultyId; 
    const blockId = currentRoom.blockId;
    const roomId = currentRoom.roomId;

    try {
      const res = await editRoom(facultyId, blockId, roomId, {
        newBlockName: currentRoom.building,
        newRoomName: currentRoom.roomName,
        latitude,
        longitude,
      });

      if (res && (res.status === 200 || res.status === 201)) {
        await fetchAndSetRooms();
        setIsEditModalOpen(false);
        showNotification("Room updated successfully");
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Edit Room Error:", err);
      setError(
        err.response?.data?.msg ||
          err.message ||
          "Failed to update room. Please try again."
      );
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
      const facultyId = userFacultyId; 

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

  // Extract facultyId from authenticated user
  useEffect(() => {
    if (user && user.facultyid) {
      console.log("🏫 User faculty ID:", user.facultyid);
      setUserFacultyId(user.facultyid);
    } else {
      console.warn("⚠️ User or facultyid not found in user object:", user);
    }
  }, [user]);

  useEffect(() => {
    if (userFacultyId) {
      fetchAndSetRooms();
    }
  }, [userFacultyId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isLoading && <LoadingOverlay />}
      <div>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6 ">
              <div className="room-header">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                      Room Management
                    </h1>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <a href="#" className="hover:text-blue-600">
                      Dashboard
                    </a>
                    <span className="mx-2">/</span>
                    <span>Room</span>
                  </div>
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("latitude")}
                      >
                        <div className="flex items-center">
                          Latitude {getSortIcon("latitude")}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("longitude")}
                      >
                        <div className="flex items-center">
                          Longitude {getSortIcon("longitude")}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {room.latitude || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {room.longitude || 'N/A'}
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
                          colSpan={7}
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
