import express from 'express';
import { handlelogin, requestPasswordReset, resetPassword, refreshToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', handlelogin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);
router.post('/refresh', refreshToken);

export default router;

