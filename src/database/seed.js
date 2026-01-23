const { sequelize, User, Guest, Room, Rate, Channel } = require('../models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Starting database seeding...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Clear existing data (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: true });
      console.log('Database cleared and synchronized.');
    }
    
    // Seed users
    await seedUsers();
    
    // Seed rooms
    await seedRooms();
    
    // Seed rates
    await seedRates();
    
    // Seed channels
    await seedChannels();
    
    // Seed sample guests
    await seedGuests();
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const users = [
    {
      email: 'admin@hotel.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      permissions: {
        all: true
      }
    },
    {
      email: 'frontdesk@hotel.com',
      password: hashedPassword,
      firstName: 'Front',
      lastName: 'Desk',
      role: 'front_desk',
      isActive: true,
      permissions: {
        reservations: ['read', 'write', 'delete'],
        guests: ['read', 'write'],
        billing: ['read', 'write'],
        checkin: true,
        checkout: true
      }
    },
    {
      email: 'housekeeping@hotel.com',
      password: hashedPassword,
      firstName: 'House',
      lastName: 'Keeper',
      role: 'housekeeping',
      isActive: true,
      permissions: {
        housekeeping: ['read', 'write', 'delete'],
        rooms: ['read']
      }
    },
    {
      email: 'manager@hotel.com',
      password: hashedPassword,
      firstName: 'Hotel',
      lastName: 'Manager',
      role: 'management',
      isActive: true,
      permissions: {
        reports: ['read'],
        analytics: ['read'],
        users: ['read', 'write'],
        settings: ['read', 'write']
      }
    }
  ];
  
  await User.bulkCreate(users);
  console.log(`${users.length} users created.`);
}

async function seedRooms() {
  console.log('Seeding rooms...');
  
  const rooms = [];
  
  // Standard Rooms (1-10)
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      roomNumber: `100${i}`,
      roomType: 'standard',
      floor: 1,
      capacity: 2,
      bedConfiguration: { queenBeds: 1 },
      basePrice: 99.00,
      currentPrice: 99.00,
      size: 25.00,
      amenities: {
        airConditioning: true,
        heating: true,
        television: true,
        wifi: true,
        minibar: false,
        safe: false,
        coffeeMachine: false,
        balcony: false,
        shower: true,
        workDesk: true,
        hairDryer: true
      }
    });
  }
  
  // Deluxe Rooms (11-20)
  for (let i = 11; i <= 20; i++) {
    rooms.push({
      roomNumber: `200${i - 10}`,
      roomType: 'deluxe',
      floor: 2,
      capacity: 2,
      bedConfiguration: { kingBeds: 1 },
      basePrice: 149.00,
      currentPrice: 149.00,
      size: 35.00,
      amenities: {
        airConditioning: true,
        heating: true,
        television: true,
        wifi: true,
        minibar: true,
        safe: true,
        coffeeMachine: true,
        balcony: true,
        oceanView: i <= 15,
        cityView: i > 15,
        bathtub: true,
        shower: true,
        workDesk: true,
        ironingBoard: true,
        hairDryer: true
      }
    });
  }
  
  // Suites (21-25)
  for (let i = 21; i <= 25; i++) {
    rooms.push({
      roomNumber: `300${i - 20}`,
      roomType: 'suite',
      floor: 3,
      capacity: 4,
      bedConfiguration: { kingBeds: 1, sofaBeds: 1 },
      basePrice: 299.00,
      currentPrice: 299.00,
      size: 55.00,
      amenities: {
        airConditioning: true,
        heating: true,
        television: true,
        wifi: true,
        minibar: true,
        safe: true,
        coffeeMachine: true,
        balcony: true,
        oceanView: true,
        bathtub: true,
        shower: true,
        kitchenette: true,
        workDesk: true,
        ironingBoard: true,
        hairDryer: true
      }
    });
  }
  
  await Room.bulkCreate(rooms);
  console.log(`${rooms.length} rooms created.`);
}

