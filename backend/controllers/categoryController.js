import Category from "../models/Category.js";

//POST api/categories
export const addCategory = async (req, res) => {
  try {
    const { name, description, priority } = req.body;
    const newCategory = new Category({
      name: name.trim(),
      description: description.trim(),
      priority: priority.trim(), 
    });
    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ msg: "Category already exists" });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("[AddCategory] Error:", err);
    res.status(500).json({ msg: "Error creating category" });
  }
};

// GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch categories" });
  }
};

// PATCH /api/categories/:categoryId
export const updateCategory = async (req, res) => {
  try {
    const { name, description, priority } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { name, description, priority },
      { new: true }
    );
    return res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ msg: "Failed to update category" });
  }
};

// DELETE /api/categories/:categoryId
export const deleteCategory = async (req, res) => {
  try {
    console.log("Delete request for id:", req.params.categoryId);
    const deleted = await Category.findByIdAndDelete(req.params.categoryId);
    console.log("Deleted category:", deleted);
    return res.status(200).json({ msg: "Category deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ msg: "Failed to delete category" });
  }
};

// POST /api/categories/bulk-delete
export const bulkDeleteCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ msg: "Invalid categories array" });
    }

    await Category.deleteMany({ _id: { $in: categories } });
    return res.status(200).json({ msg: "Categories deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete categories" });
  }
};
