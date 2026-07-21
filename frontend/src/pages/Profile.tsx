import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    citizenshipNumber: user?.citizenshipNumber || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await authAPI.updateProfile(profileData);
      if (res.data.success && res.data.data?.user) {
        updateUser(res.data.data.user);
        setIsEditing(false);
        showMessage('success', 'Profile updated successfully!');
      }
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      showMessage('error', axErr.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      showMessage('error', 'New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters.');
      return;
    }
    setIsSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (err) {
      const axErr = err as AxiosError<{ message: string }>;
      showMessage('error', axErr.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">👤 Profile Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account information</p>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-6 animate-fade-in border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Avatar + Account Meta */}
        <div className="bg-white p-6 mb-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center
                            text-3xl font-bold text-blue-600 shadow-sm flex-shrink-0">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.fullName} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user?.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user?.fullName}</h2>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-primary-50 text-primary-600 border border-primary-200 capitalize">
                  {user?.role}
                </span>
                {user?.isActive && (
                  <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white p-6 mb-5 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800">Personal Information</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-ghost text-sm">
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
                    onChange={e => setProfileData(d => ({ ...d, fullName: e.target.value }))}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={profileData.phone}
                    onChange={e => setProfileData(d => ({ ...d, phone: e.target.value }))}
                    disabled={isSaving}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Citizenship Number</label>
                  <input
                    className="form-input"
                    value={profileData.citizenshipNumber}
                    onChange={e => setProfileData(d => ({ ...d, citizenshipNumber: e.target.value }))}
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
                    onChange={e => setProfileData(d => ({ ...d, address: e.target.value }))}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={isSaving} className="btn-primary py-2.5">
                  {isSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost py-2.5">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Change Password */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-800">🔑 Security</h2>
            {!isChangingPassword && (
              <button onClick={() => setIsChangingPassword(true)} className="btn-ghost text-sm">
                Change Password
              </button>
            )}
          </div>

          {isChangingPassword ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {[
                { id: 'currentPassword', label: 'Current Password', key: 'currentPassword' as const },
                { id: 'newPassword', label: 'New Password', key: 'newPassword' as const },
                { id: 'confirmNewPassword', label: 'Confirm New Password', key: 'confirmNewPassword' as const },
              ].map(({ id, label, key }) => (
                <div key={id}>
                  <label className="form-label">{label}</label>
                  <input
                    id={id}
                    type="password"
                    className="form-input"
                    value={passwordData[key]}
                    onChange={e => setPasswordData(d => ({ ...d, [key]: e.target.value }))}
                    disabled={isSaving}
                    autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <button type="submit" disabled={isSaving} className="btn-danger py-2.5">
                  {isSaving ? 'Changing...' : '🔒 Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsChangingPassword(false); setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); }}
                  className="btn-ghost py-2.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <p className="text-slate-800 text-sm font-medium">Password Protected</p>
                <p className="text-slate-500 text-xs">Your account is secured with a password</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
