# Hotel Management System API Documentation

## Overview

The Hotel Management System (HMS) API provides comprehensive functionality for managing hotel operations including guest management, reservations, room management, front desk operations, and housekeeping.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Success Responses

Success responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

---

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff"
}
```

### GET /auth/profile
Get current user profile (requires authentication).

### PUT /auth/profile
Update current user profile (requires authentication).

---

## Guest Management Endpoints

### GET /guests
Get all guests with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `guestType`: Filter by guest type
- `blacklisted`: Filter by blacklist status

**Response:**
```json
{
  "success": true,
  "data": {
    "guests": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

### POST /guests
Create a new guest.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "guestType": "leisure",
  "preferences": {
    "roomType": "deluxe",
    "smokingPreference": "non_smoking"
  }
}
```

### GET /guests/:id
Get guest by ID.

### PUT /guests/:id
Update guest information.

### GET /guests/search
Search guests (min 2 characters).

### GET /guests/statistics
Get guest statistics and analytics.

---

## Reservation Management Endpoints

### GET /reservations
Get all reservations with pagination and filtering.

**Query Parameters:**
- `status`: Filter by status
- `guestId`: Filter by guest ID
- `roomId`: Filter by room ID
- `checkInDate`: Filter by check-in date
- `checkOutDate`: Filter by check-out date
- `bookingSource`: Filter by booking source

### POST /reservations
Create a new reservation.

**Request Body:**
```json
{
  "guestId": "uuid",
  "roomId": "uuid",
  "checkInDate": "2024-01-01",
  "checkOutDate": "2024-01-03",
  "adults": 2,
  "children": 0,
  "roomRate": 149.00,
  "totalAmount": 298.00,
  "bookingSource": "direct"
}
```

### GET /reservations/availability
Check room availability for dates.

**Query Parameters:**
- `checkInDate`: Check-in date
- `checkOutDate`: Check-out date
- `roomType`: Optional room type filter

### POST /reservations/:id/checkin
Check-in guest for reservation.

### POST /reservations/:id/checkout
Check-out guest from reservation.

### POST /reservations/:id/cancel
Cancel reservation.

---

## Room Management Endpoints

### GET /rooms
Get all rooms with pagination and filtering.

**Query Parameters:**
- `roomType`: Filter by room type
- `status`: Filter by status
- `floor`: Filter by floor
- `housekeepingStatus`: Filter by housekeeping status

### GET /rooms/statistics
Get room statistics and occupancy data.

### GET /rooms/floor-overview
Get overview of all floors and room status.

### POST /rooms
Create a new room (admin/management only).

### PUT /rooms/:id/status
Update room status.

### PUT /rooms/:id/housekeeping-status
Update housekeeping status.

---

## Front Desk Operations

### GET /frontdesk/dashboard
Get front desk dashboard with today's activities.

### POST /frontdesk/quick-checkin
Quick check-in process.

### POST /frontdesk/quick-checkout
Quick check-out process.

### POST /frontdesk/walk-in
Process walk-in reservation.

### GET /frontdesk/search-guests
Quick guest search for front desk.

---

## Housekeeping Management

### GET /housekeeping
Get all housekeeping tasks.

### GET /housekeeping/dashboard
Get housekeeping dashboard and statistics.

### GET /housekeeping/my-tasks
Get tasks assigned to current user.

### POST /housekeeping
Create new housekeeping task.

### POST /housekeeping/assign
Assign tasks to staff members.

### POST /housekeeping/:id/inspect
Inspect and verify completed task.

---

## Error Codes

- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required or invalid
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource conflict (e.g., duplicate)
- `500`: Internal Server Error - Server error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Pagination

Most list endpoints support pagination with these parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: Sort order ('asc' or 'desc', default: 'desc')

## Role-Based Access Control

The API implements role-based access control (RBAC):
- `admin`: Full system access
- `management`: Reports and analytics access
- `front_desk`: Guest and reservation management
- `housekeeping`: Housekeeping task management
- `finance`: Billing and financial reports
- `staff`: Basic read access

## Webhooks

The system supports webhooks for real-time notifications:
- New reservations
- Check-ins/check-outs
- Payment confirmations

Configure webhooks in the system settings.

## SDKs and Libraries

Official SDKs are available for:
- JavaScript/Node.js
- Python
- PHP
- Java

See the SDK documentation for installation and usage instructions.