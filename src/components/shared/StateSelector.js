import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
];

export default function StateSelector({ value, onChange, error }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);

  useEffect(() => {
    if (autoDetect && !value) {
      detectState();
    }
  }, [autoDetect]);

  const detectState = async () => {
    setIsDetecting(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Use Mapbox Geocoding API to get state
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      // Find the region (state) from the response
      const stateFeature = data.features.find((f) =>
        f.place_type.includes('region')
      );

      if (stateFeature) {
        const detectedState = stateFeature.text;
        // Match with Nigerian states
        const matchedState = NIGERIAN_STATES.find(
          (state) => state.toLowerCase() === detectedState.toLowerCase()
        );
        if (matchedState) {
          onChange({
            operatingState: matchedState,
            latitude,
            longitude,
          });
        }
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setAutoDetect(false);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Auto-detect Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">
            Auto-detect location
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAutoDetect(!autoDetect)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoDetect ? 'bg-orange-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoDetect ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* State Selection */}
      {autoDetect ? (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {isDetecting ? (
            <div className="flex items-center gap-2 text-blue-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Detecting your location...</span>
            </div>
          ) : value ? (
            <div className="flex items-center gap-2 text-green-700">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">
                Detected: {value}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={detectState}
              className="text-sm text-blue-700 hover:underline"
            >
              Click to detect location
            </button>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Operating State *
          </label>
          <select
            value={value}
            onChange={(e) =>
              onChange({
                operatingState: e.target.value,
                latitude: null,
                longitude: null,
              })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a state</option>
            {NIGERIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
