import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, RefreshCw, MapPin, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function PriceDisplay() {
  const [prices, setPrices] = useState([]);
  const [crops, setCrops] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchFilters = async () => {
    try {
      const [cropsRes, distsRes] = await Promise.all([
        api.get('/crops'),
        api.get('/districts')
      ]);
      setCrops(cropsRes.data || []);
      setDistricts(distsRes.data || []);
    } catch (err) {
      console.error('Failed to load crops or districts filter', err);
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCrop) params.cropType = selectedCrop;
      if (selectedDistrict) params.district = selectedDistrict;

      const res = await api.get('/prices', { params });
      setPrices(res.data || []);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to load mandi prices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchPrices();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrices();
  };

  const handleReset = () => {
    setSelectedCrop('');
    setSelectedDistrict('');
    setTimeout(() => {
      fetchPrices();
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Controls */}
      <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Crop
            </label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="">All Available Crops ({crops.length})</option>
                {crops.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select District
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="">All Mandi Districts ({districts.length})</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Search Mandi'}</span>
            </button>

            {(selectedCrop || selectedDistrict) && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Mandi Prices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Live Mandi Price Benchmark
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Government APMC market rates across Karnataka mandis
            </p>
          </div>

          <button
            onClick={fetchPrices}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Updated {lastUpdated || 'just now'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Crop</th>
                <th className="px-6 py-4">Mandi & District</th>
                <th className="px-6 py-4 text-right">Modal Price (₹/kg)</th>
                <th className="px-6 py-4 text-right">Min - Max Range</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Fetching market rates...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No mandi entries matching your search criteria.
                  </td>
                </tr>
              ) : (
                prices.map((p) => {
                  const currentP = Number(p.price);
                  const minP = Number(p.min_price);
                  const maxP = Number(p.max_price);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        {p.crop_type}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 block">{p.district}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {p.market_name || 'APMC Yard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-display font-extrabold text-base text-emerald-700">
                          ₹{currentP.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          ₹{minP.toFixed(1)} - ₹{maxP.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
