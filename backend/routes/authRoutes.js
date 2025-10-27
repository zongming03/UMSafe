import express from 'express';
import { handlelogin } from '../controllers/authController.js';
import { requestPasswordReset, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', handlelogin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);

export default router;

