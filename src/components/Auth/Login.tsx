import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Mail, Lock, Eye, EyeOff, LogIn, User } from 'lucide-react';

const Login: React.FC = () => {
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { theme } = useTheme();

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Handle redirect after successful login
  useEffect(() => {
    if (loginSuccess && user) {
      console.log('Login successful, user state:', {
        isVerified: user.isVerified,
        isPaidUser: user.isPaidUser
      });

      // Determine where to redirect based on user status
      if (!user.isVerified) {
        console.log('User not verified, redirecting to verify-email');
        navigate('/verify-email');
      } else if (!user.isPaidUser) {
        console.log('User verified but not paid, redirecting to payment');
        navigate('/payment');
      } else {
        console.log('User verified and paid, redirecting to dashboard');
        navigate('/dashboard');
      }

      setLoginSuccess(false); // Reset the flag
    }
  }, [loginSuccess, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Login attempt started for:', loginField);
      const result = await login(loginField, password);

      if (result.success) {
        console.log('Login successful, determining redirect...');

        // After successful login, the AuthContext's user state should be updated
        // We can now safely check the user's status from the context
        // The refreshUser() call inside AuthContext.login() ensures 'user' is fresh

        // Give a tiny moment for React to re-render with updated context if needed
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the current user from context after refreshUser()
        const currentUser = user;

        console.log('Current user state after login:', {
          user: currentUser ? {
            id: currentUser.id,
            email: currentUser.email,
            isVerified: currentUser.isVerified,
            isPaidUser: currentUser.isPaidUser
          } : null
        });

        if (result.requires2FA) {
          navigate('/verify-2fa');
        } else if (currentUser && !currentUser.isVerified) {
          console.log('Login successful, but user not verified. Redirecting to /verify-email');
          navigate('/verify-email');
        } else if (currentUser && !currentUser.isPaidUser) {
          console.log('Login successful, user verified but not paid. Redirecting to /payment');
          navigate('/payment');
        } else if (currentUser) {
          console.log('Login successful, user verified and paid. Redirecting to /dashboard');
          navigate('/dashboard');
        } else {
          console.log('Login successful but no user data available, redirecting to /dashboard');
          navigate('/dashboard');
        }
      } else {
        console.log('Login failed:', result.error);
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/20'
    : 'w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/20';

  return (
    <div className={bgClass}>
      <div className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Header Section - Like in registration */}
          <div className="text-center mb-6">
            <div className="flex justify-center space-x-4 mb-6">
              <Link
                to="/register"
                className="px-8 py-2 bg-white/10 text-white/70 rounded-lg font-medium hover:bg-white/20 transition-all duration-200"
              >
                Register
              </Link>
              <button className="px-8 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium">
                Login
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-white/70">Sign in to your EarnPro account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="loginField" className="block text-sm font-medium text-white/80 mb-2">
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      id="loginField"
                      type="text"
                      required
                      value={loginField}
                      onChange={(e) => setLoginField(e.target.value)}
                      className={inputClass}
                      placeholder="Enter your email or username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass.replace('pr-4', 'pr-12')}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${theme === 'professional' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
