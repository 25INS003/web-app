"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import SelectCategory from "@/components/Dropdowns/selectCategory";

// --- Icons ---
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Save,
  ImageIcon,
  Plus
} from "lucide-react";

// --- Shadcn UI ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// --- Validation Schema ---
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  discounted_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative"),
  min_stock_alert: z.coerce.number().min(1).default(5),
  unit: z.enum(["piece", "kg", "gram", "liter", "pair", "set", "loaf"]),
  is_available: z.boolean().default(true),
});

const EditProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const { shopId, productId } = params;

  const {
    currentProduct,
    getProductDetails,
    updateProduct,
    uploadProductImages,
    isLoading: storeLoading
  } = useProductStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image Management State
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      price: 0,
      stock_quantity: 0,
      min_stock_alert: 5,
      unit: "piece",
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
  }, [shopId, productId, getProductDetails]);

  useEffect(() => {
    if (!isInitializing && currentProduct) {
      // Handle Category safely
      const catId = typeof currentProduct.category_id === 'object'
        ? currentProduct.category_id?._id
        : currentProduct.category_id;

      form.reset({
        // Use logical OR (||) to ensure no value is ever undefined/null
        name: currentProduct.name || "",
        description: currentProduct.description || "",
        brand: currentProduct.brand || "",
        price: currentProduct.price ?? 0,
        discounted_price: currentProduct.discounted_price ?? 0,
        stock_quantity: currentProduct.stock_quantity ?? 0,
        min_stock_alert: currentProduct.min_stock_alert ?? 5,
        unit: currentProduct.unit || "piece",
        is_available: !!currentProduct.is_available,
        category_id: catId || "",
      });

      setExistingImages(currentProduct.images || []);
    }
  }, [currentProduct, isInitializing, form]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  // --- Handlers ---

  const handleNewImageChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalImages = existingImages.length + newImageFiles.length + files.length;

      if (totalImages > 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }

      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setNewImageFiles((prev) => [...prev, ...files]);
      setNewImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]); // Cleanup
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // 1. Prepare payload with "Kept" images
      const payload = {
        ...values,
        images: existingImages, // Tells backend to keep these, remove others
      };

      const success = await updateProduct(shopId, productId, payload);

      if (success) {
        // 2. If metadata update succeeded, upload NEW files
        if (newImageFiles.length > 0) {
          const formData = new FormData();
          newImageFiles.forEach((file) => {
            formData.append("images", file); // Key must match your backend Multer/upload config
          });

          await uploadProductImages(shopId, productId, formData);
        }

        toast.success("Product updated successfully");
        router.push(`/products/${shopId}/view/${productId}`);
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
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-[500px]" />
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl dark:text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-sm text-muted-foreground">Manage details and media for this item.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="md:col-span-2 space-y-6">
              {/* Product Info */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl><Input {...field} className="dark:bg-slate-900" /></FormControl>
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
                          <FormControl><Input {...field} className="dark:bg-slate-900" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <SelectCategory value={field.value} onCateSelect={field.onChange} />
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
                          <Textarea {...field} className="min-h-[120px] dark:bg-slate-900" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Enhanced Media Card */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Product Images</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {existingImages.length + newImageFiles.length} / 5 Images
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

                    {/* Existing Images */}
                    {existingImages.map((src, index) => (
                      <div key={`old-${index}`} className="relative group aspect-square rounded-md overflow-hidden border bg-slate-100 dark:bg-slate-900">
                        <img src={src} alt="Existing" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/60 text-[10px] text-white px-1.5 rounded">Saved</div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* New Previews */}
                    {newImagePreviews.map((src, index) => (
                      <div key={`new-${index}`} className="relative group aspect-square rounded-md overflow-hidden border-2 border-primary/50">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-primary text-[10px] text-white px-1.5 rounded">New</div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Upload Trigger */}
                    {existingImages.length + newImageFiles.length < 5 && (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-slate-300 dark:border-slate-700">
                        <Plus className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] font-medium text-muted-foreground">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleNewImageChange}
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-6">
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price (₹)</FormLabel>
                        <Input type="number" {...field} className="dark:bg-slate-900" />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discounted_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Price (Optional)</FormLabel>
                        <Input type="number" {...field} className="dark:bg-slate-900" />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock</FormLabel>
                          <Input type="number" {...field} className="dark:bg-slate-900" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="dark:bg-slate-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["piece", "kg", "gram", "liter", "pair", "set"].map(u => (
                                <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0 border rounded-md p-3 dark:border-slate-700">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="text-sm font-medium">Visible to Customers</FormLabel>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-700">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting || storeLoading}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditProductPage;