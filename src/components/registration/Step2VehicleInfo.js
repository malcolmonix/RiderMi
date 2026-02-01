import { useState } from 'react';
import { Car, Bike, Truck } from 'lucide-react';

const VEHICLE_TYPES = [
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'bicycle', label: 'Bicycle', icon: Bike },
  { id: 'van', label: 'Van', icon: Truck },
];

export default function Step2VehicleInfo({
  formData,
  updateFormData,
  onNext,
  onPrevious,
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Please select a vehicle type';
    }

    if (!formData.vehicleMake || formData.vehicleMake.length < 2) {
      newErrors.vehicleMake = 'Please enter vehicle make';
    }

    if (!formData.vehicleModel || formData.vehicleModel.length < 2) {
      newErrors.vehicleModel = 'Please enter vehicle model';
    }

    if (!formData.vehicleRegistrationNumber) {
      newErrors.vehicleRegistrationNumber = 'Please enter registration number';
    }

    if (!formData.licensePlateNumber) {
      newErrors.licensePlateNumber = 'Please enter license plate number';
    }

    if (!formData.vehicleColor) {
      newErrors.vehicleColor = 'Please enter vehicle color';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vehicle Information
        </h2>
        <p className="text-gray-600">
          Tell us about your vehicle
        </p>
      </div>

      {/* Vehicle Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Vehicle Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VEHICLE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => updateFormData({ vehicleType: type.id })}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  formData.vehicleType === type.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-orange-300'
                }`}
              >
                <Icon
                  className={`w-8 h-8 ${
                    formData.vehicleType === type.id
                      ? 'text-orange-500'
                      : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    formData.vehicleType === type.id
                      ? 'text-orange-500'
                      : 'text-gray-700'
                  }`}
                >
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.vehicleType && (
          <p className="text-red-500 text-sm mt-1">{errors.vehicleType}</p>
        )}
      </div>

      {/* Vehicle Make and Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Make *
          </label>
          <input
            type="text"
            value={formData.vehicleMake}
            onChange={(e) => updateFormData({ vehicleMake: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.vehicleMake ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g. Honda, Toyota"
          />
          {errors.vehicleMake && (
            <p className="text-red-500 text-sm mt-1">{errors.vehicleMake}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Model *
          </label>
          <input
            type="text"
            value={formData.vehicleModel}
            onChange={(e) => updateFormData({ vehicleModel: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.vehicleModel ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g. Civic, Corolla"
          />
          {errors.vehicleModel && (
            <p className="text-red-500 text-sm mt-1">{errors.vehicleModel}</p>
          )}
        </div>
      </div>

      {/* Registration Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Registration Number *
        </label>
        <input
          type="text"
          value={formData.vehicleRegistrationNumber}
          onChange={(e) =>
            updateFormData({ vehicleRegistrationNumber: e.target.value })
          }
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
            errors.vehicleRegistrationNumber
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
          placeholder="Enter registration number"
        />
        {errors.vehicleRegistrationNumber && (
          <p className="text-red-500 text-sm mt-1">
            {errors.vehicleRegistrationNumber}
          </p>
        )}
      </div>

      {/* License Plate and Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Plate Number *
          </label>
          <input
            type="text"
            value={formData.licensePlateNumber}
            onChange={(e) =>
              updateFormData({ licensePlateNumber: e.target.value })
            }
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.licensePlateNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g. ABC-123-XY"
          />
          {errors.licensePlateNumber && (
            <p className="text-red-500 text-sm mt-1">
              {errors.licensePlateNumber}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Color *
          </label>
          <input
            type="text"
            value={formData.vehicleColor}
            onChange={(e) => updateFormData({ vehicleColor: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.vehicleColor ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g. Black, White, Red"
          />
          {errors.vehicleColor && (
            <p className="text-red-500 text-sm mt-1">{errors.vehicleColor}</p>
          )}
        </div>
      </div>

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
