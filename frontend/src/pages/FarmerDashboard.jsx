import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import FPOCard from '../components/FPOCard';
import CVUpload from '../components/CVUpload';
import PriceDisplay from '../components/PriceDisplay';
import PricePredictor from '../components/PricePredictor';
import LogisticsBooking from '../components/LogisticsBooking';
import StorageDiscovery from '../components/StorageDiscovery';
import { COMMON_CROPS, KARNATAKA_DISTRICTS } from '../utils/helpers';
import {
  ShoppingBag,
  PackageCheck,
  Users,
  TrendingUp,
  LineChart,
  Truck,
  Store,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FarmerDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements', 'my-posts', 'fpo', 'prices'

  // Tab 1: Buyer Requirements Feed
  const [buyerPosts, setBuyerPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedCropFilter, setFeedCropFilter] = useState('');

  // Produce Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postCrop, setPostCrop] = useState('Tomato');
  const [postQty, setPostQty] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postGrade, setPostGrade] = useState('A');
  const [postImage, setPostImage] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [postSuccess, setPostSuccess] = useState('');

  // Tab 2: Farmer's Own Posts
  const [myPosts, setMyPosts] = useState([]);
  const [loadingMyPosts, setLoadingMyPosts] = useState(false);

  // Tab 3: FPO State
  const [fpos, setFpos] = useState([]);
  const [loadingFpo, setLoadingFpo] = useState(false);
  const [fpoCrop, setFpoCrop] = useState('Tomato');
  const [fpoTargetQty, setFpoTargetQty] = useState('');
  const [fpoGrade, setFpoGrade] = useState('A');
  const [fpoLocation, setFpoLocation] = useState('');
  const [fpoPrice, setFpoPrice] = useState('');
  const [creatingFpo, setCreatingFpo] = useState(false);
  const [fpoSuccess, setFpoSuccess] = useState('');

  // Load Buyer Feed
  const fetchBuyerPosts = async () => {
    setLoadingFeed(true);
    try {
      const params = { userType: 'farmer' };
      if (feedCropFilter) params.cropType = feedCropFilter;
      const res = await api.get('/posts', { params });
      setBuyerPosts(res.data || []);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Load Farmer's Own Posts
  const fetchMyPosts = async () => {
    if (!user) return;
    setLoadingMyPosts(true);
    try {
      const res = await api.get(`/posts/user/${user.id}`);
      setMyPosts(res.data || []);
    } catch (err) {
      console.error('Failed to load my posts', err);
    } finally {
      setLoadingMyPosts(false);
    }
  };

  // Load FPOs
  const fetchFpos = async () => {
    setLoadingFpo(true);
    try {
      const params = {};
      if (user?.district) params.district = user.district;
      const res = await api.get('/fpo', { params });
      setFpos(res.data || []);
    } catch (err) {
      console.error('Failed to load FPOs', err);
    } finally {
      setLoadingFpo(false);
    }
  };

  useEffect(() => {
    fetchBuyerPosts();
    fetchMyPosts();
    fetchFpos();
  }, [user]);

  // Handle Post Creation
  const handleCreateProduce = async (e) => {
    e.preventDefault();
    if (!postTitle || !postQty || !postPrice) {
      alert('Please fill in title, quantity, and price');
      return;
    }

    setCreatingPost(true);
    setPostSuccess('');

    try {
      await api.post('/posts', {
        userId: user.id,
        title: postTitle,
        description: postDesc,
        category: 'produce',
        cropType: postCrop,
        quantity: Number(postQty),
        pricePerUnit: Number(postPrice),
        grade: postGrade || 'A',
        imageUrl: postImage || null,
        userType: 'farmer'
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });

      setPostSuccess('Produce post published to marketplace feed!');
      setPostTitle('');
      setPostDesc('');
      setPostQty('');
      setPostPrice('');
      setPostImage('');

      fetchMyPosts();
      setTimeout(() => setPostSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create post');
    } finally {
      setCreatingPost(false);
    }
  };

  // Handle Dealing Done
  const handleDealingDone = async (postId) => {
    try {
      await api.post(`/posts/${postId}/dealing-done`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      fetchMyPosts();
      fetchBuyerPosts();
    } catch (err) {
      alert('Failed to mark deal as done');
    }
  };

  // Handle FPO Creation
  const handleCreateFpo = async (e) => {
    e.preventDefault();
    if (!fpoTargetQty || !fpoPrice) {
      alert('Please specify required quantity and expected price');
      return;
    }

    setCreatingFpo(true);
    setFpoSuccess('');

    try {
      await api.post('/fpo', {
        userId: user.id,
        cropType: fpoCrop,
        requiredQuantity: Number(fpoTargetQty),
        grade: fpoGrade,
        location: fpoLocation || `${user.district} Aggregation Hub`,
        price: Number(fpoPrice),
        district: user.district || 'Bengaluru'
      });

      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.6 }
      });

      setFpoSuccess('FPO bulk aggregation pool created!');
      setFpoTargetQty('');
      setFpoPrice('');
      setFpoLocation('');
      fetchFpos();
      setTimeout(() => setFpoSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create FPO');
    } finally {
      setCreatingFpo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Farmer Workspace
              </span>
              <span className="text-xs text-slate-500 font-medium">
                District: {user?.district || 'Bengaluru'}
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Direct Marketplace & Mandi Portal
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Publish produce with computer vision grading, browse buyer demands, aggregate via FPOs, and benchmark APMC rates.
            </p>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl border border-slate-300/60 overflow-x-auto self-start">
            <button
              onClick={() => setActiveTab('requirements')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'requirements'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Buyer Requirements
            </button>

            <button
              onClick={() => setActiveTab('my-posts')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'my-posts'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              My Posts ({myPosts.length})
            </button>

            <button
              onClick={() => setActiveTab('fpo')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'fpo'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              FPO Aggregation
            </button>

            <button
              onClick={() => setActiveTab('prices')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'prices'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Mandi Benchmark
            </button>

            <button
              onClick={() => setActiveTab('predictor')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'predictor'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart className="w-4 h-4 text-emerald-600" />
              Price Predictor
            </button>

            <button
              onClick={() => setActiveTab('logistics')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'logistics'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-600" />
              🚚 Logistics
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-600" />
              🏪 Storage
            </button>
          </div>
        </div>

        {/* TAB 1: BUYER REQUIREMENTS & PRODUCE POSTING */}
        {activeTab === 'requirements' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Create Produce Post (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl text-slate-900">
                    Post Produce for Sale
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Include produce photo for AI Computer Vision verification
                  </p>
                </div>
              </div>

              {postSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{postSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateProduce} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Listing Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Tomatoes - Ripe & Red"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Crop Type
                    </label>
                    <select
                      value={postCrop}
                      onChange={(e) => setPostCrop(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                    >
                      {COMMON_CROPS.map((crop) => (
                        <option key={crop} value={crop}>
                          {crop}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quantity (kg)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="50"
                      value={postQty}
                      onChange={(e) => setPostQty(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Price / kg (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      required
                      placeholder="25"
                      value={postPrice}
                      onChange={(e) => setPostPrice(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="High quality tomatoes from my farm. Price negotiable on bulk dispatch."
                    value={postDesc}
                    onChange={(e) => setPostDesc(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                {/* CV Upload Component */}
                <div className="pt-1">
                  <CVUpload
                    onGradeAssigned={(grade, imgUrl) => {
                      setPostGrade(grade);
                      setPostImage(imgUrl);
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingPost}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-display"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{creatingPost ? 'Publishing Post...' : 'Publish Produce Post'}</span>
                </button>
              </form>
            </div>

            {/* Right Side: Buyer Requirements Feed (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900">
                    Live Buyer Demands & Orders
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verified bulk buyers seeking agricultural produce
                  </p>
                </div>

                {/* Filter by crop */}
                <div className="flex items-center gap-2">
                  <select
                    value={feedCropFilter}
                    onChange={(e) => {
                      setFeedCropFilter(e.target.value);
                      setTimeout(() => fetchBuyerPosts(), 50);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Crop Demands</option>
                    {COMMON_CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={fetchBuyerPosts}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                    title="Refresh feed"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingFeed ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {loadingFeed ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs text-slate-500">Loading buyer requirements...</p>
                </div>
              ) : buyerPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">No active buyer requirements right now</h3>
                  <p className="text-xs text-slate-500 mt-1">Check back soon or post your produce on the left!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {buyerPosts.map((post) => (
                    <PostCard key={post.id} post={post} isOwner={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MY POSTS */}
        {activeTab === 'my-posts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h2 className="font-display font-extrabold text-xl text-slate-900">
                  My Active Produce Listings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Produce posted by you currently visible to buyers in the marketplace
                </p>
              </div>
              <button
                onClick={fetchMyPosts}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMyPosts ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingMyPosts ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs text-slate-500">Loading your produce listings...</p>
              </div>
            ) : myPosts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                <PackageCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">You have no active produce listings</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Switch to the "Buyer Requirements" tab to post your harvested produce!
                </p>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700"
                >
                  Create Your First Produce Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={true}
                    onDealingDone={handleDealingDone}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FPO BULK AGGREGATION */}
        {activeTab === 'fpo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Create FPO (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-xl text-slate-900">
                    Initiate FPO Aggregation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Combine volumes with nearby farmers to meet bulk transport & commercial contracts
                  </p>
                </div>
              </div>

              {fpoSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{fpoSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateFpo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Crop Type
                  </label>
                  <select
                    value={fpoCrop}
                    onChange={(e) => setFpoCrop(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white font-medium"
                  >
                    {COMMON_CROPS.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Quantity (kg)
                    </label>
                    <input
                      type="number"
                      min="10"
                      required
                      placeholder="e.g. 200"
                      value={fpoTargetQty}
                      onChange={(e) => setFpoTargetQty(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Price / kg (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      required
                      placeholder="25"
                      value={fpoPrice}
                      onChange={(e) => setFpoPrice(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quality Grade Required
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['A', 'B', 'C'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFpoGrade(g)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          fpoGrade === g
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hub Location Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Devanahalli Farm Cluster, Bengaluru Rural"
                    value={fpoLocation}
                    onChange={(e) => setFpoLocation(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingFpo}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-display"
                >
                  <Users className="w-4 h-4" />
                  <span>{creatingFpo ? 'Creating FPO Cluster...' : 'Launch FPO Aggregation'}</span>
                </button>
              </form>
            </div>

            {/* Right Side: Available FPOs in District (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900">
                    Active FPO Pools ({user?.district || 'Karnataka'})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Join ongoing aggregation pools to combine your harvest with fellow farmers
                  </p>
                </div>
                <button
                  onClick={fetchFpos}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingFpo ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingFpo ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs text-slate-500">Loading FPO pools...</p>
                </div>
              ) : fpos.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
                  <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">No active FPO clusters in your district</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Start the first FPO pool using the form on the left!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fpos.map((fpo) => (
                    <FPOCard
                      key={fpo.id}
                      fpo={fpo}
                      currentUserId={user?.id}
                      onUpdated={fetchFpos}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MANDI PRICES BENCHMARK */}
        {activeTab === 'prices' && (
          <div className="space-y-6">
            <PriceDisplay />
          </div>
        )}

        {/* TAB 5: AI PRICE PREDICTOR */}
        {activeTab === 'predictor' && (
          <div className="space-y-6">
            <PricePredictor />
          </div>
        )}

        {/* TAB 6: LOGISTICS & VEHICLE TRANSPORT */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            <LogisticsBooking />
          </div>
        )}

        {/* TAB 7: NEARBY COLD STORAGE & WAREHOUSE DISCOVERY */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            <StorageDiscovery onBookLogisticsRedirect={() => setActiveTab('logistics')} />
          </div>
        )}
      </main>
    </div>
  );
}
