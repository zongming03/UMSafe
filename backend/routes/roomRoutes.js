import express from "express";
const router = express.Router();
import {
  getAllRooms,
  addRoom,
  editRoom,
  deleteRoom,
  bulkDeleteRooms
} from "../controllers/roomController.js";

router.get("/", getAllRooms);
router.post("/", addRoom);
router.patch('/:facultyId/:blockId/:roomId', editRoom);
router.delete("/:facultyId/:blockId/:roomId",deleteRoom);
router.post('/bulk-delete', bulkDeleteRooms);

export default router;
