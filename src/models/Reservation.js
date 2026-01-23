const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  confirmationNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 20]
    }
  },
  guestId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'guests',
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rooms',
      key: 'id'
    }
  },
  checkInDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterToday(value) {
        if (value && new Date(value) < new Date()) {
          throw new Error('Check-in date cannot be in the past');
        }
      }
    }
  },
  checkOutDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isAfterCheckIn(value) {
        if (value && this.checkInDate && new Date(value) <= new Date(this.checkInDate)) {
          throw new Error('Check-out date must be after check-in date');
        }
      }
    }
  },
  actualCheckIn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualCheckOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'modified'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'refunded', 'disputed'),
    defaultValue: 'pending'
  },
  adults: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 10
    }
  },
  children: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  roomRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  amountPaid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  deposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  taxes: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  fees: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discounts: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  bookingSource: {
    type: DataTypes.ENUM('direct', 'website', 'phone', 'email', 'booking_com', 'expedia', 'ota', 'travel_agent', 'corporate', 'walk_in'),
    defaultValue: 'direct'
  },
  bookingChannel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specialRequests: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellationPolicy: {
    type: DataTypes.JSON,
    defaultValue: {
      type: 'standard',
      deadline: '24h',
      penalty: 'first_night'
    }
  },
  cancellationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  modificationHistory: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  guaranteed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  guaranteeType: {
    type: DataTypes.ENUM('credit_card', 'deposit', 'corporate', 'travel_agent'),
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
  tableName: 'reservations',
  timestamps: true,
  indexes: [
    { fields: ['confirmationNumber'] },
    { fields: ['guestId'] },
    { fields: ['roomId'] },
    { fields: ['status'] },
    { fields: ['checkInDate'] },
    { fields: ['checkOutDate'] },
    { fields: ['bookingSource'] },
    { fields: ['paymentStatus'] }
  ]
});

module.exports = Reservation;