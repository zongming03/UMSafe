import FacultyModel from "../models/Room.js";

// POST /api/rooms
export const addRoom = async (req, res) => {
  const { facultyId, blockName, roomName, latitude, longitude } = req.body;

  try {
    const faculty = await FacultyModel.findById(facultyId);
    if (!faculty) {
      console.log("Faculty not found:", facultyId);
      return res.status(404).json({ msg: "FacultyModel not found" });
    }

    let block = faculty.faculty_blocks.find((b) => b.name === blockName);

    if (block) {
      const existingRoom = block.faculty_block_rooms.find(
        (r) => r.name.toLowerCase() === roomName.toLowerCase() 
      );
      if (existingRoom) {
        console.log("Room already exists in this block:", roomName);
        return res
          .status(400)
          .json({ msg: `Room "${roomName}" already exists in ${blockName}.` });
      }
    }

    if (!block) {
      console.log("Block not found, creating new block:", blockName);
      faculty.faculty_blocks.push({
        name: blockName,
        faculty_block_rooms: [{ name: roomName, latitude, longitude }],
      });
    } else {
      // If block exists, just add the room
      block.faculty_block_rooms.push({ name: roomName, latitude, longitude });
      console.log("Room added to existing block:", roomName);
    }

    await faculty.save();
    res.status(201).json({ msg: "Room added", faculty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error adding room", error: err.message });
  }
};

// PATCH /api/rooms/:facultyId/:blockId/:roomId
export const editRoom = async (req, res) => {
  const { facultyId, blockId, roomId } = req.params;
  const { newBlockName, newRoomName } = req.body;

  console.log("[editRoom] PATCH called with:", {
    facultyId,
    blockId,
    roomId,
    newBlockName,
    newRoomName,
  });

  try {
    const faculty = await FacultyModel.findById(facultyId);
    if (!faculty) {
      console.log("[editRoom] Faculty not found:", facultyId);
      return res.status(404).json({ msg: "Faculty not found" });
    }

    const originalBlock = faculty.faculty_blocks.find(
      (b) => String(b._id) === String(blockId)
    );
    if (!originalBlock) {
      console.log("[editRoom] Original block not found:", blockId);
      return res.status(404).json({ msg: "Original block not found" });
    }

    const roomIndex = (originalBlock.faculty_block_rooms || []).findIndex(
      (r) => String(r._id) === String(roomId)
    );
    if (roomIndex === -1) {
      console.log("[editRoom] Room not found:", roomId);
      return res.status(404).json({ msg: "Room not found" });
    }

    const roomToUpdate = originalBlock.faculty_block_rooms[roomIndex];

    //  Updating room name within the same block
    if (originalBlock.name === newBlockName) {
      console.log("[editRoom] Updating room name in same block");
      const nameConflict = originalBlock.faculty_block_rooms.some(
        (r, idx) => idx !== roomIndex && r.name.toLowerCase() === newRoomName.toLowerCase()
      );
      if (nameConflict) {
        return res.status(400).json({ msg: `Room "${newRoomName}" already exists in ${newBlockName}.` });
      }
      roomToUpdate.name = newRoomName; 
    }
    else {
      console.log("[editRoom] Moving room to new block:", newBlockName);
      
      
      const [movedRoom] = originalBlock.faculty_block_rooms.splice(roomIndex, 1);
      
      let newBlock = faculty.faculty_blocks.find(
        (b) => b.name === newBlockName
      );

      // If the target block doesn't exist, create it
      if (!newBlock) {
        console.log("[editRoom] Creating new block:", newBlockName);
        faculty.faculty_blocks.push({
          name: newBlockName,
          faculty_block_rooms: [],
        });
        newBlock = faculty.faculty_blocks[faculty.faculty_blocks.length - 1]; 
        const nameConflict = newBlock.faculty_block_rooms.some(
          (r) => r.name.toLowerCase() === newRoomName.toLowerCase()
        );
        if (nameConflict) {
          originalBlock.faculty_block_rooms.splice(roomIndex, 0, movedRoom); 
          return res.status(400).json({ msg: `Room "${newRoomName}" already exists in ${newBlockName}.` });
        }
      }

      
      movedRoom.name = newRoomName;
      newBlock.faculty_block_rooms.push(movedRoom);
    }

    await faculty.save();
    console.log("[editRoom] Room updated successfully");
    res.json({ msg: "Room updated", faculty });
  } catch (err) {
    console.error("[editRoom] Error:", err);
    res.status(500).json({ msg: "Error editing room", error: err.message });
  }
};

// DELETE /api/rooms/:facultyId/:blockId/:roomId
export const deleteRoom = async (req, res) => {
  const { facultyId, blockId, roomId } = req.params;

  try {
    const faculty = await FacultyModel.findById(facultyId);
    if (!faculty) return res.status(404).json({ msg: "Faculty not found" });

    const block = faculty.faculty_blocks.id(blockId);
    if (!block) return res.status(404).json({ msg: "Block not found" });

    // Remove the room from the block
    block.faculty_block_rooms.pull(roomId);

    let blockRemoved = false;
    // If no rooms left in this block, remove the block as well
    if (!block.faculty_block_rooms || block.faculty_block_rooms.length === 0) {
      block.remove();
      blockRemoved = true;
    }

    await faculty.save();

    res.json({ msg: "Room deleted", blockRemoved });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting room", error: err.message });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const rooms = await FacultyModel.find();
    return res.status(200).json(rooms);
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Failed to fetch rooms", error: err.message });
  }
};

// GET /admin/rooms/faculty/:facultyId
export const getFacultyById = async (req, res) => {
  const { facultyId } = req.params;
  try {
    const faculty = await FacultyModel.findById(facultyId).select('name');
    if (!faculty) {
      return res.status(404).json({ msg: 'Faculty not found' });
    }
    return res.status(200).json({ id: facultyId, name: faculty.name });
  } catch (err) {
    return res.status(500).json({ msg: 'Error fetching faculty', error: err.message });
  }
};

export const bulkDeleteRooms = async (req, res) => {
  const { rooms, facultyId } = req.body; // rooms: [{ blockId, roomId }]
  try {
    const faculty = await FacultyModel.findById(facultyId);
    if (!faculty) return res.status(404).json({ msg: "Faculty not found" });

    // Track which blocks were modified to later check emptiness
    const touchedBlockIds = new Set();

    rooms.forEach(({ blockId, roomId }) => {
      const block = faculty.faculty_blocks.id(blockId);
      if (block) {
        block.faculty_block_rooms.pull(roomId);
        touchedBlockIds.add(String(blockId));
      }
    });

    // Remove any blocks that are now empty
    let blocksRemoved = 0;
    Array.from(touchedBlockIds).forEach((bId) => {
      const blk = faculty.faculty_blocks.id(bId);
      if (blk && (!blk.faculty_block_rooms || blk.faculty_block_rooms.length === 0)) {
        blk.remove();
        blocksRemoved += 1;
      }
    });

    await faculty.save();
    res.json({ msg: "Rooms deleted", blocksRemoved });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting rooms", error: err.message });
  }
};
