const { Reservation, Guest, Room, Billing } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class ReservationController {
  // Get all reservations with pagination and filtering
  async getReservations(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        guestId,
        roomId,
        checkInDate,
        checkOutDate,
        bookingSource,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (guestId) {
        whereClause.guestId = guestId;
      }
      
      if (roomId) {
        whereClause.roomId = roomId;
      }
      
      if (checkInDate) {
        whereClause.checkInDate = { [Op.gte]: checkInDate };
      }
      
      if (checkOutDate) {
        whereClause.checkOutDate = { [Op.lte]: checkOutDate };
      }
      
      if (bookingSource) {
        whereClause.bookingSource = bookingSource;
      }
      
      // Get reservations
      const { count, rows: reservations } = await Reservation.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
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
      
      res.json({
        success: true,
        data: {
          reservations,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get reservations error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching reservations'
      });
    }
  }
  
  // Get reservation by ID
  async getReservationById(req, res) {
    try {
      const { id } = req.params;
      
      const reservation = await Reservation.findByPk(id, {
        include: [
          {
            model: Guest,
            as: 'guest'
          },
          {
            model: Room,
            as: 'room'
          },
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
      
      res.json({
        success: true,
        data: reservation
      });
    } catch (error) {
      console.error('Get reservation by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching reservation'
      });
    }
  }
  
  // Create new reservation
  async createReservation(req, res) {
    try {
      const reservationData = req.body;
      
      // Check if room is available for the dates
      const isRoomAvailable = await this.checkRoomAvailability(
        reservationData.roomId,
        reservationData.checkInDate,
        reservationData.checkOutDate
      );
      
      if (!isRoomAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Room is not available for the selected dates'
        });
      }
      
      // Generate confirmation number
      const confirmationNumber = this.generateConfirmationNumber();
      
      // Add system fields
      reservationData.confirmationNumber = confirmationNumber;
      reservationData.createdBy = req.user.id;
      
      // Create reservation
      const reservation = await Reservation.create(reservationData);
      
      // Update room status to reserved
      await Room.update(
        { status: 'reserved' },
        { where: { id: reservationData.roomId } }
      );
      
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
        message: 'Reservation created successfully',
        data: createdReservation
      });
    } catch (error) {
      console.error('Create reservation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating reservation'
      });
    }
  }
  
  // Update reservation
  async updateReservation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const reservation = await Reservation.findByPk(id);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      // Check if reservation can be modified
      if (['checked_out', 'cancelled'].includes(reservation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify reservation in current status'
        });
      }
      
      // If room or dates are being changed, check availability
      if (updateData.roomId || updateData.checkInDate || updateData.checkOutDate) {
        const roomId = updateData.roomId || reservation.roomId;
        const checkInDate = updateData.checkInDate || reservation.checkInDate;
        const checkOutDate = updateData.checkOutDate || reservation.checkOutDate;
        
        const isRoomAvailable = await this.checkRoomAvailability(
          roomId,
          checkInDate,
          checkOutDate,
          id // Exclude current reservation from availability check
        );
        
        if (!isRoomAvailable) {
          return res.status(400).json({
            success: false,
            message: 'Room is not available for the selected dates'
          });
        }
      }
      
      // Add modification tracking
      updateData.lastModifiedBy = req.user.id;
      
      // Add to modification history
      const modificationHistory = reservation.modificationHistory || [];
      modificationHistory.push({
        modifiedBy: req.user.id,
        modifiedAt: new Date(),
        changes: updateData
      });
      updateData.modificationHistory = modificationHistory;
      
      // Update reservation
      await reservation.update(updateData);
      
      // Fetch updated reservation with associations
      const updatedReservation = await Reservation.findByPk(id, {
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
      
      res.json({
        success: true,
        message: 'Reservation updated successfully',
        data: updatedReservation
      });
    } catch (error) {
      console.error('Update reservation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating reservation'
      });
    }
  }
  
  // Cancel reservation
  async cancelReservation(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const reservation = await Reservation.findByPk(id);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      // Check if reservation can be cancelled
      if (['checked_out', 'cancelled', 'no_show'].includes(reservation.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel reservation in current status'
        });
      }
      
      // Update reservation status
      await reservation.update({
        status: 'cancelled',
        cancellationDate: new Date(),
        cancellationReason: reason || 'Cancelled by user',
        lastModifiedBy: req.user.id
      });
      
      // Update room status to available
      await Room.update(
        { status: 'available' },
        { where: { id: reservation.roomId } }
      );
      
      res.json({
        success: true,
        message: 'Reservation cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel reservation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while cancelling reservation'
      });
    }
  }
  
  // Check-in guest
  async checkIn(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      
      const reservation = await Reservation.findByPk(id);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      // Check if reservation is confirmed
      if (reservation.status !== 'confirmed') {
        return res.status(400).json({
          success: false,
          message: 'Only confirmed reservations can be checked in'
        });
      }
      
      // Check if check-in date is today or in the past
      const today = moment().format('YYYY-MM-DD');
      const checkInDate = moment(reservation.checkInDate).format('YYYY-MM-DD');
      
      if (checkInDate > today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot check in before the scheduled check-in date'
        });
      }
      
      // Update reservation
      await reservation.update({
        status: 'checked_in',
        actualCheckIn: new Date(),
        lastModifiedBy: req.user.id,
        notes: notes ? `${reservation.notes || ''}\nCheck-in notes: ${notes}`.trim() : reservation.notes
      });
      
      // Update room status
      await Room.update(
        { status: 'occupied' },
        { where: { id: reservation.roomId } }
      );
      
      // Update guest statistics
      await Guest.increment(
        { totalStays: 1 },
        { where: { id: reservation.guestId } }
      );
      
      res.json({
        success: true,
        message: 'Guest checked in successfully'
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during check-in'
      });
    }
  }
  
  // Check-out guest
  async checkOut(req, res) {
    try {
      const { id } = req.params;
      const { notes, finalCharges } = req.body;
      
      const reservation = await Reservation.findByPk(id, {
        include: [
          { model: Billing, as: 'billing' }
        ]
      });
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }
      
      // Check if guest is checked in
      if (reservation.status !== 'checked_in') {
        return res.status(400).json({
          success: false,
          message: 'Only checked-in guests can be checked out'
        });
      }
      
      // Calculate stay duration
      const checkIn = moment(reservation.actualCheckIn);
      const checkOut = moment();
      const nights = checkOut.diff(checkIn, 'days') + 1;
      
      // Update reservation
      await reservation.update({
        status: 'checked_out',
        actualCheckOut: new Date(),
        lastModifiedBy: req.user.id,
        notes: notes ? `${reservation.notes || ''}\nCheck-out notes: ${notes}`.trim() : reservation.notes
      });
      
      // Update room status to cleaning
      await Room.update(
        { status: 'cleaning' },
        { where: { id: reservation.roomId } }
      );
      
      // Update guest revenue
      await Guest.increment(
        { totalRevenue: reservation.totalAmount },
        { where: { id: reservation.guestId } }
      );
      
      res.json({
        success: true,
        message: 'Guest checked out successfully',
        data: {
          nights,
          totalAmount: reservation.totalAmount
        }
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during check-out'
      });
    }
  }
  
  // Get room availability
  async getRoomAvailability(req, res) {
    try {
      const { checkInDate, checkOutDate, roomType } = req.query;
      
      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required'
        });
      }
      
      // Build where clause for rooms
      const roomWhereClause = {
        status: 'available',
        isActive: true
      };
      
      if (roomType) {
        roomWhereClause.roomType = roomType;
      }
      
      // Get available rooms
      const availableRooms = await Room.findAll({
        where: roomWhereClause,
        include: [
          {
            model: Reservation,
            as: 'reservations',
            where: {
              [Op.or]: [
                {
                  [Op.and]: [
                    { checkInDate: { [Op.lte]: checkInDate } },
                    { checkOutDate: { [Op.gt]: checkInDate } }
                  ]
                },
                {
                  [Op.and]: [
                    { checkInDate: { [Op.lt]: checkOutDate } },
                    { checkOutDate: { [Op.gte]: checkOutDate } }
                  ]
                },
                {
                  [Op.and]: [
                    { checkInDate: { [Op.gte]: checkInDate } },
                    { checkOutDate: { [Op.lte]: checkOutDate } }
                  ]
                }
              ],
              status: ['confirmed', 'checked_in']
            },
            required: false
          }
        ]
      });
      
      // Filter rooms that have no conflicting reservations
      const filteredRooms = availableRooms.filter(room => room.reservations.length === 0);
      
      res.json({
        success: true,
        data: {
          availableRooms: filteredRooms,
          totalCount: filteredRooms.length
        }
      });
    } catch (error) {
      console.error('Get room availability error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while checking room availability'
      });
    }
  }
  
  // Get reservation statistics
  async getReservationStatistics(req, res) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const thisMonth = moment().startOf('month').format('YYYY-MM-DD');
      const thisYear = moment().startOf('year').format('YYYY-MM-DD');
      
      // Total reservations
      const totalReservations = await Reservation.count();
      
      // Active reservations (confirmed or checked_in)
      const activeReservations = await Reservation.count({
        where: {
          status: ['confirmed', 'checked_in']
        }
      });
      
      // Today's check-ins
      const todayCheckIns = await Reservation.count({
        where: {
          checkInDate: today,
          status: ['confirmed', 'checked_in']
        }
      });
      
      // Today's check-outs
      const todayCheckOuts = await Reservation.count({
        where: {
          checkOutDate: today,
          status: 'checked_in'
        }
      });
      
      // This month's reservations
      const thisMonthReservations = await Reservation.count({
        where: {
          createdAt: { [Op.gte]: thisMonth }
        }
      });
      
      // This year's revenue
      const thisYearRevenue = await Reservation.sum('totalAmount', {
        where: {
          createdAt: { [Op.gte]: thisYear },
          status: ['checked_in', 'checked_out']
        }
      });
      
      // Occupancy rate
      const totalRooms = await Room.count({ where: { isActive: true } });
      const occupiedRooms = await Room.count({ where: { status: 'occupied' } });
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(2) : 0;
      
      // Booking source distribution
      const bookingSourceStats = await Reservation.findAll({
        attributes: [
          'bookingSource',
          [Reservation.sequelize.fn('COUNT', Reservation.sequelize.col('id')), 'count']
        ],
        group: ['bookingSource']
      });
      
      // Status distribution
      const statusStats = await Reservation.findAll({
        attributes: [
          'status',
          [Reservation.sequelize.fn('COUNT', Reservation.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      res.json({
        success: true,
        data: {
          overview: {
            totalReservations,
            activeReservations,
            todayCheckIns,
            todayCheckOuts,
            thisMonthReservations,
            thisYearRevenue: thisYearRevenue || 0,
            occupancyRate: parseFloat(occupancyRate)
          },
          bookingSourceDistribution: bookingSourceStats,
          statusDistribution: statusStats
        }
      });
    } catch (error) {
      console.error('Get reservation statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching reservation statistics'
      });
    }
  }
  
  // Helper method to check room availability
  async checkRoomAvailability(roomId, checkInDate, checkOutDate, excludeReservationId = null) {
    const whereClause = {
      roomId,
      status: ['confirmed', 'checked_in'],
      [Op.or]: [
        {
          [Op.and]: [
            { checkInDate: { [Op.lte]: checkInDate } },
            { checkOutDate: { [Op.gt]: checkInDate } }
          ]
        },
        {
          [Op.and]: [
            { checkInDate: { [Op.lt]: checkOutDate } },
            { checkOutDate: { [Op.gte]: checkOutDate } }
          ]
        },
        {
          [Op.and]: [
            { checkInDate: { [Op.gte]: checkInDate } },
            { checkOutDate: { [Op.lte]: checkOutDate } }
          ]
        }
      ]
    };
    
    if (excludeReservationId) {
      whereClause.id = { [Op.ne]: excludeReservationId };
    }
    
    const conflictingReservations = await Reservation.count({ where: whereClause });
    
    return conflictingReservations === 0;
  }
  
  // Helper method to generate confirmation number
  generateConfirmationNumber() {
    const prefix = 'HMS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}

module.exports = new ReservationController();