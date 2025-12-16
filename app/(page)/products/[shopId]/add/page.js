"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore"; // Check your path
import SelectCategory from "@/components/Dropdowns/selectCategory";

// --- Icons ---
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Save
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
  weight_kg: z.coerce.number().optional(),
  is_available: z.boolean().default(true),
  attributes: z.object({}).optional(),
});

const AddProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId;

  // Store
  const { createProduct, uploadProductImages, isLoading } = useProductStore();

  // Local State for Images
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Hook
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      price: 0,
      discounted_price: 0,
      stock_quantity: 0,
      min_stock_alert: 5,
      unit: "piece",
      is_available: true,
      category_id: "",
    },
  });

  // --- Handlers ---

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      toast.error("You can only upload up to 5 images.");
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values) => {
    console.log("Form Values:", values);
    setIsSubmitting(true);
    try {
      // 1. Create Product Text Data
      const result = await createProduct(shopId, values);

      if (result) {
        toast.success("Product created successfully!");

        // 2. Upload Images
        // Handle result structure (Object vs Boolean)
        const newProductId = result._id || result.product_id || (typeof result === 'object' ? result._id : null);

        if (imageFiles.length > 0 && newProductId) {
          const formData = new FormData();
          imageFiles.forEach((file) => formData.append("images", file));
          await uploadProductImages(shopId, newProductId, formData);
          toast.success("Images uploaded successfully");
        }
        toast.success("Product created successfully");
        router.push(`/shop/products`);
      } else {
        toast.error("Failed to create product");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl dark:text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5 dark:text-slate-200" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-slate-100">Add New Product</h1>
          <p className="text-muted-foreground dark:text-slate-400">Fill in the details to create a new product listing.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Product Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Sony Wireless Headphones"
                            {...field}
                            className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                          />
                        </FormControl>
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
                          <FormLabel className="dark:text-slate-300">Brand</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Sony"
                              {...field}
                              className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* --- FIXED SECTION --- */}
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-slate-300">Category</FormLabel>
                          <FormControl>
                            <SelectCategory
                              value={field.value}
                              onCateSelect={(id) => {
                                field.onChange(id);
                              }}
                              isInvalid={!!form.formState.errors.category_id}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* --------------------- */}

                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed product description..."
                            className="resize-none min-h-[120px] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Media Card */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {imagePreviews.map((src, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border dark:border-slate-700">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {imagePreviews.length < 5 && (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors dark:border-slate-600 dark:hover:border-blue-400 dark:bg-slate-900">
                        <Upload className="h-8 w-8 text-gray-400 mb-2 dark:text-slate-500" />
                        <span className="text-xs text-gray-500 dark:text-slate-400">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-slate-500">Upload up to 5 images.</p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">

              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Base Price (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discounted_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Discounted Price (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-slate-300">Stock</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-slate-300">Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                              <SelectItem value="piece">Piece</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="gram">Gram</SelectItem>
                              <SelectItem value="liter">Liter</SelectItem>
                              <SelectItem value="set">Set</SelectItem>
                              <SelectItem value="pair">Pair</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="min_stock_alert"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Low Stock Alert</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 dark:border-slate-700">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="dark:text-slate-300">Available for Sale</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-[150px]">
              {(isSubmitting || isLoading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Product
                </>
              )}
            </Button>
          </div>
          
        </form>
      </Form>
    </div>
  );
};

export default AddProductPage;