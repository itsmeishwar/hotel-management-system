const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Billing = sequelize.define('Billing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 30]
    }
  },
  reservationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'reservations',
      key: 'id'
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
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'),
    defaultValue: 'draft'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paidDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  taxes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  fees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  discounts: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  amountPaid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'USD'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'mobile_payment', 'room_charge', 'corporate_account'),
    allowNull: true
  },
  paymentDetails: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of billing items with description, quantity, rate, amount'
  },
  roomCharges: {
    type: DataTypes.JSON,
    defaultValue: {
      nightlyRate: 0,
      nights: 0,
      totalRoomCharge: 0
    }
  },
  additionalCharges: {
    type: DataTypes.JSON,
    defaultValue: {
      restaurant: 0,
      bar: 0,
      roomService: 0,
      laundry: 0,
      spa: 0,
      minibar: 0,
      parking: 0,
      internet: 0,
      other: 0
    }
  },
  taxBreakdown: {
    type: DataTypes.JSON,
    defaultValue: {
      accommodationTax: { rate: 0, amount: 0 },
      salesTax: { rate: 0, amount: 0 },
      serviceTax: { rate: 0, amount: 0 },
      otherTaxes: []
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sentVia: {
    type: DataTypes.ENUM('email', 'print', 'portal', 'sms'),
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
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'billing',
  timestamps: true,
  indexes: [
    { fields: ['invoiceNumber'] },
    { fields: ['reservationId'] },
    { fields: ['guestId'] },
    { fields: ['status'] },
    { fields: ['issueDate'] },
    { fields: ['dueDate'] },
    { fields: ['paidDate'] }
  ]
});

module.exports = Billing;