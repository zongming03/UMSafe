import express from 'express';
import {
  addCategoryToFaculty,
  getCategoriesByFaculty,
  getAllFacultyCategories,
  updateCategoryInFaculty,
  deleteCategoryFromFaculty,
  bulkDeleteCategoriesFromFaculty,
} from "../controllers/facultyCategoryController.js";

const router = express.Router();

// Get all faculty categories (admin view)
router.get("/", getAllFacultyCategories);

// Get categories for a specific faculty
router.get("/:facultyId", getCategoriesByFaculty);

// Add a category to a faculty
router.post("/", addCategoryToFaculty);

// Update a category in a faculty
router.patch("/:facultyId/:categoryId", updateCategoryInFaculty);

// Delete a category from a faculty
router.delete("/:facultyId/:categoryId", deleteCategoryFromFaculty);

// Bulk delete categories from a faculty
router.post("/:facultyId/bulk-delete", bulkDeleteCategoriesFromFaculty);

export default router;
