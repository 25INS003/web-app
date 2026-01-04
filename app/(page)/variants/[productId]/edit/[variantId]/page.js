"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useVariantStore } from "@/store/productVariantStore";
import {
  ArrowLeft,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Save,
  Loader2,
  Star,
  Image as ImageIcon
} from "lucide-react";

export default function EditVariantPage() {
  const router = useRouter();
  const params = useParams();
  const { variantId } = params; // Assumes route is /variants/[variantId]/edit

  // --- Store Actions & State ---
  const {
    getVariantDetail,
    updateVariant,
    uploadVariantImages,
    deleteVariantImage,
    setMainVariantImage,
    currentVariant,
    isLoading: isStoreLoading, // Renamed to differentiate
  } = useVariantStore();

  // --- Local State ---
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    barcode: "",
    price: "",
    compare_at_price: "",
    cost_price: "",
    stock_quantity: "",
    low_stock_threshold: 5,
    is_active: true,
    is_default: false,
    attributes: [],
    images: [], // Used for display only
  });

  // --- 1. Fetch Data on Mount ---
  useEffect(() => {
    const fetchData = async () => {
      if (variantId) {
        setIsPageLoading(true);
        await getVariantDetail(variantId);
        setIsPageLoading(false);
      }
    };
    fetchData();
  }, [variantId]);

  // --- 2. Sync Store Data to Local State ---
  useEffect(() => {
    if (currentVariant) {
      setFormData({
        name: currentVariant.name || "",
        sku: currentVariant.sku || "",
        description: currentVariant.description || "",
        barcode: currentVariant.barcode || "",
        price: currentVariant.price || "",
        compare_at_price: currentVariant.compare_at_price || "",
        cost_price: currentVariant.cost_price || "",
        stock_quantity: currentVariant.stock_quantity || "",
        low_stock_threshold: currentVariant.low_stock_threshold || 5,
        is_active: currentVariant.is_active ?? true,
        is_default: currentVariant.is_default ?? false,
        attributes: currentVariant.attributes || [],
        images: currentVariant.images || [],
      });
    }
  }, [currentVariant]);

  // --- Handlers ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Attribute Handlers
  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index][field] = value;
    setFormData({ ...formData, attributes: newAttributes });
  };

  const addAttributeRow = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { name: "", value: "" }],
    });
  };

  const removeAttributeRow = (index) => {
    const newAttributes = formData.attributes.filter((_, i) => i !== index);
    setFormData({ ...formData, attributes: newAttributes });
  };

  // --- New Image Handlers (Local) ---
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check total limit (Existing + New)
    const currentTotal = formData.images.length + newFiles.length;
    if (currentTotal + selectedFiles.length > 13) {
      alert("Total images (existing + new) cannot exceed 13.");
      return;
    }

    const updatedFiles = [...newFiles, ...selectedFiles];
    setNewFiles(updatedFiles);

    // Generate Previews
    const updatedPreviews = [
      ...newPreviews,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ];
    setNewPreviews(updatedPreviews);
  };

  const removeNewImage = (index) => {
    const updatedFiles = newFiles.filter((_, i) => i !== index);
    const updatedPreviews = newPreviews.filter((_, i) => i !== index);
    
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles(updatedFiles);
    setNewPreviews(updatedPreviews);
  };

  // --- Existing Image Handlers (API Direct) ---
  const handleDeleteExistingImage = async (imageIndex) => {
    if (window.confirm("Are you sure you want to delete this image permanently?")) {
      await deleteVariantImage(variantId, imageIndex);
    }
  };

  const handleSetMainImage = async (fileOrUrl) => {
    // Note: Your store implementation for `setMainVariantImage` expects a FILE object (uploading a new main).
    // If your backend supports setting an existing URL as main via a different endpoint, you'd use that.
    // Based on your store, this action implies REPLACING the main image with a new file.
    // However, usually, a "Make Main" button acts on existing images.
    // Assuming we can't "swap" main status easily without a backend "reorder" or "setMainByIndex" endpoint, 
    // I will hide this button for existing images unless your API supports reordering.
    
    alert("To change the main image, please delete the current one or upload a new Main image via specific backend logic.");
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Update General Data
    const cleanedData = {
      ...formData,
      attributes: formData.attributes.filter(attr => attr.name && attr.value)
    };
    
    // Don't send the images array back in the body (images are handled separately)
    delete cleanedData.images; 

    const success = await updateVariant(variantId, cleanedData);

    if (success) {
      // 2. Upload New Images (if any)
      if (newFiles.length > 0) {
        await uploadVariantImages(variantId, newFiles);
        // Clear local new files after successful upload
        setNewFiles([]);
        setNewPreviews([]);
      }
      
      alert("Variant updated successfully!");
      // Optional: router.back(); 
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-500">Loading variant details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Variant</h1>
              <p className="text-sm text-gray-500">Update details for <span className="font-mono text-gray-700">{formData.sku}</span></p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isStoreLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isStoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Info */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">General Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Variant Attributes</h3>
                <button 
                  type="button"
                  onClick={addAttributeRow}
                  className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Attribute
                </button>
              </div>

              <div className="space-y-3">
                {formData.attributes.map((attr, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Name"
                        value={attr.name}
                        onChange={(e) => handleAttributeChange(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Value"
                        value={attr.value}
                        onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttributeRow(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare at</label>
                  <input
                    type="number"
                    name="compare_at_price"
                    value={formData.compare_at_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <input
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            
            {/* Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Status</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Active</span>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Default Variant</span>
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    required
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    value={formData.low_stock_threshold}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Media Management */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
              
              {/* Existing Images */}
              {formData.images.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Existing Images</p>
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                        <img 
                          src={img.url} 
                          alt="Variant" 
                          className="w-full h-full object-cover" 
                        />
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteExistingImage(index)}
                            className="p-1.5 bg-white rounded-full text-red-600 hover:bg-red-50"
                            title="Delete Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Main Image Badge */}
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Add more images</p>
              </div>

              {/* New Previews */}
              {newPreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ready to Upload</p>
                  <div className="grid grid-cols-3 gap-2">
                    {newPreviews.map((src, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-green-200 ring-2 ring-green-100">
                        <img src={src} alt="New Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 hover:bg-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}