const { Reservation, Guest, Room, Billing, Housekeeping, User } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const moment = require('moment');

class ReportingController {

  // ─── Occupancy Report ────────────────────────────────────────────────────────
  async getOccupancyReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate || moment().startOf('month').format('YYYY-MM-DD');
      const end   = endDate   || moment().endOf('month').format('YYYY-MM-DD');

      const totalRooms = await Room.count({ where: { isActive: true } });

      // Count reservations per day in range
      const reservations = await Reservation.findAll({
        where: {
          status: { [Op.in]: ['checked_in', 'checked_out'] },
          checkInDate:  { [Op.lte]: end },
          checkOutDate: { [Op.gte]: start }
        },
        attributes: ['checkInDate', 'checkOutDate', 'roomId', 'totalAmount']
      });

      // Build daily occupancy map
      const days = {};
      let cursor = moment(start);
      const endMom = moment(end);
      while (cursor.isSameOrBefore(endMom, 'day')) {
        days[cursor.format('YYYY-MM-DD')] = { date: cursor.format('YYYY-MM-DD'), occupied: 0, revenue: 0 };
        cursor.add(1, 'day');
      }

      for (const r of reservations) {
        let d = moment(r.checkInDate);
        const checkOut = moment(r.checkOutDate);
        const nights = checkOut.diff(d, 'days') || 1;
        const dailyRate = parseFloat(r.totalAmount) / nights;
        while (d.isBefore(checkOut)) {
          const key = d.format('YYYY-MM-DD');
          if (days[key]) {
            days[key].occupied += 1;
            days[key].revenue  += dailyRate;
          }
          d.add(1, 'day');
        }
      }

      const dailyData = Object.values(days).map(d => ({
        ...d,
        revenue:         Math.round(d.revenue * 100) / 100,
        occupancyRate:   totalRooms > 0 ? Math.round((d.occupied / totalRooms) * 10000) / 100 : 0,
        revPAR:          totalRooms > 0 ? Math.round((d.revenue / totalRooms)  * 100) / 100 : 0
      }));

