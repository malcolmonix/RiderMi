import { useState } from 'react';

export default function ErrorDisplay({ error, onRetry, onDismiss }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  // Extract error details
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || error?.extensions?.code || 'UNKNOWN';
  const errorStack = error?.stack || '';
  const graphQLErrors = error?.graphQLErrors || [];
  const networkError = error?.networkError;

  // Detect error type
  const isNetworkError = networkError || errorMessage.includes('Network') || errorMessage.includes('fetch');
  const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized') || errorCode === 'UNAUTHENTICATED';
  const isParseError = errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Unexpected token');

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h2 className="text-lg font-bold">Error Detected</h2>
                <p className="text-sm opacity-90">
                  {isNetworkError && 'Network Error'}
                  {isAuthError && 'Authentication Error'}
                  {isParseError && 'Data Parse Error'}
                  {!isNetworkError && !isAuthError && !isParseError && 'Application Error'}
                </p>
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* User-friendly message */}
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{errorMessage}</p>
          </div>

          {/* Error Code */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 mb-1">ERROR CODE</div>
            <div className="p-2 bg-gray-100 rounded font-mono text-sm">{errorCode}</div>
          </div>

          {/* Device Info */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-500 mb-1">DEVICE INFO</div>
            <div className="p-2 bg-gray-100 rounded text-xs space-y-1">
              <div><strong>User Agent:</strong> {navigator.userAgent}</div>
              <div><strong>Platform:</strong> {navigator.platform}</div>
              <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
              <div><strong>Language:</strong> {navigator.language}</div>
            </div>
          </div>

          {/* GraphQL Errors */}
          {graphQLErrors.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 mb-1">GRAPHQL ERRORS</div>
              <div className="space-y-2">
                {graphQLErrors.map((err, idx) => (
                  <div key={idx} className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                    <div><strong>Message:</strong> {err.message}</div>
                    {err.extensions?.code && (
                      <div><strong>Code:</strong> {err.extensions.code}</div>
                    )}
                    {err.path && (
                      <div><strong>Path:</strong> {err.path.join(' → ')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Network Error */}
          {networkError && (
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 mb-1">NETWORK ERROR</div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div><strong>Status:</strong> {networkError.statusCode || 'N/A'}</div>
                <div><strong>Message:</strong> {networkError.message || 'Network request failed'}</div>
              </div>
            </div>
          )}

          {/* Toggle Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors mb-2"
          >
            {showDetails ? '▼ Hide Technical Details' : '▶ Show Technical Details'}
          </button>

          {/* Stack Trace */}
          {showDetails && errorStack && (
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 mb-1">STACK TRACE</div>
              <div className="p-2 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {errorStack}
              </div>
            </div>
          )}

          {/* Full Error Object */}
          {showDetails && (
            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 mb-1">FULL ERROR OBJECT</div>
              <div className="p-2 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">
                {JSON.stringify(error, null, 2)}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs font-bold text-blue-800 mb-2">💡 TROUBLESHOOTING TIPS</div>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              {isNetworkError && (
                <>
                  <li>Check your internet connection</li>
                  <li>Try switching between WiFi and mobile data</li>
                  <li>Disable VPN if enabled</li>
                </>
              )}
              {isAuthError && (
                <>
                  <li>Try logging out and logging back in</li>
                  <li>Clear browser cache and cookies</li>
                  <li>Check if your session has expired</li>
                </>
              )}
              {isParseError && (
                <>
                  <li>The server may have returned invalid data</li>
                  <li>Try refreshing the page</li>
                  <li>Contact support if the issue persists</li>
                </>
              )}
              <li>Screenshot this error and send to support</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
            >
              🔄 Retry
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            🔃 Refresh Page
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
