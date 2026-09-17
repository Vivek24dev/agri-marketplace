import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { COMMON_CROPS, KARNATAKA_DISTRICTS, formatCurrency } from '../utils/helpers';
import CarrierTrackingModal from './CarrierTrackingModal';
import MapLocationPicker from './MapLocationPicker';
import confetti from 'canvas-confetti';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  Scale,
  ShieldCheck,
  Star,
  CheckCircle2,
  Navigation,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';

const PRESET_PICKUP_HUBS = [
  { name: 'Devanahalli Farm Cluster, Bengaluru Rural', lat: 13.2483, lng: 77.7126, district: 'Bengaluru' },
  { name: 'Kolar Tomato Valley Farm Gate, Kolar', lat: 13.1362, lng: 78.1291, district: 'Kolar' },
  { name: 'Malur Farm Produce Center, Kolar', lat: 13.0048, lng: 77.9405, district: 'Kolar' },
  { name: 'Nanjangud Banana Farms, Mysuru', lat: 12.1197, lng: 76.6806, district: 'Mysuru' },
  { name: 'Channapatna Agro Farms, Ramanagara', lat: 12.6518, lng: 77.2023, district: 'Ramanagara' },
  { name: 'Belagavi Grain Basin, Belagavi', lat: 15.8497, lng: 74.4977, district: 'Belagavi' }
];

const PRESET_DELIVERY_DESTINATIONS = [
  { name: 'Yeshwantpur APMC Mandi, Bengaluru', lat: 13.0234, lng: 77.5456, district: 'Bengaluru' },
  { name: 'Binny Mill Vegetable Market, Bengaluru', lat: 12.9698, lng: 77.5684, district: 'Bengaluru' },
  { name: 'CoolStore Agri-Cold Logistics Hub, Yeshwantpur', lat: 13.0234, lng: 77.5456, district: 'Bengaluru' },
  { name: 'Bandipalya APMC Yard, Mysuru', lat: 12.2785, lng: 76.6715, district: 'Mysuru' },
  { name: 'Kolar APMC Mandi Yard, Kolar', lat: 13.1362, lng: 78.1291, district: 'Kolar' },
  { name: 'Reliance Fresh Bulk Procurement Hub, Whitefield', lat: 12.9698, lng: 77.7499, district: 'Bengaluru' }
];

const VEHICLE_FILTERS = [
  { id: 'all', label: 'All Vehicles' },
  { id: 'pickup', label: '🛻 Pickup (Bolero)' },
  { id: 'mini_truck', label: '🚐 Mini-Truck (Tata Ace)' },
  { id: 'truck', label: '🚛 Heavy Truck' },
  { id: 'e_loader', label: '⚡ E-Loader (Eco)' }
];

