import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_DIRECTIONS_API = 'https://api.mapbox.com/directions/v5/mapbox/driving';

export default function RiderMap({ currentLocation, activeRide, availableRides = [] }) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: currentLocation?.lng || 3.3792,
    latitude: currentLocation?.lat || 6.5244,
    zoom: 14
  });
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isFollowing, setIsFollowing] = useState(true);

  // Update map when current location changes - ONLY if following
  useEffect(() => {
    if (currentLocation && mapRef.current && isFollowing) {
      mapRef.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 15,
        duration: 1000,
        padding: { top: 50, bottom: 50, left: 50, right: 50 } // Keep padding for markers
      });
    }
  }, [currentLocation, isFollowing]);

  // Handle manual map interaction
  const handleMove = (evt) => {
    setViewState(evt.viewState);
    // If user interacts with the map (drag/zoom), stop following
    if (evt.originalEvent) {
      setIsFollowing(false);
    }
  };

  const handleRecenter = () => {
    setIsFollowing(true);
    if (currentLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 16,
        duration: 1500
      });
    }
  };

  // Calculate and update route when active ride or status changes
  useEffect(() => {
    const calculateRoute = async () => {
      if (!activeRide || !currentLocation) return;

      // Determine destination based on ride status
      let destination;
      if (['ACCEPTED', 'ARRIVED_AT_PICKUP'].includes(activeRide.status)) {
        // Route to pickup location
        destination = { lng: activeRide.pickupLng, lat: activeRide.pickupLat };
      } else if (['PICKED_UP', 'ARRIVED_AT_DROPOFF'].includes(activeRide.status)) {
        // Route to dropoff location
        destination = { lng: activeRide.dropoffLng, lat: activeRide.dropoffLat };
      } else {
        setRouteGeometry(null);
        setDestinationCoords(null);
        return;
      }

      setDestinationCoords(destination);

      try {
        // Call Mapbox Directions API
        const url = `${MAPBOX_DIRECTIONS_API}/${currentLocation.lng},${currentLocation.lat};${destination.lng},${destination.lat}?access_token=${MAPBOX_TOKEN}&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          setRouteGeometry(data.routes[0].geometry);

          // Auto-enable follow mode when a new route is set/ride is active
          // But only if we were already following or if it's a fresh ride start
          if (!isFollowing && ['ACCEPTED', 'PICKED_UP'].includes(activeRide.status)) {
            // Optional: Force follow on status change? Let's be gentle.
            // setIsFollowing(true); 
          }
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [activeRide, currentLocation]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Mapbox token not configured</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* Route to pickup/dropoff */}
        {routeGeometry && (
          <Source
            id="route"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: routeGeometry
            }}
          >
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#3B82F6',
                'line-width': 5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

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
                style={{ width: 40, height: 40, transform: 'translate(-25%, -25%)' }} />
              {/* Main marker */}
              <div className="rider-marker text-3xl transform -translate-y-1/2">
                🛵
              </div>
            </div>
          </Marker>
        )}

        {/* Available Rides Markers */}
        {availableRides.map(ride => (
          <Marker
            key={ride.id}
            longitude={ride.pickupLng}
            latitude={ride.pickupLat}
            anchor="center"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <span className="text-white text-xs font-bold">📍</span>
            </div>
          </Marker>
        ))}

        {/* Active Ride Markers */}
        {activeRide && (
          <>
            {/* Pickup marker */}
            <Marker
              longitude={activeRide.pickupLng}
              latitude={activeRide.pickupLat}
              anchor="center"
            >
              <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-bold ${['ACCEPTED', 'ARRIVED_AT_PICKUP'].includes(activeRide.status)
                ? 'bg-yellow-400 text-gray-900 ring-4 ring-yellow-200'
                : 'bg-gray-400 text-white'
                }`}>
                📍 PICKUP
              </div>
            </Marker>

            {/* Dropoff marker */}
            <Marker
              longitude={activeRide.dropoffLng}
              latitude={activeRide.dropoffLat}
              anchor="center"
            >
              <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-bold ${['PICKED_UP', 'ARRIVED_AT_DROPOFF'].includes(activeRide.status)
                ? 'bg-red-400 text-white ring-4 ring-red-200'
                : 'bg-gray-400 text-white'
                }`}>
                🏠 DROPOFF
              </div>
            </Marker>
          </>
        )}
      </Map>

      {/* Map Control Buttons */}
      <div className="absolute bottom-32 right-4 flex flex-col gap-3 z-10">
        {/* Recenter / Follow Button */}
        {!isFollowing && currentLocation && (
          <button
            onClick={handleRecenter}
            className="bg-white p-3 rounded-full shadow-lg transition-all active:scale-95 text-blue-600 border border-blue-100 flex items-center justify-center hover:bg-blue-50"
            aria-label="Recenter map"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Trip Focus Button - Only show when ride is active */}
        {activeRide && (
          <button
            onClick={() => {
              if (mapRef.current) {
                const bounds = [
                  [Math.min(currentLocation.lng, destinationCoords.lng), Math.min(currentLocation.lat, destinationCoords.lat)],
                  [Math.max(currentLocation.lng, destinationCoords.lng), Math.max(currentLocation.lat, destinationCoords.lat)]
                ];
                mapRef.current.fitBounds(bounds, {
                  padding: 100,
                  duration: 1500
                });
                setIsFollowing(false); // Focus trip, stop follow "Me"
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg transition-all active:scale-95 text-gray-700 border border-gray-100 flex items-center justify-center hover:bg-gray-50"
            aria-label="Show entire trip"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Status Overlay */}
      {activeRide && destinationCoords && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 max-w-xs text-sm border-l-4 border-blue-500">
          <div className="font-bold text-gray-900">
            {['ACCEPTED', 'ARRIVED_AT_PICKUP'].includes(activeRide.status) ? '📍 To Pickup' : '🏠 To Dropoff'}
          </div>
          <div className="text-gray-600 mt-0.5 text-xs">
            {activeRide.status.replace(/_/g, ' ')}
          </div>
        </div>
      )}
    </div>
  );
}
