const express = require('express');
const router = express.Router();
const guestController = require('../controllers/guestController');
const { validate, schemas } = require('../middleware/validation');
const { auth, authorize, checkPermission } = require('../middleware/auth');

// All guest routes require authentication
router.use(auth);

// Guest management routes
router.get('/', checkPermission('guests.read'), guestController.getGuests);
router.get('/search', checkPermission('guests.read'), guestController.searchGuests);
router.get('/statistics', checkPermission('guests.read'), guestController.getGuestStatistics);
router.get('/:id', checkPermission('guests.read'), guestController.getGuestById);
router.post('/', checkPermission('guests.write'), validate(schemas.createGuest), guestController.createGuest);
router.put('/:id', checkPermission('guests.write'), validate(schemas.updateGuest), guestController.updateGuest);
router.delete('/:id', authorize('admin', 'management'), guestController.deleteGuest);

// Loyalty program routes
router.put('/:id/loyalty', checkPermission('guests.write'), guestController.updateLoyaltyProgram);

// Blacklist routes
router.put('/:id/blacklist', authorize('admin', 'management'), guestController.toggleBlacklist);

module.exports = router;