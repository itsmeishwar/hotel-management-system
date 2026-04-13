const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { auth, authorize, checkPermission } = require('../middleware/auth');

// All billing routes require authentication
router.use(auth);

// ─── Invoice CRUD ──────────────────────────────────────────────────────────────
// GET  /api/v1/billing            — list / search invoices
// POST /api/v1/billing            — create invoice
// GET  /api/v1/billing/summary    — financial summary (must be before :id)
// GET  /api/v1/billing/overdue    — overdue invoices  (must be before :id)
// GET  /api/v1/billing/:id        — get single invoice
// PUT  /api/v1/billing/:id        — update invoice
// POST /api/v1/billing/:id/pay    — record a payment
// POST /api/v1/billing/:id/cancel — cancel invoice
// POST /api/v1/billing/:id/refund — process refund

router.get('/summary',  checkPermission('billing.read'),  billingController.getFinancialSummary);
router.get('/overdue',  checkPermission('billing.read'),  billingController.getOverdueInvoices);

router.get('/',         checkPermission('billing.read'),  billingController.getInvoices);
router.post('/',        checkPermission('billing.write'), billingController.createInvoice);

router.get('/:id',      checkPermission('billing.read'),  billingController.getInvoiceById);
router.put('/:id',      checkPermission('billing.write'), billingController.updateInvoice);

router.post('/:id/pay',    checkPermission('billing.write'),         billingController.recordPayment);
router.post('/:id/cancel', authorize('admin', 'management', 'front_desk'), billingController.cancelInvoice);
router.post('/:id/refund', authorize('admin', 'management'),         billingController.processRefund);

module.exports = router;
