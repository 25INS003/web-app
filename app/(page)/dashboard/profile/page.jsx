"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, Phone, Mail, CreditCard, MapPin, Calendar, ArrowLeft, Edit } from 'lucide-react';

export default function ShopOwnerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setProfile({
        first_name: "Rajesh",
        last_name: "Kumar",
        email: "rajesh.kumar@example.com",
        phone: "+91 98765 43210",
        profile_image: null,
        user_type: "shop_owner",
        is_active: true,
        is_verified: true,
        last_login: "2024-12-10T10:30:00Z",
        createdAt: "2023-06-15T08:00:00Z",
        
        shop_owner: {
          business_name: "Kumar General Store",
          gst_number: "24ABCDE1234F1Z5",
          business_address_line1: "Shop No. 12, Main Market",
          business_address_line2: "Near City Hospital",
          business_address_state: "Madhya Pradesh",
          business_address_district: "Sehore",
          business_address_pincode: "466116",
          bank_account_number: "1234567890123456",
          ifsc_code: "SBIN0001234",
          business_since: "2023-06-15T08:00:00Z",
          is_approved: true
        }
      });
      setLoading(false);
    }, 500);
  }, []);

  //Good evening, this side Azhaan, made this comment and the rest below to clarify that remove the above given dummy data and use the access token in the code commented below. Thank you.

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       const token = localStorage.getItem('accessToken');
  //       const response = await fetch('/api/v1/users/shop-owner/profile', {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       });
  //       const data = await response.json();
  //       setProfile(data.data);
  //       setLoading(false);
  //     } catch (err) {
  //       setError(err.message);
  //       setLoading(false);
  //     }
  //   };
    
  //   fetchProfile();
  // }, []);


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {profile.profile_image ? (
                  <img 
                    src={profile.profile_image} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  {profile.is_verified && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      Verified
                    </span>
                  )}
                  {profile.shop_owner?.is_approved && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      Approved
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-1">Shop Owner</p>
                <p className="text-sm text-gray-500">
                  Member since {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Business Name</label>
              <p className="text-gray-900 font-medium">{profile.shop_owner?.business_name}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 block mb-1">GST Number</label>
              <p className="text-gray-900 font-medium">{profile.shop_owner?.gst_number || 'Not provided'}</p>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" />
                Business Address
              </label>
              <p className="text-gray-900">
                {profile.shop_owner?.business_address_line1}
                {profile.shop_owner?.business_address_line2 && `, ${profile.shop_owner.business_address_line2}`}
              </p>
              <p className="text-gray-900">
                {profile.shop_owner?.business_address_district}, {profile.shop_owner?.business_address_state} - {profile.shop_owner?.business_address_pincode}
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                <Calendar className="w-4 h-4" />
                Business Since
              </label>
              <p className="text-gray-900">{formatDate(profile.shop_owner?.business_since)}</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-gray-900">{profile.email}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <p className="text-gray-900">{profile.phone}</p>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Banking Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Account Number</label>
              <p className="text-gray-900 font-mono">
                {profile.shop_owner?.bank_account_number.slice(0, -4).replace(/./g, '•')}
                {profile.shop_owner?.bank_account_number.slice(-4)}
              </p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 block mb-1">IFSC Code</label>
              <p className="text-gray-900 font-mono">{profile.shop_owner?.ifsc_code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}