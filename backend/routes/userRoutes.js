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

router.post("/", authMiddleware, authorizeRoles("admin", "superadmin"), addOfficer);
router.get("/", authMiddleware, authorizeRoles("admin", "superadmin"), getAllOfficers);
router.patch("/:id", authMiddleware, authorizeRoles("admin", "superadmin"), updateOfficer);
router.delete("/:id", authMiddleware, authorizeRoles("admin", "superadmin"), deleteOfficer);
router.post(
  "/bulk-delete",
  authMiddleware,
  authorizeRoles("admin", "superadmin"),
  bulkDeleteOfficer
);


export default router;
