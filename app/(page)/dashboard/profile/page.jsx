"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  User, Building2, Phone, Mail, CreditCard, MapPin, 
  Calendar, ArrowLeft, Edit, X, Camera, Upload, Loader2, Save
} from 'lucide-react';
import { useShopOwnerStore } from '@/store/shopOwnerStore'; // Adjust path as needed

export default function ShopOwnerProfilePage() {
  // --- STORE ---
  const { 
    shopOwner: profile, // Alias to 'profile' to avoid confusion with nested 'shop_owner' property
    isLoading, 
    error: storeError, 
    fetchShopOwnerProfile, 
    updateShopOwnerProfile,
    uploadShopOwnerProfileImage,
    clearError
  } = useShopOwnerStore();

  // --- LOCAL STATE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // --- INITIAL FETCH ---
  useEffect(() => {
    fetchShopOwnerProfile();
    return () => clearError();
  }, [fetchShopOwnerProfile, clearError]);

  // --- DERIVED DATA ---
  // The backend aggregation returns the User document with a nested 'shop_owner' object
  const userDetails = profile || {};
  const businessDetails = profile?.shop_owner || {};

  // --- HANDLERS ---

  const handleEditClick = () => {
    // Flatten data for the edit form as the API expects a single level object
    setEditedData({
      // User Fields
      first_name: userDetails.first_name || "",
      last_name: userDetails.last_name || "",
      phone: userDetails.phone || "",
      
      // Shop Owner Fields
      business_name: businessDetails.business_name || "",
      gst_number: businessDetails.gst_number || "",
      business_address_line1: businessDetails.business_address_line1 || "",
      business_address_line2: businessDetails.business_address_line2 || "",
      business_address_state: businessDetails.business_address_state || "",
      business_address_district: businessDetails.business_address_district || "",
      business_address_pincode: businessDetails.business_address_pincode || "",
      bank_account_number: businessDetails.bank_account_number || "",
      ifsc_code: businessDetails.ifsc_code || "",
    });
    
    setPreviewImage(userDetails.profile_image || null);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedData(null);
    setPreviewImage(null);
    setImageFile(null);
    clearError();
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Upload Image if changed
      if (imageFile) {
        await uploadShopOwnerProfileImage(imageFile);
      }
      // 2. Update Text Data
      await updateShopOwnerProfile(editedData);

      setIsEditMode(false);
      setImageFile(null);
      setEditedData(null);
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getMaskedAccount = (accNum) => {
    if (!accNum) return 'Not provided';
    if (accNum.length <= 4) return accNum;
    return accNum.slice(0, -4).replace(/./g, '•') + accNum.slice(-4);
  };

  // --- RENDER ---

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile && !isLoading) {
     return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-red-500">Profile not found.</div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 transition-colors">
      <div className="max-w-5xl mx-auto">
        {/* Top Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Global Error */}
        {storeError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
                <span>{storeError}</span>
                <button onClick={clearError}><X className="w-4 h-4"/></button>
            </div>
        )}

        {/* Header Card (User Info) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white dark:border-gray-600 shadow-sm">
                {userDetails.profile_image ? (
                  <img 
                    src={userDetails.profile_image} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {userDetails.first_name} {userDetails.last_name}
                  </h1>
                  {userDetails.is_verified && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">
                      Verified
                    </span>
                  )}
                  {businessDetails.is_approved && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                      Approved
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                  {businessDetails.business_name || "Business Name Not Set"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Member since {formatDate(userDetails.createdAt)}
                </p>
              </div>
            </div>

            <button 
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Business Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Business Name</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{businessDetails.business_name || "N/A"}</p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">GST Number</label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{businessDetails.gst_number || 'Not provided'}</p>
            </div>
            
            <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                <MapPin className="w-4 h-4" />
                Business Address
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {businessDetails.business_address_line1}
                {businessDetails.business_address_line2 && `, ${businessDetails.business_address_line2}`}
              </p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {businessDetails.business_address_district}, {businessDetails.business_address_state} - {businessDetails.business_address_pincode}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                <Calendar className="w-4 h-4" />
                Business Since
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{formatDate(businessDetails.business_since)}</p>
            </div>
          </div>
        </div>

        {/* Contact Information (User Schema) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{userDetails.email}</p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                <Phone className="w-4 h-4" />
                Phone
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{userDetails.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Banking Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Account Number</label>
              <p className="text-gray-900 dark:text-gray-100 font-mono font-medium">
                {getMaskedAccount(businessDetails.bank_account_number)}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">IFSC Code</label>
              <p className="text-gray-900 dark:text-gray-100 font-mono font-medium">{businessDetails.ifsc_code || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditMode && editedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col transition-colors border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-xl">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h2>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8 overflow-y-auto flex-1">
              
              {/* 1. Image Upload Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 border-b border-gray-200 dark:border-gray-700 pb-8">
                <div className="relative group">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-lg">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-blue-600 dark:bg-blue-700 text-white p-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-lg group-hover:scale-110 transform duration-200"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 text-center sm:text-left space-y-3">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Picture</h3>
                   <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <Upload className="w-4 h-4" /> Change Photo
                        </button>
                        {previewImage && (
                          <button
                            type="button"
                            onClick={() => { setPreviewImage(null); setImageFile(null); }}
                             className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                    </div>
                </div>
              </div>

              {/* 2. Personal Information (User Schema) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <InputField 
                      label="First Name" 
                      value={editedData.first_name} 
                      onChange={(v) => handleInputChange('first_name', v)} 
                   />
                   <InputField 
                      label="Last Name" 
                      value={editedData.last_name} 
                      onChange={(v) => handleInputChange('last_name', v)} 
                   />
                   <InputField 
                      label="Phone Number" 
                      value={editedData.phone} 
                      onChange={(v) => handleInputChange('phone', v)} 
                      type="tel"
                   />
                </div>
              </div>

              {/* 3. Business Information (ShopOwner Schema) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Business Name *" 
                    value={editedData.business_name} 
                    onChange={(v) => handleInputChange('business_name', v)} 
                  />
                  <InputField 
                    label="GST Number" 
                    value={editedData.gst_number} 
                    onChange={(v) => handleInputChange('gst_number', v)} 
                  />
                  <div className="md:col-span-2">
                     <InputField 
                        label="Address Line 1 *" 
                        value={editedData.business_address_line1} 
                        onChange={(v) => handleInputChange('business_address_line1', v)} 
                     />
                  </div>
                  <div className="md:col-span-2">
                     <InputField 
                        label="Address Line 2" 
                        value={editedData.business_address_line2} 
                        onChange={(v) => handleInputChange('business_address_line2', v)} 
                     />
                  </div>
                  <InputField 
                    label="State *" 
                    value={editedData.business_address_state} 
                    onChange={(v) => handleInputChange('business_address_state', v)} 
                  />
                  <InputField 
                    label="District *" 
                    value={editedData.business_address_district} 
                    onChange={(v) => handleInputChange('business_address_district', v)} 
                  />
                  <InputField 
                    label="Pincode *" 
                    value={editedData.business_address_pincode} 
                    onChange={(v) => handleInputChange('business_address_pincode', v)} 
                  />
                </div>
              </div>

              {/* 4. Banking Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Banking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Bank Account Number *" 
                    value={editedData.bank_account_number} 
                    onChange={(v) => handleInputChange('bank_account_number', v)} 
                    className="font-mono"
                  />
                  <InputField 
                    label="IFSC Code *" 
                    value={editedData.ifsc_code} 
                    onChange={(v) => handleInputChange('ifsc_code', v)} 
                    className="font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-end gap-3 rounded-b-xl">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Input Component for cleaner JSX
const InputField = ({ label, value, onChange, type = "text", className = "" }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${className}`}
    />
  </div>
);