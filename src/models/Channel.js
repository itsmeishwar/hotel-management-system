const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Channel = sequelize.define('Channel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100]
    }
  },
  type: {
    type: DataTypes.ENUM('direct_website', 'ota', 'gds', 'travel_agent', 'corporate', 'phone', 'email', 'walk_in', 'mobile_app'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'API key for integration'
  },
  apiSecret: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'API secret for integration'
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 50
    }
  },
  commissionType: {
    type: DataTypes.ENUM('percentage', 'fixed', 'hybrid'),
    defaultValue: 'percentage'
  },
  fixedCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  paymentTerms: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contractStart: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  contractEnd: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isConnected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastSync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncFrequency: {
    type: DataTypes.ENUM('real_time', 'hourly', 'daily', 'manual'),
    defaultValue: 'real_time'
  },
  mapping: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Field mapping for API integration'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      autoConfirm: false,
      instantBooking: false,
      rateParity: true,
      inventorySync: true,
      rateSync: true,
      bookingSync: true
    }
  },
  statistics: {
    type: DataTypes.JSON,
    defaultValue: {
      totalBookings: 0,
      totalRevenue: 0,
      totalCommission: 0,
      averageBookingValue: 0,
      cancellationRate: 0,
      lastBookingDate: null
    }
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'channels',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['type'] },
    { fields: ['isActive'] },
    { fields: ['isConnected'] },
    { fields: ['commissionRate'] },
    { fields: ['lastSync'] }
  ]
});

module.exports = Channel;