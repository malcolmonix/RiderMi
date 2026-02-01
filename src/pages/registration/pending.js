import { useRouter } from 'next/router';
import { Clock, CheckCircle, Mail, Home } from 'lucide-react';

export default function PendingVerificationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Registration Submitted!
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">
            Thank you for registering with RiderMi. Your application is now under
            review.
          </p>

          {/* What Happens Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              What happens next?
            </h2>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex gap-3">
                <span className="font-semibold">1.</span>
                <span>
                  Our team will review your documents and verify your information
                  (usually within 24-48 hours)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold">2.</span>
                <span>
                  You'll receive an email notification once your account is
                  verified
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold">3.</span>
                <span>
                  After verification, you can start accepting delivery requests
                  and earning money
                </span>
              </li>
            </ol>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Need Help?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              If you have any questions or need assistance, please contact our
              support team:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Email:</span>{' '}
                <a
                  href="mailto:support@ridermi.com"
                  className="text-orange-600 hover:underline"
                >
                  support@ridermi.com
                </a>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Phone:</span>{' '}
                <a
                  href="tel:+2348012345678"
                  className="text-orange-600 hover:underline"
                >
                  +234 801 234 5678
                </a>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View Profile
            </button>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-8">
            Application ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
