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
  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
    name: false,
    phone: false,
  });

  // Real-time form validation
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          return 'Email is required';
        } else if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        return '';
      case 'password':
        if (!value.trim()) {
          return 'Password is required';
        } else if (value.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        return '';
      case 'name':
        if (!isLogin && !value.trim()) {
          return 'Full name is required';
        } else if (!isLogin && value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        return '';
      case 'phone':
        if (!isLogin && !value.trim()) {
          return 'Phone number is required';
        } else if (!isLogin && value.trim().length < 10) {
          return 'Please enter a valid phone number';
        }
        return '';
      default:
        return '';
    }
  };

  // Handle input changes with real-time validation
  const handleInputChange = (name, value) => {
    switch (name) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'name':
        setName(value);
        break;
      case 'phone':
        setPhone(value);
        break;
    }

    // Validate field if it has been touched
    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFormErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur (mark as touched and validate)
  const handleFieldBlur = (name) => {
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const value = name === 'email' ? email : name === 'password' ? password : name === 'name' ? name : phone;
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  // Validate entire form
  const validateForm = () => {
    const errors = {
      email: validateField('email', email),
      password: validateField('password', password),
      name: validateField('name', name),
      phone: validateField('phone', phone),
    };

    setFormErrors(errors);
    setTouchedFields({ email: true, password: true, name: true, phone: true });

    return !Object.values(errors).some(error => error !== '');
  };

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
      case 'auth/network-request-failed':
        setError('Network error. Please check your internet connection and try again.');
        break;
      case 'auth/too-many-requests':
        setError('Too many failed attempts. Please try again later.');
        break;
      case 'auth/invalid-credential':
        setError('Invalid credentials. Please check your email and password.');
        break;
      case 'auth/popup-closed-by-user':
        setError('Sign-in was cancelled. Please try again.');
        break;
      case 'auth/popup-blocked':
        setError('Popup was blocked. Please allow popups and try again.');
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

    if (!validateForm()) {
      setError('Please fix the errors below and try again.');
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 flex flex-col relative overflow-hidden cross-browser-compatible gradient-earning">
      {/* Fallback background for browsers that don't support gradients */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#059669' /* Fallback color */
        }}
      />
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-4 focus:ring-green-500/50"
      >
        Skip to main content
      </a>

      {/* Enhanced energetic background elements with cross-browser support */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Dynamic gradient overlay for energy with fallback */}
        <div
          className="absolute inset-0 gradient-earning"
          style={{
            /* Fallback for older browsers */
            backgroundColor: 'rgba(5, 150, 105, 0.95)'
          }}
        ></div>

        {/* High-energy moving delivery routes */}
        <div className="absolute top-16 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-40 animate-pulse"></div>
        <div className="absolute top-20 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute top-2/3 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-35 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
        <div className="absolute bottom-32 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-300/50 to-transparent opacity-25 animate-pulse" style={{ animationDelay: '1.2s' }}></div>

        {/* Enhanced floating decorative elements with energetic gradients */}
        <div className="absolute top-24 right-16 w-36 h-36 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-400/25 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-28 left-16 w-44 h-44 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-400/20 blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute top-1/2 right-8 w-28 h-28 rounded-full bg-gradient-to-br from-teal-300/20 to-green-400/15 blur-2xl animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        <div className="absolute top-1/3 left-8 w-32 h-32 rounded-full bg-gradient-to-br from-green-300/25 to-emerald-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        {/* Energetic delivery-themed icons with enhanced effects */}
        <div className="absolute top-28 left-12 text-5xl opacity-25 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2.5s' }} role="img" aria-label="Scooter icon">🛵</div>
        <div className="absolute top-44 right-28 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '3s' }} role="img" aria-label="Package icon">📦</div>
        <div className="absolute bottom-44 left-1/4 text-4xl opacity-25 animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.8s' }} role="img" aria-label="Speed icon">💨</div>
        <div className="absolute bottom-20 right-12 text-5xl opacity-30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3.2s' }} role="img" aria-label="Money icon">💰</div>
        <div className="absolute top-1/2 left-1/5 text-3xl opacity-15 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }} role="img" aria-label="Lightning icon">⚡</div>
        <div className="absolute bottom-1/3 right-1/5 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.7s' }} role="img" aria-label="Trophy icon">🏆</div>

        {/* Moving elements for dynamic energy */}
        <div className="absolute top-12 left-0 w-3 h-3 bg-green-400/40 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-16 right-0 w-4 h-4 bg-emerald-300/30 rounded-full animate-ping" style={{ animationDelay: '2.5s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-teal-400/35 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Enhanced Header with better branding and earning focus */}
      <header className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300" role="img" aria-label="RiderMi logo">
                <span className="text-4xl" role="img" aria-label="Scooter icon">🛵</span>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse" role="status" aria-label="High demand">
                <span className="text-xs" role="img" aria-label="Lightning icon">⚡</span>
              </div>
            </div>
            <div>
              <h1 className="text-white text-5xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 bg-clip-text text-transparent">RiderMi</h1>
              <p className="text-green-200 text-sm font-semibold">Ready to Earn? • $15-25/hr average • High demand</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/30">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
            <span className="text-green-200 text-sm font-bold">Riders Needed</span>
          </div>
        </div>

        {/* Visual separation line with energy */}
        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-green-300/40 to-transparent" aria-hidden="true"></div>
      </header>

      {/* Main Content with Responsive Layout */}
      <main className="flex-1 w-full flex flex-col items-center justify-center py-4 relative z-10" id="main-content">
        {/* Responsive Container with Mobile-First Padding */}
        <div className="w-full px-4 sm:px-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-2xl w-full max-w-lg mx-auto">
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              {/* Enhanced subtle pattern overlay */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15 0l15 15v-30l-15 15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
              </div>

              <div className="relative">
                <div className="text-center mb-6 sm:mb-8 md:mb-10">
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 px-4 sm:px-5 md:px-6 py-2 sm:py-3 md:py-4 rounded-full mb-4 sm:mb-5 md:mb-6 shadow-sm border border-green-200" role="status" aria-label="Service status: Ready to earn in high demand area">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></span>
                      <span className="text-xs sm:text-sm font-bold text-gray-700">Ready to earn</span>
                    </div>
                    <div className="w-px h-3 sm:h-4 bg-gray-300" aria-hidden="true"></div>
                    <span className="text-xs font-semibold text-gray-600">High demand area</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-5 lg:mb-6 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
                    {isLogin ? 'Ready to Earn? 💪' : 'Start Earning Today! 🚀'}
                  </h2>
                  <p className="text-gray-600 mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed">
                    {isLogin
                      ? 'Welcome back, rider! Time to make some money 💰'
                      : 'Join thousands earning $15-25/hr with flexible schedules! ⚡'}
                  </p>

                  {/* Earnings highlight section with responsive sizing */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 text-white shadow-xl" role="banner" aria-labelledby="earnings-heading">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div id="earnings-heading" className="text-xs sm:text-sm font-semibold opacity-90">Average Earnings</div>
                        <div className="text-2xl sm:text-3xl md:text-4xl font-bold">$15-25/hr</div>
                        <div className="text-xs opacity-80 mt-1">+ tips & bonuses</div>
                      </div>
                      <div className="text-3xl sm:text-4xl md:text-5xl" role="img" aria-label="Money bag icon">💰</div>
                    </div>
                  </div>

                  {/* Action-oriented trust indicators with responsive layout */}
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6" role="list" aria-label="RiderMi key benefits">
                    <div className="flex items-center gap-1 sm:gap-2 bg-green-50 px-3 sm:px-4 py-2 rounded-full border border-green-200" role="listitem">
                      <span className="text-green-600" role="img" aria-label="Lightning icon">⚡</span>
                      <span className="text-xs sm:text-sm font-bold text-green-700">Instant Payouts</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 bg-emerald-50 px-3 sm:px-4 py-2 rounded-full border border-emerald-200" role="listitem">
                      <span className="text-emerald-600" role="img" aria-label="Phone icon">📱</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700">Easy App</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 bg-teal-50 px-3 sm:px-4 py-2 rounded-full border border-teal-200" role="listitem">
                      <span className="text-teal-600" role="img" aria-label="Trophy icon">🏆</span>
                      <span className="text-xs sm:text-sm font-bold text-teal-700">Top Rated</span>
                    </div>
                  </div>
                </div>

                <form className="space-y-4 sm:space-y-5 md:space-y-6 relative" onSubmit={handleEmailAuth} role="form" aria-labelledby="rider-form-heading">
                  <h3 id="rider-form-heading" className="sr-only">{isLogin ? 'Sign In to RiderMi' : 'Create RiderMi Account'}</h3>

                  {!isLogin && (
                    <>
                      <div className="relative">
                        <label htmlFor="name" className="block text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-2 sm:mb-3">
                          Full Name
                        </label>
                        <div className="relative">
                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            onBlur={() => handleFieldBlur('name')}
                            className={`w-full h-12 sm:h-14 md:h-16 lg:h-18 p-3 sm:p-4 pl-10 sm:pl-12 border-2 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base md:text-lg hover:border-gray-300 bg-gray-50/50 focus:bg-white touch-target min-h-[44px] ${formErrors.name && touchedFields.name
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                              : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                              }`}
                            placeholder="Enter your full name"
                            aria-describedby="name-description name-error"
                            aria-invalid={formErrors.name && touchedFields.name ? 'true' : 'false'}
                          />
                          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                            <span className="text-base sm:text-lg" role="img" aria-label="Person icon">👤</span>
                          </div>
                        </div>
                        <div id="name-description" className="sr-only">
                          Enter your full name for rider account registration
                        </div>
                        {formErrors.name && touchedFields.name && (
                          <div id="name-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <span aria-hidden="true">⚠️</span>
                            {formErrors.name}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label htmlFor="phone" className="block text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-2 sm:mb-3">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            onBlur={() => handleFieldBlur('phone')}
                            className={`w-full h-12 sm:h-14 md:h-16 lg:h-18 p-3 sm:p-4 pl-10 sm:pl-12 border-2 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base md:text-lg hover:border-gray-300 bg-gray-50/50 focus:bg-white touch-target min-h-[44px] ${formErrors.phone && touchedFields.phone
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                              : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                              }`}
                            placeholder="Enter your phone number"
                            aria-describedby="phone-description phone-error"
                            aria-invalid={formErrors.phone && touchedFields.phone ? 'true' : 'false'}
                          />
                          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                            <span className="text-base sm:text-lg" role="img" aria-label="Phone icon">📱</span>
                          </div>
                        </div>
                        <div id="phone-description" className="sr-only">
                          Enter your phone number for account verification and ride notifications
                        </div>
                        {formErrors.phone && touchedFields.phone && (
                          <div id="phone-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                            <span aria-hidden="true">⚠️</span>
                            {formErrors.phone}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <label htmlFor="email" className="block text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-2 sm:mb-3">
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        className={`w-full h-12 sm:h-14 md:h-16 lg:h-18 p-3 sm:p-4 pl-10 sm:pl-12 border-2 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base md:text-lg hover:border-gray-300 bg-gray-50/50 focus:bg-white touch-target min-h-[44px] ${formErrors.email && touchedFields.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                          }`}
                        placeholder="rider@example.com"
                        aria-describedby="email-description email-error"
                        aria-invalid={formErrors.email && touchedFields.email ? 'true' : 'false'}
                      />
                      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                        <span className="text-base sm:text-lg" role="img" aria-label="Email icon">📧</span>
                      </div>
                    </div>
                    <div id="email-description" className="sr-only">
                      Enter your email address to {isLogin ? 'sign in to your rider account' : 'create a new rider account'}
                    </div>
                    {formErrors.email && touchedFields.email && (
                      <div id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                        <span aria-hidden="true">⚠️</span>
                        {formErrors.email}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label htmlFor="password" className="block text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-2 sm:mb-3">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onBlur={() => handleFieldBlur('password')}
                        className={`w-full h-12 sm:h-14 md:h-16 lg:h-18 p-3 sm:p-4 pl-10 sm:pl-12 border-2 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 text-sm sm:text-base md:text-lg hover:border-gray-300 bg-gray-50/50 focus:bg-white touch-target min-h-[44px] ${formErrors.password && touchedFields.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
                          }`}
                        placeholder="••••••••"
                        aria-describedby="password-description password-error"
                        aria-invalid={formErrors.password && touchedFields.password ? 'true' : 'false'}
                      />
                      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
                        <span className="text-base sm:text-lg" role="img" aria-label="Lock icon">🔒</span>
                      </div>
                    </div>
                    <div id="password-description" className="sr-only">
                      {isLogin ? 'Enter your account password' : 'Create a password with at least 6 characters'}
                    </div>
                    {formErrors.password && touchedFields.password && (
                      <div id="password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                        <span aria-hidden="true">⚠️</span>
                        {formErrors.password}
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-pink-50 opacity-50"></div>
                      <div className="relative flex items-center gap-2 sm:gap-3">
                        <span className="text-red-500 text-base sm:text-lg">⚠️</span>
                        <p className="text-xs sm:text-sm text-red-800 font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 sm:h-14 md:h-16 lg:h-18 py-3 sm:py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg lg:text-xl disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group touch-target min-h-[44px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">{isLogin ? 'Signing you in...' : 'Creating account...'}</span>
                        <span className="sm:hidden">{isLogin ? 'Signing in...' : 'Creating...'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                        {isLogin ? (
                          <>
                            <span className="text-base sm:text-lg md:text-xl">🚀</span>
                            <span className="hidden sm:inline">Start Earning Today</span>
                            <span className="sm:hidden">Start Earning</span>
                          </>
                        ) : (
                          <>
                            <span className="text-base sm:text-lg md:text-xl">💪</span>
                            <span className="hidden sm:inline">Join the Team & Earn</span>
                            <span className="sm:hidden">Join & Earn</span>
                          </>
                        )}
                      </span>
                    )}
                  </button>
                </form>

                <div className="my-6 sm:my-8 flex items-center gap-3 sm:gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <span className="text-gray-500 text-xs sm:text-sm font-bold px-3 sm:px-4 bg-gray-50 rounded-full py-1">or continue with</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 sm:h-14 md:h-16 lg:h-18 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 hover:bg-green-50 hover:border-green-300 transition-all duration-300 disabled:opacity-50 text-sm sm:text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] bg-white relative overflow-hidden group touch-target min-h-[44px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-50/0 via-green-50/50 to-green-50/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10" viewBox="0 0 24 24">
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
                  <span className="relative z-10 hidden sm:inline">Continue with Google</span>
                  <span className="relative z-10 sm:hidden">Google</span>
                </button>

                {/* Enhanced benefits showcase with earning focus and responsive grid */}
                <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Why choose RiderMi?</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl border border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 touch-target min-h-[44px]">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
                      <div className="text-sm font-bold text-gray-800 mb-1">Instant Payouts</div>
                      <div className="text-xs text-gray-600">Get paid immediately after each ride</div>
                    </div>
                    <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl border border-emerald-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 touch-target min-h-[44px]">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📱</div>
                      <div className="text-sm font-bold text-gray-800 mb-1">Easy App</div>
                      <div className="text-xs text-gray-600">Simple interface, smart routing</div>
                    </div>
                    <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-teal-50 to-green-50 rounded-xl sm:rounded-2xl border border-teal-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 touch-target min-h-[44px]">
                      <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🏆</div>
                      <div className="text-sm font-bold text-gray-800 mb-1">Top Rated</div>
                      <div className="text-xs text-gray-600">4.9★ rider satisfaction rating</div>
                    </div>
                  </div>

                  {/* Additional earning benefits with responsive layout */}
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">💰</span>
                        <span className="font-bold text-gray-700">Weekly bonuses</span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">🎯</span>
                        <span className="font-bold text-gray-700">Flexible schedule</span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-teal-600">📈</span>
                        <span className="font-bold text-gray-700">Earn more with tips</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                  <p className="text-gray-600 text-sm sm:text-base">
                    {isLogin ? 'New to RiderMi?' : 'Already riding with us?'}{' '}
                    <button
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                      }}
                      className="text-green-600 font-bold hover:text-green-700 hover:underline transition-colors duration-200 ml-1 touch-target min-h-[44px] px-2 py-1 rounded"
                    >
                      {isLogin ? 'Join the team' : 'Sign in here'}
                    </button>
                  </p>

                  <div className="mt-3 sm:mt-4 text-xs text-gray-500">
                    By continuing, you agree to our{' '}
                    <span className="text-green-600 hover:underline cursor-pointer">Terms of Service</span>
                    {' '}and{' '}
                    <span className="text-green-600 hover:underline cursor-pointer">Privacy Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
