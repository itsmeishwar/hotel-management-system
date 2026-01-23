const { sequelize } = require('../models');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ force: false, alter: true });
    console.log('Database schema synchronized successfully.');
    
    // Create indexes for better performance
    await createIndexes();
    console.log('Database indexes created successfully.');
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

async function createIndexes() {
  const queryInterface = sequelize.getQueryInterface();
  
  // Performance indexes
  const indexes = [
    // Reservation indexes
    { name: 'idx_reservations_dates', fields: ['check_in_date', 'check_out_date'] },
    { name: 'idx_reservations_status_guest', fields: ['status', 'guest_id'] },
    { name: 'idx_reservations_room_status', fields: ['room_id', 'status'] },
    
    // Room indexes
    { name: 'idx_rooms_status_type', fields: ['status', 'room_type'] },
    { name: 'idx_rooms_floor_status', fields: ['floor', 'status'] },
    
    // Guest indexes
    { name: 'idx_guests_name', fields: ['last_name', 'first_name'] },
    { name: 'idx_guests_type_revenue', fields: ['guest_type', 'total_revenue'] },
    
    // Billing indexes
    { name: 'idx_billing_status_date', fields: ['status', 'issue_date'] },
    { name: 'idx_billing_guest_status', fields: ['guest_id', 'status'] },
    
    // Housekeeping indexes
    { name: 'idx_housekeeping_room_status', fields: ['room_id', 'status'] },
    { name: 'idx_housekeeping_assignee_date', fields: ['assigned_to', 'scheduled_date'] },
    
    // Rate indexes
    { name: 'idx_rates_dates_type', fields: ['effective_date', 'expiry_date', 'rate_type'] },
    { name: 'idx_rates_room_active', fields: ['room_type', 'is_active'] }
  ];
  
  for (const index of indexes) {
    try {
      await queryInterface.addIndex(index.table || null, index.fields, {
        name: index.name,
        unique: index.unique || false
      });
    } catch (error) {
      // Ignore duplicate index errors
      if (!error.message.includes('already exists')) {
        console.warn(`Warning: Could not create index ${index.name}:`, error.message);
      }
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate, createIndexes };