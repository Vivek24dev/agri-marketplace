import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { COMMON_CROPS, KARNATAKA_DISTRICTS, formatCurrency } from '../utils/helpers';
import {
  TrendingUp,
  TrendingDown,
  CloudRain,
  Sun,
  Cloud,
  Thermometer,
  Droplets,
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';

export default function PricePredictor() {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedDistrict, setSelectedDistrict] = useState('Bengaluru');
  const [horizon, setHorizon] = useState('nextWeek'); // 'nextDay', 'nextWeek', 'nextMonth'
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchPrediction = async (crop = selectedCrop, dist = selectedDistrict) => {
    setLoading(true);
    try {
      const res = await api.get('/prices/predict', {
        params: { cropType: crop, district: dist }
      });
      setPrediction(res.data);
    } catch (err) {
      console.error('Failed to load price prediction', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(selectedCrop, selectedDistrict);
  }, []);

  const handleCropChange = (crop) => {
    setSelectedCrop(crop);
    fetchPrediction(crop, selectedDistrict);
  };

  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    fetchPrediction(selectedCrop, dist);
  };

  // Filter time-series based on horizon tab
  const getDisplaySeries = () => {
    if (!prediction || !prediction.timeSeries) return [];
    const all = prediction.timeSeries;

    if (horizon === 'nextDay') {
      // Show last 5 days + today + next 1 day
      return all.filter((p) => p.dayOffset >= -5 && p.dayOffset <= 1);
    } else if (horizon === 'nextWeek') {
      // Show last 7 days + today + next 7 days
      return all.filter((p) => p.dayOffset >= -7 && p.dayOffset <= 7);
    } else {
      // Next Month: show last 10 days + today + next 30 days
      return all.filter((p) => p.dayOffset >= -10 && p.dayOffset <= 30);
    }
  };

  const displaySeries = getDisplaySeries();

  // SVG Chart Geometry calculations
  const svgWidth = 820;
  const svgHeight = 280;
  const padding = { top: 30, right: 35, bottom: 40, left: 55 };

  const minVal = displaySeries.length > 0
    ? Math.max(0, Math.floor(Math.min(...displaySeries.map((p) => p.minPrice || p.price)) * 0.92))
    : 0;
  const maxVal = displaySeries.length > 0
    ? Math.ceil(Math.max(...displaySeries.map((p) => p.maxPrice || p.price)) * 1.08)
    : 100;
  const valRange = maxVal - minVal || 1;

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / Math.max(1, displaySeries.length - 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - ((val - minVal) / valRange) * chartHeight;

  // Split series into historical and forecast paths
  const todayIndex = displaySeries.findIndex((p) => p.dayOffset === 0);

  // Generate SVG path for line
  const createLinePath = (slice) => {
    if (slice.length === 0) return '';
    return slice
      .map((pt, i) => {
        const globalIndex = displaySeries.indexOf(pt);
        const x = getX(globalIndex);
        const y = getY(pt.price);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Generate confidence band area
  const createConfidenceArea = () => {
    const forecastPts = displaySeries.filter((p) => p.dayOffset >= 0);
    if (forecastPts.length === 0) return '';

    const topPath = forecastPts.map((pt) => {
      const idx = displaySeries.indexOf(pt);
      return `${getX(idx)} ${getY(pt.maxPrice)}`;
    });

    const bottomPath = forecastPts.slice().reverse().map((pt) => {
      const idx = displaySeries.indexOf(pt);
      return `${getX(idx)} ${getY(pt.minPrice)}`;
    });

    return `M ${topPath.join(' L ')} L ${bottomPath.join(' L ')} Z`;
  };

  const historicalSlice = displaySeries.filter((p) => p.dayOffset <= 0);
  const forecastSlice = displaySeries.filter((p) => p.dayOffset >= 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                AI Mandi Price Predictor
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Powered by Historical APMC Rates & Regional Weather Telemetry
              </span>
            </div>
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Crop Price Forecast & Optimal Selling Window
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Anticipate price shifts tomorrow, next week, and next month to maximize harvest revenue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Crop Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">Crop:</span>
              <select
                value={selectedCrop}
                onChange={(e) => handleCropChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {COMMON_CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* District Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {KARNATAKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchPrediction()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Refresh Forecast"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Horizon Tabs */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setHorizon('nextDay')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                horizon === 'nextDay'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow (Next Day)
            </button>
            <button
              onClick={() => setHorizon('nextWeek')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                horizon === 'nextWeek'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 7 Days (Week)
            </button>
            <button
              onClick={() => setHorizon('nextMonth')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                horizon === 'nextMonth'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 30 Days (Month)
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 bg-blue-500 inline-block rounded"></span>
              Historical Actuals
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-600 inline-block rounded"></span>
              AI Forecast Curve
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800/80">
              <span className="w-3 h-2 bg-emerald-100/70 border border-emerald-200 inline-block rounded"></span>
              Confidence Interval
            </span>
          </div>
        </div>
      </div>

      {/* 4 Horizon Summary Metric Cards */}
      {prediction && prediction.horizons && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Today Base */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Current APMC Modal Rate
            </span>
            <p className="font-display font-extrabold text-2xl text-slate-900">
              ₹{prediction.basePrice.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/kg</span>
            </p>
            <span className="text-[11px] text-slate-400 font-medium">
              Live Mandi Benchmark
            </span>
          </div>

          {/* Card 2: Next Day */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tomorrow (Next Day)
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  prediction.horizons.nextDay.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {prediction.horizons.nextDay.changePercent >= 0 ? '+' : ''}
                {prediction.horizons.nextDay.changePercent}%
              </span>
            </div>
            <p className="font-display font-extrabold text-2xl text-emerald-700">
              ₹{prediction.horizons.nextDay.price.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/kg</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              {prediction.horizons.nextDay.changePercent >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )}
              {prediction.horizons.nextDay.changePercent >= 0 ? 'Expected gain' : 'Expected dip'}
            </span>
          </div>

          {/* Card 3: Next Week */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Next Week (7 Days)
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  prediction.horizons.nextWeek.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {prediction.horizons.nextWeek.changePercent >= 0 ? '+' : ''}
                {prediction.horizons.nextWeek.changePercent}%
              </span>
            </div>
            <p className="font-display font-extrabold text-2xl text-emerald-700">
              ₹{prediction.horizons.nextWeek.price.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/kg</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Projected 7-Day Peak
            </span>
          </div>

          {/* Card 4: Next Month */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Next Month (30 Days)
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  prediction.horizons.nextMonth.changePercent >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {prediction.horizons.nextMonth.changePercent >= 0 ? '+' : ''}
                {prediction.horizons.nextMonth.changePercent}%
              </span>
            </div>
            <p className="font-display font-extrabold text-2xl text-emerald-800">
              ₹{prediction.horizons.nextMonth.price.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/kg</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium">
              Range: ₹{prediction.horizons.nextMonth.minPrice} - ₹{prediction.horizons.nextMonth.maxPrice}
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive SVG Prediction Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {selectedCrop} Price Trajectory & Forecast Horizon
            </h3>
            <p className="text-xs text-slate-500">
              Market baseline: {prediction?.marketName || `${selectedDistrict} APMC Yard`}
            </p>
          </div>

          {hoveredPoint && (
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-3 shadow-md animate-fade-in">
              <span className="text-slate-300 font-normal">{hoveredPoint.date}:</span>
              <span className="font-bold text-emerald-400 text-sm">₹{hoveredPoint.price.toFixed(2)}/kg</span>
              <span className="text-[11px] text-slate-400">
                (Range: ₹{hoveredPoint.minPrice} - ₹{hoveredPoint.maxPrice})
              </span>
              <span className="text-amber-300">
                {hoveredPoint.weather === 'Rain' ? '🌧️ Rain' : hoveredPoint.weather === 'Sunny' ? '☀️ Sunny' : '⛅ Overcast'}
              </span>
            </div>
          )}
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto max-h-72 select-none"
          >
            <defs>
              {/* Shaded confidence interval gradient */}
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>

              {/* Historical area gradient */}
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartHeight * ratio;
              const priceAtLine = Math.round((maxVal - ratio * valRange) * 10) / 10;
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontWeight="500"
                  >
                    ₹{priceAtLine}
                  </text>
                </g>
              );
            })}

            {/* Confidence Interval Band */}
            {createConfidenceArea() && (
              <path
                d={createConfidenceArea()}
                fill="url(#confidenceGrad)"
                className="transition-all duration-300"
              />
            )}

            {/* Vertical Line for "Today" */}
            {todayIndex !== -1 && (
              <g>
                <line
                  x1={getX(todayIndex)}
                  y1={padding.top - 5}
                  x2={getX(todayIndex)}
                  y2={padding.top + chartHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text
                  x={getX(todayIndex)}
                  y={padding.top - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  fontWeight="bold"
                >
                  TODAY
                </text>
              </g>
            )}

            {/* Historical Solid Line */}
            {createLinePath(historicalSlice) && (
              <path
                d={createLinePath(historicalSlice)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Forecast Dashed Line */}
            {createLinePath(forecastSlice) && (
              <path
                d={createLinePath(forecastSlice)}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Circles on Each Data Point */}
            {displaySeries.map((pt, idx) => {
              const x = getX(idx);
              const y = getY(pt.price);
              const isToday = pt.dayOffset === 0;
              const isForecast = pt.dayOffset > 0;

              return (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Outer glow on hover */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isToday ? 6 : 4}
                    fill={isToday ? '#10b981' : isForecast ? '#34d399' : '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-transform group-hover:scale-150"
                  />
                  {/* Invisible larger target for easy hover */}
                  <circle cx={x} cy={y} r="14" fill="transparent" />

                  {/* X-axis date labels (show every few points to prevent clutter) */}
                  {(idx % Math.ceil(displaySeries.length / 8) === 0 || isToday || idx === displaySeries.length - 1) && (
                    <text
                      x={x}
                      y={svgHeight - padding.bottom + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fill={isToday ? '#0f172a' : '#94a3b8'}
                      fontWeight={isToday ? 'bold' : 'normal'}
                    >
                      {pt.date}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Bottom Row: Weather Telemetry Card & AI Selling Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weather Telemetry Panel (5 cols) */}
        {prediction?.weatherTelemetry && (
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-500" />
                Regional Weather Telemetry
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {prediction.weatherTelemetry.volatilityIndex}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Thermometer className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-medium block">Temperature</span>
                <span className="font-display font-bold text-base text-slate-800">
                  {prediction.weatherTelemetry.temperature}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <CloudRain className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-medium block">Rainfall</span>
                <span className="font-display font-bold text-base text-slate-800">
                  {prediction.weatherTelemetry.rainfall}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <Droplets className="w-4 h-4 mx-auto text-teal-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-medium block">Humidity</span>
                <span className="font-display font-bold text-base text-slate-800">
                  {prediction.weatherTelemetry.humidity}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                Atmospheric Assessment:
              </span>
              <p className="text-slate-600 leading-relaxed font-medium">
                {prediction.weatherTelemetry.condition}. Harvest transport routes in {selectedDistrict} and peripheral farm clusters are experiencing meteorological volatility affecting wholesale mandi supply arrivals.
              </p>
            </div>
          </div>
        )}

        {/* AI Selling Recommendation Advisory (7 cols) */}
        {prediction?.advisory && (
          <div className="lg:col-span-7 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-6 rounded-3xl shadow-md space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/60 px-3 py-1 rounded-full border border-emerald-700/60 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  AI Market Action Recommendation
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  {prediction.advisory.confidenceScore}% Prediction Confidence
                </span>
              </div>

              <h3 className="font-display font-extrabold text-xl text-white tracking-tight mb-2">
                {prediction.advisory.headline}
              </h3>

              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal">
                {prediction.advisory.detail}
              </p>
            </div>

            <div className="pt-3 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-300/80 font-medium">
              <span>Forecast Mode: Adaptive Holt-Winters & Meteorological Telemetry</span>
              <span>Regional Hub: {prediction.marketName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
