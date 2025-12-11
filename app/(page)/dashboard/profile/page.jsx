"use client";

import { useState, useEffect, useRef } from 'react';
import { User, Building2, Phone, Mail, CreditCard, MapPin, Calendar, ArrowLeft, Edit, X, Save, Camera, Upload } from 'lucide-react';

export default function ShopOwnerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      const profileData = {
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
      };
      setProfile(profileData);
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

  const handleEditClick = () => {
    setEditedProfile(JSON.parse(JSON.stringify(profile)));
    setPreviewImage(profile.profile_image);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedProfile(null);
    setPreviewImage(null);
  };

  const handleInputChange = (field, value, isShopOwner = false) => {
    if (isShopOwner) {
      setEditedProfile(prev => ({
        ...prev,
        shop_owner: {
          ...prev.shop_owner,
          [field]: value
        }
      }));
    } else {
      setEditedProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setEditedProfile(prev => ({
          ...prev,
          profile_image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setEditedProfile(prev => ({
      ...prev,
      profile_image: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      // use the same access token here also.
      
      // try {
      //   const token = localStorage.getItem('accessToken');
      //   const response = await fetch('/api/v1/users/shop-owner/profile', {
      //     method: 'PUT',
      //     headers: {
      //       'Authorization': `Bearer ${token}`,
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify(editedProfile)
      //   });
      //   const data = await response.json();
      //   setProfile(data.data);
      // } catch (err) {
      //   setError(err.message);
      // }
      
      setProfile(editedProfile);
      setSaving(false);
      setIsEditMode(false);
      setEditedProfile(null);
      setPreviewImage(null);
    }, 1000);
  };

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
          onClick={() => window.history.back()}
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

            <button 
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
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

      {/* Edit Modal */}
      {isEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Edit Profile</h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Photo Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="space-y-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </button>
                      {previewImage && (
                        <button
                          onClick={handleRemoveImage}
                          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Remove Photo
                        </button>
                      )}
                      <p className="text-sm text-gray-500">
                        Recommended: Square image, at least 400x400px
                        <br />
                        Maximum file size: 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editedProfile?.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.business_name || ''}
                      onChange={(e) => handleInputChange('business_name', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.gst_number || ''}
                      onChange={(e) => handleInputChange('gst_number', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.business_address_line1 || ''}
                      onChange={(e) => handleInputChange('business_address_line1', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.business_address_line2 || ''}
                      onChange={(e) => handleInputChange('business_address_line2', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.business_address_state || ''}
                      onChange={(e) => handleInputChange('business_address_state', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.business_address_district || ''}
                      onChange={(e) => handleInputChange('business_address_district', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.business_address_pincode || ''}
                      onChange={(e) => handleInputChange('business_address_pincode', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Banking Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.bank_account_number || ''}
                      onChange={(e) => handleInputChange('bank_account_number', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      value={editedProfile?.shop_owner?.ifsc_code || ''}
                      onChange={(e) => handleInputChange('ifsc_code', e.target.value, true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}