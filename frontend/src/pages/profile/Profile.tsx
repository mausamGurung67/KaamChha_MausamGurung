import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Phone, Shield, CheckCircle, XCircle, Pencil, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { getProfile, updateProfile, type UpdateProfilePayload } from '../../services/profile.service';
import { STORAGE_KEYS } from '../../utils/constants';
import Button from '../../components/common/Button';

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const location = useLocation();

  const isInsideDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/technician');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  // Fetch full profile when entering edit mode
  const startEditing = async () => {
    setLoadingProfile(true);
    try {
      const res = await getProfile();
      if (res.success && res.data) {
        const p = res.data.profile;
        setForm({
          name: p?.name || user?.name || '',
          phone: p?.phone || user?.phone || '',
          address: p?.address || '',
        });
      } else {
        setForm({ name: user?.name || '', phone: user?.phone || '', address: '' });
      }
    } catch {
      setForm({ name: user?.name || '', phone: user?.phone || '', address: '' });
    } finally {
      setLoadingProfile(false);
      setEditing(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {};
      if (form.name.trim()) payload.name = form.name.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.address.trim()) payload.address = form.address.trim();

      const res = await updateProfile(payload);
      if (res.success) {
        // Update auth context and localStorage
        if (user) {
          const updated = { ...user, name: form.name.trim() || user.name, phone: form.phone.trim() || user.phone };
          setUser(updated);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
        }
        toast.success('Profile updated successfully');
        setEditing(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {!isInsideDashboard && <Navbar />}
        <div className={`${isInsideDashboard ? 'pt-6' : 'pt-24'} px-6`}>
          <div className="max-w-4xl mx-auto text-center py-20">
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isInsideDashboard ? '' : 'min-h-screen bg-gray-50'}>
      {!isInsideDashboard && <Navbar />}

      <div className={`${isInsideDashboard ? 'pt-2' : 'pt-24'} px-6 pb-12`}>
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl font-bold">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user.email[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user.name || 'User'}</h1>
                  <p className="text-gray-600 mt-1">{user.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                      user.role === 'TECHNICIAN'
                        ? 'bg-blue-100 text-blue-700'
                        : user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      <Shield size={14} />
                      {user.role}
                    </span>
                    {user.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
                        <CheckCircle size={14} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-red-100 text-red-700">
                        <XCircle size={14} />
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  disabled={loadingProfile}
                  isLoading={loadingProfile}
                >
                  <Pencil size={16} />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Profile Details / Edit Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editing ? 'Edit Profile' : 'Profile Information'}
            </h2>

            {editing ? (
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-100 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Your phone number"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="Your address"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={saving}
                    isLoading={saving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <User size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="text-base font-medium text-gray-900">{user.name || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-base font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-base font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <Shield size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="text-base font-medium text-gray-900">{user.role}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
