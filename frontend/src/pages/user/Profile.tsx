import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import { AxiosError } from 'axios';

// ─── Password Strength ────────────────────────────────────────────────────────
const getPasswordStrength = (pwd: string): { level: 0|1|2|3|4; label: string; color: string } => {
  if (!pwd) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const map: Array<{ label: string; color: string }> = [
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Strong', color: 'bg-emerald-500' },
    { label: 'Very strong', color: 'bg-emerald-400' },
  ];

  return { level: score as 0|1|2|3|4, ...map[score] };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    citizenshipNumber: user?.citizenshipNumber || '',
  });

  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.profilePhoto || '');

  const strength = getPasswordStrength(pwdData.newPassword);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authAPI.updateProfile(profileData);
      if (res.data.success && res.data.data?.user) {
        updateUser(res.data.data.user);
        setIsEditing(false);
        showMsg('success', 'Profile updated successfully!');
      }
    } catch (err) {
      const ax = err as AxiosError<{ message: string }>;
      showMsg('error', ax.response?.data?.message || 'Update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdData.newPassword !== pwdData.confirmNewPassword) {
      showMsg('error', 'Passwords do not match.');
      return;
    }
    if (strength.level < 2) {
      showMsg('error', 'Password is too weak. Use at least 8 chars, uppercase, number.');
      return;
    }
    setIsSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword,
      });
      setPwdData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setIsChangingPwd(false);
      showMsg('success', 'Password changed successfully!');
    } catch (err) {
      const ax = err as AxiosError<{ message: string }>;
      showMsg('error', ax.response?.data?.message || 'Password change failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">👤 Profile Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account & security</p>
        </div>

        {/* Toast */}
        {msg && (
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 mb-6 animate-fade-in border
                           ${msg.type === 'success'
                             ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                             : 'bg-red-500/10 border-red-500/30 text-red-400'
                           }`}>
            <span className="text-xl">{msg.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="text-sm font-medium">{msg.text}</p>
          </div>
        )}

        {/* Avatar + Basic Info */}
        <div className="bg-white p-6 mb-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-5 mb-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary-200
                            shadow-sm cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user?.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center
                                  text-2xl font-bold text-blue-600">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                                transition-opacity flex items-center justify-center text-white text-xl">
                  📷
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">{user?.fullName}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="badge bg-primary-50 text-primary-600 border border-primary-200 capitalize">
                  {user?.role}
                </span>
                <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200">
                  ● Active
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Personal Information</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-ghost text-sm"
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-input"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData((d) => ({ ...d, fullName: e.target.value }))}
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="form-label">Email <span className="text-slate-500 text-xs">(read-only)</span></label>
                    <input className="form-input opacity-60" value={user?.email || ''} readOnly disabled />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      value={profileData.phone}
                      onChange={(e) => setProfileData((d) => ({ ...d, phone: e.target.value }))}
                      placeholder="+977-98XXXXXXXX"
                      disabled={isSaving}
                    />
                  </div>
                  <div>
                    <label className="form-label">Citizenship Number</label>
                    <input
                      className="form-input"
                      value={profileData.citizenshipNumber}
                      onChange={(e) => setProfileData((d) => ({ ...d, citizenshipNumber: e.target.value }))}
                      placeholder="XX-XX-XXXXXX"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-input resize-none"
                      rows={2}
                      value={profileData.address}
                      onChange={(e) => setProfileData((d) => ({ ...d, address: e.target.value }))}
                      placeholder="Your current address"
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={isSaving} className="btn-primary py-2.5">
                    {isSaving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn-ghost py-2.5"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', value: user?.fullName },
                  { label: 'Email', value: user?.email },
                  { label: 'Phone', value: user?.phone || '—' },
                  { label: 'Citizenship No.', value: user?.citizenshipNumber || '—' },
                  { label: 'Address', value: user?.address || '—' },
                  { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NP') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className="text-slate-800 text-sm truncate">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              🔑 Change Password
            </h3>
            {!isChangingPwd && (
              <button onClick={() => setIsChangingPwd(true)} className="btn-ghost text-sm">
                Change
              </button>
            )}
          </div>

          {isChangingPwd ? (
            <form onSubmit={handlePasswordSave} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showPwd.current ? 'text' : 'password'}
                    className="form-input pr-12"
                    value={pwdData.currentPassword}
                    onChange={(e) => setPwdData((d) => ({ ...d, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPwd.current ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPwd.new ? 'text' : 'password'}
                    className="form-input pr-12"
                    value={pwdData.newPassword}
                    onChange={(e) => setPwdData((d) => ({ ...d, newPassword: e.target.value }))}
                    autoComplete="new-password"
                    disabled={isSaving}
                    placeholder="Min 8 chars, uppercase, number..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, new: !s.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPwd.new ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Strength Meter */}
                {pwdData.newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {Array.from({ length: 4 }, (_, i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                            i < strength.level ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showPwd.confirm ? 'text' : 'password'}
                    className={`form-input pr-12 ${
                      pwdData.confirmNewPassword &&
                      pwdData.newPassword !== pwdData.confirmNewPassword
                        ? 'border-red-500/50'
                        : ''
                    }`}
                    value={pwdData.confirmNewPassword}
                    onChange={(e) => setPwdData((d) => ({ ...d, confirmNewPassword: e.target.value }))}
                    autoComplete="new-password"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                  >
                    {showPwd.confirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {pwdData.confirmNewPassword &&
                  pwdData.newPassword !== pwdData.confirmNewPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving || !pwdData.currentPassword || !pwdData.newPassword}
                  className="btn-danger py-2.5 px-5 disabled:opacity-40"
                >
                  {isSaving ? 'Changing...' : '🔒 Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPwd(false);
                    setPwdData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                  }}
                  className="btn-ghost py-2.5"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
              <span className="text-3xl">🔐</span>
              <div>
                <p className="text-slate-800 text-sm font-medium">Password Protected</p>
                <p className="text-slate-500 text-xs">
                  Last changed:{' '}
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-NP') : 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
