import express from 'express';
import { handlelogin, requestPasswordReset, resetPassword, refreshToken, handleLogout, verifyEmail } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', handlelogin);
router.post('/logout', authMiddleware, handleLogout);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password/:token', resetPassword);
// Allow both POST and GET for verification links
router.post('/verify-email/:token', verifyEmail);
router.get('/verify-email/:token', verifyEmail);
router.post('/refresh', refreshToken);

// Fallback: catch /verify-email requests without /auth prefix and redirect
router.get('/verify-email', (req, res) => {
  res.status(400).json({
    error: 'Invalid verification link. Token is missing.',
    message: 'Please use the complete verification link from the email.'
  });
});

export default router;