export default function LogisticsBooking() {
  const { user } = useAuthStore();

  // Booking Form State
  const [selectedPickup, setSelectedPickup] = useState(PRESET_PICKUP_HUBS[0]);
  const [customPickup, setCustomPickup] = useState('');
  const [useCustomPickup, setUseCustomPickup] = useState(false);

  const [selectedDelivery, setSelectedDelivery] = useState(PRESET_DELIVERY_DESTINATIONS[0]);
  const [customDelivery, setCustomDelivery] = useState('');
  const [useCustomDelivery, setUseCustomDelivery] = useState(false);

  // Mode: 'map' (Google Map interactive pin selection) or 'dropdown'
  const [pickupMode, setPickupMode] = useState('map');
  const [deliveryMode, setDeliveryMode] = useState('map');

  const [cropType, setCropType] = useState('Tomato');
  const [quantityKg, setQuantityKg] = useState('250');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTimeSlot, setPickupTimeSlot] = useState('10:00 AM');
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Carriers & Calculation State
  const [carriers, setCarriers] = useState([]);
  const [distanceKm, setDistanceKm] = useState(34.2);
  const [durationMinutes, setDurationMinutes] = useState(52);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Deliveries List & Tracking
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  // Fetch available carriers and distance matrix
  const fetchCarriers = async () => {
    setLoadingCarriers(true);
    try {
      const pLat = useCustomPickup ? 12.9716 : selectedPickup.lat;
      const pLng = useCustomPickup ? 77.5946 : selectedPickup.lng;
      const dLat = useCustomDelivery ? 13.0234 : selectedDelivery.lat;
      const dLng = useCustomDelivery ? 77.5456 : selectedDelivery.lng;

      const params = {
        pickup_lat: pLat,
        pickup_lng: pLng,
        delivery_lat: dLat,
        delivery_lng: dLng,
        quantity_kg: quantityKg || 100
      };
      if (vehicleFilter !== 'all') {
        params.vehicle_type = vehicleFilter;
      }

      const res = await api.get('/logistics/carriers', { params });
      setCarriers(res.data.carriers || []);
      setDistanceKm(res.data.distanceKm || 25);
      setDurationMinutes(res.data.durationMinutes || 40);

      if (res.data.carriers && res.data.carriers.length > 0) {
        setSelectedCarrier(res.data.carriers[0]);
      }
    } catch (err) {
      console.error('Failed to load carriers', err);
    } finally {
      setLoadingCarriers(false);
    }
  };

  // Fetch farmer's past/active bookings
  const fetchUserBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const res = await api.get(`/logistics/bookings/user/${user.id}`);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
    fetchUserBookings();
  }, [selectedPickup, selectedDelivery, quantityKg, vehicleFilter, useCustomPickup, useCustomDelivery]);

  const handleCreateBooking = async () => {
    if (!selectedCarrier) {
      alert('Please select a logistics carrier.');
      return;
    }

    const pAddress = useCustomPickup ? customPickup : selectedPickup.name;
    const dAddress = useCustomDelivery ? customDelivery : selectedDelivery.name;

    if (!pAddress || !dAddress) {
      alert('Please provide valid pickup and delivery locations.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const pLat = useCustomPickup ? 12.9716 : selectedPickup.lat;
      const pLng = useCustomPickup ? 77.5946 : selectedPickup.lng;
      const dLat = useCustomDelivery ? 13.0234 : selectedDelivery.lat;
      const dLng = useCustomDelivery ? 77.5456 : selectedDelivery.lng;

      const payload = {
        userId: user.id,
        carrierId: selectedCarrier.id,
        pickupAddress: pAddress,
        pickupLat: pLat,
        pickupLng: pLng,
        pickupTime: `${pickupDate} ${pickupTimeSlot}`,
        deliveryAddress: dAddress,
        deliveryLat: dLat,
        deliveryLng: dLng,
        cropType,
        quantityKg: Number(quantityKg) || 100,
        distanceKm,
        totalCost: selectedCarrier.estimatedCost
      };

      const res = await api.post('/logistics/booking', payload);

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });

      setBookingSuccess(res.data.booking);
      fetchUserBookings();
      setTimeout(() => setBookingSuccess(null), 8000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to book logistics carrier.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Agro-Logistics & Freight Service
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Verified Mandi & Cold Chain Transportation
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Book Farm-to-Mandi Transport Vehicle
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Select pickup from your farm, choose destination APMC mandi or storage facility, get transparent road freight rates, and track your driver live on GPS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchCarriers();
                fetchUserBookings();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCarriers ? 'animate-spin text-emerald-600' : ''}`} />
              Refresh Rates
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {bookingSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-sm flex items-start justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Transport Vehicle Successfully Booked! (Booking #{bookingSuccess.id})</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Driver <span className="font-semibold">{bookingSuccess.carrier_name}</span> has been dispatched. Estimated pickup arrival: ~25 mins.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTrackingId(bookingSuccess.id)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex-shrink-0 cursor-pointer"
          >
            Track Dispatch GPS
          </button>
        </div>
      )}

      {/* 2-Column Booking Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Booking Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display font-extrabold text-lg text-slate-900">
                1. Specify Journey & Cargo Details
              </h3>
              <p className="text-xs text-slate-500">Pick origin farm gate and wholesale delivery destination.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              ~{distanceKm} km Road Transit
            </span>
          </div>

          <div className="space-y-4">
            {/* Pickup Location */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Pickup Origin (Farmer Gate)
                </label>

                {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPickupMode('map')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      pickupMode === 'map'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🗺️ Google Map Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupMode('dropdown')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      pickupMode === 'dropdown'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📋 Dropdown / Text
                  </button>
                </div>
              </div>

              {pickupMode === 'map' ? (
                <MapLocationPicker
                  title="Click or drag pin to mark your Farm Gate"
                  initialLat={selectedPickup.lat}
                  initialLng={selectedPickup.lng}
                  initialAddress={useCustomPickup ? customPickup : selectedPickup.name}
                  presets={PRESET_PICKUP_HUBS}
                  pinType="pickup"
                  onLocationSelect={({ lat, lng, address }) => {
                    setSelectedPickup({ name: address, lat, lng, district: 'Custom Farm' });
                    setCustomPickup(address);
                    setUseCustomPickup(true);
                  }}
                />
              ) : (
                <div>
                  <div className="flex justify-end mb-1.5">
                    <button
                      type="button"
                      onClick={() => setUseCustomPickup(!useCustomPickup)}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      {useCustomPickup ? 'Select Preset Farm Hub' : '+ Custom Address'}
                    </button>
                  </div>
                  {useCustomPickup ? (
                    <input
                      type="text"
                      placeholder="e.g. Survey No. 42, Hoskote Rural, Bengaluru"
                      value={customPickup}
                      onChange={(e) => setCustomPickup(e.target.value)}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={selectedPickup.name}
                      onChange={(e) => {
                        const found = PRESET_PICKUP_HUBS.find(h => h.name === e.target.value);
                        if (found) setSelectedPickup(found);
                      }}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {PRESET_PICKUP_HUBS.map((hub) => (
                        <option key={hub.name} value={hub.name}>
                          📍 {hub.name} ({hub.district})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Destination */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  Delivery Destination (Mandi / Storage)
                </label>

                {/* Mode Selector */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('map')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      deliveryMode === 'map'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🗺️ Google Map Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('dropdown')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      deliveryMode === 'dropdown'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📋 Dropdown / Text
                  </button>
                </div>
              </div>

              {deliveryMode === 'map' ? (
                <MapLocationPicker
                  title="Click or drag pin to mark Mandi or Storage facility"
                  initialLat={selectedDelivery.lat}
                  initialLng={selectedDelivery.lng}
                  initialAddress={useCustomDelivery ? customDelivery : selectedDelivery.name}
                  presets={PRESET_DELIVERY_DESTINATIONS}
                  pinType="delivery"
                  onLocationSelect={({ lat, lng, address }) => {
                    setSelectedDelivery({ name: address, lat, lng, district: 'Custom Destination' });
                    setCustomDelivery(address);
                    setUseCustomDelivery(true);
                  }}
                />
              ) : (
                <div>
                  <div className="flex justify-end mb-1.5">
                    <button
                      type="button"
                      onClick={() => setUseCustomDelivery(!useCustomDelivery)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {useCustomDelivery ? 'Select APMC Mandi' : '+ Custom Address'}
                    </button>
                  </div>
                  {useCustomDelivery ? (
                    <input
                      type="text"
                      placeholder="e.g. Shop 45, APMC Yard Gate 2"
                      value={customDelivery}
                      onChange={(e) => setCustomDelivery(e.target.value)}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={selectedDelivery.name}
                      onChange={(e) => {
                        const found = PRESET_DELIVERY_DESTINATIONS.find(d => d.name === e.target.value);
                        if (found) setSelectedDelivery(found);
                      }}
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {PRESET_DELIVERY_DESTINATIONS.map((dest) => (
                        <option key={dest.name} value={dest.name}>
                          🏁 {dest.name} ({dest.district})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Produce & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Crop Type
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {COMMON_CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Cargo Weight (kg)
                </label>
                <input
                  type="number"
                  min="20"
                  max="10000"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Date & Time Slots */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Time Slot
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="08:00 AM">08:00 AM - Morning Fresh</option>
                  <option value="10:00 AM">10:00 AM - Midday Mandi</option>
                  <option value="01:00 PM">01:00 PM - Afternoon Slot</option>
                  <option value="04:00 PM">04:00 PM - Evening Express</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fare Summary & Distance Matrix Strip */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Calculated Highway Distance: {distanceKm} km
                </div>
                <div className="text-[11px] text-slate-500">
                  Estimated transit: ~{durationMinutes} minutes with live traffic
                </div>
              </div>
            </div>

            {selectedCarrier && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Freight</span>
                <span className="font-display font-extrabold text-xl text-emerald-700">
                  {formatCurrency(selectedCarrier.estimatedCost)}
                </span>
              </div>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={handleCreateBooking}
            disabled={submittingBooking || !selectedCarrier}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm tracking-wide shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {submittingBooking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Assigning Nearest Vehicle...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Confirm Transport Booking ({selectedCarrier ? formatCurrency(selectedCarrier.estimatedCost) : 'Select Carrier'})
              </>
            )}
          </button>
        </div>

        {/* Right Side: Available Carriers (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Available Carriers ({carriers.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">Sorted by Best Value</span>
          </div>

          {/* Vehicle Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {VEHICLE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setVehicleFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  vehicleFilter === f.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Carrier Cards List */}
          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {loadingCarriers ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Checking nearest carrier fleet availability...</p>
              </div>
            ) : carriers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
                <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">No vehicles found for this filter.</p>
                <p className="text-[11px] text-slate-400 mt-1">Try switching to "All Vehicles".</p>
              </div>
            ) : (
              carriers.map((carrier) => {
                const isSelected = selectedCarrier?.id === carrier.id;
                return (
                  <div
                    key={carrier.id}
                    onClick={() => setSelectedCarrier(carrier)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-slate-900">{carrier.name}</h4>
                            {carrier.verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Carrier" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {carrier.vehicleModel} &bull; <span className="font-semibold text-slate-700">{carrier.capacityKg} kg capacity</span>
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1 font-bold text-amber-600">
                              <Star className="w-3 h-3 fill-amber-500" />
                              {carrier.rating} ({carrier.totalDeliveries} trips)
                            </span>
                            <span>&bull;</span>
                            <span className="text-emerald-700 font-semibold">Ready in 30 mins</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[11px] text-slate-400 block">Total Fare</span>
                        <div className="font-display font-extrabold text-base text-slate-900">
                          {formatCurrency(carrier.estimatedCost)}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Base ₹{carrier.baseRate} + ₹{carrier.ratePerKm}/km
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Section C: Farmer's Active & Past Deliveries */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              My Transport Deliveries & Consignments
            </h3>
            <p className="text-xs text-slate-500">
              Monitor active en-route transit, view driver locations on GPS, and inspect delivery receipts.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {bookings.length} Bookings
          </span>
        </div>

        {loadingBookings ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading transport history...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Truck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No transport bookings yet.</p>
            <p className="text-xs text-slate-500 mt-0.5">Use the form above to book your first vehicle for mandi delivery!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => {
              const inTransit = b.status === 'in_transit';
              const delivered = b.status === 'delivered';

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          Booking #{b.id}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          delivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : inTransit
                            ? 'bg-amber-100 text-amber-900 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {delivered ? 'Delivered' : inTransit ? 'In Transit' : b.status}
                        </span>
                      </div>
                      <span className="font-display font-bold text-sm text-slate-900">
                        {formatCurrency(b.total_cost)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {b.crop_type} &bull; <span className="font-semibold text-slate-600">{b.quantity_kg} kg</span>
                    </h4>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="truncate">From: {b.pickup_address}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="truncate">To: {b.delivery_address}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Carrier: <strong className="text-slate-800">{b.carrier_name}</strong></span>
                      <span>{b.distance_km} km</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setActiveTrackingId(b.id)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        inTransit
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {inTransit ? 'Track Live Dispatch GPS' : 'View Journey Details'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Carrier Tracking Modal */}
      {activeTrackingId && (
        <CarrierTrackingModal
          bookingId={activeTrackingId}
          onClose={() => setActiveTrackingId(null)}
          onStatusUpdated={() => fetchUserBookings()}
        />
      )}
    </div>
  );
}
