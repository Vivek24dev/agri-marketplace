import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Snowflake,
  Warehouse,
  Store,
  MapPin,
  Crosshair,
  Maximize2,
  Navigation,
  Thermometer,
  Droplets,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

export default function StorageMap({
  farmerLat = 12.9716,
  farmerLng = 77.5946,
  radiusKm = 25,
  storages = [],
  onSelectStorage
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [tileLayerRef, setTileLayerRef] = useState(null);

  // Custom marker generator
  const createStorageIcon = (type) => {
    const isCold = type === 'cold_storage';
    const isWarehouse = type === 'warehouse';
    const bg = isCold ? '#2563eb' : isWarehouse ? '#d97706' : '#475569';
    const icon = isCold ? '❄️' : isWarehouse ? '🌾' : '🛖';

    return L.divIcon({
      className: 'storage-map-pin',
      html: `
        <div style="
          background: ${bg};
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          font-size: 16px;
          cursor: pointer;
        ">
          <span style="transform: rotate(45deg);">${icon}</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  };

  const createFarmerIcon = () => {
    return L.divIcon({
      className: 'farmer-map-pin',
      html: `
        <div style="
          background: #059669;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(5,150,105,0.4);
          font-size: 18px;
        ">
          🌾
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [farmerLat, farmerLng],
        zoom: radiusKm <= 10 ? 12 : radiusKm <= 25 ? 11 : 10,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // Google Roadmap Tiles
      const googleRoadmap = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Google Maps'
        }
      ).addTo(map);

      setTileLayerRef(googleRoadmap);

      // Marker Group
      const markersGroup = L.featureGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Storages and Farmer Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Farmer location pin
    const farmerMarker = L.marker([farmerLat, farmerLng], {
      icon: createFarmerIcon()
    }).bindPopup(`
      <div style="font-family: inherit; padding: 4px;">
        <span style="font-size: 11px; font-weight: bold; color: #059669; text-transform: uppercase;">Your Farm Gate</span>
        <h4 style="font-size: 14px; font-weight: 800; margin: 2px 0; color: #0f172a;">Farmer Location</h4>
        <p style="font-size: 11px; color: #64748b; margin: 0;">Search radius: ${radiusKm} km perimeter</p>
      </div>
    `);
    group.addLayer(farmerMarker);

    // Search Perimeter Radius Circle
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }
    const safeRadiusKm = radiusKm === 'all' ? 250 : (Number(radiusKm) || 25);
    const circle = L.circle([farmerLat, farmerLng], {
      radius: safeRadiusKm * 1000,
      color: '#059669',
      weight: 1.5,
      fillColor: '#10b981',
      fillOpacity: 0.08,
      dashArray: '6, 6'
    }).addTo(map);
    circleRef.current = circle;

    // Storage Markers
    storages.forEach((s) => {
      const isCold = s.location_type === 'cold_storage';
      const marker = L.marker([s.latitude, s.longitude], {
        icon: createStorageIcon(s.location_type)
      });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="
              font-size: 10px;
              font-weight: 800;
              padding: 2px 8px;
              border-radius: 9999px;
              background: ${isCold ? '#dbeafe' : '#fef3c7'};
              color: ${isCold ? '#1e40af' : '#92400e'};
            ">
              ${isCold ? '❄️ Cold Storage' : '🌾 Warehouse'}
            </span>
            <span style="font-size: 11px; font-weight: bold; color: #059669;">
              ${s.distanceText || `${s.distanceKm} km away`}
            </span>
          </div>

          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 4px 0;">
            ${s.name}
          </h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">
            ${s.address}, ${s.city}
          </p>

          ${isCold ? `
            <div style="font-size: 11px; background: #f8fafc; padding: 4px 8px; border-radius: 8px; margin-bottom: 6px; color: #334155;">
              🌡️ <strong>${s.temperature_range_min}°C to ${s.temperature_range_max}°C</strong> &bull; 💧 ${s.humidity_range_min}-${s.humidity_range_max}% RH
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            <span>Rate: <strong>₹${s.price_per_kg_per_day} /kg/day</strong></span>
            <span style="color: #059669; font-weight: bold;">${(s.available_kg || 0).toLocaleString()} kg free</span>
          </div>

          <button
            id="book-btn-${s.id}"
            style="
              width: 100%;
              margin-top: 8px;
              padding: 6px 12px;
              background: #0f172a;
              color: white;
              font-size: 11px;
              font-weight: bold;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            "
          >
            Book Storage Slot &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`book-btn-${s.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectStorage) onSelectStorage(s);
          };
        }
      });

      group.addLayer(marker);
    });

    // Adjust bounds to fit all facilities and farmer
    if (storages.length > 0) {
      const bounds = group.getBounds();
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([farmerLat, farmerLng], 12);
    }
  }, [storages, farmerLat, farmerLng, radiusKm]);

  // Toggle Map Type
  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const nextType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(nextType);

    if (tileLayerRef) {
      mapInstanceRef.current.removeLayer(tileLayerRef);
    }

    const newUrl =
      nextType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}' // Google Satellite Hybrid
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Roadmap

    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Google Maps'
    }).addTo(mapInstanceRef.current);

    setTileLayerRef(newLayer);
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([farmerLat, farmerLng], radiusKm <= 10 ? 12 : 11);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Map Action Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-blue-600" />
            Google Map Storage Radar
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
            {storages.length} Facilities in {radiusKm} km Radius
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMapType}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            {mapType === 'roadmap' ? 'Satellite Hybrid' : 'Google Road Map'}
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            Center on Farm
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          style={{ height: '380px', width: '100%', zIndex: 1 }}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/85 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl text-[11px] flex items-center gap-4 shadow-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
            <span className="font-medium text-slate-200">Farm Gate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
            <span className="font-medium text-slate-200">Cold Storage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-600 border border-white" />
            <span className="font-medium text-slate-200">Grain Warehouse</span>
          </div>
        </div>
      </div>
    </div>
  );
}
