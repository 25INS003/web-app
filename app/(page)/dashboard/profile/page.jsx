"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Building2, Phone, Mail, CreditCard, MapPin,
  Calendar, ArrowLeft, Edit, X, Camera, Upload, Loader2, Save,
  CheckCircle2, Shield, Sparkles
} from 'lucide-react';
import { useShopOwnerStore } from '@/store/shopOwnerStore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

// Reusable Info Field Component
const InfoField = ({ icon: Icon, label, value, className = "" }) => (
  <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 ${className}`}>
    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1.5">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </div>
    <p className="font-semibold text-slate-900 dark:text-white">{value || "N/A"}</p>
  </div>
);

// Reusable Input Field Component
const FormInput = ({ label, value, onChange, type = "text", className = "" }) => (
  <div className="w-full space-y-2">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-xl dark:bg-slate-800 h-11 ${className}`}
    />
  </div>
);

export default function ShopOwnerProfilePage() {
  const {
    shopOwner: profile,
    isLoading,
    error: storeError,
    fetchShopOwnerProfile,
    updateShopOwnerProfile,
    uploadShopOwnerProfileImage,
    clearError
  } = useShopOwnerStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchShopOwnerProfile();
    return () => clearError();
  }, [fetchShopOwnerProfile, clearError]);

  const userDetails = profile || {};
  const businessDetails = profile?.shop_owner || {};

  const handleEditClick = () => {
    setEditedData({
      first_name: userDetails.first_name || "",
      last_name: userDetails.last_name || "",
      phone: userDetails.phone || "",
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
    setEditedData(prev => ({ ...prev, [field]: value }));
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
      if (imageFile) {
        await uploadShopOwnerProfileImage(imageFile);
      }
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

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  if (!profile && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-red-500 text-lg font-medium">Profile not found.</div>
      </div>
    );
  }

  return (
    <motion.div
      className="py-6 px-4 max-w-5xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Global Error */}
      {storeError && (
        <motion.div
          variants={itemVariants}
          className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl flex justify-between items-center"
        >
          <span>{storeError}</span>
          <button onClick={clearError} className="p-1 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      {/* Profile Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-lg dark:bg-slate-900/50 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden">
                  {userDetails.profile_image ? (
                    <img
                      src={userDetails.profile_image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>

                <div className="text-center sm:text-left pb-1">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {userDetails.first_name} {userDetails.last_name}
                    </h1>
                    {userDetails.is_verified && (
                      <Badge className="rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    )}
                    {businessDetails.is_approved && (
                      <Badge className="rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        <Shield className="w-3 h-3 mr-1" /> Approved
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">
                    {businessDetails.business_name || "Business Name Not Set"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500">
                    Member since {formatDate(userDetails.createdAt)}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleEditClick}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Information */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900/50 overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Business Name" value={businessDetails.business_name} />
              <InfoField label="GST Number" value={businessDetails.gst_number || 'Not provided'} />

              <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1.5">
                  <MapPin className="w-4 h-4" />
                  Business Address
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {businessDetails.business_address_line1}
                  {businessDetails.business_address_line2 && `, ${businessDetails.business_address_line2}`}
                </p>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {businessDetails.business_address_district}, {businessDetails.business_address_state} - {businessDetails.business_address_pincode}
                </p>
              </div>

              <InfoField icon={Calendar} label="Business Since" value={formatDate(businessDetails.business_since)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Information */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900/50 overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField icon={Mail} label="Email" value={userDetails.email} />
              <InfoField icon={Phone} label="Phone" value={userDetails.phone || 'Not provided'} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Banking Information */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-lg">Banking Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Account Number" value={<span className="font-mono">{getMaskedAccount(businessDetails.bank_account_number)}</span>} />
              <InfoField label="IFSC Code" value={<span className="font-mono">{businessDetails.ifsc_code || 'Not provided'}</span>} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl dark:bg-slate-900">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Edit Profile</DialogTitle>
                <DialogDescription>Update your business and personal information</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editedData && (
            <div className="space-y-8 py-4">
              {/* Profile Image Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b dark:border-slate-700">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl">
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Picture</h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-2" /> Change Photo
                    </Button>
                    {previewImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => { setPreviewImage(null); setImageFile(null); }}
                        className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="First Name" value={editedData.first_name} onChange={(v) => handleInputChange('first_name', v)} />
                  <FormInput label="Last Name" value={editedData.last_name} onChange={(v) => handleInputChange('last_name', v)} />
                  <FormInput label="Phone Number" value={editedData.phone} onChange={(v) => handleInputChange('phone', v)} type="tel" />
                </div>
              </div>

              {/* Business Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Business Name *" value={editedData.business_name} onChange={(v) => handleInputChange('business_name', v)} />
                  <FormInput label="GST Number" value={editedData.gst_number} onChange={(v) => handleInputChange('gst_number', v)} />
                  <div className="md:col-span-2">
                    <FormInput label="Address Line 1 *" value={editedData.business_address_line1} onChange={(v) => handleInputChange('business_address_line1', v)} />
                  </div>
                  <div className="md:col-span-2">
                    <FormInput label="Address Line 2" value={editedData.business_address_line2} onChange={(v) => handleInputChange('business_address_line2', v)} />
                  </div>
                  <FormInput label="State *" value={editedData.business_address_state} onChange={(v) => handleInputChange('business_address_state', v)} />
                  <FormInput label="District *" value={editedData.business_address_district} onChange={(v) => handleInputChange('business_address_district', v)} />
                  <FormInput label="Pincode *" value={editedData.business_address_pincode} onChange={(v) => handleInputChange('business_address_pincode', v)} />
                </div>
              </div>

              {/* Banking Details */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Banking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Bank Account Number *" value={editedData.bank_account_number} onChange={(v) => handleInputChange('bank_account_number', v)} className="font-mono" />
                  <FormInput label="IFSC Code *" value={editedData.ifsc_code} onChange={(v) => handleInputChange('ifsc_code', v.toUpperCase())} className="font-mono" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}