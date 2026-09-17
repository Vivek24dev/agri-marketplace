const express = require('express');
const router = express.Router();
const db = require('../db');

function calculateHaversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * GET /api/storage/nearby
 * Find storage facilities within radius (5km, 10km, 25km, 50km)
 */
router.get('/nearby', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius_km,
      storage_type,
      min_capacity_kg,
      max_price_per_day,
      district
    } = req.query;

    const farmerLat = Number(latitude) || 12.9716;
    const farmerLng = Number(longitude) || 77.5946;
    const radius = Number(radius_km) || 30; // default 30km coverage

    const allStorages = db.getStorageLocations({
      district,
      location_type: storage_type,
      min_capacity: min_capacity_kg,
      max_price: max_price_per_day
    });

    const withDistances = allStorages.map(s => {
      const dist = calculateHaversine(farmerLat, farmerLng, s.latitude, s.longitude);
      return {
        ...s,
        distanceKm: dist,
        distanceText: `${dist} km away`
      };
    });

    // Filter within radius (or include all if radius is large)
    let filtered = withDistances.filter(s => s.distanceKm <= radius);
    if (filtered.length === 0) {
      // Return closest storages so farmer always has options
      filtered = withDistances.slice(0, 4);
    }

    filtered.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      farmerCoordinates: { lat: farmerLat, lng: farmerLng },
      radiusKm: radius,
      count: filtered.length,
      locations: filtered
    });
  } catch (err) {
    console.error('[STORAGE] Error querying nearby storage:', err);
    return res.status(500).json({ error: 'Failed to find nearby storage locations.' });
  }
});

/**
 * GET /api/storage/availability
 * Check specific storage slot capacity and calculate pricing
 */
router.get('/availability', async (req, res) => {
  try {
    const { storageId, checkInDate, checkOutDate, quantity } = req.query;

    if (!storageId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Missing required query parameters.' });
    }

    const storage = db.getStorageLocationById(storageId);
    if (!storage) {
      return res.status(404).json({ error: 'Storage facility not found.' });
    }

    const qty = Number(quantity) || 100;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.max(86400000, end - start);
    const daysNeeded = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const available = storage.available_kg >= qty;
    const totalCost = Math.round(qty * storage.price_per_kg_per_day * daysNeeded * 100) / 100;

    return res.status(200).json({
      storageId: storage.id,
      storageName: storage.name,
      available,
      availableCapacityKg: storage.available_kg,
      requestedQuantityKg: qty,
      checkInDate,
      checkOutDate,
      daysNeeded,
      pricePerKgPerDay: storage.price_per_kg_per_day,
      totalCost,
      breakdown: {
        quantityKg: qty,
        pricePerKgPerDay: storage.price_per_kg_per_day,
        numberOfDays: daysNeeded,
        totalCost
      }
    });
  } catch (err) {
    console.error('[STORAGE] Error calculating storage availability:', err);
    return res.status(500).json({ error: 'Failed to verify availability.' });
  }
});

/**
 * POST /api/storage/booking
 * Book storage facility with instant confirmation slip
 */
router.post('/booking', async (req, res) => {
  try {
    const {
      userId,
      farmerId,
      storageId,
      postId,
      quantity,
      cropType,
      produceGrade,
      produceDescription,
      checkInDate,
      checkOutDate,
      specialRequirements,
      useLogisticsForPickup,
      pickupLocation
    } = req.body;

    const fId = userId || farmerId;
    if (!fId || !storageId || !quantity || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const storage = db.getStorageLocationById(storageId);
    if (!storage) {
      return res.status(404).json({ error: 'Storage facility not found.' });
    }

    const qty = Number(quantity);
    if (storage.available_kg < qty) {
      return res.status(400).json({ error: `Not enough space available. Remaining capacity: ${storage.available_kg} kg.` });
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = Math.max(86400000, end - start);
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalCost = Math.round(qty * storage.price_per_kg_per_day * days * 100) / 100;

    const newBooking = db.createStorageBooking({
      farmer_id: fId,
      storage_id: storageId,
      post_id: postId,
      quantity_kg: qty,
      crop_type: cropType || 'Produce',
      produce_grade: produceGrade || 'A',
      produce_description: produceDescription,
      special_requirements: specialRequirements,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      days,
      price_per_kg_per_day: storage.price_per_kg_per_day,
      total_cost: totalCost
    });

    let logisticsBooking = null;
    if (useLogisticsForPickup) {
      // Auto-schedule pickup truck to deliver produce from farm to storage
      const defaultCarrier = db.getCarriers()[0];
      if (defaultCarrier) {
        logisticsBooking = db.createLogisticsBooking({
          user_id: fId,
          carrier_id: defaultCarrier.id,
          pickup_address: pickupLocation || 'Farmer Farm Gate, Karnataka',
          delivery_address: `${storage.name}, ${storage.address}`,
          delivery_lat: storage.latitude,
          delivery_lng: storage.longitude,
          crop_type: cropType || 'Produce for Cold Storage',
          quantity_kg: qty,
          distance_km: 18.5,
          total_cost: Math.round(defaultCarrier.base_rate + (18.5 * defaultCarrier.rate_per_km)),
          status: 'in_transit'
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Storage successfully reserved at ${storage.name}!`,
      booking: newBooking,
      receiptCode: newBooking.receipt_code,
      logisticsBooking: logisticsBooking
    });
  } catch (err) {
    console.error('[STORAGE] Error booking storage:', err);
    return res.status(500).json({ error: 'Failed to create storage booking.' });
  }
});

/**
 * GET /api/storage/bookings/user/:userId
 * Retrieve all storage reservations for a farmer
 */
router.get('/bookings/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const bookings = db.getUserStorageBookings(userId);
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('[STORAGE] Error loading storage bookings:', err);
    return res.status(500).json({ error: 'Failed to retrieve storage bookings.' });
  }
});

module.exports = router;
