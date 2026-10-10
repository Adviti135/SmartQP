import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Lock, Mail, User as UserIcon, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, signup, googleLogin } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const formatFirebaseError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Incorrect email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email address already exists. Please sign in instead.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in popup was closed before completing.';
    }
    if (code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key') {
      return 'Firebase configuration missing or invalid. Please check VITE_FIREBASE_API_KEY in your .env file.';
    }
    return err?.message || 'Authentication failed. Please try again.';
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Please enter your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword);
      addToast('Welcome back to SmartQP!', 'success');
      navigate('/');
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setErrorMsg('All fields are required for registration.');
      return;
    }

    if (!signupEmail.includes('@') || !signupEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signup(signupUsername.trim(), signupEmail.trim(), signupPassword);
      addToast('Account created successfully with Firebase! Welcome to SmartQP.', 'success');
      navigate('/');
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await googleLogin();
      addToast('Signed in with Google account via Firebase!', 'success');
      navigate('/');
    } catch (err: any) {
      setErrorMsg(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg text-white mb-2">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          SmartQP
        </h1>
        <p className="text-sm font-medium text-indigo-600 flex items-center justify-center gap-1">
          <Sparkles className="w-4 h-4" />
          Smarter Questions. Balanced Papers. Better Examinations.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 border border-gray-100 sm:rounded-2xl sm:px-10">
          
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Firebase Google OAuth Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google (Firebase)</span>
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-medium">Or continue with password</span>
            </div>
          </div>

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="teacher@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name / Username
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={signupUsername}
                    onChange={e => setSignupUsername(e.target.value)}
                    placeholder="Prof John Doe"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="john@university.edu"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
