const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Rate = sequelize.define('Rate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomType: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'executive_suite', 'presidential_suite', 'family_room', 'connecting_room'),
    allowNull: false
  },
  rateType: {
    type: DataTypes.ENUM('base_rate', 'dynamic_rate', 'promotional_rate', 'corporate_rate', 'group_rate', 'seasonal_rate'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD'
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  daysOfWeek: {
    type: DataTypes.JSON,
    defaultValue: [1, 2, 3, 4, 5, 6, 7],
    comment: 'Array of days (1=Monday, 7=Sunday) this rate applies to'
  },
  seasons: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of seasons this rate applies to'
  },
  occupancyBased: {
    type: DataTypes.JSON,
    defaultValue: {
      singleOccupancy: 0,
      doubleOccupancy: 0,
      additionalAdult: 0,
      additionalChild: 0
    }
  },
  lengthOfStay: {
    type: DataTypes.JSON,
    defaultValue: {
      minNights: 1,
      maxNights: null,
      discounts: []
    }
  },
  bookingWindow: {
    type: DataTypes.JSON,
    defaultValue: {
      advanceBookingRequired: 0,
      lastMinuteDiscount: 0,
      earlyBirdDiscount: 0
    }
  },
  cancellationPolicy: {
    type: DataTypes.JSON,
    defaultValue: {
      type: 'standard',
      deadline: '24h',
      penalty: 'first_night',
      nonRefundable: false
    }
  },
  inclusions: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of included services/amenities'
  },
  restrictions: {
    type: DataTypes.JSON,
    defaultValue: {
      blackouts: [],
      minimumStay: 1,
      maximumStay: null,
      checkInDays: [],
      checkOutDays: []
    }
  },
  commission: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Commission percentage for travel agents/OTAs'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Higher priority rates are applied first'
  },
  channel: {
    type: DataTypes.ENUM('all', 'direct', 'website', 'ota', 'corporate', 'travel_agent'),
    defaultValue: 'all'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastModifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'rates',
  timestamps: true,
  indexes: [
    { fields: ['roomType'] },
    { fields: ['rateType'] },
    { fields: ['effectiveDate'] },
    { fields: ['expiryDate'] },
    { fields: ['isActive'] },
    { fields: ['channel'] },
    { fields: ['priority'] }
  ]
});

module.exports = Rate;