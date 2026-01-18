"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation"; 
import { useVariantStore } from "@/store/productVariantStore";
import { useProductStore } from "@/store/productStore"; // Import product store
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  UploadCloud, 
  X, 
  Save, 
  Loader2,
  AlertTriangle 
} from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used for toasts

export default function AddVariantPage() {
  const router = useRouter();
  const params = useParams();
  const { productId, shopId } = params; // Ensure shopId is available in params if needed

  // --- Store Actions ---
  const { addVariant, uploadVariantImages, updateVariant, isLoading } = useVariantStore();
  const { getProductDetails, currentProduct, currentVariants } = useProductStore();

  // --- Local State ---
  const [isInitializing, setIsInitializing] = useState(true);
  const [defaultVariantToRename, setDefaultVariantToRename] = useState(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  // Form for the NEW variant
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
    attributes: [{ name: "", value: "" }], 
  });

  // Form for RENAMING the default variant (if needed)
  const [defaultVariantData, setDefaultVariantData] = useState({
    name: "",
    attributes: [{ name: "", value: "" }]
  });

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      if (productId && shopId) {
        // Fetch product & variants to check if we are in the "First Variant" scenario
        await getProductDetails(shopId, productId);
        setIsInitializing(false);
      }
    };
    init();
  }, [productId, shopId, getProductDetails]);

  // Detect if we need to rename the default variant
  useEffect(() => {
    if (!isInitializing && currentProduct && currentVariants) {
      // Check if there is exactly ONE variant
      if (currentVariants.length === 1) {
        const firstVar = currentVariants[0];
        // Check if it looks like a "Default Shell" (Same name as product, no attributes)
        // Or essentially, if it's the *only* variant, we MUST define it before adding a 2nd one.
        // Otherwise we end up with "Shirt" and "Red Shirt". We want "Blue Shirt" and "Red Shirt".
        
        // We only trigger this if the user hasn't already defined attributes for it
        if (!firstVar.attributes || firstVar.attributes.length === 0) {
            setDefaultVariantToRename(firstVar);
            // Pre-fill form with existing data (or empty attrs)
            setDefaultVariantData({
                name: "", // Force them to pick a specific name e.g. "Small / Red"
                attributes: [{ name: "", value: "" }]
            });
        }
      }
    }
  }, [currentProduct, currentVariants, isInitializing]);


  // --- Handlers ---

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Attribute Handlers for New Variant
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


  // Attribute Handlers for Default Variant (Renaming)
  const handleDefAttributeChange = (index, field, value) => {
    const newAttributes = [...defaultVariantData.attributes];
    newAttributes[index][field] = value;
    setDefaultVariantData({ ...defaultVariantData, attributes: newAttributes });
  };
  const addDefAttributeRow = () => {
    setDefaultVariantData({
      ...defaultVariantData,
      attributes: [...defaultVariantData.attributes, { name: "", value: "" }],
    });
  };
  const removeDefAttributeRow = (index) => {
    const newAttributes = defaultVariantData.attributes.filter((_, i) => i !== index);
    setDefaultVariantData({ ...defaultVariantData, attributes: newAttributes });
  };

  // Image Handlers
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 13) {
      toast.error("You can only upload a maximum of 13 images.");
      return;
    }
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!productId) {
      toast.error("Product ID is missing.");
      return;
    }

    try {
        // STEP 1: If we need to rename the default variant first
        if (defaultVariantToRename) {
            // Validate inputs
            const validDefAttrs = defaultVariantData.attributes.filter(a => a.name && a.value);
            if (validDefAttrs.length === 0 && !defaultVariantData.name) {
                toast.error("Please define attributes for the existing default variant first.");
                return;
            }

            const updatePayload = {
                name: defaultVariantData.name || `${currentProduct.name} - ${validDefAttrs.map(a => a.value).join("/")}`,
                attributes: validDefAttrs
            };

            const success = await updateVariant(defaultVariantToRename._id, updatePayload);
            if (!success) {
                toast.error("Failed to update the default variant. Please try again.");
                return;
            }
        }

        // STEP 2: Create the NEW Variant
        const cleanedData = {
            ...formData,
            attributes: formData.attributes.filter(attr => attr.name && attr.value)
        };

        const newVariant = await addVariant(productId, cleanedData);

        if (newVariant && newVariant._id) {
            if (files.length > 0) {
                await uploadVariantImages(newVariant._id, files);
            }
            toast.success("Variant created successfully!");
            router.back(); 
        }

    } catch (error) {
        console.error(error);
        toast.error("An unexpected error occurred");
    }
  };

  if (isInitializing) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add New Variant</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create a new variation for {currentProduct?.name}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All Changes
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* --- SECTION 1: RENAME DEFAULT (CONDITIONAL) --- */}
          {defaultVariantToRename && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                
                <div className="flex items-start gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
                    <div>
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">Setup Required: Define First Variant</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 max-w-3xl">
                            Before adding a second variant, you must define the specific attributes for your existing product (the current default).
                            For example, if you are adding a "Small" size, you should first label the existing one as "Large" or "Standard".
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-9">
                    <div>
                        <label className="block text-sm font-medium text-amber-900 dark:text-amber-400 mb-1">
                            Name for Existing Variant *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Standard Size" // Placeholder change
                            value={defaultVariantData.name}
                            onChange={(e) => setDefaultVariantData({...defaultVariantData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-slate-900"
                        />
                    </div>
                    {/* Attributes for Default */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-amber-900 dark:text-amber-400 mb-2">Attributes (e.g. Size: Large)</label>
                         <div className="space-y-3">
                            {defaultVariantData.attributes.map((attr, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Name (e.g. Size)"
                                    value={attr.name}
                                    onChange={(e) => handleDefAttributeChange(index, "name", e.target.value)}
                                    className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-amber-500 text-sm bg-white dark:bg-slate-900"
                                />
                                </div>
                                <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Value (e.g. Large)"
                                    value={attr.value}
                                    onChange={(e) => handleDefAttributeChange(index, "value", e.target.value)}
                                    className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-amber-500 text-sm bg-white dark:bg-slate-900"
                                />
                                </div>
                                <button
                                type="button"
                                onClick={() => removeDefAttributeRow(index)}
                                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition"
                                >
                                <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            ))}
                            <button 
                            type="button"
                            onClick={addDefAttributeRow}
                            className="text-sm text-amber-700 font-medium hover:text-amber-800 flex items-center gap-1"
                            >
                            <Plus className="w-4 h-4" /> Add Attribute
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          )}


          {/* --- SECTION 2: NEW VARIANT FORM --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* General Information Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">New Variant Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Variant Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Small / Red"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none transition"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      required
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none uppercase"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barcode (ISBN/UPC)</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                    />
                  </div>
  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                    ></textarea>
                  </div>
                </div>
              </div>
  
              {/* Dynamic Attributes Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Variant Attributes</h3>
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
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Value (e.g. Blue)"
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(index, "value", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttributeRow(index)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.attributes.length === 0 && (
                    <p className="text-sm text-slate-400 italic">No attributes added. Click "Add Attribute" to define specifics.</p>
                  )}
                </div>
              </div>
  
              {/* Pricing Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Pricing</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500">₹</span>
                      <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Compare at</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500">₹</span>
                      <input
                        type="number"
                        name="compare_at_price"
                        min="0"
                        value={formData.compare_at_price}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cost Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500">₹</span>
                      <input
                        type="number"
                        name="cost_price"
                        min="0"
                        value={formData.cost_price}
                        onChange={handleChange}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            {/* RIGHT COLUMN - Sidebar */}
            <div className="space-y-6">
              
              {/* Status Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Status</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 border dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
  
                  <label className="flex items-center justify-between p-3 border dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Default Variant</span>
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
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Inventory</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock_quantity"
                      required
                      min="0"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                    />
                  </div>
  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Low Stock Threshold</label>
                    <input
                      type="number"
                      name="low_stock_threshold"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-950 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>
              </div>
  
              {/* Image Upload Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Media</h3>
                
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Click to upload images</p>
                  <p className="text-xs text-slate-400">Max 13 images</p>
                </div>
  
                {/* Image Previews */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {previews.map((src, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 group">
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
          </div>
        </form>
      </div>
    </div>
  );
}