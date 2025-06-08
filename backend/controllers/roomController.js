import FacultyModel from "../models/Room.js";
import Counter from "../models/Counter.js";

function getAbbreviation(name) {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toLowerCase();
}

// POST /api/rooms
export const addRoom = async (req, res) => {
  const { facultyId, blockName, roomName } = req.body;

  try {
    const faculty = await FacultyModel.findById(facultyId);
    if (!faculty) {
      console.log("Faculty not found:", facultyId);
      return res.status(404).json({ msg: "FacultyModel not found" });
    }
    console.log("Faculty found:", faculty.name);
    const facultyCode = faculty.code || getAbbreviation(faculty.name);
    const counter = await Counter.findOneAndUpdate(
      { facultyCode },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const roomCode = `${facultyCode}-${String(counter.seq).padStart(3, "0")}`;

    let block = faculty.faculty_blocks.find((b) => b.name === blockName);
    if (block) {
      console.log("Block found:", block.name);
      const existingRoom = block.faculty_block_rooms.find(
        (r) => r.name === roomName
      );
      if (existingRoom) {
        console.log("Room already exists:", roomName);
        return res
          .status(400)
          .json({ msg: "Room already exists in this block" });
      }
    }

    if (!block) {
      console.log("Block not found, creating new block:", blockName);
      block = {
        name: blockName,
        faculty_block_rooms: [{ name: roomName }],
      };
      faculty.faculty_blocks.push(block);
    } else {
      block.faculty_block_rooms.push({ name: roomName, code: roomCode });
      console.log("Room added to block:", roomName);
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

    // If block name hasn't changed, just update the room name
    if (originalBlock.name === newBlockName) {
      console.log("[editRoom] Updating room name in same block");
      originalBlock.faculty_block_rooms[roomIndex].name = newRoomName;
    } else {
      // Remove the room from the original block if user changes the block also roomname
      console.log("[editRoom] Moving room to new block:", newBlockName);
      const [roomToMove] = originalBlock.faculty_block_rooms.splice(
        roomIndex,
        1
      );
      roomToMove.name = newRoomName;

      let newBlock = faculty.faculty_blocks.find(
        (b) => b.name === newBlockName
      );
      if (!newBlock) {
        console.log("[editRoom] Creating new block:", newBlockName);
        faculty.faculty_blocks.push({
          name: newBlockName,
          faculty_block_rooms: [],
        });
        newBlock = faculty.faculty_blocks[faculty.faculty_blocks.length - 1];
      }
      newBlock.faculty_block_rooms.push(roomToMove);
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
    const block = faculty.faculty_blocks.id(blockId);
    block.faculty_block_rooms.pull(roomId);
    await faculty.save();

    res.json({ msg: "Room deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting room", error: error.message });
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

export const bulkDeleteRooms = async (req, res) => {
  const { rooms, facultyId } = req.body; // rooms: [{ blockId, roomId }]
  try {
    const faculty = await FacultyModel.findById(facultyId);
    if (!faculty) return res.status(404).json({ msg: "Faculty not found" });

    rooms.forEach(({ blockId, roomId }) => {
      const block = faculty.faculty_blocks.id(blockId);
      if (block) {
        block.faculty_block_rooms.pull(roomId);
      }
    });

    await faculty.save();
    res.json({ msg: "Rooms deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting rooms", error: err.message });
  }
};
