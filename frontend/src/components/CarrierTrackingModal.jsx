import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { generateWhatsAppLink, formatCurrency } from '../utils/helpers';
import {
  X,
  Truck,
  MapPin,
  Clock,
  Gauge,
  Phone,
  MessageCircle,
  CheckCircle2,
  Navigation,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function CarrierTrackingModal({ bookingId, onClose, onStatusUpdated }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const fetchTracking = async () => {
    try {
      const res = await api.get(`/logistics/tracking/${bookingId}`);
      setTracking(res.data);
    } catch (err) {
      console.error('Failed to fetch tracking', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 8000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const handleSimulateMove = async () => {
    setSimulating(true);
    try {
      await api.post(`/logistics/simulate-move/${bookingId}`);
      await fetchTracking();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Are you sure you want to confirm receipt of this consignment?')) return;
    setConfirming(true);
    try {
      await api.post('/logistics/confirm-delivery', {
        bookingId,
        notes: 'Farmer confirmed complete and damage-free delivery at destination.'
      });
      await fetchTracking();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  if (!tracking && loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-slate-800">Connecting to GPS Telemetry...</h3>
          <p className="text-xs text-slate-500 mt-1">Retrieving live satellite positioning from carrier vehicle.</p>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  const isDelivered = tracking.status === 'delivered';
  const progressPercent = isDelivered
    ? 100
    : Math.max(10, Math.min(95, Math.round(((tracking.distanceKm - tracking.distanceRemainingKm) / (tracking.distanceKm || 1)) * 100)));

  const waMessage = `Hello ${tracking.carrier.name}, I am tracking Booking #${bookingId} (${tracking.cropType}, ${tracking.quantityKg}kg) on Agro-Market. What is your current location?`;
  const waLink = generateWhatsAppLink(tracking.carrier.phone, waMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full overflow-hidden my-6 animate-fade-in">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  Live Dispatch GPS
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isDelivered ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-950 animate-pulse'
                }`}>
                  {isDelivered ? 'Delivered' : 'In Transit'}
                </span>
              </div>
              <h3 className="font-display font-extrabold text-lg text-white">
                Booking #{bookingId} &bull; {tracking.cropType} ({tracking.quantityKg} kg)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Visual Route Trajectory Map */}
          <div className="relative bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Navigation className="w-3.5 h-3.5" />
                  Route Trajectory ({tracking.distanceKm} km total)
                </div>
                <div className="font-mono text-xs">
                  {isDelivered ? 'Destination Reached' : `${tracking.distanceRemainingKm} km remaining`}
                </div>
              </div>

              {/* Progress SVG Line */}
              <div className="relative py-4">
                <div className="h-2 bg-slate-800 rounded-full w-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Animated Vehicle Icon Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
                  style={{ left: `calc(${progressPercent}% - 14px)` }}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white animate-pulse">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Origin & Destination Footers */}
              <div className="flex justify-between items-start pt-2 text-xs">
                <div className="max-w-[45%]">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Pickup Origin</span>
                  <p className="font-semibold text-slate-200 truncate">{tracking.origin.address}</p>
                </div>
                <div className="max-w-[45%] text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Delivery Destination</span>
                  <p className="font-semibold text-slate-200 truncate">{tracking.destination.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block flex items-center justify-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                Transit Speed
              </span>
              <div className="font-mono font-extrabold text-lg text-slate-800 mt-0.5">
                {tracking.carrier.speedKmh} <span className="text-xs font-medium text-slate-500">km/h</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                ETA Countdown
              </span>
              <div className="font-mono font-extrabold text-lg text-slate-800 mt-0.5">
                {isDelivered ? 'Arrived' : `~${tracking.estimatedArrivalMinutes} mins`}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Freight Cost
              </span>
              <div className="font-mono font-extrabold text-lg text-slate-800 mt-0.5">
                {formatCurrency(tracking.totalCost)}
              </div>
            </div>
          </div>

          {/* Driver & Carrier Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold shadow-xs">
                <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{tracking.carrier.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Verified Carrier
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Vehicle: {tracking.carrier.vehicleModel} &bull; Driver Phone: {tracking.carrier.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${tracking.carrier.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-slate-600" />
                Call Driver
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Delivery Milestone Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Transit Milestones
            </h4>
            <div className="space-y-2.5">
              {tracking.milestones.map((m, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5">
                    {m.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${m.done ? 'text-slate-900' : 'text-slate-500'}`}>
                        {m.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{m.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Interactive Simulation Button */}
          {!isDelivered ? (
            <button
              onClick={handleSimulateMove}
              disabled={simulating}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {simulating ? 'Updating GPS...' : 'Simulate Vehicle Movement (+25% distance)'}
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Delivered & Handed Over
            </span>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {!isDelivered && (
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {confirming ? 'Confirming...' : 'Mark Delivered'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
