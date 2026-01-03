"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import SelectCategory from "@/components/Dropdowns/selectCategory";

// --- Icons ---
import {
  ArrowLeft,
  X,
  Loader2,
  Save,
  ImagePlus,
  Trash2
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// --- Validation Schema ---
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  // Keep unit for schema validation, even if not shown in UI
  unit: z.enum(["piece", "kg", "gram", "liter", "pair", "set", "loaf", "dozen", "meter", "yard", "bottle", "pack"]),
  is_active: z.boolean().default(true),
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
  console.log("Current Product in Store:", currentProduct);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Single Image State ---
  const [existingImage, setExistingImage] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      unit: "piece",
      is_active: true,
      category_id: "",
    },
  });

  // Fetch Product Data
  useEffect(() => {
    const init = async () => {
      if (shopId && productId) {
        await getProductDetails(shopId, productId);
        setIsInitializing(false);
      }
    };
    init();
  }, [shopId, productId, getProductDetails]);

  // Populate Form
  useEffect(() => {
    if (!isInitializing && currentProduct) {
      const catId = typeof currentProduct.category_id === 'object'
        ? currentProduct.category_id?._id
        : currentProduct.category_id;

      form.reset({
        name: currentProduct.name || "",
        description: currentProduct.description || "",
        brand: currentProduct.brand || "",
        unit: currentProduct.unit || "piece",
        is_active: !!currentProduct.is_active,
        category_id: catId || "",
      });

      // Handle Single Image: Take the first one if array exists
      if (currentProduct.main_image?.url) {
        setExistingImage(currentProduct.main_image.url);
      }
    }
  }, [currentProduct, isInitializing, form]);

  // Cleanup Preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // --- Handlers ---

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clear previous preview if exists
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Start "fresh" by ignoring the old server image visually
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
      // Logic: If we have an existing image, send it. If we have a new file, we upload it separately.
      // If user removed everything, images array is empty.
      const imagesPayload = existingImage ? [existingImage] : [];

      const payload = {
        ...values,
        images: imagesPayload, 
      };

      const success = await updateProduct(shopId, productId, payload);

      if (success) {
        // If there is a NEW file, upload it now
        if (newImageFile) {
          const formData = new FormData();
          formData.append("file", newImageFile); 
          await uploadProductImages(shopId, productId, formData);
        }

        toast.success("Product updated successfully");
        router.push(`/products`);
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
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  // Determine what to show in the image box
  const activeImage = previewUrl || existingImage;

  return (
    <div className="container mx-auto p-6 max-w-5xl dark:text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-sm text-muted-foreground">Manage details and main image.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column: Form Fields */}
            <div className="md:col-span-2 space-y-6">
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
                  <FormField
                    control={form.control}
                    name="is_active"
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

            {/* Right Column: Single Image Upload */}
            <div className="md:col-span-1">
              <Card className="dark:bg-slate-800 dark:border-slate-700 h-full">
                <CardHeader>
                  <CardTitle>Front Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    
                    {activeImage ? (
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 group">
                        <img 
                          src={activeImage} 
                          alt="Product Front" 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon"
                            onClick={handleRemoveImage}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                        {/* Status Badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                          {previewUrl ? "New Upload" : "Saved"}
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImagePlus className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Front view only
                          </p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}

                    <div className="text-xs text-muted-foreground text-center">
                      Upload a single clear image representing your product.
                    </div>
                  </div>
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