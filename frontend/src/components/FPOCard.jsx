import React, { useState } from 'react';
import { Users, MapPin, TrendingUp, CheckCircle, Plus, ChevronDown, ChevronUp, Truck, ShieldCheck, IndianRupee } from 'lucide-react';
import { formatKg, formatCurrency } from '../utils/helpers';
import api from '../utils/api';
import confetti from 'canvas-confetti';

export default function FPOCard({ fpo, currentUserId, onUpdated }) {
  const [isJoining, setIsJoining] = useState(false);
  const [contributionKg, setContributionKg] = useState('');
  const [showFarmers, setShowFarmers] = useState(false);
  const [joinedFarmers, setJoinedFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const required = Number(fpo.required_quantity || 0);
  const current = Number(fpo.current_quantity || 0);
  const percent = required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;
  const isTargetMet = current >= required;

  const isCreator = Number(fpo.creator_id) === Number(currentUserId);

  const fetchJoinedFarmers = async () => {
    if (showFarmers) {
      setShowFarmers(false);
      return;
    }
    try {
      setLoadingFarmers(true);
      const res = await api.get(`/fpo/${fpo.id}`);
      setJoinedFarmers(res.data.joinedFarmers || []);
      setShowFarmers(true);
    } catch (err) {
      console.error('Failed to load farmers', err);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!contributionKg || Number(contributionKg) <= 0) {
      setError('Please enter a valid contribution in kg');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await api.post(`/fpo/${fpo.id}/join`, {
        userId: currentUserId,
        quantity: Number(contributionKg)
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      setIsJoining(false);
      setContributionKg('');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join FPO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (window.confirm('Mark this FPO as complete and ready for dispatch?')) {
      try {
        await api.post(`/fpo/${fpo.id}/complete`);
        if (onUpdated) onUpdated();
      } catch (err) {
        alert('Failed to complete FPO');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-6">
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                FPO Aggregation Cluster
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Grade {fpo.grade || 'A'}
              </span>
            </div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              {fpo.crop_type} Bulk Pool
            </h3>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 font-medium">Expected Price</span>
            <p className="font-display font-bold text-lg text-emerald-700">₹{fpo.price}/kg</p>
          </div>
        </div>

        {/* Location & Creator */}
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mb-5">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {fpo.location || fpo.district} ({fpo.district})
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Organizer: {fpo.creator_name || 'Farmer Demo'}
          </span>
        </div>

        {/* Dynamic Aggregation Progress Bar */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-5">
          <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <span className="text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Volume Aggregated
            </span>
            <span className="text-emerald-700 font-bold">
              {current} / {required} kg ({percent}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isTargetMet ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${percent}%` }}
            ></div>
          </div>

          {isTargetMet && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              100% Target Reached! Ready for bulk transporter pickup.
            </div>
          )}
        </div>

        {/* Join Form Drawer / Modal State */}
        {isJoining ? (
          <form onSubmit={handleJoin} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl mb-4">
            <p className="text-xs font-bold text-emerald-900 mb-2">
              Contribute your produce volume to this FPO pool:
            </p>
            {error && <p className="text-xs text-red-600 mb-2 font-medium">{error}</p>}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Quantity (kg) e.g. 50"
                  value={contributionKg}
                  onChange={(e) => setContributionKg(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  autoFocus
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">kg</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                {submitting ? 'Adding...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setIsJoining(false)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isJoining && (
            <button
              onClick={() => setIsJoining(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Join Aggregation (+kg)
            </button>
          )}

          <button
            onClick={fetchJoinedFarmers}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Farmers</span>
            {showFarmers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isCreator && (
            <button
              onClick={handleComplete}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 transition-colors"
              title="Close and mark complete"
            >
              Mark Done
            </button>
          )}
        </div>

        {/* Joined Farmers Accordion */}
        {showFarmers && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Participating Farmers ({joinedFarmers.length})
            </h4>
            {loadingFarmers ? (
              <p className="text-xs text-slate-400">Loading farmer contributions...</p>
            ) : joinedFarmers.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No additional farmers have joined yet. Be the first!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {joinedFarmers.map((jf, idx) => (
                  <div
                    key={jf.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{jf.farmer_name}</span>
                      {jf.farmer_phone && (
                        <span className="text-slate-400 text-[11px] block">{jf.farmer_phone}</span>
                      )}
                    </div>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                      +{jf.quantity_contributed} kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
