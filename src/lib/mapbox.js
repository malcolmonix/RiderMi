// Mapbox utilities for RiderMi

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat, lng) {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

/**
 * Forward geocode address to get coordinates
 */
export async function forwardGeocode(address) {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
    );
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features.map(f => ({
        address: f.place_name,
        lat: f.center[1],
        lng: f.center[0]
      }));
    }
    return [];
  } catch (error) {
    console.error('Forward geocode error:', error);
    return [];
  }
}

/**
 * Get route between two points
 */
export async function getRoute(origin, destination) {
  if (!MAPBOX_TOKEN) {
    console.warn('Mapbox token not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        geometry: route.geometry,
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60)
      };
    }
    return null;
  } catch (error) {
    console.error('Get route error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in km
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate estimated delivery time
 */
export function estimateDeliveryTime(distanceKm, trafficFactor = 1.0) {
  // Average speed of 30 km/h in city traffic
  const avgSpeedKmh = 30 / trafficFactor;
  const timeHours = distanceKm / avgSpeedKmh;
  return Math.round(timeHours * 60); // Return in minutes
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
