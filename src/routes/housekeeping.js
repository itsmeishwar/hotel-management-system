const express = require('express');
const router = express.Router();
const housekeepingController = require('../controllers/housekeepingController');
const { auth, authorize, checkPermission } = require('../middleware/auth');

// All housekeeping routes require authentication
router.use(auth);

// Task management routes
router.get('/', checkPermission('housekeeping.read'), housekeepingController.getTasks);
router.get('/my-tasks', checkPermission('housekeeping.write'), housekeepingController.getMyTasks);
router.get('/dashboard', checkPermission('housekeeping.read'), housekeepingController.getDashboard);
router.get('/report', checkPermission('housekeeping.read'), housekeepingController.generateReport);
router.get('/:id', checkPermission('housekeeping.read'), housekeepingController.getTaskById);
router.post('/', checkPermission('housekeeping.write'), housekeepingController.createTask);
router.put('/:id', checkPermission('housekeeping.write'), housekeepingController.updateTask);
router.delete('/:id', authorize('admin', 'management'), housekeepingController.deleteTask);

// Task operations
router.post('/assign', checkPermission('housekeeping.write'), housekeepingController.assignTasks);
router.post('/:id/inspect', checkPermission('housekeeping.write'), housekeepingController.inspectTask);

module.exports = router;