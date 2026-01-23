const { Room, Reservation, Housekeeping } = require('../models');
const { Op } = require('sequelize');

class RoomController {
  // Get all rooms with pagination and filtering
  async getRooms(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        roomType,
        status,
        floor,
        housekeepingStatus,
        sortBy = 'roomNumber',
        sortOrder = 'asc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = { isActive: true };
      
      if (roomType) {
        whereClause.roomType = roomType;
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (floor) {
        whereClause.floor = floor;
      }
      
      if (housekeepingStatus) {
        whereClause.housekeepingStatus = housekeepingStatus;
      }
      
      // Get rooms
      const { count, rows: rooms } = await Room.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: Reservation,
            as: 'reservations',
            where: {
              status: ['confirmed', 'checked_in']
            },
            required: false,
            limit: 1,
            order: [['checkInDate', 'ASC']]
          },
          {
            model: Housekeeping,
            as: 'housekeepingTasks',
            where: {
              status: ['pending', 'in_progress']
            },
            required: false,
            limit: 1,
            order: [['scheduledDate', 'ASC']]
          }
        ]
      });
      
      res.json({
        success: true,
        data: {
          rooms,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching rooms'
      });
    }
  }
  
  // Get room by ID
  async getRoomById(req, res) {
    try {
      const { id } = req.params;
      
      const room = await Room.findByPk(id, {
        include: [
          {
            model: Reservation,
            as: 'reservations',
            order: [['createdAt', 'DESC']],
            limit: 10
          },
          {
            model: Housekeeping,
            as: 'housekeepingTasks',
            order: [['scheduledDate', 'DESC']],
            limit: 10
          }
        ]
      });
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      
      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error('Get room by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching room'
      });
    }
  }
  
  // Create new room
  async createRoom(req, res) {
    try {
      const roomData = req.body;
      
      // Check if room number already exists
      const existingRoom = await Room.findOne({ where: { roomNumber: roomData.roomNumber } });
      
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Room with this number already exists'
        });
      }
      
      // Set current price to base price if not provided
      if (!roomData.currentPrice) {
        roomData.currentPrice = roomData.basePrice;
      }
      
      // Create room
      const room = await Room.create(roomData);
      
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room
      });
    } catch (error) {
      console.error('Create room error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating room'
      });
    }
  }
  
  // Update room
  async updateRoom(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const room = await Room.findByPk(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      
      // Check if room number is being updated and already exists
      if (updateData.roomNumber && updateData.roomNumber !== room.roomNumber) {
        const existingRoom = await Room.findOne({ where: { roomNumber: updateData.roomNumber } });
        
        if (existingRoom) {
          return res.status(400).json({
            success: false,
            message: 'Room with this number already exists'
          });
        }
      }
      
      // Update room
      await room.update(updateData);
      
      res.json({
        success: true,
        message: 'Room updated successfully',
        data: room
      });
    } catch (error) {
      console.error('Update room error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating room'
      });
    }
  }
  
  // Delete room (soft delete)
  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      
      const room = await Room.findByPk(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      
      // Check if room has active reservations
      const activeReservations = await Reservation.count({
        where: {
          roomId: id,
          status: ['confirmed', 'checked_in']
        }
      });
      
      if (activeReservations > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete room with active reservations'
        });
      }
      
      // Soft delete by setting isActive to false
      await room.update({ isActive: false });
      
      res.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      console.error('Delete room error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting room'
      });
    }
  }
  
  // Update room status
  async updateRoomStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const room = await Room.findByPk(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      
      // Validate status transition
      const validTransitions = {
        'available': ['occupied', 'maintenance', 'out_of_order', 'reserved'],
        'occupied': ['available', 'cleaning', 'maintenance'],
        'cleaning': ['available', 'occupied'],
        'maintenance': ['available', 'out_of_order'],
        'out_of_order': ['available', 'maintenance'],
        'reserved': ['available', 'occupied']
      };
      
      if (!validTransitions[room.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from ${room.status} to ${status}`
        });
      }
      
      // Update room status
      await room.update({ 
        status,
        maintenanceNotes: notes || room.maintenanceNotes
      });
      
      res.json({
        success: true,
        message: 'Room status updated successfully',
        data: { status: room.status }
      });
    } catch (error) {
      console.error('Update room status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating room status'
      });
    }
  }
  
  // Update housekeeping status
  async updateHousekeepingStatus(req, res) {
    try {
      const { id } = req.params;
      const { housekeepingStatus, notes } = req.body;
      
      const room = await Room.findByPk(id);
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      
      // Update housekeeping status
      await room.update({ housekeepingStatus });
      
      // If status is 'clean', update room status to 'available' if it was 'cleaning'
      if (housekeepingStatus === 'clean' && room.status === 'cleaning') {
        await room.update({ status: 'available' });
      }
      
      res.json({
        success: true,
        message: 'Housekeeping status updated successfully',
        data: { housekeepingStatus: room.housekeepingStatus, status: room.status }
      });
    } catch (error) {
      console.error('Update housekeeping status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating housekeeping status'
      });
    }
  }
  
  // Get room statistics
  async getRoomStatistics(req, res) {
    try {
      // Total rooms
      const totalRooms = await Room.count({ where: { isActive: true } });
      
      // Room status distribution
      const statusStats = await Room.findAll({
        where: { isActive: true },
        attributes: [
          'status',
          [Room.sequelize.fn('COUNT', Room.sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      // Room type distribution
      const typeStats = await Room.findAll({
        where: { isActive: true },
        attributes: [
          'roomType',
          [Room.sequelize.fn('COUNT', Room.sequelize.col('id')), 'count']
        ],
        group: ['roomType']
      });
      
      // Housekeeping status distribution
      const housekeepingStats = await Room.findAll({
        where: { isActive: true },
        attributes: [
          'housekeepingStatus',
          [Room.sequelize.fn('COUNT', Room.sequelize.col('id')), 'count']
        ],
        group: ['housekeepingStatus']
      });
      
      // Occupancy rate
      const occupiedRooms = await Room.count({
        where: { 
          isActive: true,
          status: 'occupied'
        }
      });
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(2) : 0;
      
      // Average room rate
      const avgRateResult = await Room.findAll({
        where: { isActive: true },
        attributes: [
          [Room.sequelize.fn('AVG', Room.sequelize.col('currentPrice')), 'avgRate']
        ]
      });
      const avgRate = avgRateResult[0]?.dataValues?.avgRate || 0;
      
      // Rooms needing maintenance
      const maintenanceRooms = await Room.count({
        where: {
          isActive: true,
          status: ['maintenance', 'out_of_order']
        }
      });
      
      res.json({
        success: true,
        data: {
          overview: {
            totalRooms,
            occupiedRooms,
            occupancyRate: parseFloat(occupancyRate),
            maintenanceRooms,
            averageRate: parseFloat(avgRate)
          },
          statusDistribution: statusStats,
          typeDistribution: typeStats,
          housekeepingDistribution: housekeepingStats
        }
      });
    } catch (error) {
      console.error('Get room statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching room statistics'
      });
    }
  }
  
  // Get floor overview
  async getFloorOverview(req, res) {
    try {
      const floors = await Room.findAll({
        where: { isActive: true },
        attributes: [
          'floor',
          [Room.sequelize.fn('COUNT', Room.sequelize.col('id')), 'totalRooms'],
          [Room.sequelize.fn('COUNT', Room.sequelize.literal('CASE WHEN status = \'occupied\' THEN 1 END')), 'occupiedRooms'],
          [Room.sequelize.fn('COUNT', Room.sequelize.literal('CASE WHEN status = \'available\' THEN 1 END')), 'availableRooms'],
          [Room.sequelize.fn('COUNT', Room.sequelize.literal('CASE WHEN status = \'maintenance\' THEN 1 END')), 'maintenanceRooms'],
          [Room.sequelize.fn('COUNT', Room.sequelize.literal('CASE WHEN housekeepingStatus = \'dirty\' THEN 1 END')), 'dirtyRooms']
        ],
        group: ['floor'],
        order: [['floor', 'ASC']]
      });
      
      res.json({
        success: true,
        data: floors
      });
    } catch (error) {
      console.error('Get floor overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching floor overview'
      });
    }
  }
  
  // Search rooms
  async searchRooms(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }
      
      const rooms = await Room.findAll({
        where: {
          isActive: true,
          [Op.or]: [
            { roomNumber: { [Op.iLike]: `%${query}%` } },
            { roomType: { [Op.iLike]: `%${query}%` } }
          ]
        },
        limit: 20,
        order: [['roomNumber', 'ASC']]
      });
      
      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      console.error('Search rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching rooms'
      });
    }
  }
}

module.exports = new RoomController();