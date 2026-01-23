const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { validate, schemas } = require('../middleware/validation');
const { auth, authorize, checkPermission } = require('../middleware/auth');

// All reservation routes require authentication
router.use(auth);

// Reservation management routes
router.get('/', checkPermission('reservations.read'), reservationController.getReservations);
router.get('/availability', checkPermission('reservations.read'), reservationController.getRoomAvailability);
router.get('/statistics', checkPermission('reservations.read'), reservationController.getReservationStatistics);
router.get('/:id', checkPermission('reservations.read'), reservationController.getReservationById);
router.post('/', checkPermission('reservations.write'), validate(schemas.createReservation), reservationController.createReservation);
router.put('/:id', checkPermission('reservations.write'), validate(schemas.updateReservation), reservationController.updateReservation);
router.delete('/:id', authorize('admin', 'management'), reservationController.cancelReservation);

// Check-in/Check-out routes
router.post('/:id/checkin', checkPermission('checkin'), reservationController.checkIn);
router.post('/:id/checkout', checkPermission('checkout'), reservationController.checkOut);
router.post('/:id/cancel', checkPermission('reservations.write'), reservationController.cancelReservation);

module.exports = router;