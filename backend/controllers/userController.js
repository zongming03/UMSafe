const User = require('../models/User');
const bcrypt = require('bcryptjs');

// POST /api/users
exports.addOfficer = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, hashed_password: hashed, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ msg: 'Error adding officer' });
  }
};

// GET /api/users
exports.getAllOfficers = async (req, res) => {
  try {
    const users = await User.find({ role: 'officer' });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching officers' });
  }
};

// DELETE /api/users/:id
exports.deleteOfficer = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Officer deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete officer' });
  }
};
