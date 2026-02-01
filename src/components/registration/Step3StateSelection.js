import { useState } from 'react';
import StateSelector from '../shared/StateSelector';

export default function Step3StateSelection({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}) {
  const [error, setError] = useState('');

  const handleStateChange = (data) => {
    updateFormData(data);
    setError('');
  };

  const handleNext = () => {
    if (!formData.operatingState) {
      setError('Please select your operating state');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Operating State
        </h2>
        <p className="text-gray-600">
          Select the state where you'll be operating
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Why do we need this?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You'll receive delivery requests from your selected state</li>
          <li>• Helps us match you with nearby orders</li>
          <li>• You can change this later in settings</li>
        </ul>
      </div>

      <StateSelector
        value={formData.operatingState}
        onChange={handleStateChange}
        error={error}
      />

      {formData.operatingState && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✓ You'll receive delivery requests from{' '}
            <span className="font-semibold">{formData.operatingState}</span>
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrevious}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
