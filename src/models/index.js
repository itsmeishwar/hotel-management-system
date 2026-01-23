const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const User = require('./User');
const Guest = require('./Guest');
const Room = require('./Room');
const Reservation = require('./Reservation');
const Billing = require('./Billing');
const Housekeeping = require('./Housekeeping');
const Rate = require('./Rate');
const Channel = require('./Channel');

// Define associations
const models = {
  User,
  Guest,
  Room,
  Reservation,
  Billing,
  Housekeeping,
  Rate,
  Channel
};

// User associations
User.hasMany(Reservation, { foreignKey: 'createdBy', as: 'createdReservations' });
User.hasMany(Reservation, { foreignKey: 'lastModifiedBy', as: 'modifiedReservations' });
User.hasMany(Billing, { foreignKey: 'createdBy', as: 'createdBilling' });
User.hasMany(Billing, { foreignKey: 'approvedBy', as: 'approvedBilling' });
User.hasMany(Housekeeping, { foreignKey: 'assignedTo', as: 'assignedTasks' });
User.hasMany(Housekeeping, { foreignKey: 'createdBy', as: 'createdTasks' });
User.hasMany(Housekeeping, { foreignKey: 'completedBy', as: 'completedTasks' });
User.hasMany(Housekeeping, { foreignKey: 'inspectedBy', as: 'inspectedTasks' });
User.hasMany(Rate, { foreignKey: 'createdBy', as: 'createdRates' });
User.hasMany(Rate, { foreignKey: 'lastModifiedBy', as: 'modifiedRates' });
User.hasMany(Channel, { foreignKey: 'createdBy', as: 'createdChannels' });
User.hasMany(Channel, { foreignKey: 'lastModifiedBy', as: 'modifiedChannels' });

// Guest associations
Guest.hasMany(Reservation, { foreignKey: 'guestId', as: 'reservations' });
Guest.hasMany(Billing, { foreignKey: 'guestId', as: 'billing' });

// Room associations
Room.hasMany(Reservation, { foreignKey: 'roomId', as: 'reservations' });
Room.hasMany(Housekeeping, { foreignKey: 'roomId', as: 'housekeepingTasks' });

// Reservation associations
Reservation.belongsTo(Guest, { foreignKey: 'guestId', as: 'guest' });
Reservation.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Reservation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Reservation.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'modifier' });
Reservation.hasMany(Billing, { foreignKey: 'reservationId', as: 'billing' });
Reservation.hasMany(Housekeeping, { foreignKey: 'reservationId', as: 'housekeepingTasks' });

// Billing associations
Billing.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });
Billing.belongsTo(Guest, { foreignKey: 'guestId', as: 'guest' });
Billing.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Billing.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Housekeeping associations
Housekeeping.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Housekeeping.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Housekeeping.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Housekeeping.belongsTo(User, { foreignKey: 'completedBy', as: 'completer' });
Housekeeping.belongsTo(User, { foreignKey: 'inspectedBy', as: 'inspector' });
Housekeeping.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });

// Rate associations
Rate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Rate.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'modifier' });

// Channel associations
Channel.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Channel.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'modifier' });

// Reverse associations
Reservation.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Reservation.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'lastModifiedByUser' });
Billing.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Billing.belongsTo(User, { foreignKey: 'approvedBy', as: 'approvedByUser' });
Housekeeping.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedToUser' });
Housekeeping.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Housekeeping.belongsTo(User, { foreignKey: 'completedBy', as: 'completedByUser' });
Housekeeping.belongsTo(User, { foreignKey: 'inspectedBy', as: 'inspectedByUser' });
Rate.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Rate.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'lastModifiedByUser' });
Channel.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });
Channel.belongsTo(User, { foreignKey: 'lastModifiedBy', as: 'lastModifiedByUser' });

// Export models and associations
module.exports = {
  sequelize,
  ...models
};