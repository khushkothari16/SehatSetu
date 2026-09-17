import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export const LeafletMap = ({
  center,
  zoom = 13,
  markers = [],
  height = '360px',
  onMarkerClick
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const effectiveCenter = center || (markers[0] ? [markers[0].lat, markers[0].lng] : [28.1878, 75.5001]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: effectiveCenter,
        zoom,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(effectiveCenter, zoom);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && effectiveCenter) {
      mapInstanceRef.current.setView(effectiveCenter, zoom);
    }
  }, [effectiveCenter[0], effectiveCenter[1], zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      if (!m.lat || !m.lng) return;

      // Create distinct colored SVG pins based on type
      let pinColor = '#0D9488'; // Teal default
      let iconSymbol = '🏥';

      if (m.isUserLocation || m.type === 'user') {
        pinColor = '#2563EB'; // Vibrant Blue
        iconSymbol = '👤';
      } else if (m.type === 'patient') {
        pinColor = '#2563EB'; // Blue
        iconSymbol = '📍';
      } else if (m.type === 'ambulance') {
        pinColor = '#DC2626'; // Red
        iconSymbol = '🚑';
      } else if (m.type === 'police') {
        pinColor = '#1D4ED8'; // Police Navy Blue
        iconSymbol = '🚓';
      } else if (m.type === 'pharmacy') {
        pinColor = '#059669'; // Green
        iconSymbol = '💊';
      } else if (m.type === 'diagnostic') {
        pinColor = '#7C3AED'; // Purple
        iconSymbol = '🔬';
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">${iconSymbol}</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      const leafletMarker = L.marker([m.lat, m.lng], { icon: customIcon });

      if (m.title || m.description) {
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; min-width: 180px; padding: 4px;">
            <div style="font-weight: 700; font-size: 14px; color: #0F172A; margin-bottom: 2px;">
              ${m.title || 'Facility'}
            </div>
            ${m.subtitle ? `<div style="font-size: 12px; color: #64748B; margin-bottom: 4px;">${m.subtitle}</div>` : ''}
            ${m.distance ? `<div style="font-size: 11px; font-weight: 600; color: #0D9488; margin-bottom: 4px;">📍 ${m.distance} away</div>` : ''}
            ${m.description ? `<div style="font-size: 12px; color: #334155; margin-bottom: 6px;">${m.description}</div>` : ''}
            ${m.status ? `<div style="font-size: 11px; font-weight: 700; color: #16A34A;">● ${m.status}</div>` : ''}
          </div>
        `;
        leafletMarker.bindPopup(popupContent);
      }

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(m));
      }

      markersLayerRef.current.addLayer(leafletMarker);
    });
  }, [markers]);

  return (
    <div style={{ width: '100%', height, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
