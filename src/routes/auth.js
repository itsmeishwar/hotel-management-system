const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/login', validate(schemas.login), authController.login);
router.post('/register', validate(schemas.register), authController.register);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.use(auth); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.put('/change-password', authController.changePassword);
router.post('/logout', authController.logout);

module.exports = router;