const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Haversine formula to compute great-circle distance between two points on Earth (in km)
 * multiplied by road tortuosity factor (~1.25) to approximate actual highway driving distance.
 */
function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 24.5; // fallback average city transit distance
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  const roadFactor = 1.28; // standard road winding coefficient
  return Math.max(3.0, Math.round(straightLine * roadFactor * 10) / 10);
}

/**
 * GET /api/logistics/carriers
 * Returns available carriers with dynamic distance and freight fare calculation
 */
router.get('/carriers', async (req, res) => {
  try {
    const {
      pickup_lat,
      pickup_lng,
      delivery_lat,
      delivery_lng,
      quantity_kg,
      vehicle_type
    } = req.query;

    const qty = Number(quantity_kg) || 100;
    const pLat = Number(pickup_lat);
    const pLng = Number(pickup_lng);
    const dLat = Number(delivery_lat);
    const dLng = Number(delivery_lng);

    const distanceKm = calculateRoadDistance(pLat, pLng, dLat, dLng);
    const durationMinutes = Math.max(15, Math.round((distanceKm / 38) * 60));

    const carriers = db.getCarriers({
      vehicle_type,
      min_capacity: qty
    });

    const carriersWithEstimates = carriers.map(c => {
      const totalCost = Math.round((c.base_rate + (distanceKm * c.rate_per_km)) * 100) / 100;
      const durationHours = Math.floor(durationMinutes / 60);
      const remainingMins = durationMinutes % 60;
      const durationText = durationHours > 0 ? `${durationHours}h ${remainingMins}m` : `${remainingMins} mins`;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        vehicleType: c.vehicle_type,
        vehicleModel: c.vehicle_model,
        capacityKg: c.capacity_kg,
        baseRate: c.base_rate,
        ratePerKm: c.rate_per_km,
        rating: c.rating,
        totalDeliveries: c.total_deliveries,
        verified: c.verified_by_admin,
        estimatedCost: totalCost,
        distanceKm: distanceKm,
        durationMinutes: durationMinutes,
        durationText: durationText,
        available: true,
        availabilityNote: 'Ready for dispatch in 25-40 mins'
      };
    });

    // Sort by best price & rating
    carriersWithEstimates.sort((a, b) => a.estimatedCost - b.estimatedCost);

    return res.status(200).json({
      distanceKm,
      durationMinutes,
      carriers: carriersWithEstimates
    });
  } catch (err) {
    console.error('[LOGISTICS] Error fetching carriers:', err);
    return res.status(500).json({ error: 'Failed to retrieve logistics carriers.' });
  }
});

/**
 * POST /api/logistics/booking
 * Create a new vehicle transport booking
 */
router.post('/booking', async (req, res) => {
  try {
    const {
      userId,
      carrierId,
      postId,
      pickupAddress,
      pickupLat,
      pickupLng,
      pickupTime,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      deliveryTime,
      cropType,
      quantityKg,
      distanceKm,
      totalCost
    } = req.body;

    if (!userId || !carrierId || !pickupAddress || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required booking parameters (user, carrier, pickup, delivery).' });
    }

    const carrier = db.getCarrierById(carrierId);
    if (!carrier) {
      return res.status(404).json({ error: 'Selected logistics carrier not found.' });
    }

    const pLat = Number(pickupLat) || 12.9716;
    const pLng = Number(pickupLng) || 77.5946;
    const dLat = Number(deliveryLat) || 13.0234;
    const dLng = Number(deliveryLng) || 77.5456;

    const calcDistance = distanceKm ? Number(distanceKm) : calculateRoadDistance(pLat, pLng, dLat, dLng);
    const durationMinutes = Math.max(15, Math.round((calcDistance / 38) * 60));
    const calcCost = totalCost ? Number(totalCost) : Math.round((carrier.base_rate + (calcDistance * carrier.rate_per_km)) * 100) / 100;

    const newBooking = db.createLogisticsBooking({
      user_id: userId,
      carrier_id: carrierId,
      post_id: postId,
      pickup_address: pickupAddress,
      pickup_lat: pLat,
      pickup_lng: pLng,
      pickup_time: pickupTime,
      delivery_address: deliveryAddress,
      delivery_lat: dLat,
      delivery_lng: dLng,
      delivery_time: deliveryTime,
      crop_type: cropType || 'Produce Consignment',
      quantity_kg: quantityKg || 100,
      distance_km: calcDistance,
      duration_minutes: durationMinutes,
      base_rate: carrier.base_rate,
      distance_rate: carrier.rate_per_km,
      total_cost: calcCost,
      status: 'in_transit'
    });

    return res.status(201).json({
      success: true,
      message: 'Transport vehicle successfully booked! Driver assigned and en route.',
      booking: newBooking,
      trackingUrl: `/tracking/${newBooking.id}`
    });
  } catch (err) {
    console.error('[LOGISTICS] Error creating booking:', err);
    return res.status(500).json({ error: 'Failed to create logistics booking.' });
  }
});

