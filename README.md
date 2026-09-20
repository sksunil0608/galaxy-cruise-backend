# Cruise Saga API

Welcome to the Cruise Saga API documentation. This API powers the cruise booking platform and provides endpoints for managing cruises, bookings, users, and more.

## Base URL

```
https://api.cruisesaga.com/
```

## Authentication

All endpoints require authentication via API key.

```
Authorization: Bearer <your_api_key>
```

## Endpoints

### 1. List Cruises

```
GET /cruises
```
Returns a list of available cruises.

#### Response

```json
[
    {
        "id": "cruise_123",
        "name": "Mediterranean Explorer",
        "departure_date": "2024-07-15",
        "duration_days": 7,
        "price": 1200
    }
]
```

### 2. Get Cruise Details

```
GET /cruises/{id}
```
Returns details for a specific cruise.

### 3. Create Booking

```
POST /bookings
```
Creates a new booking.

#### Request

```json
{
    "cruise_id": "cruise_123",
    "user_id": "user_456",
    "guests": 2
}
```

### 4. List Bookings

```
GET /bookings
```
Returns bookings for the authenticated user.

## Error Handling

Errors are returned as JSON:

```json
{
    "error": "Invalid API key"
}
```

## Support

For support, contact [support@cruisesaga.com](mailto:support@cruisesaga.com).

---