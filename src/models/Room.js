const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 20]
    }
  },
  roomType: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'executive_suite', 'presidential_suite', 'family_room', 'connecting_room'),
    allowNull: false
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  bedConfiguration: {
    type: DataTypes.JSON,
    defaultValue: {
      kingBeds: 0,
      queenBeds: 0,
      doubleBeds: 0,
      twinBeds: 0,
      sofaBeds: 0
    }
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currentPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'out_of_order', 'cleaning', 'reserved'),
    defaultValue: 'available'
  },
  housekeepingStatus: {
    type: DataTypes.ENUM('clean', 'dirty', 'in_progress', 'needs_inspection'),
    defaultValue: 'clean'
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: {
      airConditioning: true,
      heating: true,
      television: true,
      wifi: true,
      minibar: false,
      safe: false,
      coffeeMachine: false,
      balcony: false,
      oceanView: false,
      cityView: false,
      gardenView: false,
      mountainView: false,
      bathtub: false,
      shower: true,
      kitchenette: false,
      workDesk: true,
      ironingBoard: false,
      hairDryer: true
    }
  },
  size: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Room size in square meters'
  },
  smokingAllowed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  petFriendly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  accessible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Wheelchair accessible'
  },
  lastMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maintenanceNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  occupancyRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: 'Occupancy rate percentage'
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'rooms',
  timestamps: true,
  indexes: [
    { fields: ['roomNumber'] },
    { fields: ['roomType'] },
    { fields: ['status'] },
    { fields: ['floor'] },
    { fields: ['housekeepingStatus'] }
  ]
});

module.exports = Room;