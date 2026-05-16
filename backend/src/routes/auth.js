// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, googleLogin, forgotPassword, resetPassword, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', authMiddleware, updateProfile);
module.exports = router;
