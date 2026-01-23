const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { validate, schemas } = require('../middleware/validation');
const { auth, authorize, checkPermission } = require('../middleware/auth');

// All room routes require authentication
router.use(auth);

// Room management routes
router.get('/', checkPermission('rooms.read'), roomController.getRooms);
router.get('/search', checkPermission('rooms.read'), roomController.searchRooms);
router.get('/statistics', checkPermission('rooms.read'), roomController.getRoomStatistics);
router.get('/floor-overview', checkPermission('rooms.read'), roomController.getFloorOverview);
router.get('/:id', checkPermission('rooms.read'), roomController.getRoomById);
router.post('/', authorize('admin', 'management'), validate(schemas.createRoom), roomController.createRoom);
router.put('/:id', authorize('admin', 'management'), validate(schemas.updateRoom), roomController.updateRoom);
router.delete('/:id', authorize('admin', 'management'), roomController.deleteRoom);

// Room status routes
router.put('/:id/status', checkPermission('rooms.write'), roomController.updateRoomStatus);
router.put('/:id/housekeeping-status', checkPermission('housekeeping.write'), roomController.updateHousekeepingStatus);

module.exports = router;