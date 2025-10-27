import express from "express";
const router = express.Router();

import {
  addOfficer,
  getAllOfficers,
  updateOfficer,
  deleteOfficer,
  bulkDeleteOfficer,
} from "../controllers/userController.js";

import {
  authMiddleware,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

router.post("/", authMiddleware, authorizeRoles("admin"), addOfficer);
router.get("/", authMiddleware, authorizeRoles("admin"), getAllOfficers);
router.patch("/:id", authMiddleware, authorizeRoles("admin"), updateOfficer);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteOfficer);
router.post(
  "/bulk-delete",
  authMiddleware,
  authorizeRoles("admin"),
  bulkDeleteOfficer
);


export default router;
