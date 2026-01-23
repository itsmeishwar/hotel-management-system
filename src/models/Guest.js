const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Guest = sequelize.define('Guest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[+]?[\d\s\-\(\)]+$/
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passportNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  idDocumentType: {
    type: DataTypes.ENUM('passport', 'national_id', 'driver_license', 'other'),
    allowNull: true
  },
  idDocumentNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      roomType: '',
      floor: '',
      smokingPreference: 'non_smoking',
      bedType: '',
      pillowType: '',
      allergies: [],
      dietaryRestrictions: [],
      specialRequests: []
    }
  },
  loyaltyProgram: {
    type: DataTypes.JSON,
    defaultValue: {
      memberId: null,
      tier: 'basic',
      points: 0,
      joinDate: null,
      status: 'active'
    }
  },
  guestType: {
    type: DataTypes.ENUM('leisure', 'business', 'group', 'vip', 'long_stay'),
    defaultValue: 'leisure'
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  travelAgent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  blacklisted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  blacklistReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalStays: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  }
}, {
  tableName: 'guests',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['phoneNumber'] },
    { fields: ['lastName', 'firstName'] },
    { fields: ['guestType'] },
    { fields: ['blacklisted'] }
  ]
});

module.exports = Guest;