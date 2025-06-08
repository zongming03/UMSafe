const express = require('express');
const router = express.Router();
import {
addCategory,
getAllCategories,
updateCategory,
deleteCategory,
bulkDeleteCategories,
} from "../controllers/categoryController.js";

router.get("/", getAllCategories);
router.post("/", addCategory);
router.patch('/:categoryId', updateCategory);
router.delete("/:categoryId",deleteCategory);
router.post('/bulk-delete', bulkDeleteCategories);

export default router;