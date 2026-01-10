import FacultyCategory from "../models/FacultyCategory.js";

// POST /api/faculty-categories - Add a category to a faculty
export const addCategoryToFaculty = async (req, res) => {
  try {
    const { facultyId, facultyName, name, description, priority } = req.body;

    if (!facultyId || !facultyName || !name || !description) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Check if FacultyCategory document exists for this faculty
    let facultyCategory = await FacultyCategory.findOne({ facultyId });

    if (!facultyCategory) {
      // Create new FacultyCategory document
      facultyCategory = new FacultyCategory({
        facultyId,
        facultyName,
        categories: [{
          name: name.trim(),
          description: description.trim(),
          priority: priority?.trim() || 'low',
        }],
      });
      await facultyCategory.save();
      return res.status(201).json(facultyCategory);
    }

    // Check if category name already exists in this faculty
    const categoryExists = facultyCategory.categories.some(
      cat => cat.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (categoryExists) {
      return res.status(400).json({ msg: "Category already exists in this faculty" });
    }

    // Add new category to existing faculty
    facultyCategory.categories.push({
      name: name.trim(),
      description: description.trim(),
      priority: priority?.trim() || 'low',
    });

    await facultyCategory.save();
    res.status(201).json(facultyCategory);
  } catch (err) {
    console.error("[AddCategoryToFaculty] Error:", err);
    res.status(500).json({ msg: "Error creating category" });
  }
};

// GET /api/faculty-categories/:facultyId - Get all categories for a faculty
export const getCategoriesByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const facultyCategory = await FacultyCategory.findOne({ facultyId });
    
    if (!facultyCategory) {
      return res.status(200).json([]);
    }

    res.status(200).json(facultyCategory.categories);
  } catch (err) {
    console.error("[GetCategoriesByFaculty] Error:", err);
    res.status(500).json({ msg: "Failed to fetch categories" });
  }
};

// GET /api/faculty-categories - Get all faculty categories (for admin)
export const getAllFacultyCategories = async (req, res) => {
  try {
    const facultyCategories = await FacultyCategory.find();
    res.status(200).json(facultyCategories);
  } catch (err) {
    console.error("[GetAllFacultyCategories] Error:", err);
    res.status(500).json({ msg: "Failed to fetch faculty categories" });
  }
};

// PATCH /api/faculty-categories/:facultyId/:categoryId - Update a category
export const updateCategoryInFaculty = async (req, res) => {
  try {
    const { facultyId, categoryId } = req.params;
    const { name, description, priority } = req.body;

    const facultyCategory = await FacultyCategory.findOne({ facultyId });

    if (!facultyCategory) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    const category = facultyCategory.categories.id(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    // Check if new name conflicts with another category in same faculty
    if (name && name !== category.name) {
      const nameExists = facultyCategory.categories.some(
        cat => cat._id.toString() !== categoryId && 
               cat.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (nameExists) {
        return res.status(400).json({ msg: "Category name already exists in this faculty" });
      }
    }

    // Update category fields
    if (name) category.name = name.trim();
    if (description) category.description = description.trim();
    if (priority) category.priority = priority.trim();

    await facultyCategory.save();
    res.status(200).json(category);
  } catch (err) {
    console.error("[UpdateCategoryInFaculty] Error:", err);
    res.status(500).json({ msg: "Failed to update category" });
  }
};

// DELETE /api/faculty-categories/:facultyId/:categoryId - Delete a category
export const deleteCategoryFromFaculty = async (req, res) => {
  try {
    const { facultyId, categoryId } = req.params;

    const facultyCategory = await FacultyCategory.findOne({ facultyId });

    if (!facultyCategory) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    const category = facultyCategory.categories.id(categoryId);

    if (!category) {
      return res.status(404).json({ msg: "Category not found" });
    }

    category.deleteOne();
    await facultyCategory.save();

    res.status(200).json({ msg: "Category deleted successfully" });
  } catch (err) {
    console.error("[DeleteCategoryFromFaculty] Error:", err);
    res.status(500).json({ msg: "Failed to delete category" });
  }
};

// POST /api/faculty-categories/:facultyId/bulk-delete - Bulk delete categories
export const bulkDeleteCategoriesFromFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ msg: "Invalid categoryIds array" });
    }

    const facultyCategory = await FacultyCategory.findOne({ facultyId });

    if (!facultyCategory) {
      return res.status(404).json({ msg: "Faculty not found" });
    }

    // Remove categories by filtering out the ones in categoryIds
    facultyCategory.categories = facultyCategory.categories.filter(
      cat => !categoryIds.includes(cat._id.toString())
    );

    await facultyCategory.save();
    res.status(200).json({ msg: "Categories deleted successfully" });
  } catch (err) {
    console.error("[BulkDeleteCategoriesFromFaculty] Error:", err);
    res.status(500).json({ msg: "Failed to delete categories" });
  }
};
