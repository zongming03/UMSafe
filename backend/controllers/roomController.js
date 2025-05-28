const Faculty = require('../models/Room');

// POST /api/rooms
exports.addRoom = async (req, res) => {
  const { facultyId, blockName, roomName } = req.body;

  try {
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) return res.status(404).json({ msg: 'Faculty not found' });

    const block = faculty.faculty_blocks.find(b => b.name === blockName);
    if (!block) return res.status(404).json({ msg: 'Block not found' });

    block.faculty_block_rooms.push({ name: roomName });
    await faculty.save();

    res.status(201).json({ msg: 'Room added', faculty });
  } catch (err) {
    res.status(500).json({ msg: 'Error adding room' });
  }
};

// PATCH /api/rooms/:facultyId/:blockId/:roomId
exports.editRoom = async (req, res) => {
  const { facultyId, blockId, roomId } = req.params;
  const { newName } = req.body;

  try {
    const faculty = await Faculty.findById(facultyId);
    const block = faculty.faculty_blocks.id(blockId);
    const room = block.faculty_block_rooms.id(roomId);

    room.name = newName;
    await faculty.save();

    res.json({ msg: 'Room updated', room });
  } catch (err) {
    res.status(500).json({ msg: 'Error editing room' });
  }
};

// DELETE /api/rooms/:facultyId/:blockId/:roomId
exports.deleteRoom = async (req, res) => {
  const { facultyId, blockId, roomId } = req.params;

  try {
    const faculty = await Faculty.findById(facultyId);
    const block = faculty.faculty_blocks.id(blockId);
    block.faculty_block_rooms.pull(roomId);
    await faculty.save();

    res.json({ msg: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting room' });
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Faculty.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch rooms' });
  }
};
