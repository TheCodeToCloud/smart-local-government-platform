import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Restore remembered email
  useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) {
      setFormData(f => ({ ...f, email: saved }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      await login(formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse>;
      setError(
        axiosErr.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Panel — Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-10">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20
                            flex items-center justify-center text-5xl mb-6 shadow-glow-blue">
              🇳🇵
            </div>
            <h1 className="text-4xl font-bold mb-3 leading-tight">
              Smart Local<br />
              <span className="text-gradient">Government Platform</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Nepal's digital gateway for government certificates and services. Fast, transparent, and secure.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '⚡', title: 'Instant Applications', desc: 'Apply for certificates in minutes' },
              { icon: '📡', title: 'Real-Time Tracking', desc: 'Monitor application status live' },
              { icon: '🔒', title: 'Bank-Grade Security', desc: 'Your data is always protected' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:-translate-y-1 transition-transform">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-semibold text-white">{feature.title}</p>
                  <p className="text-blue-200 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center
                            text-4xl mx-auto mb-4 shadow-lg">
              🇳🇵
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">
              Sign in to access government services
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Error Banner */}
              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30
                                rounded-xl px-4 py-3 animate-fade-in">
                  <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="login-email" className="form-label">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="form-input pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="form-label">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔑</span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="form-input pl-10 pr-12"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    id="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400
                               hover:text-slate-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-primary-600
                               focus:ring-primary-500 focus:ring-offset-white"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>🚀 Sign In</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600 mt-6">
            🔒 Protected by 256-bit SSL encryption · Government of Nepal
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
