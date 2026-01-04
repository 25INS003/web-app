"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation"; // Use 'next/router' if using Pages dir
import { useVariantStore } from "@/store/productVariantStore";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  UploadCloud, 
  X, 
  Save, 
  Loader2 
} from "lucide-react";

export default function AddVariantPage() {
  const router = useRouter();
  const params = useParams();
  const { productId } = params;

  // --- Store Actions ---
  const { addVariant, uploadVariantImages, isLoading } = useVariantStore();

  // --- Local State ---
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  
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
    attributes: [{ name: "", value: "" }], // Start with one empty attribute
  });

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

  // Image Handlers
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate max images (Store/Schema limit is 13)
    if (files.length + selectedFiles.length > 13) {
      alert("You can only upload a maximum of 13 images.");
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    // Generate Previews
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke old URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId) {
      alert("Product ID is missing.");
      return;
    }

    // 1. Create Variant
    // Filter out empty attributes before sending
    const cleanedData = {
      ...formData,
      attributes: formData.attributes.filter(attr => attr.name && attr.value)
    };

    const newVariant = await addVariant(productId, cleanedData);

    if (newVariant && newVariant._id) {
      // 2. Upload Images (if any)
      if (files.length > 0) {
        await uploadVariantImages(newVariant._id, files);
      }

      // 3. Success & Redirect
      // alert("Variant created successfully!");
      router.back(); // Or redirect to variant list
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Add New Variant</h1>
              <p className="text-sm text-gray-500">Create a new variation for this product</p>
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
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Variant
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Information Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">General Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Small / Red"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (ISBN/UPC)</label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Dynamic Attributes Card */}
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
                        placeholder="Name (e.g. Color)"
                        value={attr.name}
                        onChange={(e) => handleAttributeChange(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Value (e.g. Blue)"
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
                
                {formData.attributes.length === 0 && (
                  <p className="text-sm text-gray-400 italic">No attributes added. Click "Add Attribute" to define specifics.</p>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compare at Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="compare_at_price"
                      min="0"
                      value={formData.compare_at_price}
                      onChange={handleChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="cost_price"
                      min="0"
                      value={formData.cost_price}
                      onChange={handleChange}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Customers won't see this</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="space-y-6">
            
            {/* Status Card */}
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
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-700">Default Variant</span>
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    required
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Click to upload images</p>
                <p className="text-xs text-gray-400">Max 13 images</p>
              </div>

              {/* Image Previews */}
              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {previews.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}