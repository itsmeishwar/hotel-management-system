const { Reservation, Guest, Room, Billing, Housekeeping } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const nodemailer = require('nodemailer');

class FrontDeskController {
  // Get dashboard data for front desk
  async getDashboard(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');
      
      // Today's check-ins
      const todayCheckIns = await Reservation.findAll({
        where: {
          checkInDate: today,
          status: 'confirmed'
        },
        include: [
          {
            model: Guest,
            as: 'guest',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
          },
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          }
        ],
        order: [['createdAt', 'ASC']]
      });
      
      // Today's check-outs
      const todayCheckOuts = await Reservation.findAll({
        where: {
          checkOutDate: today,
          status: 'checked_in'
        },
        include: [
          {
            model: Guest,
            as: 'guest',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
          },
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          }
        ],
        order: [['createdAt', 'ASC']]
      });
      
      // Tomorrow's check-ins
      const tomorrowCheckIns = await Reservation.findAll({
        where: {
          checkInDate: tomorrow,
          status: 'confirmed'
        },
        include: [
          {
            model: Guest,
            as: 'guest',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
          },
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          }
        ],
        order: [['createdAt', 'ASC']]
      });
      
      // Available rooms
      const availableRooms = await Room.findAll({
        where: {
          status: 'available',
          isActive: true
        },
        order: [['roomNumber', 'ASC']],
        limit: 10
      });
      
      // Pending tasks (housekeeping, maintenance)
      const pendingTasks = await Housekeeping.findAll({
        where: {
          status: 'pending',
          priority: ['high', 'urgent']
        },
        include: [
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType']
          }
        ],
        order: [['priority', 'DESC'], ['scheduledDate', 'ASC']],
        limit: 10
      });
      
      // Recent activities
      const recentActivities = await Reservation.findAll({
        where: {
          updatedAt: { [Op.gte]: moment().subtract(24, 'hours').toDate() }
        },
        include: [
          {
            model: Guest,
            as: 'guest',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 10
      });
      
      // Statistics
      const stats = {
        totalGuests: await Guest.count({ where: { blacklisted: false } }),
        occupiedRooms: await Room.count({ where: { status: 'occupied' } }),
        availableRooms: await Room.count({ where: { status: 'available' } }),
        totalReservations: await Reservation.count({ where: { status: ['confirmed', 'checked_in'] } }),
        todayCheckIns: todayCheckIns.length,
        todayCheckOuts: todayCheckOuts.length
      };
      
      res.json({
        success: true,
        data: {
          stats,
          todayCheckIns,
          todayCheckOuts,
          tomorrowCheckIns,
          availableRooms,
          pendingTasks,
          recentActivities
        }
      });
    } catch (error) {
      console.error('Get front desk dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching dashboard data'
      });
    }
  }
  
  // Quick check-in (with minimal validation for speed)
  async quickCheckIn(req, res) {
    try {
      const { reservationId, paymentMethod, amountPaid } = req.body;
      
      const reservation = await Reservation.findByPk(reservationId, {
        include: [
          {
            model: Guest,
            as: 'guest'
          },
          {
            model: Room,
            as: 'room'
          }
        ]
      });
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      if (reservation.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Only confirmed reservations can be checked in'
        });
      }
      
      // Update reservation
      await reservation.update({
        status: 'checked_in',
        actualCheckIn: new Date(),
        amountPaid: (reservation.amountPaid || 0) + (amountPaid || 0),
        lastModifiedBy: req.user.id
      });
      
      // Update room status
      await Room.update(
        { status: 'occupied' },
        { where: { id: reservation.roomId } }
      );
      
      // Create or update billing record
      let billing = await Billing.findOne({
        where: { reservationId }
      });
      
      if (!billing) {
        billing = await Billing.create({
          reservationId,
          guestId: reservation.guestId,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: new Date(),
          dueDate: moment().add(1, 'day').toDate(),
          subtotal: reservation.totalAmount,
          taxes: 0,
          fees: 0,
          discounts: 0,
          totalAmount: reservation.totalAmount,
          amountPaid: amountPaid || 0,
          balance: reservation.totalAmount - (amountPaid || 0),
          paymentMethod,
          status: amountPaid >= reservation.totalAmount ? 'paid' : 'partial',
          createdBy: req.user.id
        });
      } else {
        await billing.update({
          amountPaid: billing.amountPaid + (amountPaid || 0),
          balance: billing.totalAmount - (billing.amountPaid + (amountPaid || 0)),
          status: (billing.amountPaid + (amountPaid || 0)) >= billing.totalAmount ? 'paid' : 'partial',
          paidDate: (billing.amountPaid + (amountPaid || 0)) >= billing.totalAmount ? new Date() : null
        });
      }
      
      // Update guest statistics
      await Guest.increment(
        { totalStays: 1 },
        { where: { id: reservation.guestId } }
      );
      
      res.json({
        success: true,
        message: 'Quick check-in completed successfully',
        data: {
          reservation,
          billing
        }
      });
    } catch (error) {
      console.error('Quick check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during quick check-in'
      });
    }
  }
  
  // Quick check-out
  async quickCheckOut(req, res) {
    try {
      const { reservationId, finalCharges, paymentMethod, amountPaid } = req.body;
      
      const reservation = await Reservation.findByPk(reservationId, {
        include: [
          {
            model: Billing,
            as: 'billing'
          }
        ]
      });
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      if (reservation.status !== 'checked_in') {
        return res.status(400).json({
          success: false,
          message: 'Only checked-in guests can be checked out'
        });
      }
      
      // Update reservation
      await reservation.update({
        status: 'checked_out',
        actualCheckOut: new Date(),
        lastModifiedBy: req.user.id
      });
      
      // Update room status to cleaning
      await Room.update(
        { status: 'cleaning' },
        { where: { id: reservation.roomId } }
      );
      
      // Update billing with final charges
      let billing = reservation.billing;
      
      if (!billing) {
        billing = await Billing.create({
          reservationId,
          guestId: reservation.guestId,
          invoiceNumber: `INV-${Date.now()}`,
          issueDate: new Date(),
          dueDate: new Date(),
          subtotal: reservation.totalAmount + (finalCharges || 0),
          taxes: 0,
          fees: 0,
          discounts: 0,
          totalAmount: reservation.totalAmount + (finalCharges || 0),
          amountPaid: amountPaid || reservation.amountPaid || 0,
          balance: (reservation.totalAmount + (finalCharges || 0)) - (amountPaid || reservation.amountPaid || 0),
          paymentMethod,
          status: 'paid',
          paidDate: new Date(),
          createdBy: req.user.id
        });
      } else {
        const newTotalAmount = reservation.totalAmount + (finalCharges || 0);
        const newAmountPaid = (billing.amountPaid || 0) + (amountPaid || 0);
        const newBalance = newTotalAmount - newAmountPaid;
        
        await billing.update({
          subtotal: billing.subtotal + (finalCharges || 0),
          totalAmount: newTotalAmount,
          amountPaid: newAmountPaid,
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'partial',
          paidDate: newBalance <= 0 ? new Date() : null
        });
      }
      
      // Create housekeeping task for room cleaning
      await Housekeeping.create({
        roomId: reservation.roomId,
        taskType: 'turnover',
        status: 'pending',
        priority: 'high',
        scheduledDate: new Date(),
        createdBy: req.user.id,
        reservationId
      });
      
      // Update guest revenue
      await Guest.increment(
        { totalRevenue: reservation.totalAmount + (finalCharges || 0) },
        { where: { id: reservation.guestId } }
      });
      
      res.json({
        success: true,
        message: 'Quick check-out completed successfully',
        data: {
          reservation,
          billing
        }
      });
    } catch (error) {
      console.error('Quick check-out error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during quick check-out'
      });
    }
  }
  
  // Process walk-in reservation
  async processWalkIn(req, res) {
    try {
      const {
        guestData,
        roomData,
        checkInDate,
        checkOutDate,
        adults,
        children,
        paymentMethod,
        amountPaid
      } = req.body;
      
      // Create guest first
      let guest;
      if (guestData.email) {
        guest = await Guest.findOne({ where: { email: guestData.email } });
        if (guest) {
          await guest.update(guestData);
        } else {
          guest = await Guest.create(guestData);
        }
      } else {
        guest = await Guest.create(guestData);
      }
      
      // Find available room
      const availableRoom = await Room.findOne({
        where: {
          status: 'available',
          roomType: roomData.roomType,
          isActive: true
        }
      });
      
      if (!availableRoom) {
        return res.status(400).json({
          success: false,
          message: 'No available rooms found for the specified type'
        });
      }
      
      // Calculate total amount
      const nights = moment(checkOutDate).diff(moment(checkInDate), 'days');
      const totalAmount = availableRoom.currentPrice * nights;
      
      // Generate confirmation number
      const confirmationNumber = `WALK${Date.now()}`;
      
      // Create reservation
      const reservation = await Reservation.create({
        confirmationNumber,
        guestId: guest.id,
        roomId: availableRoom.id,
        checkInDate,
        checkOutDate,
        status: 'confirmed',
        adults,
        children,
        roomRate: availableRoom.currentPrice,
        totalAmount,
        amountPaid: amountPaid || 0,
        bookingSource: 'walk_in',
        guaranteed: amountPaid > 0,
        guaranteeType: amountPaid > 0 ? 'deposit' : null,
        createdBy: req.user.id
      });
      
      // Update room status
      await availableRoom.update({ status: 'reserved' });
      
      // Create billing record
      const billing = await Billing.create({
        reservationId: reservation.id,
        guestId: guest.id,
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: new Date(),
        dueDate: moment().add(1, 'day').toDate(),
        subtotal: totalAmount,
        taxes: 0,
        fees: 0,
        discounts: 0,
        totalAmount,
        amountPaid: amountPaid || 0,
        balance: totalAmount - (amountPaid || 0),
        paymentMethod,
        status: amountPaid >= totalAmount ? 'paid' : 'partial',
        createdBy: req.user.id
      });
      
      // Fetch complete reservation with associations
      const createdReservation = await Reservation.findByPk(reservation.id, {
        include: [
          {
            model: Guest,
            as: 'guest',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
          },
          {
            model: Room,
            as: 'room',
            attributes: ['id', 'roomNumber', 'roomType', 'floor']
          }
        ]
      });
      
      res.status(201).json({
        success: true,
        message: 'Walk-in reservation processed successfully',
        data: {
          reservation: createdReservation,
          billing
        }
      });
    } catch (error) {
      console.error('Process walk-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while processing walk-in reservation'
      });
    }
  }
  
  // Get guest search results for front desk
  async searchGuestsQuick(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }
      
      const guests = await Guest.findAll({
        where: {
          [Op.and]: [
            { blacklisted: false },
            {
              [Op.or]: [
                { firstName: { [Op.iLike]: `%${query}%` } },
                { lastName: { [Op.iLike]: `%${query}%` } },
                { email: { [Op.iLike]: `%${query}%` } },
                { phoneNumber: { [Op.iLike]: `%${query}%` } }
              ]
            }
          ]
        },
        limit: 10,
        order: [['totalStays', 'DESC'], ['totalRevenue', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'totalStays', 'totalRevenue', 'guestType']
      });
      
      res.json({
        success: true,
        data: guests
      });
    } catch (error) {
      console.error('Search guests quick error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching guests'
      });
    }
  }
  
  // Send check-in confirmation email
  async sendCheckInEmail(req, res) {
    try {
      const { reservationId } = req.params;
      
      const reservation = await Reservation.findByPk(reservationId, {
        include: [
          {
            model: Guest,
            as: 'guest'
          },
          {
            model: Room,
            as: 'room'
          }
        ]
      });
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      if (!reservation.guest.email) {
        return res.status(400).json({
          success: false,
          message: 'Guest email not available'
        });
      }
      
      // Send email (implementation depends on your email service)
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: reservation.guest.email,
        subject: `Check-in Confirmation - ${reservation.confirmationNumber}`,
        html: this.generateCheckInEmailTemplate(reservation)
      };
      
      await transporter.sendMail(mailOptions);
      
      res.json({
        success: true,
        message: 'Check-in confirmation email sent successfully'
      });
    } catch (error) {
      console.error('Send check-in email error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while sending email'
      });
    }
  }
  
  // Helper method to generate check-in email template
  generateCheckInEmailTemplate(reservation) {
    return `
      <h2>Welcome to Our Hotel!</h2>
      <p>Dear ${reservation.guest.firstName} ${reservation.guest.lastName},</p>
      <p>We are delighted to welcome you to our hotel. Your check-in has been completed successfully.</p>
      
      <h3>Reservation Details:</h3>
      <ul>
        <li><strong>Confirmation Number:</strong> ${reservation.confirmationNumber}</li>
        <li><strong>Room Number:</strong> ${reservation.room.roomNumber}</li>
        <li><strong>Room Type:</strong> ${reservation.room.roomType}</li>
        <li><strong>Check-in Date:</strong> ${moment(reservation.actualCheckIn).format('MMMM DD, YYYY')}</li>
        <li><strong>Check-out Date:</strong> ${moment(reservation.checkOutDate).format('MMMM DD, YYYY')}</li>
        <li><strong>Guests:</strong> ${reservation.adults} Adults${reservation.children > 0 ? `, ${reservation.children} Children` : ''}</li>
      </ul>
      
      <p>If you have any questions or need assistance during your stay, please don't hesitate to contact our front desk.</p>
      
      <p>We hope you have a wonderful stay with us!</p>
      
      <p>Best regards,<br>Hotel Management Team</p>
    `;
  }
}

module.exports = new FrontDeskController();