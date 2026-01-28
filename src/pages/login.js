import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [processingRedirect, setProcessingRedirect] = useState(false);

  // Check if Firebase is configured
  const isFirebaseConfigured = auth !== null;

  // First, check if user is already logged in
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setCheckingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Login page - Auth state changed:', user?.email || 'null');
      setCheckingAuth(false);
      if (user && !processingRedirect) {
        // User is already logged in, redirect to home
        console.log('✅ User already logged in, redirecting to home...');
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [router, isFirebaseConfigured, processingRedirect]);

  // Handle Google redirect result AFTER auth check
  useEffect(() => {
    if (!isFirebaseConfigured || checkingAuth) return;

    const handleRedirectResult = async () => {
      setProcessingRedirect(true);
      try {
        console.log('🔄 Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('✅ Got redirect result for user:', result.user.email);
          // Create or update rider profile in Firestore
          await createRiderProfile(result.user);
          console.log('✅ Rider profile created, redirecting...');
          router.replace('/');
          return;
        }
        console.log('ℹ️ No redirect result (normal page load)');
      } catch (error) {
        console.error('❌ Redirect result error:', error);
        handleAuthError(error);
      } finally {
        setProcessingRedirect(false);
      }
    };
    handleRedirectResult();
  }, [router, isFirebaseConfigured, checkingAuth]);

  const createRiderProfile = async (user) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'riders', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || name || '',
        phoneNumber: user.phoneNumber || phone || '',
        photoURL: user.photoURL || '',
        available: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error creating rider profile:', error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please ensure Firestore security rules are deployed.');
      }
      throw error;
    }
  };

  const handleAuthError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setError('This email is already registered. Please login instead.');
        break;
      case 'auth/weak-password':
        setError('Password is too weak. Please use at least 6 characters.');
        break;
      case 'auth/invalid-email':
        setError('Invalid email address. Please check and try again.');
        break;
      case 'auth/user-not-found':
        setError('No account found with this email. Please register first.');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password. Please try again.');
        break;
      case 'permission-denied':
        setError('Permission denied. Please ensure Firestore security rules are deployed.');
        break;
      default:
        setError(error.message || 'An error occurred. Please try again.');
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please set up environment variables.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      await createRiderProfile(userCredential.user);
      router.push('/');
    } catch (error) {
      console.error('Email auth error:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please set up environment variables.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        await createRiderProfile(result.user);
        router.replace('/');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      handleAuthError(error);
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (checkingAuth || processingRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-6">
          <span className="text-white text-3xl">🛵</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
        <p className="text-gray-600">
          {processingRedirect ? 'Completing sign in...' : 'Checking authentication...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Moving delivery routes */}
        <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute top-2/3 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-20 animate-pulse delay-1000"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-400/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/20 blur-3xl animate-pulse delay-500"></div>
        
        {/* Delivery-themed icons */}
        <div className="absolute top-32 left-16 text-4xl opacity-20 animate-bounce delay-0">🛵</div>
        <div className="absolute top-48 right-32 text-3xl opacity-20 animate-bounce delay-700">📦</div>
        <div className="absolute bottom-40 left-1/3 text-3xl opacity-20 animate-bounce delay-300">💨</div>
        <div className="absolute bottom-24 right-16 text-4xl opacity-20 animate-bounce delay-1000">💰</div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <span className="text-5xl">🛵</span>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-sm">⚡</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
            RiderMi
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-2">
            Ready to Earn? 💪
          </h2>
          <p className="text-green-200 text-lg">
            {isLogin ? 'Welcome back, rider!' : 'Join the delivery revolution!'}
          </p>
          
          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full mt-4">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-200 text-sm font-medium">Riders needed • High demand</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl sm:px-12 border border-green-100/50 relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15 0l15 15v-30l-15 15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <form className="space-y-6 relative" onSubmit={handleEmailAuth}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 text-base"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 text-base"
                    placeholder="Enter your phone number"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 text-base"
                placeholder="rider@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all duration-300 text-base"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-base font-bold text-white bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  {isLogin ? 'Signing you in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? (
                    <>
                      <span>🚀</span>
                      <span>Start Earning Today</span>
                    </>
                  ) : (
                    <>
                      <span>💪</span>
                      <span>Join the Team</span>
                    </>
                  )}
                </span>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Quick start with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-3 py-4 px-6 border-2 border-gray-200 rounded-2xl shadow-lg bg-white text-base font-semibold text-gray-700 hover:bg-green-50 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-300"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Earnings highlight */}
            <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-green-800">Average Earnings</div>
                  <div className="text-2xl font-bold text-green-600">$15-25/hr</div>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-base text-gray-600 hover:text-green-600 transition-colors"
            >
              {isLogin ? "New rider? " : 'Already riding with us? '}
              <span className="font-bold text-green-600 hover:text-green-700">
                {isLogin ? 'Join the team' : 'Sign in here'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-xs font-semibold text-green-200">Instant Payouts</div>
          </div>
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-xs font-semibold text-green-200">Easy App</div>
          </div>
          <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-xs font-semibold text-green-200">Top Rated</div>
          </div>
        </div>
      </div>
    </div>
  );
}
