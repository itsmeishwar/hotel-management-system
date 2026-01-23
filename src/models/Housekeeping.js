const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const Housekeeping = sequelize.define('Housekeeping', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rooms',
      key: 'id'
    }
  },
  taskType: {
    type: DataTypes.ENUM('cleaning', 'deep_cleaning', 'turnover', 'maintenance', 'inspection', 'turndown', 'laundry', 'restock'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'paused', 'cancelled', 'verified'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes'
  },
  checklist: {
    type: DataTypes.JSON,
    defaultValue: {
      bathroom: false,
      bedroom: false,
      kitchen: false,
      livingRoom: false,
      dusting: false,
      vacuuming: false,
      mopping: false,
      windows: false,
      linens: false,
      towels: false,
      amenities: false,
      minibar: false,
      trash: false
    }
  },
  supplies: {
    type: DataTypes.JSON,
    defaultValue: {
      cleaningProducts: [],
      linens: [],
      amenities: [],
      tools: []
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  guestNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from guest about room condition'
  },
  issues: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of issues found during cleaning'
  },
  maintenanceRequests: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Maintenance requests generated from this task'
  },
  qualityScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  inspectedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  inspectionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  inspectionNotes: {
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
  completedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reservationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'reservations',
      key: 'id'
    }
  }
}, {
  tableName: 'housekeeping',
  timestamps: true,
  indexes: [
    { fields: ['roomId'] },
    { fields: ['assignedTo'] },
    { fields: ['status'] },
    { fields: ['taskType'] },
    { fields: ['priority'] },
    { fields: ['scheduledDate'] },
    { fields: ['createdBy'] }
  ]
});

module.exports = Housekeeping;