import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Phone, Shield, CheckCircle, XCircle, Pencil, Loader2, MapPin, Camera, FileText, Calendar, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';
import { getProfile, updateProfile, type UpdateProfilePayload } from '../../services/profile.service';
import * as technicianService from '../../services/technician.service';
import type { TechnicianProfile } from '../../services/technician.service';
import { getMyKYC, type KYCData } from '../../services/kyc.service';
import { STORAGE_KEYS, ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '../../utils/constants';
import Button from '../../components/common/Button';

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInsideDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/technician');
  const isTechnician = user?.role === 'TECHNICIAN';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load avatar and KYC on mount for technicians
  useEffect(() => {
    const loadData = async () => {
      if (isTechnician) {
        try {
          const profileRes = await technicianService.getProfile();
          if (profileRes.success && profileRes.data) {
            setAvatar(profileRes.data.profile.profile?.avatar || null);
          }
        } catch { /* ignore */ }

        setLoadingKyc(true);
        try {
          const kycRes = await getMyKYC();
          if (kycRes.success && kycRes.data) {
            setKycData(kycRes.data.kyc);
          }
        } catch { /* no kyc */ }
        finally { setLoadingKyc(false); }
      }
    };
    loadData();
  }, [isTechnician]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { url } = await technicianService.uploadAvatar(file);
      await technicianService.updateProfile({ avatar: url });
      setAvatar(url);
      toast.success('Profile picture updated!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
                {/* Avatar with upload */}
                <div className="relative group">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={user.name || 'Avatar'}
                      className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl font-bold">
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : user.email[0].toUpperCase()}
                    </div>
                  )}
                  {isTechnician && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                        title="Change profile picture"
                      >
                        {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </>
                  )}
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

          {/* KYC Details Section - Technician only */}
          {isTechnician && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">KYC Verification Details</h2>

              {loadingKyc ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              ) : kycData ? (
                <div className="space-y-6">
                  {/* KYC Status Badge */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                      kycData.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : kycData.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {kycData.status === 'APPROVED' ? <CheckCircle size={14} /> : kycData.status === 'REJECTED' ? <XCircle size={14} /> : <Loader2 size={14} />}
                      {kycData.status}
                    </span>
                  </div>

                  {kycData.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                      <p className="text-sm text-red-700 mt-1">{kycData.rejectionReason}</p>
                    </div>
                  )}

                  {/* Document Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Document Type</p>
                        <p className="text-base font-medium text-gray-900">{kycData.documentType}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Shield size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Document Number</p>
                        <p className="text-base font-medium text-gray-900">{kycData.documentNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Submitted At</p>
                        <p className="text-base font-medium text-gray-900">
                          {new Date(kycData.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {kycData.verifiedAt && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                          <CheckCircle size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Verified At</p>
                          <p className="text-base font-medium text-gray-900">
                            {new Date(kycData.verifiedAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'long', day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Document Images */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Submitted Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Document Front', url: kycData.documentFront },
                        { label: 'Document Back', url: kycData.documentBack },
                        { label: 'Selfie', url: kycData.selfie },
                      ].map((doc) => (
                        <div key={doc.label} className="relative group">
                          <p className="text-xs text-gray-500 mb-1">{doc.label}</p>
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                            <img
                              src={doc.url}
                              alt={doc.label}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => setPreviewImage(doc.url)}
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors"
                            >
                              <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No KYC submitted yet</p>
                  <p className="text-gray-400 text-sm mt-1">Submit your KYC documents to get verified.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Document preview" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-3 mx-auto block text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
