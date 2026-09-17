import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { KARNATAKA_CITIES_AND_VILLAGES, KARNATAKA_DISTRICTS } from '../utils/helpers';
import { MapPin, Search, Check, X, Sprout, Building2, Sparkles, Navigation } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CityVillageSelectorModal({ isOpen, onClose, onLocationSelected }) {
  const { user, updateUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All');
  const [customLocationName, setCustomLocationName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentLocation = user?.city_or_village || user?.district || 'Not selected';

  // Filtered locations
  const filteredLocations = KARNATAKA_CITIES_AND_VILLAGES.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict =
      selectedDistrictFilter === 'All' ||
      loc.district.toLowerCase() === selectedDistrictFilter.toLowerCase();
    return matchesSearch && matchesDistrict;
  });

  const handleSelectLocation = async (loc) => {
    setSaving(true);
    try {
      // 1. Update backend profile if authenticated
      if (user?.id) {
        await api.put('/auth/profile', {
          city_or_village: loc.name,
          district: loc.district,
          lat: loc.lat,
          lng: loc.lng
        }).catch((err) => console.warn('Profile sync warning:', err));
      }

      // 2. Update client authStore state
      updateUser({
        city_or_village: loc.name,
        district: loc.district,
        lat: loc.lat,
        lng: loc.lng
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSavedSuccess(true);
      if (onLocationSelected) {
        onLocationSelected(loc);
      }

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to select location:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customLocationName.trim()) return;

    const loc = {
      name: customLocationName.trim(),
      district: selectedDistrictFilter !== 'All' ? selectedDistrictFilter : user?.district || 'Bengaluru',
      lat: user?.lat || 13.2483,
      lng: user?.lng || 77.7126,
      type: 'village'
    };

    await handleSelectLocation(loc);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-white">
                Choose Your City or Village
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Tailors nearby cold storages, logistics routes, and farmer produce feed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Location Pill */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Currently Active:</span>
            <span className="font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
              {currentLocation}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">
            Role: {user?.userType === 'farmer' ? '🌾 Farmer Gate' : '🛒 Buyer Destination'}
          </span>
        </div>

        {/* Search & District Filter */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search village (e.g. Devanahalli, Maddur, Byadgi, Malur)..."
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* District Quick Filter */}
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Districts (Karnataka)</option>
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </div>

          {/* Location Selection Grid */}
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {filteredLocations.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No matching village or city found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Try clearing your search or enter your custom village below!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredLocations.map((loc) => {
                  const isCurrent = (user?.city_or_village || '') === loc.name;
                  const isVillage = loc.type === 'village';

                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectLocation(loc)}
                      disabled={saving}
                      className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between group cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isVillage
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isVillage ? <Sprout className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                            {loc.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">
                              {loc.district}
                            </span>
                            <span className="text-slate-300">&bull;</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                isVillage
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isVillage ? 'Village' : 'City / APMC'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 ml-2">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 font-semibold flex-shrink-0 ml-2">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Village Option */}
          <div className="pt-3 border-t border-slate-100">
            {!showCustomInput ? (
              <button
                onClick={() => setShowCustomInput(true)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Don't see your village or town?</span>
                <span className="underline">+ Enter custom village</span>
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  placeholder="Enter your village or taluk name..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={saving || !customLocationName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Save Village
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Selecting your village syncs storage distance radar and carrier pickup coordinates.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
