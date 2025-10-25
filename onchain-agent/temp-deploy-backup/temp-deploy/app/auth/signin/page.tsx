'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type AuthMode = 'signin' | 'signup';
type AuthType = 'google' | 'email' | 'phone' | 'phone-sms';

export default function SignIn() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [authType, setAuthType] = useState<AuthType>('google');
  
  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Email/Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn('email', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Phone/Password Sign In
  const handlePhonePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn('phone-password', {
        phone,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid phone number or password');
      } else {
        router.push('/');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) return;
    if (authType === 'email' && !email) return;
    if (authType === 'phone' && !phone) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: authType,
          email: authType === 'email' ? email : undefined,
          phone: authType === 'phone' ? phone : undefined,
          password,
          name,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Auto sign in after registration
        const result = await signIn(authType, {
          email: authType === 'email' ? email : undefined,
          phone: authType === 'phone' ? phone : undefined,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Registration successful but sign-in failed. Please try signing in manually.');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setError('');

    try {
      // Send SMS verification code
      const response = await fetch('/api/auth/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('code');
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      setError('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError('');

    try {
      const result = await signIn('phone', {
        phone,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid verification code');
      } else {
        router.push('/');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('Google sign-in button clicked');
    setLoading(true);
    try {
      console.log('Calling signIn with google provider');
      const result = await signIn('google', { callbackUrl: '/' });
      console.log('Google sign-in result:', result);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to StreakPets</h1>
          <p className="text-white/80">
            {mode === 'signin' ? 'Sign in to start your pet journey' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'signin'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-6">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">or</span>
            </div>
          </div>

          {/* Auth Type Selection for Sign Up */}
          {mode === 'signup' && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAuthType('email')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  authType === 'email'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:text-white'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setAuthType('phone')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  authType === 'phone'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:text-white'
                }`}
              >
                Phone
              </button>
              <button
                onClick={() => setAuthType('phone-sms')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  authType === 'phone-sms'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:text-white'
                }`}
              >
                SMS
              </button>
            </div>
          )}

          {/* Sign In Mode */}
          {mode === 'signin' && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAuthType('email')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  authType === 'email'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:text-white'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setAuthType('phone')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  authType === 'phone'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:text-white'
                }`}
              >
                Phone
              </button>
              <button
                onClick={() => setAuthType('phone-sms')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  authType === 'phone-sms'
                    ? 'bg-blue-500/20 text-blue-200 border border-blue-500/50'
                    : 'bg-white/5 text-white/60 border border-white/20 hover:text-white'
                }`}
              >
                SMS
              </button>
            </div>
          )}

          {/* Email/Password Form */}
          {(authType === 'email') && (
            <form onSubmit={mode === 'signin' ? handleEmailSignIn : handleRegister} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email || !password || (mode === 'signup' && !name)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          )}

          {/* Phone/Password Form */}
          {(authType === 'phone') && (
            <form onSubmit={mode === 'signin' ? handlePhonePasswordSignIn : handleRegister} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !phone || !password || (mode === 'signup' && !name)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          )}

          {/* SMS Authentication (existing) */}
          {authType === 'phone-sms' && (
            <>
              {step === 'phone' ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="phone-sms" className="block text-sm font-medium text-white/80 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone-sms"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !phone}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-white/80 mb-2">
                      Verification Code
                    </label>
                    <p className="text-sm text-white/60 mb-3">
                      Enter the 6-digit code sent to {phone}
                    </p>
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="w-full text-white/60 hover:text-white transition-colors"
                  >
                    ← Back to phone number
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}