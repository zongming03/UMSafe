import express from 'express';
import {
addCategory,
getAllCategories,
updateCategory,
deleteCategory,
bulkDeleteCategories,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.post("/", addCategory);
router.patch('/:categoryId', updateCategory);
router.delete('/:categoryId',deleteCategory);
router.post('/bulk-delete', bulkDeleteCategories);

export default router;