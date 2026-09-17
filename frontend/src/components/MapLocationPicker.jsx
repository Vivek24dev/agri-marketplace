import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Layers,
  Search,
  CheckCircle2,
  Navigation,
  Sparkles
} from 'lucide-react';

// Fix Leaflet's default marker icons broken by Webpack/Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapLocationPicker({
  title = 'Select Location on Map',
  initialLat = 12.9716,
  initialLng = 77.5946,
  initialAddress = '',
  presets = [],
  onLocationSelect,
  pinType = 'pickup' // 'pickup' (emerald) or 'delivery' (blue)
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [currentAddress, setCurrentAddress] = useState(initialAddress || 'Bengaluru, Karnataka');
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' or 'satellite'
  const [tileLayerRef, setTileLayerRef] = useState(null);

  // Custom colored marker icon
  const createPinIcon = (type) => {
    const isPickup = type === 'pickup';
    const bg = isPickup ? '#059669' : '#2563eb';
    const emoji = isPickup ? '🌾' : '🏁';

    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          background: ${bg};
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-size: 16px;
        ">
          <span style="transform: rotate(45deg);">${emoji}</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });
  };

  // Approximate reverse geocoding
  const reverseGeocode = async (lat, lng) => {
    // Check if close to a preset
    const closePreset = presets.find((p) => {
      const d = Math.hypot(p.lat - lat, p.lng - lng);
      return d < 0.04;
    });

    if (closePreset) {
      return closePreset.name;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        // Return cleaned up short address
        const parts = data.display_name.split(', ');
        return parts.slice(0, 3).join(', ');
      }
    } catch (e) {
      // Fallback
    }
    return `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: false
      });

      // Add Zoom Control in top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Google Maps Tile Layer
      const googleRoadmap = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Google Maps'
        }
      ).addTo(map);

      setTileLayerRef(googleRoadmap);

      // Draggable Marker
      const marker = L.marker([initialLat, initialLng], {
        icon: createPinIcon(pinType),
        draggable: true
      }).addTo(map);

      markerRef.current = marker;

      // Click on Map to move pin
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCurrentLat(lat);
        setCurrentLng(lng);
        const addr = await reverseGeocode(lat, lng);
        setCurrentAddress(addr);
        if (onLocationSelect) {
          onLocationSelect({ lat, lng, address: addr });
        }
      });

      // Drag Pin End
      marker.on('dragend', async (e) => {
        const { lat, lng } = marker.getLatLng();
        setCurrentLat(lat);
        setCurrentLng(lng);
        const addr = await reverseGeocode(lat, lng);
        setCurrentAddress(addr);
        if (onLocationSelect) {
          onLocationSelect({ lat, lng, address: addr });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update position if initialLat/Lng change from outside
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      mapInstanceRef.current.setView([initialLat, initialLng], 13);
      setCurrentLat(initialLat);
      setCurrentLng(initialLng);
      if (initialAddress) setCurrentAddress(initialAddress);
    }
  }, [initialLat, initialLng]);

  // Switch Google Maps Layer (Roadmap vs Satellite Hybrid)
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

  // Center to user GPS
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 14);
            markerRef.current.setLatLng([lat, lng]);
            setCurrentLat(lat);
            setCurrentLng(lng);
            const addr = await reverseGeocode(lat, lng);
            setCurrentAddress(addr);
            if (onLocationSelect) {
              onLocationSelect({ lat, lng, address: addr });
            }
          }
        },
        () => {
          alert('Could not access current location. Please click on map to choose location.');
        }
      );
    }
  };

  // Handle Preset Click
  const handleSelectPreset = (p) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([p.lat, p.lng], 14);
      markerRef.current.setLatLng([p.lat, p.lng]);
      setCurrentLat(p.lat);
      setCurrentLng(p.lng);
      setCurrentAddress(p.name);
      if (onLocationSelect) {
        onLocationSelect({ lat: p.lat, lng: p.lng, address: p.name });
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <MapPin className={`w-3.5 h-3.5 ${pinType === 'pickup' ? 'text-emerald-600' : 'text-blue-600'}`} />
          {title}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMapType}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Layers className="w-3 h-3 text-slate-500" />
            {mapType === 'roadmap' ? 'Satellite View' : 'Map View'}
          </button>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-medium flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Crosshair className="w-3 h-3 text-emerald-600" />
            My GPS
          </button>
        </div>
      </div>

      {/* Preset Quick Chips */}
      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Popular:
          </span>
          {presets.slice(0, 4).map((p) => {
            const isMatch = Math.hypot(p.lat - currentLat, p.lng - currentLng) < 0.02;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isMatch
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.name.split(',')[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300/80 shadow-inner">
        <div
          ref={mapContainerRef}
          style={{ height: '260px', width: '100%', zIndex: 1 }}
        />

        {/* Floating Instruction / Google Branding Badge */}
        <div className="absolute top-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Click or drag pin to select location
        </div>

        {/* Selected Coordinates & Address Footer */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-slate-950/85 backdrop-blur-md text-white px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="truncate flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Selected Point:
            </span>
            <span className="font-medium text-slate-100 truncate block">
              {currentAddress}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">
            {currentLat.toFixed(4)}°, {currentLng.toFixed(4)}°
          </span>
        </div>
      </div>
    </div>
  );
}