/**
 * GET /api/logistics/bookings/user/:userId
 * Retrieve all transport bookings for a specific farmer
 */
router.get('/bookings/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const bookings = db.getUserLogisticsBookings(userId);
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('[LOGISTICS] Error fetching user bookings:', err);
    return res.status(500).json({ error: 'Failed to load bookings.' });
  }
});

/**
 * GET /api/logistics/tracking/:bookingId
 * Real-time telemetry, live coordinates, speed, and milestone progress for a booking
 */
router.get('/tracking/:bookingId', async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = db.getLogisticsBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Dynamic progress calculation between pickup and delivery coordinates
    const pLat = booking.pickup_lat;
    const pLng = booking.pickup_lng;
    const dLat = booking.delivery_lat;
    const dLng = booking.delivery_lng;

    // Simulate current carrier location along the vector if in_transit
    let currentLat = booking.carrier_lat || pLat;
    let currentLng = booking.carrier_lng || pLng;
    let speed = booking.carrier_speed_kmh || 42;
    let distRemaining = booking.distance_remaining_km;
    let etaMinutes = booking.estimated_arrival_minutes;

    if (booking.status === 'delivered') {
      currentLat = dLat;
      currentLng = dLng;
      speed = 0;
      distRemaining = 0;
      etaMinutes = 0;
    }

    return res.status(200).json({
      bookingId: booking.id,
      status: booking.status,
      cropType: booking.crop_type,
      quantityKg: booking.quantity_kg,
      carrier: {
        id: booking.carrier_id,
        name: booking.carrier_name,
        phone: booking.carrier_phone,
        vehicleType: booking.vehicle_type,
        vehicleModel: booking.vehicle_model,
        speedKmh: speed,
        headingDegrees: booking.carrier_heading || 45,
        currentLocation: {
          lat: currentLat,
          lng: currentLng
        }
      },
      origin: {
        address: booking.pickup_address,
        lat: pLat,
        lng: pLng,
        time: booking.pickup_time
      },
      destination: {
        address: booking.delivery_address,
        lat: dLat,
        lng: dLng,
        time: booking.delivery_time
      },
      distanceKm: booking.distance_km,
      distanceRemainingKm: distRemaining,
      estimatedArrivalMinutes: etaMinutes,
      eta: booking.eta,
      totalCost: booking.total_cost,
      milestones: booking.milestones || []
    });
  } catch (err) {
    console.error('[LOGISTICS] Error fetching tracking telemetry:', err);
    return res.status(500).json({ error: 'Failed to retrieve tracking data.' });
  }
});

/**
 * POST /api/logistics/confirm-delivery
 * Confirm delivery is completed
 */
router.post('/confirm-delivery', async (req, res) => {
  try {
    const { bookingId, notes } = req.body;
    const booking = db.getLogisticsBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const updatedMilestones = (booking.milestones || []).map(m => ({ ...m, done: true }));
    updatedMilestones.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'Consignment Handover Complete',
      description: notes || 'Recipient signed delivery manifest and accepted cargo in good condition.',
      done: true
    });

    const updated = db.updateLogisticsBooking(bookingId, {
      status: 'delivered',
      delivery_confirmed: true,
      carrier_speed_kmh: 0,
      distance_remaining_km: 0,
      estimated_arrival_minutes: 0,
      milestones: updatedMilestones
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery confirmed successfully!',
      booking: updated
    });
  } catch (err) {
    console.error('[LOGISTICS] Error confirming delivery:', err);
    return res.status(500).json({ error: 'Failed to confirm delivery.' });
  }
});

/**
 * POST /api/logistics/simulate-move/:bookingId
 * Advances the carrier position along the route towards destination (interactive telemetry demo)
 */
router.post('/simulate-move/:bookingId', async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = db.getLogisticsBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.status === 'delivered') {
      return res.status(200).json({ message: 'Already delivered', booking });
    }

    const dLat = booking.delivery_lat;
    const dLng = booking.delivery_lng;
    const currentLat = booking.carrier_lat;
    const currentLng = booking.carrier_lng;

    // Step 20% closer to destination
    const nextLat = currentLat + (dLat - currentLat) * 0.25;
    const nextLng = currentLng + (dLng - currentLng) * 0.25;
    const newRemaining = Math.max(0, Math.round((booking.distance_remaining_km * 0.75) * 10) / 10);
    const newMinutes = Math.max(2, Math.round(booking.estimated_arrival_minutes * 0.75));

    let newStatus = booking.status;
    if (newRemaining <= 0.5) {
      newStatus = 'delivered';
    }

    const updated = db.updateLogisticsBooking(bookingId, {
      carrier_lat: nextLat,
      carrier_lng: nextLng,
      distance_remaining_km: newRemaining,
      estimated_arrival_minutes: newMinutes,
      status: newStatus
    });

    return res.status(200).json({ success: true, booking: updated });
  } catch (err) {
    console.error('[LOGISTICS] Error simulating carrier move:', err);
    return res.status(500).json({ error: 'Failed to simulate movement.' });
  }
});

module.exports = router;
