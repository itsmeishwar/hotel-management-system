const { Guest, Reservation } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class GuestController {
  // Get all guests with pagination and filtering
  async getGuests(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        guestType,
        blacklisted,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phoneNumber: { [Op.iLike]: `%${search}%` } },
          { company: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (guestType) {
        whereClause.guestType = guestType;
      }
      
      if (blacklisted !== undefined) {
        whereClause.blacklisted = blacklisted === 'true';
      }
      
      // Get guests
      const { count, rows: guests } = await Guest.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
        include: [
          {
            model: Reservation,
            as: 'reservations',
            attributes: ['id', 'checkInDate', 'checkOutDate', 'status', 'totalAmount'],
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      res.json({
        success: true,
        data: {
          guests,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get guests error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching guests'
      });
    }
  }
  
  // Get guest by ID
  async getGuestById(req, res) {
    try {
      const { id } = req.params;
      
      const guest = await Guest.findByPk(id, {
        include: [
          {
            model: Reservation,
            as: 'reservations',
            order: [['createdAt', 'DESC']]
          }
        ]
      });
      
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
      }
      
      res.json({
        success: true,
        data: guest
      });
    } catch (error) {
      console.error('Get guest by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching guest'
      });
    }
  }
  
  // Create new guest
  async createGuest(req, res) {
    try {
      const guestData = req.body;
      
      // Check if guest with same email already exists
      if (guestData.email) {
        const existingGuest = await Guest.findOne({ where: { email: guestData.email } });
        
        if (existingGuest) {
          return res.status(400).json({
            success: false,
            message: 'Guest with this email already exists'
          });
        }
      }
      
      // Create guest
      const guest = await Guest.create(guestData);
      
      res.status(201).json({
        success: true,
        message: 'Guest created successfully',
        data: guest
      });
    } catch (error) {
      console.error('Create guest error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating guest'
      });
    }
  }
  
  // Update guest
  async updateGuest(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const guest = await Guest.findByPk(id);
      
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
      }
      
      // Check if email is being updated and already exists
      if (updateData.email && updateData.email !== guest.email) {
        const existingGuest = await Guest.findOne({ where: { email: updateData.email } });
        
        if (existingGuest) {
          return res.status(400).json({
            success: false,
            message: 'Guest with this email already exists'
          });
        }
      }
      
      // Update guest
      await guest.update(updateData);
      
      res.json({
        success: true,
        message: 'Guest updated successfully',
        data: guest
      });
    } catch (error) {
      console.error('Update guest error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating guest'
      });
    }
  }
  
  // Delete guest
  async deleteGuest(req, res) {
    try {
      const { id } = req.params;
      
      const guest = await Guest.findByPk(id);
      
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
      }
      
      // Check if guest has active reservations
      const activeReservations = await Reservation.count({
        where: {
          guestId: id,
          status: ['confirmed', 'checked_in']
        }
      });
      
      if (activeReservations > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete guest with active reservations'
        });
      }
      
      // Soft delete by updating blacklisted status
      await guest.update({ blacklisted: true, blacklistReason: 'Deleted from system' });
      
      res.json({
        success: true,
        message: 'Guest deleted successfully'
      });
    } catch (error) {
      console.error('Delete guest error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting guest'
      });
    }
  }
  
  // Get guest statistics
  async getGuestStatistics(req, res) {
    try {
      const totalGuests = await Guest.count();
      const activeGuests = await Guest.count({ where: { blacklisted: false } });
      const blacklistedGuests = await Guest.count({ where: { blacklisted: true } });
      
      // Guest type distribution
      const guestTypeStats = await Guest.findAll({
        attributes: [
          'guestType',
          [Guest.sequelize.fn('COUNT', Guest.sequelize.col('id')), 'count']
        ],
        group: ['guestType']
      });
      
      // Top guests by revenue
      const topGuests = await Guest.findAll({
        limit: 10,
        order: [['totalRevenue', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'email', 'totalRevenue', 'totalStays']
      });
      
      // New guests this month
      const thisMonth = moment().startOf('month').toDate();
      const newGuestsThisMonth = await Guest.count({
        where: {
          createdAt: { [Op.gte]: thisMonth }
        }
      });
      
      // Repeat guests (guests with more than 1 stay)
      const repeatGuests = await Guest.count({
        where: {
          totalStays: { [Op.gt]: 1 }
        }
      });
      
      res.json({
        success: true,
        data: {
          overview: {
            totalGuests,
            activeGuests,
            blacklistedGuests,
            newGuestsThisMonth,
            repeatGuests
          },
          guestTypeDistribution: guestTypeStats,
          topGuestsByRevenue: topGuests
        }
      });
    } catch (error) {
      console.error('Get guest statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching guest statistics'
      });
    }
  }
  
  // Search guests
  async searchGuests(req, res) {
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
                { phoneNumber: { [Op.iLike]: `%${query}%` } },
                { company: { [Op.iLike]: `%${query}%` } }
              ]
            }
          ]
        },
        limit: 20,
        order: [['totalRevenue', 'DESC']],
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'company', 'guestType', 'totalStays', 'totalRevenue']
      });
      
      res.json({
        success: true,
        data: guests
      });
    } catch (error) {
      console.error('Search guests error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching guests'
      });
    }
  }
  
  // Update guest loyalty program
  async updateLoyaltyProgram(req, res) {
    try {
      const { id } = req.params;
      const { memberId, tier, points, status } = req.body;
      
      const guest = await Guest.findByPk(id);
      
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
      }
      
      // Update loyalty program
      const loyaltyProgram = {
        ...guest.loyaltyProgram,
        memberId: memberId || guest.loyaltyProgram.memberId,
        tier: tier || guest.loyaltyProgram.tier,
        points: points !== undefined ? points : guest.loyaltyProgram.points,
        status: status || guest.loyaltyProgram.status,
        joinDate: guest.loyaltyProgram.joinDate || new Date()
      };
      
      await guest.update({ loyaltyProgram });
      
      res.json({
        success: true,
        message: 'Loyalty program updated successfully',
        data: guest.loyaltyProgram
      });
    } catch (error) {
      console.error('Update loyalty program error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating loyalty program'
      });
    }
  }
  
  // Blacklist/unblacklist guest
  async toggleBlacklist(req, res) {
    try {
      const { id } = req.params;
      const { blacklisted, reason } = req.body;
      
      const guest = await Guest.findByPk(id);
      
      if (!guest) {
        return res.status(404).json({
          success: false,
          message: 'Guest not found'
        });
      }
      
      await guest.update({
        blacklisted,
        blacklistReason: blacklisted ? reason : null
      });
      
      res.json({
        success: true,
        message: blacklisted ? 'Guest blacklisted successfully' : 'Guest unblacklisted successfully',
        data: {
          blacklisted: guest.blacklisted,
          blacklistReason: guest.blacklistReason
        }
      });
    } catch (error) {
      console.error('Toggle blacklist error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating blacklist status'
      });
    }
  }
}

module.exports = new GuestController();