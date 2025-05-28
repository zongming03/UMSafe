const Category = require('../models/Category');

//POST api/categories
exports.addCategory = async (req, res) => {
    try{
        const { name } = req.body;
        const existing = await Category.findOne({ name });
        if (existing) return res.status(400).json({ msg: 'Category already exists' });

        const category = new Category({ name });
        await category.save();
        res.status(201).json(category);
  } catch (err) {
        res.status(500).json({ msg: 'Error creating category' });
  }
};

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch categories' });
  }
};

// PATCH /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update category' });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete category' });
  }
};