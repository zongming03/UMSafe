const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Admin-only user management
// router.get('/', userController.getAllUsers);       
// router.post('/', userController.createUser);       
// router.patch('/:id', userController.updateUser);   
// router.delete('/:id', userController.deleteUser);  

module.exports = router;