async function seedRates() {
  console.log('Seeding rates...');
  
  const rates = [
    // Standard room rates
    {
      roomType: 'standard',
      rateType: 'base_rate',
      name: 'Standard Room Base Rate',
      amount: 99.00,
      effectiveDate: new Date(),
      occupancyBased: {
        singleOccupancy: 99.00,
        doubleOccupancy: 99.00,
        additionalAdult: 25.00,
        additionalChild: 15.00
      }
    },
    {
      roomType: 'standard',
      rateType: 'promotional_rate',
      name: 'Standard Room Promo Rate',
      amount: 79.00,
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      priority: 1
    },
    
    // Deluxe room rates
    {
      roomType: 'deluxe',
      rateType: 'base_rate',
      name: 'Deluxe Room Base Rate',
      amount: 149.00,
      effectiveDate: new Date(),
      occupancyBased: {
        singleOccupancy: 149.00,
        doubleOccupancy: 149.00,
        additionalAdult: 35.00,
        additionalChild: 20.00
      }
    },
    {
      roomType: 'deluxe',
      rateType: 'seasonal_rate',
      name: 'Deluxe Room Summer Rate',
      amount: 189.00,
      effectiveDate: new Date('2024-06-01'),
      expiryDate: new Date('2024-08-31'),
      priority: 2
    },
    
    // Suite rates
    {
      roomType: 'suite',
      rateType: 'base_rate',
      name: 'Suite Base Rate',
      amount: 299.00,
      effectiveDate: new Date(),
      occupancyBased: {
        singleOccupancy: 299.00,
        doubleOccupancy: 299.00,
        additionalAdult: 50.00,
        additionalChild: 30.00
      }
    },
    {
      roomType: 'suite',
      rateType: 'corporate_rate',
      name: 'Suite Corporate Rate',
      amount: 249.00,
      effectiveDate: new Date(),
      channel: 'corporate',
      priority: 3
    }
  ];
  
  await Rate.bulkCreate(rates);
  console.log(`${rates.length} rates created.`);
}

async function seedChannels() {
  console.log('Seeding channels...');
  
  const channels = [
    {
      name: 'Direct Website',
      type: 'direct_website',
      description: 'Hotel\'s official website',
      website: 'https://hotel-website.com',
      commissionRate: 0,
      isActive: true,
      isConnected: true,
      syncFrequency: 'real_time'
    },
    {
      name: 'Booking.com',
      type: 'ota',
      description: 'Booking.com OTA channel',
      website: 'https://booking.com',
      commissionRate: 15,
      commissionType: 'percentage',
      isActive: true,
      isConnected: false,
      syncFrequency: 'hourly'
    },
    {
      name: 'Expedia',
      type: 'ota',
      description: 'Expedia OTA channel',
      website: 'https://expedia.com',
      commissionRate: 12,
      commissionType: 'percentage',
      isActive: true,
      isConnected: false,
      syncFrequency: 'daily'
    },
    {
      name: 'Phone Booking',
      type: 'phone',
      description: 'Direct phone reservations',
      commissionRate: 0,
      isActive: true,
      syncFrequency: 'manual'
    },
    {
      name: 'Walk-in',
      type: 'walk_in',
      description: 'Guests walking in without reservation',
      commissionRate: 0,
      isActive: true,
      syncFrequency: 'manual'
    }
  ];
  
  await Channel.bulkCreate(channels);
  console.log(`${channels.length} channels created.`);
}

async function seedGuests() {
  console.log('Seeding sample guests...');
  
  const guests = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phoneNumber: '+1234567890',
      guestType: 'leisure',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      },
      preferences: {
        roomType: 'deluxe',
        smokingPreference: 'non_smoking',
        bedType: 'king',
        floor: 'high',
        specialRequests: ['extra pillows', 'late checkout']
      }
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@company.com',
      phoneNumber: '+1234567891',
      guestType: 'business',
      company: 'Tech Corp',
      address: {
        street: '456 Business Ave',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA'
      },
      preferences: {
        roomType: 'standard',
        smokingPreference: 'non_smoking',
        bedType: 'queen',
        specialRequests: ['work desk', 'high-speed internet']
      },
      loyaltyProgram: {
        memberId: 'TC001',
        tier: 'gold',
        points: 1500,
        joinDate: new Date('2023-01-15'),
        status: 'active'
      }
    },
    {
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert.j@email.com',
      phoneNumber: '+1234567892',
      guestType: 'vip',
      address: {
        street: '789 Luxury Ln',
        city: 'Beverly Hills',
        state: 'CA',
        postalCode: '90210',
        country: 'USA'
      },
      preferences: {
        roomType: 'suite',
        smokingPreference: 'non_smoking',
        bedType: 'king',
        floor: 'high',
        specialRequests: ['butler service', 'spa access', 'premium minibar']
      },
      loyaltyProgram: {
        memberId: 'VIP001',
        tier: 'platinum',
        points: 5000,
        joinDate: new Date('2022-03-01'),
        status: 'active'
      }
    }
  ];
  
  await Guest.bulkCreate(guests);
  console.log(`${guests.length} guests created.`);
}

// Run seeding if called directly
if (require.main === module) {
  seed();
}

module.exports = { seed };