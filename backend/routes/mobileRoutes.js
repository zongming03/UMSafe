import express from "express";
import { getAllUsersForMobile,getAllRoomsForMobile,getAllCategoriesForMobile} from "../controllers/mobileController.js";

const router = express.Router();

router.get("/users", getAllUsersForMobile);
router.get("/rooms", getAllRoomsForMobile);
router.get("/categories", getAllCategoriesForMobile);


export default router;
 