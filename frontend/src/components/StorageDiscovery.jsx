import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { COMMON_CROPS, KARNATAKA_DISTRICTS, formatCurrency } from '../utils/helpers';
import confetti from 'canvas-confetti';
import {
  Store,
  Snowflake,
  Warehouse,
  ShieldCheck,
  MapPin,
  Clock,
  Thermometer,
  Droplets,
  Calendar,
  CheckCircle2,
  Truck,
  RefreshCw,
  Search,
  X,
  Phone,
  ArrowRight,
  Info
} from 'lucide-react';

const STORAGE_TYPES = [
  { id: 'all', label: 'All Storages' },
  { id: 'cold_storage', label: '❄️ Cold Storage (Refrigerated)' },
  { id: 'warehouse', label: '🌾 Grain Warehouse' },
  { id: 'covered', label: '🛖 Covered Shed' }
];

const RADIUS_OPTIONS = [
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
  { value: 50, label: 'Within 50 km' }
];

export default function StorageDiscovery({ onBookLogisticsRedirect }) {
  const { user } = useAuthStore();

  const [storages, setStorages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(25);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || 'Bengaluru');

  // Booking Modal State
  const [activeFacility, setActiveFacility] = useState(null);
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0]
  );
  const [quantityKg, setQuantityKg] = useState('500');
  const [cropType, setCropType] = useState('Tomato');
  const [produceGrade, setProduceGrade] = useState('A');
  const [specialReqs, setSpecialReqs] = useState('Maintain optimal temperature between 4-8°C');
  const [bundleLogistics, setBundleLogistics] = useState(true);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // User's active storage bookings
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Fetch nearby storages
  const fetchStorages = async () => {
    setLoading(true);
    try {
      const params = {
        radius_km: selectedRadius,
        district: selectedDistrict !== 'All' ? selectedDistrict : undefined
      };
      if (selectedType !== 'all') params.storage_type = selectedType;

      const res = await api.get('/storage/nearby', { params });
      setStorages(res.data.locations || []);
    } catch (err) {
      console.error('Failed to query storage facilities', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's existing reservations
  const fetchUserBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const res = await api.get(`/storage/bookings/user/${user.id}`);
      setUserBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load user storage bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchStorages();
    fetchUserBookings();
  }, [selectedRadius, selectedType, selectedDistrict]);

  // Calculate duration and pricing
  const calculateDays = () => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.max(86400000, end - start);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const days = calculateDays();
  const estimatedCost = activeFacility
    ? Math.round(Number(quantityKg || 0) * activeFacility.price_per_kg_per_day * days * 100) / 100
    : 0;

  const handleConfirmReservation = async () => {
    if (!activeFacility) return;
    if (Number(quantityKg) <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        userId: user.id,
        storageId: activeFacility.id,
        quantity: Number(quantityKg),
        cropType,
        produceGrade,
        checkInDate,
        checkOutDate,
        specialRequirements: specialReqs,
        useLogisticsForPickup: bundleLogistics,
        pickupLocation: `${user.district || 'Karnataka'} Farm Gate`
      };

      const res = await api.post('/storage/booking', payload);

      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 }
      });

      setBookingResult(res.data);
      fetchUserBookings();
      fetchStorages();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to complete storage reservation.');
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                <Snowflake className="w-3.5 h-3.5 text-blue-600" />
                Agro Cold Chain & Warehouse Discovery
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Protect harvest perishables and wait for peak mandi prices
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Nearby Storage & Cold Vault Search
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Locate certified cold storage rooms and grain warehouses within 5km to 50km radius. Inspect climate metrics, reserve storage slots, and schedule carrier transport.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchStorages();
                fetchUserBookings();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              Refresh Facilities
            </button>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          {/* Storage Type Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {STORAGE_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Radius & District Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Radius:</span>
              <select
                value={selectedRadius}
                onChange={(e) => setSelectedRadius(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="All">All Districts</option>
                {KARNATAKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Facilities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-extrabold text-xl text-slate-900">
            Available Facilities ({storages.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">Sorted by Nearest Distance</span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <RefreshCw className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Scanning regional agricultural cold chains...</p>
          </div>
        ) : storages.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <Warehouse className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800">No storage facilities found in this perimeter.</h4>
            <p className="text-xs text-slate-500 mt-1">Try expanding the radius to 25 km or 50 km.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storages.map((facility) => {
              const isCold = facility.location_type === 'cold_storage';
              const availableKg = facility.available_kg;
              const totalKg = facility.total_capacity_kg;
              const usagePercent = Math.round(((totalKg - availableKg) / (totalKg || 1)) * 100);

              return (
                <div
                  key={facility.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                        isCold
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isCold ? <Snowflake className="w-3.5 h-3.5 text-blue-600" /> : <Warehouse className="w-3.5 h-3.5 text-amber-600" />}
                        {isCold ? 'Cold Storage' : 'Warehouse'}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {facility.distanceText || `${facility.distanceKm} km`}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-base text-slate-900 line-clamp-1">
                      {facility.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1 line-clamp-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      {facility.address}, {facility.city}
                    </p>

                    {/* Climate Controls Strip */}
                    {isCold && (
                      <div className="mt-4 p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-xs text-blue-900">
                        <div className="flex items-center gap-1.5">
                          <Thermometer className="w-4 h-4 text-blue-600" />
                          <span>{facility.temperature_range_min}°C to {facility.temperature_range_max}°C</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          <span>{facility.humidity_range_min}-{facility.humidity_range_max}% RH</span>
                        </div>
                      </div>
                    )}

                    {/* Capacity Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Capacity Space</span>
                        <span className="font-bold text-slate-800">
                          {facility.available_kg?.toLocaleString()} kg available
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${100 - usagePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Total {facility.total_capacity_kg?.toLocaleString()} kg &bull; {100 - usagePercent}% free
                      </span>
                    </div>

                    {/* Features Tags */}
                    {facility.special_features && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {facility.special_features.slice(0, 2).map((feat, i) => (
                          <span key={i} className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                            &bull; {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer & Action */}
                  <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rate</span>
                      <div className="font-display font-extrabold text-base text-slate-900">
                        ₹{facility.price_per_kg_per_day} <span className="text-xs font-normal text-slate-500">/kg/day</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveFacility(facility);
                        setBookingResult(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Book Slot
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Storage Bookings */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              My Storage Reservations & Slips
            </h3>
            <p className="text-xs text-slate-500">
              Active produce stored in verified warehouses. Extend storage dates or schedule checkout transport.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
            {userBookings.length} Active Slots
          </span>
        </div>

        {loadingBookings ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading stored slips...</p>
          </div>
        ) : userBookings.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Store className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No active produce in storage.</p>
            <p className="text-xs text-slate-500 mt-0.5">Explore the cold storage facilities above to reserve space for your harvest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Slip: {b.receipt_code || `STR-${b.id}`}
                    </span>
                    <span className="text-xs font-display font-bold text-slate-900">
                      {formatCurrency(b.total_cost)}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">
                    {b.storage_name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {b.quantity_kg} kg {b.crop_type} (Grade {b.produce_grade}) &bull; Stored for {b.days} days
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Check-In</span>
                      <span className="font-semibold text-slate-800">{b.check_in_date}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Check-Out</span>
                      <span className="font-semibold text-slate-800">{b.check_out_date}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Produce Securely Stored
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {activeFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden my-6 animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-white">
                    Reserve Storage Slot
                  </h3>
                  <p className="text-xs text-blue-200 truncate">{activeFacility.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveFacility(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {bookingResult ? (
                <div className="text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xl text-slate-900">
                      Storage Slot Confirmed!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Your produce reservation at <span className="font-semibold">{activeFacility.name}</span> has been confirmed.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reservation Slip:</span>
                      <strong className="font-mono text-emerald-700">{bookingResult.receiptCode}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-semibold text-slate-800">{days} days ({checkInDate} to {checkOutDate})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stored Cargo:</span>
                      <span className="font-semibold text-slate-800">{quantityKg} kg {cropType}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-800">Total Storage Fee:</span>
                      <strong className="font-display font-extrabold text-base text-emerald-700">{formatCurrency(estimatedCost)}</strong>
                    </div>
                  </div>

                  {bookingResult.logisticsBooking && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 text-left flex items-start gap-2.5">
                      <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="block font-bold">Pickup Carrier Dispatched!</strong>
                        A vehicle has been scheduled to transport your harvest to this cold storage facility.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveFacility(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Done & View Slips
                  </button>
                </div>
              ) : (
                <>
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Check-In Date</label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Check-Out Date</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Produce & Quantity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Crop Type</label>
                      <select
                        value={cropType}
                        onChange={(e) => setCropType(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {COMMON_CROPS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        min="50"
                        value={quantityKg}
                        onChange={(e) => setQuantityKg(e.target.value)}
                        className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Transparent Calculation Box */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Rate per kg per day:</span>
                      <strong className="font-semibold text-slate-800">₹{activeFacility.price_per_kg_per_day} /kg</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Storage Duration:</span>
                      <strong className="font-semibold text-slate-800">{days} days</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Cargo Volume:</span>
                      <strong className="font-semibold text-slate-800">{quantityKg} kg</strong>
                    </div>
                    <div className="pt-2 border-t border-blue-200 flex justify-between items-center text-blue-950">
                      <span className="font-bold">Total Storage Cost:</span>
                      <span className="font-display font-extrabold text-lg text-blue-800">
                        {formatCurrency(estimatedCost)}
                      </span>
                    </div>
                  </div>

                  {/* Bundled Logistics Checkbox */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="bundleLogistics"
                      checked={bundleLogistics}
                      onChange={(e) => setBundleLogistics(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="bundleLogistics" className="text-xs text-slate-700 cursor-pointer">
                      <strong className="block font-bold text-slate-900">🚚 Arrange Farm-to-Storage Pickup Truck</strong>
                      Automatically dispatch a verified logistics carrier to collect this produce from your farm gate and deliver to the cold vault.
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveFacility(null)}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReservation}
                      disabled={submittingBooking}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {submittingBooking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Confirming Slot...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm Storage Slot ({formatCurrency(estimatedCost)})
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
