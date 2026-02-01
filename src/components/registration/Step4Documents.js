import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import DocumentUploader from '../shared/DocumentUploader';

export default function Step4Documents({
  formData,
  updateFormData,
  onPrevious,
  onSubmit,
  isSubmitting,
  isLastStep,
}) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.idCardFront) {
      newErrors.idCardFront = 'ID card (front) is required';
    }

    if (!formData.idCardBack) {
      newErrors.idCardBack = 'ID card (back) is required';
    }

    if (!formData.driversLicense) {
      newErrors.driversLicense = "Driver's license is required";
    }

    if (!formData.vehicleRegistration) {
      newErrors.vehicleRegistration = 'Vehicle registration is required';
    }

    if (!formData.insuranceCertificate) {
      newErrors.insuranceCertificate = 'Insurance certificate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Documents
        </h2>
        <p className="text-gray-600">
          Please upload clear photos or scans of your documents
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important:</p>
            <ul className="space-y-1">
              <li>• All documents must be valid and not expired</li>
              <li>• Photos should be clear and readable</li>
              <li>• Accepted formats: JPG, PNG, or PDF</li>
              <li>• Maximum file size: 5MB per document</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ID Card Front */}
      <DocumentUploader
        label="ID Card (Front)"
        value={formData.idCardFront}
        onChange={(url) => updateFormData({ idCardFront: url })}
      />
      {errors.idCardFront && (
        <p className="text-red-500 text-sm -mt-2">{errors.idCardFront}</p>
      )}

      {/* ID Card Back */}
      <DocumentUploader
        label="ID Card (Back)"
        value={formData.idCardBack}
        onChange={(url) => updateFormData({ idCardBack: url })}
      />
      {errors.idCardBack && (
        <p className="text-red-500 text-sm -mt-2">{errors.idCardBack}</p>
      )}

      {/* Driver's License */}
      <DocumentUploader
        label="Driver's License"
        value={formData.driversLicense}
        onChange={(url) => updateFormData({ driversLicense: url })}
      />
      {errors.driversLicense && (
        <p className="text-red-500 text-sm -mt-2">{errors.driversLicense}</p>
      )}

      {/* Vehicle Registration */}
      <DocumentUploader
        label="Vehicle Registration"
        value={formData.vehicleRegistration}
        onChange={(url) => updateFormData({ vehicleRegistration: url })}
      />
      {errors.vehicleRegistration && (
        <p className="text-red-500 text-sm -mt-2">
          {errors.vehicleRegistration}
        </p>
      )}

      {/* Insurance Certificate */}
      <DocumentUploader
        label="Insurance Certificate"
        value={formData.insuranceCertificate}
        onChange={(url) => updateFormData({ insuranceCertificate: url })}
      />
      {errors.insuranceCertificate && (
        <p className="text-red-500 text-sm -mt-2">
          {errors.insuranceCertificate}
        </p>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrevious}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </button>
      </div>
    </div>
  );
}
