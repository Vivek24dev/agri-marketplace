# 🚚 TECHNICAL SPECIFICATION
# Google Maps Logistics + Nearby Storage Location Search

**For:** Agro-Market Platform (SIH Agri-Marketplace)  
**New Features:** Farmer Logistics + Storage Location Discovery  
**Platform:** Can be built with Antigravity, No-Code, or Low-Code  
**Status:** Feature Design Document  

---

## 📋 TABLE OF CONTENTS
1. [Feature Overview](#feature-overview)
2. [System Architecture](#️-system-architecture)
3. [Google Maps Integration](#google-maps-integration)
4. [Database Schema Additions](#database-schema-additions)
5. [API Endpoints](#api-endpoints)
6. [Frontend Requirements](#frontend-requirements)
7. [User Flows](#user-flows)
8. [Data Models](#data-models)
9. [Implementation Details](#implementation-details)
10. [Integration Points](#integration-points)
11. [Revenue Model](#revenue-model)
12. [Performance Optimization](#performance-optimization)
13. [Testing Scenarios](#testing-scenarios)
14. [Error Handling](#error-handling)
15. [Security & Privacy](#security--privacy)

---

## FEATURE OVERVIEW

### What We're Adding

#### Feature 1: Google Maps Logistics Service
- **Problem:** Farmers don't know how to transport produce to buyers/markets.
- **Solution:** In-app logistics booking with carrier tracking.
- **Capabilities:**
  - Pickup & delivery location selection via Google Maps
  - Distance calculation (automatic)
  - Estimated cost calculation
  - Carrier availability checking
  - Real-time tracking
  - Delivery confirmation

#### Feature 2: Nearby Storage Location Search
- **Problem:** Farmers need temporary cold storage for produce.
- **Solution:** Discover nearby storage facilities (cold stores, warehouses).
- **Capabilities:**
  - Search storage within 5km, 10km, 25km radius
  - Filter by storage type (cold storage, regular, covered)
  - Check availability & capacity
  - View pricing
  - Book directly
  - Integration with logistics (pickup from storage)

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Farmer Dashboard                                   │   │
│  │  ├─ Logistics Tab (NEW)                             │   │
│  │  │  ├─ Book Pickup/Delivery                         │   │
│  │  │  ├─ View Available Carriers                      │   │
│  │  │  └─ Track Delivery                               │   │
│  │  │                                                   │   │
│  │  ├─ Storage Tab (NEW)                               │   │
│  │  │  ├─ Search Nearby Storage                        │   │
│  │  │  ├─ View Storage Details & Pricing               │   │
│  │  │  └─ Book Storage                                 │   │
│  │  │                                                   │   │
│  │  └─ Maps Component                                  │   │
│  │     ├─ Pickup Location Selector                     │   │
│  │     ├─ Delivery Location Selector                   │   │
│  │     └─ Storage Location Display                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              ↓              ↓              ↓
        HTTP/REST    Google Maps API    WebSocket
              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Logistics Service Routes                           │   │
│  │  ├─ GET /api/logistics/carriers                     │   │
│  │  ├─ POST /api/logistics/booking                     │   │
│  │  ├─ GET /api/logistics/tracking/:bookingId          │   │
│  │  └─ POST /api/logistics/confirm                     │   │
│  │                                                       │   │
│  │  Storage Service Routes                             │   │
│  │  ├─ GET /api/storage/search                         │   │
│  │  ├─ GET /api/storage/nearby                         │   │
│  │  ├─ GET /api/storage/details/:storageId             │   │
│  │  ├─ POST /api/storage/booking                       │   │
│  │  └─ GET /api/storage/availability                   │   │
│  │                                                       │   │
│  │  Google Maps Integration                            │   │
│  │  ├─ Distance Matrix Calculations                    │   │
│  │  ├─ Geocoding (Address ↔ Coordinates)               │   │
│  │  ├─ Nearby Search (Places API)                      │   │
│  │  └─ Route Optimization                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              ↓              ↓              ↓
        PostgreSQL   Google Maps API    Carrier APIs
              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────┐
│                      DATABASES                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Logistics   │  │   Storage    │  │   Carrier    │     │
│  │  Bookings    │  │  Locations   │  │  Tracking    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## GOOGLE MAPS INTEGRATION

### 1. Google Maps API Services Required

#### Service 1: Maps JavaScript API
- **Purpose:** Display maps in frontend.
- **Use Cases:**
  - Show pickup location on map
  - Show delivery location on map
  - Show carrier location (real-time tracking)
  - Show storage locations
- **API Key:** `YOUR_GOOGLE_MAPS_API_KEY`
- **Enabled APIs:**
  - ✅ Maps JavaScript API
  - ✅ Distance Matrix API
  - ✅ Directions API
  - ✅ Geocoding API
  - ✅ Places API
  - ✅ Roads API (optional - for route optimization)

#### Service 2: Distance Matrix API
- **Purpose:** Calculate distance & duration between locations.
- **Use Cases:**
  - Pickup → Delivery distance
  - Farmer location → Storage location distance
  - Cost calculation based on distance
- **Example Request:**
```http
GET https://maps.googleapis.com/maps/api/distancematrix/json
  ?origins=12.9716,77.5946              (Bengaluru)
  &destinations=13.0827,77.6070         (Target)
  &key=YOUR_API_KEY
  &mode=driving
```
- **Example Response:**
```json
{
  "rows": [
    {
      "elements": [
        {
          "distance": { "text": "12.5 km", "value": 12500 },
          "duration": { "text": "25 mins", "value": 1500 },
          "status": "OK"
        }
      ]
    }
  ]
}
```

#### Service 3: Geocoding API
- **Purpose:** Convert addresses ↔ coordinates.
- **Use Cases:**
  - User enters "123 Main Street, Bengaluru"
  - Convert to coordinates (12.9716, 77.5946)
  - For database storage and calculations
- **Example Request:**
```http
GET https://maps.googleapis.com/maps/api/geocode/json
  ?address=123+Main+Street+Bengaluru
  &key=YOUR_API_KEY
```

#### Service 4: Places API (Nearby Search)
- **Purpose:** Find storage locations near farmer.
- **Use Cases:**
  - Search "cold storage" within 5km
  - Search "warehouses" within 10km
  - Get details (address, phone, rating, hours)
- **Example Request:**
```http
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json
  ?location=12.9716,77.5946             (Farmer's coordinates)
  &radius=5000                          (5km in meters)
  &type=point_of_interest
  &keyword=cold+storage
  &key=YOUR_API_KEY
```

---

### 2. Frontend Map Components

#### Component 1: Location Picker Map
- **Purpose:** User selects pickup or delivery location.
- **Features:** Interactive Google Map, Click to select location, Search box (autocomplete), Drag marker to refine location, Show coordinates & address, Save location as favorite.
- **Inputs:**
```javascript
{
  mapId: "pickup-map" | "delivery-map",
  initialLocation: { lat: 12.9716, lng: 77.5946 },
  onLocationSelect: (location) => {},
  zoomLevel: 15,
  allowSearchBox: true,
  allowFavorites: true
}
```
- **Outputs:**
```javascript
{
  latitude: 12.9716,
  longitude: 77.5946,
  address: "123 Main Street, Bengaluru",
  placeId: "ChIJ..."
}
```

#### Component 2: Carrier Tracking Map
- **Purpose:** Show real-time carrier location.
- **Features:** Live marker for carrier, Estimated route, Arrival time countdown, Distance remaining, Updates every 5-30 seconds.
- **Inputs:**
```javascript
{
  bookingId: 123,
  pickupLocation: { lat, lng },
  deliveryLocation: { lat, lng },
  carrierLocation: { lat, lng },    // Updated via WebSocket
  estimatedArrival: "2026-09-17 14:30"
}
```

#### Component 3: Storage Location Map
- **Purpose:** Display nearby storage facilities.
- **Features:** Show multiple storage locations, Color-coded by type (cold, regular, covered), Click for details popup, Distance from farmer, Directions link, Book now button.
- **Inputs:**
```javascript
{
  farmerLocation: { lat, lng },
  storageLocations: [
    {
      id: 1,
      name: "CoolStore Logistics",
      lat: 12.97,
      lng: 77.60,
      type: "cold_storage",
      distance: "2.5 km",
      capacity: "5000 kg",
      available: "2000 kg",
      pricePerDay: 150
    }
  ]
}
```

---

## DATABASE SCHEMA ADDITIONS

### 1. `logistics_carriers` Table
```sql
CREATE TABLE logistics_carriers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    vehicle_type VARCHAR(100),              -- "truck", "auto", "bike"
    capacity_kg DECIMAL(10, 2),             -- Vehicle capacity
    base_location_lat DECIMAL(10, 8),
    base_location_lng DECIMAL(10, 8),
    service_radius_km INT,                  -- Coverage area
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3, 2),                   -- 1-5 stars
    total_deliveries INT DEFAULT 0,
    verified_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_carriers_location ON logistics_carriers(base_location_lat, base_location_lng);
CREATE INDEX idx_carriers_active ON logistics_carriers(is_active);
```

### 2. `logistics_bookings` Table
```sql
CREATE TABLE logistics_bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    carrier_id INTEGER NOT NULL REFERENCES logistics_carriers(id),
    post_id INTEGER REFERENCES posts(id),                -- Which post/item
    
    -- Pickup Details
    pickup_address VARCHAR(500) NOT NULL,
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lng DECIMAL(10, 8) NOT NULL,
    pickup_time TIMESTAMP,
    pickup_confirmed BOOLEAN DEFAULT false,
    
    -- Delivery Details
    delivery_address VARCHAR(500) NOT NULL,
    delivery_lat DECIMAL(10, 8) NOT NULL,
    delivery_lng DECIMAL(10, 8) NOT NULL,
    delivery_time TIMESTAMP,
    delivery_confirmed BOOLEAN DEFAULT false,
    
    -- Route & Cost
    distance_km DECIMAL(10, 2),              -- Calculated by Google Maps
    duration_minutes INT,                    -- Estimated duration
    base_rate DECIMAL(10, 2),                -- Carrier base rate
    distance_rate DECIMAL(10, 2),            -- Rs per km
    total_cost DECIMAL(10, 2),               -- base_rate + (distance_km * distance_rate)
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',    -- pending, confirmed, in_transit, delivered, cancelled
    carrier_lat DECIMAL(10, 8),              -- Current carrier location
    carrier_lng DECIMAL(10, 8),
    
    -- Tracking
    tracking_enabled BOOLEAN DEFAULT true,
    last_location_update TIMESTAMP,
    eta TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON logistics_bookings(user_id);
CREATE INDEX idx_bookings_carrier ON logistics_bookings(carrier_id);
CREATE INDEX idx_bookings_status ON logistics_bookings(status);
CREATE INDEX idx_bookings_post ON logistics_bookings(post_id);
```

### 3. `storage_locations` Table
```sql
CREATE TABLE storage_locations (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- Storage owner (optional)
    name VARCHAR(255) NOT NULL,                               -- "CoolStore Logistics"
    location_type VARCHAR(100) NOT NULL,                      -- "cold_storage", "warehouse", "covered"
    
    -- Location
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(10, 8) NOT NULL,
    
    -- Capacity & Inventory
    total_capacity_kg DECIMAL(12, 2) NOT NULL,               -- Maximum capacity
    current_used_kg DECIMAL(12, 2) DEFAULT 0,                -- Currently used
    available_kg DECIMAL(12, 2) GENERATED ALWAYS AS 
        (total_capacity_kg - current_used_kg) STORED,
    
    -- Facilities
    has_temperature_control BOOLEAN DEFAULT false,
    has_humidity_control BOOLEAN DEFAULT false,
    temperature_range_min INT,              -- Celsius
    temperature_range_max INT,
    humidity_range_min INT,                 -- Percentage
    humidity_range_max INT,
    
    -- Pricing
    price_per_kg_per_day DECIMAL(10, 2) NOT NULL,
    price_per_ton_per_month DECIMAL(10, 2),
    min_storage_days INT DEFAULT 1,
    
    -- Operations
    operating_hours_open VARCHAR(50),       -- "09:00"
    operating_hours_close VARCHAR(50),      -- "18:00"
    accepts_weekend BOOLEAN DEFAULT false,
    
    -- Contact
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    contact_person VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    rating DECIMAL(3, 2),                   -- 1-5 stars
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_storage_location ON storage_locations(latitude, longitude);
CREATE INDEX idx_storage_district ON storage_locations(district);
CREATE INDEX idx_storage_type ON storage_locations(location_type);
CREATE INDEX idx_storage_available ON storage_locations(available_kg);
```

### 4. `storage_bookings` Table
```sql
CREATE TABLE storage_bookings (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_id INTEGER NOT NULL REFERENCES storage_locations(id),
    post_id INTEGER REFERENCES posts(id),               -- Which produce
    
    -- Booking Details
    quantity_kg DECIMAL(10, 2) NOT NULL,
    booking_date TIMESTAMP DEFAULT NOW(),
    check_in_date DATE NOT NULL,
    check_out_date DATE,                    -- Can be extended
    
    -- Cost Calculation
    price_per_kg_per_day DECIMAL(10, 2),
    number_of_days INT GENERATED ALWAYS AS 
        (check_out_date - check_in_date) STORED,
    total_cost DECIMAL(12, 2) GENERATED ALWAYS AS 
        (quantity_kg * price_per_kg_per_day * number_of_days) STORED,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',   -- pending, confirmed, stored, collected, cancelled
    farmer_checked_in BOOLEAN DEFAULT false,
    farmer_checked_out BOOLEAN DEFAULT false,
    
    -- Notes
    produce_description TEXT,               -- Type, quality, condition
    special_requirements TEXT,              -- Temperature, humidity, etc.
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_storage_bookings_farmer ON storage_bookings(farmer_id);
CREATE INDEX idx_storage_bookings_storage ON storage_bookings(storage_id);
CREATE INDEX idx_storage_bookings_status ON storage_bookings(status);
```

### 5. `carrier_tracking` Table (Real-time)
```sql
CREATE TABLE carrier_tracking (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES logistics_bookings(id) ON DELETE CASCADE,
    carrier_id INTEGER NOT NULL REFERENCES logistics_carriers(id),
    
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(10, 8) NOT NULL,
    accuracy_meters INT,
    
    heading INT,                            -- Direction (0-360)
    speed_kmh DECIMAL(10, 2),               -- Current speed
    
    status VARCHAR(50),                     -- "in_transit", "stopped", "delivered"
    
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tracking_booking ON carrier_tracking(booking_id);
CREATE INDEX idx_tracking_recent ON carrier_tracking(timestamp DESC);
```

---

## API ENDPOINTS

### Logistics Service Endpoints

#### 1. `GET /api/logistics/carriers`
- **Purpose:** Get available carriers based on location & requirements.
- **Query Parameters:** `pickup_lat`, `pickup_lng`, `delivery_lat`, `delivery_lng`, `quantity_kg`, `preferred_vehicle_type`
- **Response:**
```json
{
  "carriers": [
    {
      "id": 1,
      "name": "FastTransport",
      "phone": "9876543210",
      "vehicleType": "truck",
      "capacity": "1000 kg",
      "baseRate": 200,
      "ratePerKm": 15,
      "rating": 4.5,
      "estimatedCost": 387.50,
      "estimatedDuration": "25 mins",
      "distance": 12.5,
      "available": true
    }
  ]
}
```

#### 2. `POST /api/logistics/booking`
- **Purpose:** Create a logistics booking.
- **Request Body:** `userId`, `carrierId`, `postId`, `pickupAddress`, `pickupLat`, `pickupLng`, `pickupTime`, `deliveryAddress`, `deliveryLat`, `deliveryLng`, `deliveryTime`, `quantity`
- **Response:**
```json
{
  "bookingId": 123,
  "status": "pending",
  "carrier": { "name": "FastTransport", "phone": "9876543210" },
  "totalCost": 387.50,
  "estimatedArrival": "2026-09-17 10:25",
  "trackingUrl": "/tracking/123",
  "message": "Booking created. Awaiting carrier confirmation."
}
```

#### 3. `GET /api/logistics/tracking/:bookingId`
- **Purpose:** Get real-time tracking updates.
- **Response:**
```json
{
  "bookingId": 123,
  "status": "in_transit",
  "carrier": {
    "name": "FastTransport",
    "phone": "9876543210",
    "currentLocation": { "lat": 12.98, "lng": 77.58 },
    "heading": 45,
    "speed": 45
  },
  "pickupLocation": { "lat": 12.9716, "lng": 77.5946 },
  "deliveryLocation": { "lat": 13.0827, "lng": 77.6070 },
  "distanceRemaining": 5.2,
  "estimatedArrival": "2026-09-17 11:15",
  "updates": [
    {
      "time": "2026-09-17 10:05",
      "message": "Carrier picked up your order",
      "location": { "lat": 12.9716, "lng": 77.5946 }
    }
  ]
}
```

#### 4. `POST /api/logistics/confirm-delivery`
- **Purpose:** Confirm delivery is complete.
- **Request Body:** `bookingId`, `confirmationCode`, `recipientName`, `notes`
- **Response:**
```json
{
  "message": "Delivery confirmed",
  "bookingId": 123,
  "status": "delivered",
  "completedAt": "2026-09-17 11:20"
}
```

---

### Storage Service Endpoints

#### 5. `GET /api/storage/nearby`
- **Purpose:** Find storage locations near farmer.
- **Query Parameters:** `latitude`, `longitude`, `radius_km`, `storage_type`, `min_capacity_kg`, `max_price_per_day`
- **Response:**
```json
{
  "locations": [
    {
      "id": 1,
      "name": "CoolStore Logistics",
      "type": "cold_storage",
      "address": "456 Storage Lane, Bengaluru",
      "distance": "2.5 km",
      "latitude": 12.9850,
      "longitude": 77.5950,
      "capacity": "5000 kg",
      "available": "2000 kg",
      "pricePerKgPerDay": 0.30,
      "temperature": "4°C to 8°C",
      "facilities": ["temperature_control", "humidity_control"],
      "rating": 4.7,
      "phone": "9876543210",
      "workingHours": "09:00 - 18:00",
      "acceptsWeekend": false
    }
  ]
}
```

#### 6. `GET /api/storage/availability`
- **Purpose:** Check specific storage availability.
- **Query Parameters:** `storageId`, `checkInDate`, `checkOutDate`, `quantity`
- **Response:**
```json
{
  "storageId": 1,
  "available": true,
  "availableCapacity": 2000,
  "requestedQuantity": 500,
  "canAccommodate": true,
  "checkInDate": "2026-09-17",
  "checkOutDate": "2026-09-25",
  "daysNeeded": 8,
  "pricePerDay": 150,
  "totalCost": 1200,
  "breakdown": {
    "quantityKg": 500,
    "pricePerKgPerDay": 0.30,
    "numberOfDays": 8,
    "totalCost": 1200
  }
}
```

#### 7. `POST /api/storage/booking`
- **Purpose:** Book storage facility.
- **Request Body:** `userId`, `storageId`, `postId`, `quantity`, `checkInDate`, `checkOutDate`, `produceDescription`, `specialRequirements`, `useLogisticsForPickup`, `pickupLocation`
- **Response:**
```json
{
  "bookingId": 456,
  "storageId": 1,
  "storageName": "CoolStore Logistics",
  "status": "pending",
  "totalCost": 1200,
  "checkInDate": "2026-09-17",
  "checkOutDate": "2026-09-25",
  "confirmationMessage": "Booking confirmed. Please check in by 10:00 AM on check-in date."
}
```

---

## FRONTEND REQUIREMENTS

### 1. Farmer Dashboard - New Logistics Tab (`📦 Logistics`)
- **Section A: Book Delivery:**
  - Pickup Location (interactive Map / address search / user saved location)
  - Delivery Location (interactive Map / destinations)
  - Pickup Date & Time slots (e.g., 08:00, 09:00, 10:00)
  - Quantity & Produce weight (kg), special instructions, link to existing posts
  - Review & Cost calculation breakdown (Base + Distance * Rate)
- **Section B: Available Carriers:**
  - Scrollable carrier cards showing rating, vehicle type, distance, duration, total cost, and select button
- **Section C: Active Bookings:**
  - Booking list with status badges (`Pending`, `In Transit`, `Delivered`), ETA, cost, and live **Track Delivery** modal launcher

### 2. Farmer Dashboard - New Storage Tab (`🏪 Storage`)
- **Section A: Search Storage:**
  - Radius Selector (5 km, 10 km, 25 km)
  - Storage Type filter (`All`, `Cold Storage`, `Warehouse`, `Covered`)
  - Capacity & Price sliders
- **Section B: Storage Cards:**
  - Facility name, type badge, rating, distance, capacity / availability, climate controls, pricing per kg/day, operating hours, direct contact
- **Section C: Storage Booking Modal:**
  - Check-in & check-out date selectors, quantity input, instant duration and total cost calculation, optional pickup logistics link
- **Section D: Active Storage Bookings:**
  - Current storage slips with days remaining, check-in status, and receipt view

### 3. Tracking Map Component (Modal / Full View)
- Real-time carrier trajectory map showing Origin (Pickup) ○──────● (Carrier) ──────○ Destination (Delivery)
- Carrier name, vehicle type, live speed, remaining distance, countdown ETA, driver WhatsApp/Call button, and milestone update log

---

## USER FLOWS

### Flow 1: Book Logistics Service
1. Farmer navigates to **Logistics** Tab.
2. Clicks **Book a Delivery**.
3. Selects Pickup & Delivery locations via Map / Search.
4. Enters weight (kg) and preferred pickup time.
5. System calculates road distance, queries available carriers, and calculates transparent freight fees.
6. Farmer selects suitable carrier and confirms booking.
7. Real-time tracking is enabled with live GPS trajectory, ETA countdown, and SMS / WhatsApp notifications.
8. Driver delivers produce; delivery confirmation is signed / validated.

### Flow 2: Search & Book Nearby Storage
1. Farmer navigates to **Storage** Tab.
2. System auto-discovers facilities within selected radius (e.g. 5 km).
3. Farmer filters by Cold Storage type and verified climate conditions (e.g. 4-8°C).
4. Clicks **Book Now** on facility card.
5. Selects check-in / check-out dates and quantity in kg.
6. Transparent pricing calculates total cost (`kg * rate * days`).
7. Farmer confirms booking; check-in slip with QR/instructions is issued.

---

## REVENUE MODEL (Agro-Market Commission)

### 1. Logistics Service
- Total Booking: ₹387.50
- Platform Commission: **5%** (₹19.38 platform fee)
- Carrier Payout: ₹368.12

### 2. Storage Service
- Total Booking: ₹1,200
- Platform Commission: **10%** (₹120.00 platform fee)
- Facility Payout: ₹1,080.00

### 3. Combined Value Chain
- Farmer uses logistics to transport to storage + stores harvest for higher prices = Compound marketplace revenue!

---

## PERFORMANCE OPTIMIZATION & SECURITY
- **Caching:** Cache nearby storage locations & carrier base rates for 5 minutes; real-time GPS tracking bypasses cache.
- **Database Indexing:** Indexed on `(base_location_lat, base_location_lng)`, `(latitude, longitude)`, and `(booking_id, timestamp DESC)`.
- **Privacy Controls:** Encrypted location coordinates, carrier phone masking, address revealed only upon booking confirmation, automated location history purging after 7 days.

---
*Document Created: September 17, 2026*  
*For: Agro-Market Platform (SIH Agri-Marketplace)*  
