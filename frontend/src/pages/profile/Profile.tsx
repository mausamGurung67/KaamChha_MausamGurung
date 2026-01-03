import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, Mail, Phone, Shield, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
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
          </div>

          {/* Profile Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
            
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

              {user.phone && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                    <Phone size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="text-base font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}

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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
