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

  // Update map when current location changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        duration: 1000
      });
    }
  }, [currentLocation]);

  // Calculate and update route when active ride or status changes
  useEffect(() => {
    const calculateRoute = async () => {
      if (!activeRide || !currentLocation) return;

      // Determine destination based on ride status
      let destination;
      if (['ACCEPTED', 'ARRIVED_AT_PICKUP'].includes(activeRide.status)) {
        // Route to pickup location
        destination = { lng: activeRide.pickupLng, lat: activeRide.pickupLat };
        console.log('🚗 Routing to pickup:', destination);
      } else if (['PICKED_UP', 'ARRIVED_AT_DROPOFF'].includes(activeRide.status)) {
        // Route to dropoff location
        destination = { lng: activeRide.dropoffLng, lat: activeRide.dropoffLat };
        console.log('🏠 Routing to dropoff:', destination);
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
    <Map
      ref={mapRef}
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
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
              'line-width': 4,
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
                 style={{ width: 40, height: 40 }} />
            {/* Main marker */}
            <div className="rider-marker text-2xl">
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
          <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
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
            <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-bold ${
              ['ACCEPTED', 'ARRIVED_AT_PICKUP'].includes(activeRide.status)
                ? 'bg-yellow-400 text-gray-900'
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
            <div className={`px-3 py-2 rounded-lg shadow-lg text-xs font-bold ${
              ['PICKED_UP', 'ARRIVED_AT_DROPOFF'].includes(activeRide.status)
                ? 'bg-red-400 text-white'
                : 'bg-gray-400 text-white'
            }`}>
              🏠 DROPOFF
            </div>
          </Marker>
        </>
      )}

      {/* Destination info overlay */}
      {activeRide && destinationCoords && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs text-sm">
          <div className="font-bold text-gray-900">
            {['ACCEPTED', 'ARRIVED_AT_PICKUP'].includes(activeRide.status) ? '📍 Going to Pickup' : '🏠 Going to Dropoff'}
          </div>
          <div className="text-gray-600 mt-1 text-xs">
            {activeRide.status}
          </div>
        </div>
      )}
    </Map>
  );
}