      const avgOccupancy = dailyData.length > 0
        ? Math.round(dailyData.reduce((s, d) => s + d.occupancyRate, 0) / dailyData.length * 100) / 100
        : 0;

      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          totalRooms,
          averageOccupancyRate: avgOccupancy,
          dailyOccupancy: dailyData
        }
      });
    } catch (error) {
      console.error('Occupancy report error:', error);
      res.status(500).json({ success: false, message: 'Server error while generating occupancy report' });
    }
  }

  // ─── Revenue Report ──────────────────────────────────────────────────────────
  async getRevenueReport(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      const start = startDate || moment().startOf('month').format('YYYY-MM-DD');
      const end   = endDate   || moment().endOf('month').format('YYYY-MM-DD');

      const invoices = await Billing.findAll({
        where: {
          issueDate: { [Op.between]: [start, end] },
          status: { [Op.in]: ['paid', 'partial', 'sent', 'overdue'] }
        },
        attributes: ['issueDate', 'totalAmount', 'amountPaid', 'taxes', 'discounts', 'paymentMethod', 'status'],
        order: [['issueDate', 'ASC']]
      });

      // Group data
      const groups = {};
      for (const inv of invoices) {
        let key;
        if (groupBy === 'month') {
          key = moment(inv.issueDate).format('YYYY-MM');
        } else if (groupBy === 'week') {
          key = moment(inv.issueDate).format('YYYY-[W]WW');
        } else {
          key = moment(inv.issueDate).format('YYYY-MM-DD');
        }

        if (!groups[key]) {
          groups[key] = { period: key, totalRevenue: 0, totalCollected: 0, totalTaxes: 0, totalDiscounts: 0, invoiceCount: 0 };
        }
        groups[key].totalRevenue    += parseFloat(inv.totalAmount) || 0;
        groups[key].totalCollected  += parseFloat(inv.amountPaid)  || 0;
        groups[key].totalTaxes      += parseFloat(inv.taxes)       || 0;
        groups[key].totalDiscounts  += parseFloat(inv.discounts)   || 0;
        groups[key].invoiceCount    += 1;
      }

      const revenueData = Object.values(groups).map(g => ({
        ...g,
        totalRevenue:   Math.round(g.totalRevenue   * 100) / 100,
        totalCollected: Math.round(g.totalCollected * 100) / 100,
        totalTaxes:     Math.round(g.totalTaxes     * 100) / 100,
        totalDiscounts: Math.round(g.totalDiscounts * 100) / 100
      }));

      const totals = revenueData.reduce((acc, g) => {
        acc.totalRevenue   += g.totalRevenue;
        acc.totalCollected += g.totalCollected;
        acc.totalTaxes     += g.totalTaxes;
        acc.totalDiscounts += g.totalDiscounts;
        acc.invoiceCount   += g.invoiceCount;
        return acc;
      }, { totalRevenue: 0, totalCollected: 0, totalTaxes: 0, totalDiscounts: 0, invoiceCount: 0 });

      // Payment method breakdown
      const byPaymentMethod = {};
      for (const inv of invoices) {
        if (inv.paymentMethod) {
          byPaymentMethod[inv.paymentMethod] = (byPaymentMethod[inv.paymentMethod] || 0) + (parseFloat(inv.amountPaid) || 0);
        }
      }

      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end, groupBy },
          summary: {
            totalRevenue:   Math.round(totals.totalRevenue   * 100) / 100,
            totalCollected: Math.round(totals.totalCollected * 100) / 100,
            totalTaxes:     Math.round(totals.totalTaxes     * 100) / 100,
            totalDiscounts: Math.round(totals.totalDiscounts * 100) / 100,
            invoiceCount:   totals.invoiceCount
          },
          byPaymentMethod,
          revenueData
        }
      });
    } catch (error) {
      console.error('Revenue report error:', error);
      res.status(500).json({ success: false, message: 'Server error while generating revenue report' });
    }
  }

  // ─── Guest Report ────────────────────────────────────────────────────────────
  async getGuestReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate || moment().startOf('month').format('YYYY-MM-DD');
      const end   = endDate   || moment().endOf('month').format('YYYY-MM-DD');

      // New guests in period
      const newGuests = await Guest.count({
        where: { createdAt: { [Op.between]: [moment(start).toDate(), moment(end).toDate()] } }
      });

      const totalGuests = await Guest.count();
      const vipGuests   = await Guest.count({ where: { guestType: 'vip' } });
      const returningGuests = await Guest.count({ where: { totalStays: { [Op.gte]: 2 } } });

      // Top guests by revenue
      const topGuests = await Guest.findAll({
        order: [['totalRevenue', 'DESC']],
        limit: 10,
        attributes: ['id', 'firstName', 'lastName', 'email', 'totalStays', 'totalRevenue', 'guestType', 'nationality']
      });

      // Nationality breakdown
      const nationalityData = await Guest.findAll({
        attributes: ['nationality', [fn('COUNT', col('id')), 'count']],
        where: { nationality: { [Op.ne]: null } },
        group: ['nationality'],
        order: [[literal('count'), 'DESC']],
        limit: 10,
        raw: true
      });

      // Reservations in period
      const reservationsInPeriod = await Reservation.count({
        where: {
          createdAt: { [Op.between]: [moment(start).toDate(), moment(end).toDate()] }
        }
      });

      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          summary: { totalGuests, newGuests, returningGuests, vipGuests, reservationsInPeriod },
          topGuestsByRevenue: topGuests,
          nationalityBreakdown: nationalityData
        }
      });
    } catch (error) {
      console.error('Guest report error:', error);
      res.status(500).json({ success: false, message: 'Server error while generating guest report' });
    }
  }

  // ─── Housekeeping Report ─────────────────────────────────────────────────────
  async getHousekeepingReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? moment(startDate).toDate() : moment().startOf('month').toDate();
      const end   = endDate   ? moment(endDate).toDate()   : moment().endOf('month').toDate();

      const tasks = await Housekeeping.findAll({
        where: { createdAt: { [Op.between]: [start, end] } },
        include: [
          { model: Room, as: 'room', attributes: ['id', 'roomNumber', 'roomType', 'floor'] },
          { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      const byStatus   = {};
      const byType     = {};
      const byPriority = {};
      const staffPerformance = {};

      for (const task of tasks) {
        byStatus[task.status]     = (byStatus[task.status]     || 0) + 1;
        byType[task.taskType]     = (byType[task.taskType]     || 0) + 1;
        byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

        if (task.assignee) {
          const name = task.assignee.firstName + ' ' + task.assignee.lastName;
          if (!staffPerformance[name]) {
            staffPerformance[name] = { assigned: 0, completed: 0 };
          }
          staffPerformance[name].assigned += 1;
          if (task.status === 'completed') staffPerformance[name].completed += 1;
        }
      }

      const completionRate = tasks.length > 0
        ? Math.round(((byStatus['completed'] || 0) / tasks.length) * 10000) / 100
        : 0;

      res.json({
        success: true,
        data: {
          period: { startDate: start, endDate: end },
          summary: {
            totalTasks: tasks.length,
            completionRate,
            byStatus,
            byType,
            byPriority
          },
          staffPerformance: Object.entries(staffPerformance).map(([name, s]) => ({
            name,
            assigned:        s.assigned,
            completed:       s.completed,
            completionRate:  s.assigned > 0 ? Math.round((s.completed / s.assigned) * 10000) / 100 : 0
          })).sort((a, b) => b.completed - a.completed)
        }
      });
    } catch (error) {
      console.error('Housekeeping report error:', error);
      res.status(500).json({ success: false, message: 'Server error while generating housekeeping report' });
    }
  }

  // ─── Executive Dashboard Summary ─────────────────────────────────────────────
  async getDashboardSummary(req, res) {
    try {
      const today     = moment().format('YYYY-MM-DD');
      const thisMonth = { [Op.between]: [moment().startOf('month').toDate(), moment().endOf('month').toDate()] };

      const [
        totalRooms, occupiedRooms, availableRooms, cleaningRooms,
        totalGuests, checkedInToday, checkOutsToday,
        monthlyRevenue, pendingInvoices, overdueInvoices,
        pendingHKTasks, recentReservations
      ] = await Promise.all([
        Room.count({ where: { isActive: true } }),
        Room.count({ where: { status: 'occupied' } }),
        Room.count({ where: { status: 'available' } }),
        Room.count({ where: { status: 'cleaning' } }),
        Guest.count({ where: { blacklisted: false } }),
        Reservation.count({ where: { checkInDate: today, status: 'checked_in' } }),
        Reservation.count({ where: { checkOutDate: today, status: 'checked_in' } }),
        Billing.findAll({
          where: { issueDate: thisMonth, status: { [Op.in]: ['paid', 'partial'] } },
          attributes: ['amountPaid']
        }),
        Billing.count({ where: { status: { [Op.in]: ['draft', 'sent', 'partial'] } } }),
        Billing.count({ where: { status: 'overdue' } }),
        Housekeeping.count({ where: { status: 'pending' } }),
        Reservation.findAll({
          order: [['createdAt', 'DESC']],
          limit: 5,
          include: [
            { model: Guest, as: 'guest', attributes: ['id', 'firstName', 'lastName'] },
            { model: Room,  as: 'room',  attributes: ['id', 'roomNumber', 'roomType'] }
          ]
        })
      ]);

      const monthlyRevenueTotal = monthlyRevenue.reduce((s, b) => s + (parseFloat(b.amountPaid) || 0), 0);
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 10000) / 100 : 0;

      res.json({
        success: true,
        data: {
          rooms:        { total: totalRooms, occupied: occupiedRooms, available: availableRooms, cleaning: cleaningRooms, occupancyRate },
          guests:       { total: totalGuests, checkedInToday, checkOutsToday },
          finance:      { monthlyRevenue: Math.round(monthlyRevenueTotal * 100) / 100, pendingInvoices, overdueInvoices },
          housekeeping: { pendingTasks: pendingHKTasks },
          recentReservations,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      res.status(500).json({ success: false, message: 'Server error while generating dashboard summary' });
    }
  }
}

module.exports = new ReportingController();
