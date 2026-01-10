import express from "express";
import { getAllUsersForMobile, getUsersByFacultyForMobile, getUserDetailsById, getAllRoomsForMobile, getAllCategoriesForMobile} from "../controllers/mobileController.js";

const router = express.Router();

router.get("/users", getAllUsersForMobile);
router.get("/users/faculty/:facultyId", getUsersByFacultyForMobile);
router.get("/users/:id/details", getUserDetailsById);
router.get("/rooms", getAllRoomsForMobile);
router.get("/categories", getAllCategoriesForMobile);


export default router;
 