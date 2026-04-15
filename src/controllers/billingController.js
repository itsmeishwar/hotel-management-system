// this is the billing controller file

const { Billing, Reservation, Guest, Room } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class BillingController {
  // ─── List / Search ──────────────────────────────────────────────────────────

  async getInvoices(req, res) {
    try {
      const {
        page = 1, limit = 20,
        status, guestId, reservationId,
        startDate, endDate, search
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const where = {};

      if (status) where.status = status;
      if (guestId) where.guestId = guestId;
      if (reservationId) where.reservationId = reservationId;

      if (startDate && endDate) {
        where.issueDate = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        where.issueDate = { [Op.gte]: startDate };
      } else if (endDate) {
        where.issueDate = { [Op.lte]: endDate };
      }

      if (search) {
        where.invoiceNumber = { [Op.like]: '%' + search + '%' };
      }

      const { count, rows } = await Billing.findAndCountAll({
        where,
        include: [
          {
            model: Guest,
            as: 'guest',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
          },
          {
            model: Reservation,
            as: 'reservation',
            attributes: ['id', 'confirmationNumber', 'checkInDate', 'checkOutDate']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching invoices' });
    }
  }

  // ─── Get single ─────────────────────────────────────────────────────────────

  async getInvoiceById(req, res) {
    try {
      const billing = await Billing.findByPk(req.params.id, {
        include: [
          {
            model: Guest,
            as: 'guest'
          },
          {
            model: Reservation,
            as: 'reservation',
            include: [
              { model: Room, as: 'room', attributes: ['id', 'roomNumber', 'roomType', 'floor'] }
            ]
          }
        ]
      });

      if (!billing) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      res.json({ success: true, data: billing });
    } catch (error) {
      console.error('Get invoice by id error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching invoice' });
    }
  }

  // ─── Create invoice ──────────────────────────────────────────────────────────

  async createInvoice(req, res) {
    try {
      const {
        reservationId, guestId, dueDate,
        items, roomCharges, additionalCharges,
        taxBreakdown, discounts, currency,
        paymentMethod, billingAddress, notes
      } = req.body;

      if (!reservationId || !guestId) {
        return res.status(400).json({
          success: false,
          message: 'reservationId and guestId are required'
        });
      }

      // Validate reservation exists
      const reservation = await Reservation.findByPk(reservationId);
      if (!reservation) {
        return res.status(404).json({ success: false, message: 'Reservation not found' });
      }

      // Calculate totals
      const subtotal = parseFloat(roomCharges && roomCharges.totalRoomCharge ? roomCharges.totalRoomCharge : reservation.totalAmount);
      const totalTaxes = taxBreakdown
        ? Object.values(taxBreakdown).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
        : 0;
      const totalDiscounts = parseFloat(discounts) || 0;
      const totalAmount = subtotal + totalTaxes - totalDiscounts;

      const invoiceNumber = 'INV-' + moment().format('YYYYMMDD') + '-' + Math.floor(Math.random() * 9000 + 1000);

      const billing = await Billing.create({
        invoiceNumber,
        reservationId,
        guestId,
        issueDate: new Date(),
        dueDate: dueDate || moment().add(1, 'day').toDate(),
        subtotal,
        taxes: totalTaxes,
        fees: 0,
        discounts: totalDiscounts,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        currency: currency || 'USD',
        paymentMethod: paymentMethod || null,
        items: items || [],
        roomCharges: roomCharges || {},
        additionalCharges: additionalCharges || {},
        taxBreakdown: taxBreakdown || {},
        billingAddress: billingAddress || null,
        notes: notes || null,
        status: 'draft',
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: billing
      });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({ success: false, message: 'Server error while creating invoice' });
    }
  }

  // ─── Update invoice ──────────────────────────────────────────────────────────

  async updateInvoice(req, res) {
    try {
      const billing = await Billing.findByPk(req.params.id);
      if (!billing) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      if (['paid', 'cancelled'].includes(billing.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a paid or cancelled invoice'
        });
      }

      await billing.update(req.body);

      res.json({ success: true, message: 'Invoice updated successfully', data: billing });
    } catch (error) {
      console.error('Update invoice error:', error);
      res.status(500).json({ success: false, message: 'Server error while updating invoice' });
    }
  }

  // ─── Record a payment ────────────────────────────────────────────────────────

  async recordPayment(req, res) {
    try {
      const { amount, paymentMethod, paymentDetails, notes } = req.body;
      const billing = await Billing.findByPk(req.params.id, {
        include: [{ model: Guest, as: 'guest', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      });

      if (!billing) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      if (billing.status === 'paid') {
        return res.status(400).json({ success: false, message: 'Invoice is already fully paid' });
      }

      if (billing.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Cannot record payment on a cancelled invoice' });
      }

      const paymentAmount = parseFloat(amount);
      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
      }

      const newAmountPaid = parseFloat(billing.amountPaid) + paymentAmount;
      const newBalance = parseFloat(billing.totalAmount) - newAmountPaid;

      let newStatus = 'partial';
      let paidDate = null;
      if (newBalance <= 0) {
        newStatus = 'paid';
        paidDate = new Date();
      }

      await billing.update({
        amountPaid: newAmountPaid,
        balance: Math.max(0, newBalance),
        status: newStatus,
        paidDate,
        paymentMethod: paymentMethod || billing.paymentMethod,
        paymentDetails: {
          ...(billing.paymentDetails || {}),
          ...(paymentDetails || {}),
          lastPayment: { amount: paymentAmount, date: new Date(), method: paymentMethod }
        },
        notes: notes ? ((billing.notes || '') + '\n' + notes).trim() : billing.notes,
        approvedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
          invoiceNumber: billing.invoiceNumber,
          totalAmount: billing.totalAmount,
          amountPaid: newAmountPaid,
          balance: Math.max(0, newBalance),
          status: newStatus
        }
      });
    } catch (error) {
      console.error('Record payment error:', error);
      res.status(500).json({ success: false, message: 'Server error while recording payment' });
    }
  }

  // ─── Cancel invoice ──────────────────────────────────────────────────────────

  async cancelInvoice(req, res) {
    try {
      const billing = await Billing.findByPk(req.params.id);
      if (!billing) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      if (billing.status === 'paid') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a paid invoice. Issue a refund instead.' });
      }

      await billing.update({ status: 'cancelled', notes: (billing.notes || '') + '\nCancelled by ' + req.user.id });

      res.json({ success: true, message: 'Invoice cancelled successfully', data: billing });
    } catch (error) {
      console.error('Cancel invoice error:', error);
      res.status(500).json({ success: false, message: 'Server error while cancelling invoice' });
    }
  }

  // ─── Process refund ──────────────────────────────────────────────────────────

  async processRefund(req, res) {
    try {
      const { amount, reason } = req.body;
      const billing = await Billing.findByPk(req.params.id);

      if (!billing) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      if (billing.status !== 'paid') {
        return res.status(400).json({ success: false, message: 'Only paid invoices can be refunded' });
      }

      const refundAmount = parseFloat(amount) || parseFloat(billing.amountPaid);

      await billing.update({
        status: 'refunded',
        amountPaid: parseFloat(billing.amountPaid) - refundAmount,
        balance: refundAmount,
        notes: ((billing.notes || '') + '\nRefund of ' + refundAmount + ': ' + (reason || 'No reason given')).trim(),
        approvedBy: req.user.id
      });

      res.json({ success: true, message: 'Refund processed successfully', data: billing });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({ success: false, message: 'Server error while processing refund' });
    }
  }

  // ─── Financial Summary ───────────────────────────────────────────────────────

  async getFinancialSummary(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const start = startDate ? moment(startDate).toDate() : moment().startOf('month').toDate();
      const end = endDate ? moment(endDate).toDate() : moment().endOf('month').toDate();

      const invoices = await Billing.findAll({
        where: { issueDate: { [Op.between]: [start, end] } }
      });

      const summary = {
        period: { start, end },
        totalInvoices: invoices.length,
        totalRevenue: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalDiscounts: 0,
        totalTaxes: 0,
        byStatus: { draft: 0, sent: 0, paid: 0, partial: 0, overdue: 0, cancelled: 0, refunded: 0 },
        byPaymentMethod: {}
      };

      for (const inv of invoices) {
        const total = parseFloat(inv.totalAmount) || 0;
        const paid = parseFloat(inv.amountPaid) || 0;

        summary.totalRevenue += total;
        summary.totalCollected += paid;
        summary.totalOutstanding += parseFloat(inv.balance) || 0;
        summary.totalDiscounts += parseFloat(inv.discounts) || 0;
        summary.totalTaxes += parseFloat(inv.taxes) || 0;

        summary.byStatus[inv.status] = (summary.byStatus[inv.status] || 0) + 1;

        if (inv.paymentMethod) {
          summary.byPaymentMethod[inv.paymentMethod] = (summary.byPaymentMethod[inv.paymentMethod] || 0) + paid;
        }
      }

      // Round for clean output
      for (const key of ['totalRevenue', 'totalCollected', 'totalOutstanding', 'totalDiscounts', 'totalTaxes']) {
        summary[key] = Math.round(summary[key] * 100) / 100;
      }

      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Get financial summary error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching financial summary' });
    }
  }

  // ─── Overdue invoices ────────────────────────────────────────────────────────

  async getOverdueInvoices(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');

      const overdue = await Billing.findAll({
        where: {
          dueDate: { [Op.lt]: today },
          status: { [Op.in]: ['sent', 'partial', 'draft'] }
        },
        include: [
          { model: Guest, as: 'guest', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'] }
        ],
        order: [['dueDate', 'ASC']]
      });

      // Mark them as overdue in DB
      await Billing.update(
        { status: 'overdue' },
        {
          where: {
            dueDate: { [Op.lt]: today },
            status: { [Op.in]: ['sent', 'partial', 'draft'] }
          }
        }
      );

      res.json({ success: true, data: overdue, count: overdue.length });
    } catch (error) {
      console.error('Get overdue invoices error:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching overdue invoices' });
    }
  }
}

module.exports = new BillingController();
