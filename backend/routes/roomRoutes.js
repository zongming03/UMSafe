const express = require('express');
const router = express.Router();
const roomcontroller = require('../controllers/roomController');

router.get('/', roomcontroller.getAllRooms);
router.post('/', roomcontroller.addRoom);
router.patch('/:id', roomcontroller.editRoom);
router.delete('/:facultyId/:blockId/:roomId', roomcontroller.deleteRoom);

module.exports = router;