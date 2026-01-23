const express = require('express');
const router = express.Router();
const frontDeskController = require('../controllers/frontDeskController');
const { auth, authorize, checkPermission } = require('../middleware/auth');

// All front desk routes require authentication
router.use(auth);

// Front desk dashboard
router.get('/dashboard', checkPermission('checkin'), frontDeskController.getDashboard);

// Quick operations
router.post('/quick-checkin', checkPermission('checkin'), frontDeskController.quickCheckIn);
router.post('/quick-checkout', checkPermission('checkout'), frontDeskController.quickCheckOut);
router.post('/walk-in', checkPermission('reservations.write'), frontDeskController.processWalkIn);

// Guest search for front desk
router.get('/search-guests', checkPermission('guests.read'), frontDeskController.searchGuestsQuick);

// Email communications
router.post('/reservations/:id/checkin-email', checkPermission('checkin'), frontDeskController.sendCheckInEmail);

module.exports = router;