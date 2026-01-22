"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useProductStore } from "@/store/productStore";
import { useVariantStore } from "@/store/productVariantStore";
import CascadingCategorySelect from "@/components/Dropdowns/CascadingCategorySelect";

// --- Icons ---
import {
  ArrowLeft,
  Loader2,
  Save,
  ImagePlus,
  Trash2,
  Plus,
  Upload,
  X,
  Package,
  Tag,
  Boxes,
  Sparkles,
  Edit3,
  Eye
} from "lucide-react";

// --- Shadcn UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

// --- Validation Schema ---
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  is_available: z.boolean().default(true),
});

const formatPrice = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// --- Variant Row Component ---
const VariantRow = ({ variant, shopId, onRefresh }) => {
  const { updateVariant, deleteVariant, uploadVariantImages, deleteVariantImage, isLoading } = useVariantStore();

  const [isOpen, setIsOpen] = useState(false);

  const normalizeTax = (tax) => {
    if (!tax) return [];
    if (Array.isArray(tax)) return tax.map(t => ({ name: t?.name ?? "", rate: t?.rate ?? 0 }));
    if (typeof tax === 'object') {
      return Object.entries(tax).map(([name, rate]) => ({ name, rate: rate || 0 }));
    }
    return [];
  };

  const [data, setData] = useState({
    name: variant.name || "",
    price: variant.price || 0,
    stock_quantity: variant.stock_quantity || 0,
    sku: variant.sku || "",
    cost_price: variant.cost_price || 0,
    compare_at_price: variant.compare_at_price || 0,
    unit: variant.unit || "piece",
    per_unit_qty: variant.per_unit_qty || 1,
    tax: normalizeTax(variant.tax),
    attributes: variant.attributes || []
  });

  const [pendingFiles, setPendingFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleSave = async () => {
    setIsSaving(true);
    const updateSuccess = await updateVariant(variant._id, data);
    let uploadSuccess = true;
    if (pendingFiles.length > 0) {
      const res = await uploadVariantImages(variant._id, pendingFiles);
      if (!res) uploadSuccess = false;
    }
    if (updateSuccess && uploadSuccess) {
      toast.success("Variant saved successfully");
      setPendingFiles([]);
      setPreviewUrls([]);
      onRefresh();
    } else if (!updateSuccess) {
      // Error handled by store
    } else {
      toast.error("Details saved, but image upload failed");
      onRefresh();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this variant?")) return;
    const success = await deleteVariant(variant._id);
    if (success) {
      toast.success("Variant deleted");
      onRefresh();
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPendingFiles(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removePendingImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (index) => {
    if (!window.confirm("Remove this saved image?")) return;
    const success = await deleteVariantImage(variant._id, index);
    if (success) {
      toast.success("Image removed");
      onRefresh();
    }
  };

  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 overflow-hidden shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
            {variant.images && variant.images.length > 0 && variant.images[0]?.url && variant.images[0].url.trim() !== '' ? (
              <img src={variant.images[0].url} className="h-full w-full object-cover" alt="variant" />
            ) : (
              <Package className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{variant.name || "Unnamed Variant"}</h4>
            <div className="text-xs text-slate-500 flex gap-2 items-center mt-0.5">
              <span className="font-medium text-indigo-600 dark:text-indigo-400">{formatPrice(variant.price)}</span>
              <span>•</span>
              <span>Stock: {variant.stock_quantity}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">SKU: {variant.sku}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="rounded-xl">
          {isOpen ? "Close" : "Edit"}
        </Button>
      </div>

      {isOpen && (
        <div className="p-5 pt-0 space-y-5 border-t dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="grid grid-cols-1 gap-4 mt-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Variant Name</label>
              <Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Selling Price *</label>
              <Input type="number" value={data.price} onChange={e => setData({ ...data, price: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Stock Qty *</label>
              <Input type="number" value={data.stock_quantity} onChange={e => setData({ ...data, stock_quantity: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Cost Price</label>
              <Input type="number" value={data.cost_price} onChange={e => setData({ ...data, cost_price: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">MRP (Compare At)</label>
              <Input type="number" value={data.compare_at_price} onChange={e => setData({ ...data, compare_at_price: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">SKU</label>
              <Input value={data.sku} onChange={e => setData({ ...data, sku: e.target.value })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Unit</label>
              <Select value={data.unit} onValueChange={(val) => setData({ ...data, unit: val })}>
                <SelectTrigger className="h-10 rounded-xl dark:bg-slate-800 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["piece", "kg", "gram", "liter", "pair", "set", "loaf", "dozen", "meter", "yard", "bottle", "pack"].map(u => (
                    <SelectItem key={u} value={u} className="text-xs rounded-lg">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Per Unit Qty</label>
              <Input type="number" value={data.per_unit_qty} onChange={e => setData({ ...data, per_unit_qty: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
            </div>
          </div>

          {/* Tax Section */}
          <div className="space-y-3 border-t pt-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500">Tax / GST</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] rounded-lg hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
                onClick={() => setData({ ...data, tax: [...(data.tax || []), { name: "", rate: 0 }] })}
              >
                + Add Tax
              </Button>
            </div>
            <div className="space-y-2">
              {(data.tax || []).map((t, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Name (e.g. IGST)"
                    value={t?.name ?? ""}
                    onChange={e => {
                      const newTax = [...(data.tax || [])];
                      newTax[idx] = { ...newTax[idx], name: e.target.value.toUpperCase() };
                      setData({ ...data, tax: newTax });
                    }}
                    className="h-9 text-xs rounded-xl dark:bg-slate-800"
                  />
                  <div className="relative w-24">
                    <Input
                      type="number"
                      placeholder="%"
                      value={t?.rate ?? 0}
                      onChange={e => {
                        const newTax = [...(data.tax || [])];
                        newTax[idx] = { ...newTax[idx], rate: parseFloat(e.target.value) || 0 };
                        setData({ ...data, tax: newTax });
                      }}
                      className="h-9 text-xs rounded-xl dark:bg-slate-800 pr-6"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-slate-400">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600 rounded-xl"
                    onClick={() => setData({ ...data, tax: (data.tax || []).filter((_, i) => i !== idx) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(data.tax || []).length === 0 && (
                <p className="text-[10px] text-slate-400 italic">No taxes applied.</p>
              )}
            </div>
          </div>

          {/* Attributes Manager */}
          <div className="space-y-3 border-t pt-4 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500">Attributes (Color, Size, etc.)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10"
                onClick={() => setData({ ...data, attributes: [...(data.attributes || []), { name: "", value: "" }] })}
              >
                + Add Attribute
              </Button>
            </div>
            <div className="space-y-2">
              {(data.attributes || []).map((attr, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Name (e.g. Color)"
                    value={attr.name}
                    onChange={(e) => {
                      const newAttrs = [...data.attributes];
                      newAttrs[idx] = { ...newAttrs[idx], name: e.target.value };
                      setData({ ...data, attributes: newAttrs });
                    }}
                    className="h-9 text-xs flex-1 rounded-xl dark:bg-slate-800"
                  />
                  <Input
                    placeholder="Value (e.g. Red)"
                    value={attr.value}
                    onChange={(e) => {
                      const newAttrs = [...data.attributes];
                      newAttrs[idx] = { ...newAttrs[idx], value: e.target.value };
                      setData({ ...data, attributes: newAttrs });
                    }}
                    className="h-9 text-xs flex-1 rounded-xl dark:bg-slate-800"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600 rounded-xl"
                    onClick={() => setData({ ...data, attributes: data.attributes.filter((_, i) => i !== idx) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(data.attributes || []).length === 0 && (
                <p className="text-[10px] text-slate-400 italic">No attributes defined.</p>
              )}
            </div>
          </div>

          {/* Image Manager */}
          <div className="space-y-3 border-t pt-4 dark:border-slate-700">
            <label className="text-xs font-medium text-slate-500 block">Variant Images</label>
            <div className="flex flex-wrap gap-2">
              {variant.images?.filter(img => img?.url && img.url.trim() !== '').map((img, idx) => (
                <div key={`existing-${idx}`} className="relative h-16 w-16 rounded-xl border-2 dark:border-slate-600 overflow-hidden group shadow-sm">
                  <img src={img.url} className="h-full w-full object-cover" alt={`variant-${idx}`} />
                  <div className="absolute top-0 right-0 bg-sky-500 text-[8px] text-white px-1.5 py-0.5 rounded-bl-lg font-medium">Saved</div>
                  <button
                    onClick={() => handleDeleteImage(idx)}
                    type="button"
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {previewUrls.map((url, idx) => (
                <div key={`pending-${idx}`} className="relative h-16 w-16 rounded-xl border-2 border-green-500 overflow-hidden group shadow-sm">
                  <img src={url} className="h-full w-full object-cover opacity-80" />
                  <div className="absolute top-0 right-0 bg-green-500 text-[8px] text-white px-1.5 py-0.5 rounded-bl-lg font-medium">New</div>
                  <button
                    onClick={() => removePendingImage(idx)}
                    type="button"
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {((variant.images?.length || 0) + pendingFiles.length) < 13 && (
                <label className="h-16 w-16 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-600 transition-colors">
                  <Upload className="h-4 w-4 text-slate-400" />
                  <span className="text-[9px] text-slate-400 mt-1">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            {pendingFiles.length > 0 && (
              <p className="text-[10px] text-green-600 mt-1">* {pendingFiles.length} new image(s) selected. Click Save Changes to upload.</p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 rounded-xl">
              <Trash2 className="h-3 w-3 mr-2" /> Delete Variant
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 h-9 rounded-xl shadow-lg shadow-indigo-500/25">
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />} Save Changes
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};


// --- Add Variant Form Component ---
const AddVariantForm = ({ productId, onRefresh }) => {
  const { addVariant, uploadVariantImages, isLoading } = useVariantStore();
  const [isOpen, setIsOpen] = useState(false);

  const [newData, setNewData] = useState({
    name: "",
    price: 0,
    stock_quantity: 0,
    sku: "",
    cost_price: 0,
    compare_at_price: 0
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }
  }, [previewUrl]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
  };

  const handleAdd = async () => {
    const newVariant = await addVariant(productId, newData);
    if (newVariant) {
      if (imageFile) {
        await uploadVariantImages(newVariant._id, [imageFile]);
      }
      toast.success("New variant added!");
      setNewData({ name: "", price: 0, stock_quantity: 0, sku: "", cost_price: 0, compare_at_price: 0 });
      removeImage();
      setIsOpen(false);
      onRefresh();
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full border-dashed rounded-xl h-12" variant="outline">
        <Plus className="mr-2 h-4 w-4" /> Add New Variant
      </Button>
    );
  }

  return (
    <Card className="border-dashed border-2 rounded-2xl dark:border-slate-700 dark:bg-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20">
            <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          Add New Variant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Name</label>
          <Input placeholder="e.g. Blue" value={newData.name} onChange={e => setNewData({ ...newData, name: e.target.value })} className="h-10 rounded-xl dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Selling Price *</label>
            <Input type="number" value={newData.price} onChange={e => setNewData({ ...newData, price: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Stock Qty *</label>
            <Input type="number" value={newData.stock_quantity} onChange={e => setNewData({ ...newData, stock_quantity: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Cost Price</label>
            <Input type="number" value={newData.cost_price} onChange={e => setNewData({ ...newData, cost_price: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">MRP (Compare At)</label>
            <Input type="number" value={newData.compare_at_price} onChange={e => setNewData({ ...newData, compare_at_price: parseFloat(e.target.value) })} className="h-10 rounded-xl dark:bg-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">SKU</label>
            <Input placeholder="Optional" value={newData.sku} onChange={e => setNewData({ ...newData, sku: e.target.value })} className="h-10 rounded-xl dark:bg-slate-800" />
          </div>
        </div>

        {/* Image Upload for New Variant */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">Variant Image (Optional)</label>
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <div className="relative h-16 w-16 rounded-xl border-2 dark:border-slate-600 overflow-hidden group">
                <img src={previewUrl} className="h-full w-full object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="h-16 w-16 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 dark:border-slate-600 transition-colors">
                <Upload className="h-4 w-4 text-slate-400" />
                <span className="text-[9px] text-slate-400 mt-1">Select</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
            {previewUrl && <span className="text-xs text-green-600">Image selected</span>}
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t dark:border-slate-700 pt-4">
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl">Cancel</Button>
        <Button onClick={handleAdd} disabled={isLoading} size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create Variant"}
        </Button>
      </CardFooter>
    </Card>
  );
};


const EditProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const { shopId, productId } = params;

  const {
    currentProduct,
    currentVariants,
    getProductDetails,
    updateProduct,
    uploadProductImages,
    isLoading: storeLoading
  } = useProductStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [existingImage, setExistingImage] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      is_available: true,
      category_id: "",
    },
  });

  useEffect(() => {
    const init = async () => {
      if (shopId && productId) {
        await getProductDetails(shopId, productId);
        setIsInitializing(false);
      }
    };
    init();
  }, [shopId, productId]);

  const refreshData = async () => {
    await getProductDetails(shopId, productId);
  };

  useEffect(() => {
    if (!isInitializing && currentProduct) {
      const catId = typeof currentProduct.category_id === 'object'
        ? currentProduct.category_id?._id
        : currentProduct.category_id;

      form.reset({
        name: currentProduct.name || "",
        description: currentProduct.description || "",
        brand: currentProduct.brand || "",
        is_available: currentProduct.is_available,
        category_id: catId || "",
      });

      if (currentProduct.main_image && currentProduct.main_image?.url) {
        setExistingImage(currentProduct.main_image.url);
      }
    }
  }, [currentProduct, isInitializing, form]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExistingImage(null);
    }
  };

  const handleRemoveImage = () => {
    setNewImageFile(null);
    setPreviewUrl(null);
    setExistingImage(null);
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = { ...values };
      const success = await updateProduct(shopId, productId, payload);

      if (success) {
        if (newImageFile) {
          const formData = new FormData();
          formData.append("file", newImageFile);
          await uploadProductImages(shopId, productId, formData);
        }
        toast.success("Product updated successfully");
        router.refresh();
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update product details");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        <Skeleton className="h-10 w-1/3 rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  const activeImage = previewUrl || existingImage;

  return (
    <motion.div
      className="container mx-auto p-4 lg:p-8 max-w-6xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Edit3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Product</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage details, main image, and variants.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Product Info */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

          {/* General Info Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                      <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <CardTitle className="text-lg">General Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl dark:bg-slate-800 h-11" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl><Input {...field} className="rounded-xl dark:bg-slate-800 h-10" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <CascadingCategorySelect value={field.value} onCategorySelect={field.onChange} placeholder="Select Category..." />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[120px] rounded-xl dark:bg-slate-800" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 border rounded-xl p-4 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-600" />
                        </FormControl>
                        <div>
                          <FormLabel className="font-medium">Visible to Customers</FormLabel>
                          <p className="text-xs text-slate-500">Product will appear in your store</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting || storeLoading} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save General Info
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </form>
          </Form>

          {/* Variants Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                <Boxes className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Product Variants</h2>
            </div>

            <div className="space-y-4">
              {currentVariants?.map((variant) => (
                <VariantRow
                  key={variant._id}
                  variant={variant}
                  shopId={shopId}
                  onRefresh={refreshData}
                />
              ))}
            </div>

            <div className="mt-6">
              <AddVariantForm productId={productId} onRefresh={refreshData} />
            </div>
          </div>

        </motion.div>

        {/* RIGHT COLUMN: Main Image */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900/50 overflow-hidden sticky top-6">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                  <ImagePlus className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Main Product Image</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {activeImage ? (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 group">
                    <img
                      src={activeImage}
                      alt="Product"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={handleRemoveImage}
                        className="rounded-xl"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                      {previewUrl ? "New Upload" : "Saved"}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 mb-3">
                        <Upload className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default EditProductPage;