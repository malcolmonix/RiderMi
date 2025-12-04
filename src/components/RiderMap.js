import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function RiderMap({ currentLocation, activeOrder, availableOrders = [] }) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: currentLocation?.lng || 3.3792,
    latitude: currentLocation?.lat || 6.5244,
    zoom: 14
  });

  // Update map when current location changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        duration: 1000
      });
    }
  }, [currentLocation]);

  // Route line layer style
  const routeLayerStyle = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#3B82F6',
      'line-width': 4,
      'line-opacity': 0.8
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      {/* Current Location Marker */}
      {currentLocation && (
        <Marker
          longitude={currentLocation.lng}
          latitude={currentLocation.lat}
          anchor="center"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-50" 
                 style={{ width: 40, height: 40 }} />
            {/* Main marker */}
            <div className="rider-marker">
              🛵
            </div>
          </div>
        </Marker>
      )}

      {/* Available Orders Markers */}
      {availableOrders.map(order => (
        <Marker
          key={order.id}
          longitude={order.dropoffLng || 3.38} // Default if not available
          latitude={order.dropoffLat || 6.52}
          anchor="center"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">📦</span>
          </div>
        </Marker>
      ))}

      {/* Active Order Markers */}
      {activeOrder && (
        <>
          {/* Pickup marker - use restaurant location or default */}
          <Marker
            longitude={3.38} // Would need restaurant coordinates
            latitude={6.52}
            anchor="center"
          >
            <div className="pickup-marker flex items-center justify-center">
              <span className="text-white text-xs">📍</span>
            </div>
          </Marker>

          {/* Dropoff marker */}
          <Marker
            longitude={3.39} // Would need delivery coordinates
            latitude={6.53}
            anchor="center"
          >
            <div className="dropoff-marker flex items-center justify-center">
              <span className="text-white text-xs">🏠</span>
            </div>
          </Marker>
        </>
      )}
    </Map>
  );
}
