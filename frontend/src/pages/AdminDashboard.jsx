import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { COMMON_CROPS, KARNATAKA_DISTRICTS, formatDate, formatCurrency } from '../utils/helpers';
import {
  BarChart3,
  Users,
  TrendingUp,
  Tag,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Percent,
  ArrowUpRight,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'users', 'prices'

  // Tab 1: Analytics
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    farmers: 0,
    buyers: 0,
    activePosts: 0,
    completedDeals: 0
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Tab 2: Users
  const [usersList, setUsersList] = useState([]);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Tab 3: Mandi Price Manager
  const [pricesList, setPricesList] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [cropType, setCropType] = useState('Tomato');
  const [district, setDistrict] = useState('Bengaluru');
  const [currentPrice, setCurrentPrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState('');

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/admin/users');
      setUsersList(res.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPrices = async () => {
    setLoadingPrices(true);
    try {
      const res = await api.get('/prices');
      setPricesList(res.data || []);
    } catch (err) {
      console.error('Failed to load prices', err);
    } finally {
      setLoadingPrices(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    fetchPrices();
  }, []);

  // Compute metrics
  const totalDeals = (analytics.activePosts || 0) + (analytics.completedDeals || 0);
  const conversionRate = totalDeals > 0 ? Math.round((analytics.completedDeals / totalDeals) * 100) : 0;
  const totalFB = (analytics.farmers || 0) + (analytics.buyers || 0);
  const farmerRatio = totalFB > 0 ? Math.round((analytics.farmers / totalFB) * 100) : 50;

  // Handle Mandi Price Update
  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    if (!cropType || !district || !currentPrice) {
      alert('Please fill in crop, district, and current price');
      return;
    }

    setUpdatingPrice(true);
    setPriceSuccess('');

    try {
      const numPrice = Number(currentPrice);
      const calculatedMin = minPrice ? Number(minPrice) : Math.round(numPrice * 0.8 * 10) / 10;
      const calculatedMax = maxPrice ? Number(maxPrice) : Math.round(numPrice * 1.2 * 10) / 10;

      await api.post('/admin/prices/update', {
        cropType,
        district,
        price: numPrice,
        minPrice: calculatedMin,
        maxPrice: calculatedMax
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      setPriceSuccess(`Price updated successfully for ${cropType} in ${district}!`);
      setCurrentPrice('');
      setMinPrice('');
      setMaxPrice('');
      fetchPrices();
      setTimeout(() => setPriceSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update mandi price');
    } finally {
      setUpdatingPrice(false);
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    if (userTypeFilter === 'all') return true;
    return u.user_type === userTypeFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                System Administration
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Signed in: {user?.email}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Platform Analytics & Master Controls
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Monitor agricultural ecosystem health, oversee user registrations, and update live APMC benchmarks.
            </p>
          </div>

          {/* Navigation Pill Bar */}
          <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl border border-slate-300/60 overflow-x-auto self-start">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              Users ({usersList.length})
            </button>

            <button
              onClick={() => setActiveTab('prices')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'prices'
                  ? 'bg-white text-blue-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Mandi Prices Manager
            </button>
          </div>
        </div>

        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Top 6 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Card 1: Total Users */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Users
                </span>
                <p className="font-display font-extrabold text-3xl text-blue-600">
                  {analytics.totalUsers}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Registered Platform Users</span>
              </div>

              {/* Card 2: Farmers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Farmers
                </span>
                <p className="font-display font-extrabold text-3xl text-emerald-600">
                  {analytics.farmers}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Active Producers</span>
              </div>

              {/* Card 3: Buyers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-colors">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Buyers
                </span>
                <p className="font-display font-extrabold text-3xl text-purple-600">
                  {analytics.buyers}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Procurement Clients</span>
              </div>

              {/* Card 4: Active Listings */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Listings
                </span>
                <p className="font-display font-extrabold text-3xl text-amber-600">
                  {analytics.activePosts}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Open in Marketplace</span>
              </div>

              {/* Card 5: Completed Deals */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Completed Deals
                </span>
                <p className="font-display font-extrabold text-3xl text-teal-600">
                  {analytics.completedDeals}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Deals Successfully Closed</span>
              </div>

              {/* Card 6: Conversion Rate */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Conversion Rate
                </span>
                <p className="font-display font-extrabold text-3xl text-indigo-600">
                  {conversionRate}%
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Transaction Success Rate</span>
              </div>
            </div>

            {/* Progress Bars Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
                Platform Activity & Ecosystem Ratios
              </h3>

              {/* User Activity */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">User Activity Scale (Current vs Target 100)</span>
                  <span className="text-blue-600 font-bold">{Math.min(100, Math.round((analytics.totalUsers / 100) * 100))}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (analytics.totalUsers / 100) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Farmer-Buyer Ratio */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">Farmer Proportion in Marketplace</span>
                  <span className="text-emerald-600 font-bold">{farmerRatio}% Farmers / {100 - farmerRatio}% Buyers</span>
                </div>
                <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-500"
                    style={{ width: `${farmerRatio}%` }}
                  ></div>
                </div>
              </div>

              {/* Transaction Success */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">Deal Completion Velocity</span>
                  <span className="text-teal-600 font-bold">{conversionRate}% closed deals</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${conversionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">
                  Registered Users Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Manage accounts, contact details, and user verification status
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmers Only</option>
                  <option value="buyer">Buyers Only</option>
                  <option value="admin">Admins Only</option>
                </select>

                <button
                  onClick={fetchUsers}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">District</th>
                    <th className="px-6 py-4">Phone / WhatsApp</th>
                    <th className="px-6 py-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                        Loading user directory...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        No users match the selected role.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                              u.user_type === 'farmer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : u.user_type === 'buyer'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {u.user_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {u.district || 'Bengaluru'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {u.phone || u.whatsapp_number || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MANDI PRICES MANAGER */}
        {activeTab === 'prices' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Update Mandi Price Form (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl text-slate-900">
                    Update APMC Benchmark
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Broadcast official modal rate & price ranges
                  </p>
                </div>
              </div>

              {priceSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{priceSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePriceUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Crop Type
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white font-medium"
                  >
                    {COMMON_CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mandi District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white font-medium"
                  >
                    {KARNATAKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Modal Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 28.00"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Min Price (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 22.00"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Max Price (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 32.00"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPrice}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-display"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{updatingPrice ? 'Updating Rate...' : 'Publish Mandi Benchmark'}</span>
                </button>
              </form>
            </div>

            {/* Right Side: Active Mandi Benchmarks (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    Active Mandi Rates ({pricesList.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live rates synced across all user dashboards
                  </p>
                </div>
                <button
                  onClick={fetchPrices}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingPrices ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
                {pricesList.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{p.crop_type}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {p.district} &bull; {p.market_name}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-extrabold text-base text-blue-700 block">
                        ₹{Number(p.price).toFixed(2)}/kg
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Range: ₹{Number(p.min_price).toFixed(1)} - ₹{Number(p.max_price).toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
