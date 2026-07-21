import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../../types';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  agreeTerms: boolean;
}

interface FieldError {
  [key: string]: string;
}

const getPasswordStrength = (password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { level: 2, label: 'Medium', color: 'bg-amber-500' };
  return { level: 3, label: 'Strong', color: 'bg-emerald-500' };
};

const Register: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const passwordStrength = getPasswordStrength(formData.password);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'fullName':
        return value.trim().length < 2 ? 'Full name must be at least 2 characters.' : '';
      case 'email':
        return !/^\S+@\S+\.\S+$/.test(value) ? 'Please enter a valid email.' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters.' : '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match.' : '';
      case 'phone':
        return !/^[0-9+\-\s()]{7,15}$/.test(value) ? 'Enter a valid phone number.' : '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setApiError('');
    const newVal = type === 'checkbox' ? checked : value;
    setFormData(f => ({ ...f, [name]: newVal }));

    // Real-time validation
    if (type !== 'checkbox') {
      const errorMsg = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: FieldError = {};
    (['fullName', 'email', 'password', 'confirmPassword', 'phone'] as const).forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsLoading(true);
    setApiError('');

    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone,
        address: formData.address.trim(),
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiResponse>;
      setApiError(
        axiosErr.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `form-input ${errors[field] ? 'border-red-500/50 focus:ring-red-500' : ''}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center
                          p-2 mx-auto mb-4 shadow-lg border border-white/20">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/87/Emblem_of_Nepal.svg" alt="Nepal Emblem" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Create Your Account</h1>
          <p className="text-slate-500 text-sm">
            Join Nepal's Smart Government Platform — access all digital services
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
          <form id="register-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* API Error */}
            {apiError && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30
                              rounded-xl px-4 py-3 animate-fade-in">
                <span className="text-red-400 text-lg">⚠️</span>
                <p className="text-red-400 text-sm">{apiError}</p>
              </div>
            )}

            {/* Row 1: Full Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-fullName" className="form-label">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                  <input
                    id="reg-fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ram Bahadur Thapa"
                    className={`${inputClass('fullName')} pl-10`}
                    disabled={isLoading}
                  />
                </div>
                {errors.fullName && <p className="form-error">{errors.fullName}</p>}
              </div>

              <div>
                <label htmlFor="reg-phone" className="form-label">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">📱</span>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+977 98XXXXXXXX"
                    className={`${inputClass('phone')} pl-10`}
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="form-label">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={`${inputClass('email')} pl-10`}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* Row 2: Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="form-label">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔑</span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass('password')} pl-10 pr-10`}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}

                {/* Password Strength */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      passwordStrength.level === 1 ? 'text-red-400' :
                      passwordStrength.level === 2 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {passwordStrength.label} password
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="reg-confirmPassword" className="form-label">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass('confirmPassword')} pl-10 pr-10`}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
                {formData.confirmPassword && !errors.confirmPassword && (
                  <p className="text-emerald-400 text-xs mt-1">✓ Passwords match</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="reg-address" className="form-label">
                Current Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">📍</span>
                <textarea
                  id="reg-address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ward No. X, Municipality, District, Province"
                  rows={2}
                  className="form-input pl-10 resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  id="agree-terms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 bg-white text-primary-600
                             focus:ring-primary-500 focus:ring-offset-white flex-shrink-0"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </Link>{' '}
                  of Nepal Government Digital Services
                </span>
              </label>
              {errors.agreeTerms && <p className="form-error ml-7">{errors.agreeTerms}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>🎉 Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          🔒 Your data is encrypted and stored securely · Government of Nepal
        </p>
      </div>
    </div>
  );
};

export default Register;
