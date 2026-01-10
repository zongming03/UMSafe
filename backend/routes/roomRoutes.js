import express from "express";
const router = express.Router();
import {
  getAllRooms,
  addRoom,
  editRoom,
  deleteRoom,
  bulkDeleteRooms,
  getFacultyById,
} from "../controllers/roomController.js";

router.get("/", getAllRooms);
router.post("/", addRoom);
router.patch('/:facultyId/:blockId/:roomId', editRoom);
router.delete("/:facultyId/:blockId/:roomId",deleteRoom);
router.post('/bulk-delete', bulkDeleteRooms);
// Fetch a faculty name by ID
router.get('/faculty/:facultyId', getFacultyById);

export default router;
