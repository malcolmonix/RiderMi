import { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { apolloClient } from '../lib/apollo';
import { getAuth } from 'firebase/auth';

const AVAILABLE_RIDES = gql`
  query AvailableRides {
    availableRides {
      id
      rideId
      status
      pickupAddress
      dropoffAddress
      fare
      createdAt
    }
  }
`;

const GET_RIDER_PROFILE = gql`
  query Me {
    me {
      id
      email
      displayName
      phoneNumber
    }
  }
`;

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState({
    firebase: 'checking',
    graphql: 'checking',
    network: 'checking'
  });
  const [authUser, setAuthUser] = useState(null);
  const [envVars, setEnvVars] = useState({});

  const { data: ridesData, loading: ridesLoading, error: ridesError } = useQuery(AVAILABLE_RIDES, {
    pollInterval: 5000,
    fetchPolicy: 'network-only'
  });

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(GET_RIDER_PROFILE, {
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    // Check Firebase Auth
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          console.log('🔐 Firebase token obtained:', token.substring(0, 50) + '...');
        } catch (e) {
          console.error('❌ Failed to get token:', e);
        }
      }
      setConnectionStatus(prev => ({
        ...prev,
        firebase: user ? 'connected' : 'not authenticated'
      }));
    });

    // Check network
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com/favicon.ico');
        setConnectionStatus(prev => ({
          ...prev,
          network: response.ok ? 'online' : 'offline'
        }));
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          network: 'offline'
        }));
      }
    };

    checkNetwork();

    // Gather environment variables
    setEnvVars({
      graphqlUri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'NOT SET',
      firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT SET',
      firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT SET',
      firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'SET' : 'NOT SET',
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check GraphQL connection
    if (ridesError) {
      setConnectionStatus(prev => ({
        ...prev,
        graphql: 'error: ' + ridesError.message
      }));
    } else if (!ridesLoading) {
      setConnectionStatus(prev => ({
        ...prev,
        graphql: 'connected'
      }));
    }
  }, [ridesError, ridesLoading]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#1a1a1a', color: '#00ff00', minHeight: '100vh' }}>
      <h1 style={{ borderBottom: '2px solid #00ff00', paddingBottom: '10px' }}>🔧 RiderMi Debug Console</h1>
      
      {/* Connection Status */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>📡 Connection Status</h2>
        <div style={{ marginTop: '10px' }}>
          <StatusItem label="Firebase Auth" status={connectionStatus.firebase} />
          <StatusItem label="GraphQL API" status={connectionStatus.graphql} />
          <StatusItem label="Network" status={connectionStatus.network} />
        </div>
      </section>

      {/* Environment Variables */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🔐 Environment Configuration</h2>
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} style={{ padding: '5px 0', borderBottom: '1px solid #333' }}>
              <strong>{key}:</strong> <span style={{ color: value.includes('NOT SET') ? '#ff0000' : '#00ff00' }}>{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Auth User */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>👤 Current User</h2>
        {authUser ? (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <div><strong>UID:</strong> {authUser.uid}</div>
            <div><strong>Email:</strong> {authUser.email}</div>
            <div><strong>Display Name:</strong> {authUser.displayName || 'N/A'}</div>
          </div>
        ) : (
          <div style={{ color: '#ffaa00' }}>Not authenticated</div>
        )}
      </section>

      {/* Rider Profile */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🏍️ Current User Profile</h2>
        {profileLoading && <div>Loading profile...</div>}
        {profileError && <div style={{ color: '#ff0000' }}>Error: {profileError.message}</div>}
        {profileData?.me ? (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <div><strong>ID:</strong> {profileData.me.id}</div>
            <div><strong>Display Name:</strong> {profileData.me.displayName || 'N/A'}</div>
            <div><strong>Email:</strong> {profileData.me.email}</div>
            <div><strong>Phone:</strong> {profileData.me.phoneNumber || 'N/A'}</div>
          </div>
        ) : !profileLoading && !profileError ? (
          <div style={{ color: '#ffaa00' }}>No profile data</div>
        ) : null}
      </section>

      {/* Available Rides */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🚗 Available Rides (Direct from API)</h2>
        {ridesLoading && <div>Loading rides...</div>}
        {ridesError && <div style={{ color: '#ff0000' }}>Error: {ridesError.message}</div>}
        {ridesData?.availableRides && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Total Available:</strong> {ridesData.availableRides.length}
            </div>
            {ridesData.availableRides.length === 0 ? (
              <div style={{ color: '#ffaa00' }}>No rides available at the moment</div>
            ) : (
              <div style={{ fontSize: '14px' }}>
                {ridesData.availableRides.map((ride, index) => (
                  <div key={ride.id} style={{ 
                    padding: '10px', 
                    marginBottom: '10px', 
                    background: '#1a1a1a', 
                    borderLeft: '4px solid #00ff00',
                    borderRadius: '4px'
                  }}>
                    <div><strong>#{index + 1} - Ride ID:</strong> {ride.rideId}</div>
                    <div><strong>Status:</strong> {ride.status}</div>
                    <div><strong>Pickup:</strong> {ride.pickupAddress}</div>
                    <div><strong>Dropoff:</strong> {ride.dropoffAddress}</div>
                    <div><strong>Fare:</strong> ${ride.fare?.toFixed(2)}</div>
                    <div><strong>Created:</strong> {new Date(ride.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Apollo Client Info */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🔄 Apollo Client Info</h2>
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          <div><strong>Link URI:</strong> {apolloClient.link?.options?.uri || 'N/A'}</div>
          <div><strong>Cache Size:</strong> {Object.keys(apolloClient.cache.data.data).length} entries</div>
        </div>
      </section>

      {/* Manual GraphQL Test */}
      <section style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', borderRadius: '8px' }}>
        <h2>🔬 Manual GraphQL Test</h2>
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={async () => {
              if (!authUser) {
                alert('Not authenticated');
                return;
              }
              const token = await authUser.getIdToken();
              const response = await fetch('https://food-delivery-api-indol.vercel.app/graphql', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  query: '{ me { id email displayName phoneNumber } }'
                })
              });
              const result = await response.json();
              console.log('Manual GraphQL test result:', result);
              alert(JSON.stringify(result, null, 2));
            }}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Me Query with Token
          </button>
        </div>
      </section>

      {/* Timestamp */}
      <div style={{ marginTop: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

function StatusItem({ label, status }) {
  const isConnected = status === 'connected' || status === 'online';
  const isError = typeof status === 'string' && status.includes('error');
  const color = isConnected ? '#00ff00' : isError ? '#ff0000' : '#ffaa00';

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
      <strong>{label}:</strong> <span style={{ color }}>{status}</span>
    </div>
  );
}
