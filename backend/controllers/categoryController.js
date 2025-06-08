const Category = require('../models/Category');

//POST api/categories
export const addCategory = async (req, res) => {
    try{
        const { name,description } = req.body;
        const existing = await Category.findOne({ name });
        if (existing) return res.status(400).json({ msg: 'Category already exists' });

        const category = new Category({ name ,description});
        await category.save();
        res.status(201).json(category);
  } catch (err) {
        res.status(500).json({ msg: 'Error creating category' });
  }
};

// GET /api/categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch categories' });
  }
};

// PATCH /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update category' });
  }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete category' });
  }
};

// POST /api/categories/bulk-delete
export const bulkDeleteCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ msg: 'Invalid categories array' });
    }
    
    await Category.deleteMany({ _id: { $in: categories } });
    res.json({ msg: 'Categories deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete categories' });
  }
}
