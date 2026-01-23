const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details[0].message;
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    next();
  };
};

const schemas = {
  // User schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    phoneNumber: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
    role: Joi.string().valid('admin', 'front_desk', 'housekeeping', 'management', 'finance', 'staff').default('staff'),
    department: Joi.string().optional()
  }),
  
  // Guest schemas
  createGuest: Joi.object({
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    nationality: Joi.string().optional(),
    passportNumber: Joi.string().optional(),
    idDocumentType: Joi.string().valid('passport', 'national_id', 'driver_license', 'other').optional(),
    idDocumentNumber: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().optional()
    }).optional(),
    preferences: Joi.object({
      roomType: Joi.string().optional(),
      floor: Joi.string().optional(),
      smokingPreference: Joi.string().valid('smoking', 'non_smoking').optional(),
      bedType: Joi.string().optional(),
      pillowType: Joi.string().optional(),
      allergies: Joi.array().items(Joi.string()).optional(),
      dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
      specialRequests: Joi.array().items(Joi.string()).optional()
    }).optional(),
    guestType: Joi.string().valid('leisure', 'business', 'group', 'vip', 'long_stay').default('leisure'),
    company: Joi.string().optional(),
    travelAgent: Joi.string().optional(),
    notes: Joi.string().optional()
  }),
  
  updateGuest: Joi.object({
    firstName: Joi.string().min(1).max(100).optional(),
    lastName: Joi.string().min(1).max(100).optional(),
    email: Joi.string().email().optional(),
    phoneNumber: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    nationality: Joi.string().optional(),
    passportNumber: Joi.string().optional(),
    idDocumentType: Joi.string().valid('passport', 'national_id', 'driver_license', 'other').optional(),
    idDocumentNumber: Joi.string().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().optional()
    }).optional(),
    preferences: Joi.object({
      roomType: Joi.string().optional(),
      floor: Joi.string().optional(),
      smokingPreference: Joi.string().valid('smoking', 'non_smoking').optional(),
      bedType: Joi.string().optional(),
      pillowType: Joi.string().optional(),
      allergies: Joi.array().items(Joi.string()).optional(),
      dietaryRestrictions: Joi.array().items(Joi.string()).optional(),
      specialRequests: Joi.array().items(Joi.string()).optional()
    }).optional(),
    guestType: Joi.string().valid('leisure', 'business', 'group', 'vip', 'long_stay').optional(),
    company: Joi.string().optional(),
    travelAgent: Joi.string().optional(),
    notes: Joi.string().optional()
  }),
  
  // Reservation schemas
  createReservation: Joi.object({
    guestId: Joi.string().uuid().required(),
    roomId: Joi.string().uuid().required(),
    checkInDate: Joi.date().iso().required(),
    checkOutDate: Joi.date().iso().min(Joi.ref('checkInDate')).required(),
    adults: Joi.number().integer().min(1).max(10).default(1),
    children: Joi.number().integer().min(0).max(10).default(0),
    roomRate: Joi.number().decimal().min(0).required(),
    totalAmount: Joi.number().decimal().min(0).required(),
    deposit: Joi.number().decimal().min(0).default(0),
    bookingSource: Joi.string().valid('direct', 'website', 'phone', 'email', 'booking_com', 'expedia', 'ota', 'travel_agent', 'corporate', 'walk_in').default('direct'),
    bookingChannel: Joi.string().optional(),
    specialRequests: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().optional(),
    guaranteed: Joi.boolean().default(false),
    guaranteeType: Joi.string().valid('credit_card', 'deposit', 'corporate', 'travel_agent').optional()
  }),
  
  updateReservation: Joi.object({
    roomId: Joi.string().uuid().optional(),
    checkInDate: Joi.date().iso().optional(),
    checkOutDate: Joi.date().iso().optional(),
    adults: Joi.number().integer().min(1).max(10).optional(),
    children: Joi.number().integer().min(0).max(10).optional(),
    roomRate: Joi.number().decimal().min(0).optional(),
    totalAmount: Joi.number().decimal().min(0).optional(),
    deposit: Joi.number().decimal().min(0).optional(),
    specialRequests: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().optional(),
    guaranteed: Joi.boolean().optional(),
    guaranteeType: Joi.string().valid('credit_card', 'deposit', 'corporate', 'travel_agent').optional()
  }),
  
  // Room schemas
  createRoom: Joi.object({
    roomNumber: Joi.string().min(1).max(20).required(),
    roomType: Joi.string().valid('standard', 'deluxe', 'suite', 'executive_suite', 'presidential_suite', 'family_room', 'connecting_room').required(),
    floor: Joi.number().integer().min(1).required(),
    capacity: Joi.number().integer().min(1).max(10).required(),
    bedConfiguration: Joi.object({
      kingBeds: Joi.number().integer().min(0).default(0),
      queenBeds: Joi.number().integer().min(0).default(0),
      doubleBeds: Joi.number().integer().min(0).default(0),
      twinBeds: Joi.number().integer().min(0).default(0),
      sofaBeds: Joi.number().integer().min(0).default(0)
    }).required(),
    basePrice: Joi.number().decimal().min(0).required(),
    size: Joi.number().decimal().min(0).optional(),
    smokingAllowed: Joi.boolean().default(false),
    petFriendly: Joi.boolean().default(false),
    accessible: Joi.boolean().default(false),
    amenities: Joi.object({
      airConditioning: Joi.boolean().default(true),
      heating: Joi.boolean().default(true),
      television: Joi.boolean().default(true),
      wifi: Joi.boolean().default(true),
      minibar: Joi.boolean().default(false),
      safe: Joi.boolean().default(false),
      coffeeMachine: Joi.boolean().default(false),
      balcony: Joi.boolean().default(false),
      oceanView: Joi.boolean().default(false),
      cityView: Joi.boolean().default(false),
      gardenView: Joi.boolean().default(false),
      mountainView: Joi.boolean().default(false),
      bathtub: Joi.boolean().default(false),
      shower: Joi.boolean().default(true),
      kitchenette: Joi.boolean().default(false),
      workDesk: Joi.boolean().default(true),
      ironingBoard: Joi.boolean().default(false),
      hairDryer: Joi.boolean().default(true)
    }).optional()
  }),
  
  updateRoom: Joi.object({
    roomType: Joi.string().valid('standard', 'deluxe', 'suite', 'executive_suite', 'presidential_suite', 'family_room', 'connecting_room').optional(),
    floor: Joi.number().integer().min(1).optional(),
    capacity: Joi.number().integer().min(1).max(10).optional(),
    bedConfiguration: Joi.object({
      kingBeds: Joi.number().integer().min(0).default(0),
      queenBeds: Joi.number().integer().min(0).default(0),
      doubleBeds: Joi.number().integer().min(0).default(0),
      twinBeds: Joi.number().integer().min(0).default(0),
      sofaBeds: Joi.number().integer().min(0).default(0)
    }).optional(),
    basePrice: Joi.number().decimal().min(0).optional(),
    currentPrice: Joi.number().decimal().min(0).optional(),
    status: Joi.string().valid('available', 'occupied', 'maintenance', 'out_of_order', 'cleaning', 'reserved').optional(),
    size: Joi.number().decimal().min(0).optional(),
    smokingAllowed: Joi.boolean().optional(),
    petFriendly: Joi.boolean().optional(),
    accessible: Joi.boolean().optional(),
    amenities: Joi.object({
      airConditioning: Joi.boolean().optional(),
      heating: Joi.boolean().optional(),
      television: Joi.boolean().optional(),
      wifi: Joi.boolean().optional(),
      minibar: Joi.boolean().optional(),
      safe: Joi.boolean().optional(),
      coffeeMachine: Joi.boolean().optional(),
      balcony: Joi.boolean().optional(),
      oceanView: Joi.boolean().optional(),
      cityView: Joi.boolean().optional(),
      gardenView: Joi.boolean().optional(),
      mountainView: Joi.boolean().optional(),
      bathtub: Joi.boolean().optional(),
      shower: Joi.boolean().optional(),
      kitchenette: Joi.boolean().optional(),
      workDesk: Joi.boolean().optional(),
      ironingBoard: Joi.boolean().optional(),
      hairDryer: Joi.boolean().optional()
    }).optional()
  }),
  
  // Query parameter schemas
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

module.exports = {
  validate,
  schemas
};