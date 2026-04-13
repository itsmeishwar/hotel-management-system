const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const { auth, authorize } = require('../middleware/auth');

// All reporting routes require authentication + management/admin role
router.use(auth);
router.use(authorize('admin', 'management', 'front_desk'));

// ─── Report endpoints ──────────────────────────────────────────────────────────
// GET /api/v1/reports/dashboard    — executive KPI dashboard
// GET /api/v1/reports/occupancy    — daily occupancy & RevPAR
// GET /api/v1/reports/revenue      — revenue grouped by day/week/month
// GET /api/v1/reports/guests       — guest statistics
// GET /api/v1/reports/housekeeping — housekeeping performance

router.get('/dashboard',    reportingController.getDashboardSummary);
router.get('/occupancy',    reportingController.getOccupancyReport);
router.get('/revenue',      reportingController.getRevenueReport);
router.get('/guests',       reportingController.getGuestReport);
router.get('/housekeeping', reportingController.getHousekeepingReport);

module.exports = router;
