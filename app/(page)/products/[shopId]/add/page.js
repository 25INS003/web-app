"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form"; // 1. Added useFieldArray
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
  Image as ImageIcon,
  Plus,    // Added
  Trash2   // Added
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

  // Pricing
  price: z.coerce.number().min(0, "Price cannot be negative"),
  compare_at_price: z.coerce.number().min(0).optional(),
  cost_price: z.coerce.number().min(0).optional(),
  cost_against: z.number().min(0).optional(),

  // Inventory
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.enum(["piece", "kg", "gram", "liter", "pair", "set", "loaf", "dozen", "meter", "yard", "bottle", "pack"]),

  // Status
  is_active: z.boolean().default(true),

  // Meta - UPDATED VALIDATION
  attributes: z.array(z.object({
    name: z.string().min(1, "Attribute name is required"), // Key (e.g., Color)
    value: z.string().min(1, "Attribute value is required") // Value (e.g., Red)
  })).optional(),
});

const AddProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId;

  const { createProduct, uploadProductImages, isLoading } = useProductStore();

  const [mainImageFile, setMainImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      category_id: "",
      price: 0,
      compare_at_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      costPrice: 1,
      sku: "",
      barcode: "",
      unit: "piece",
      is_active: true,
      attributes: [], // Default empty array
    },
  });

  // 2. Setup useFieldArray for dynamic attributes
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "attributes",
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setMainImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const formattedCostString = `${values.costPrice} ${values.unit}`;
      const productData = {
        ...values,
        cost_against: formattedCostString,
        shop_id: shopId,
      };

      const response = await createProduct(shopId, productData);

      const createdProduct = response?.data?.product || response?.product || response?.data;

      if (!createdProduct || (!createdProduct._id && !createdProduct.product_id)) {
        toast.error("Product created but ID missing. Check console.");
        return;
      }

      const productId = createdProduct.product_id || createdProduct._id;

      if (mainImageFile) {
        const formData = new FormData();
        formData.append("file", mainImageFile);
        await uploadProductImages(shopId, productId, formData);
      }

      toast.success("Product created successfully!");
      router.push(`/products`);

    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("An unexpected error occurred.");
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
          <p className="text-muted-foreground dark:text-slate-400">Create a new item in your inventory.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">

              {/* Basic Details */}
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
                        <FormLabel className="dark:text-slate-300">Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Wireless Mouse" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
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
                            <Input placeholder="e.g. Logitech" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-slate-300">Category *</FormLabel>
                          <FormControl>
                            <SelectCategory
                              value={field.value}
                              onCateSelect={(id) => field.onChange(id)}
                              isInvalid={!!form.formState.errors.category_id}
                            />
                          </FormControl>
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
                        <FormLabel className="dark:text-slate-300">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Product features and details..."
                            className="resize-none min-h-[120px] dark:bg-slate-900 dark:border-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* NEW SECTION: Attributes */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="dark:text-slate-100">Product Attributes</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", value: "" })}
                    className="dark:bg-slate-900 dark:border-slate-600"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Attribute
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {fields.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg dark:border-slate-700">
                      No attributes added yet. Add details like Color, Size, or Material.
                    </div>
                  )}

                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                      <FormField
                        control={form.control}
                        name={`attributes.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Name (e.g. Color)" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`attributes.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Value (e.g. Red)" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-0.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Main Image Upload */}
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="dark:text-slate-100">Main Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center w-full">
                    {imagePreview ? (
                      <div className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden border dark:border-slate-700">
                        <img src={imagePreview} alt="Main Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-600/90 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-300 dark:border-slate-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Click to upload</span> main image
                          </p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Pricing & Inventory */}
            <div className="space-y-6">

              {/* Pricing */}
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
                        <FormLabel className="dark:text-slate-300">Selling Price (₹) *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="compare_at_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-slate-300 text-xs">Compare At (MRP)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-slate-300 text-xs">Cost Price</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="costPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Against *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 150"
                              {...field}
                              className="dark:bg-slate-900"
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
                          <FormLabel>Unit *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="dark:bg-slate-900">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["piece", "kg", "gram", "liter", "pair", "set", "loaf", "dozen", "meter", "yard", "bottle", "pack"].map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Inventory */}
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
                          <FormLabel className="dark:text-slate-300">Stock Quantity *</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Stock Keeping Unit" {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="dark:text-slate-300">Barcode / EAN</FormLabel>
                        <FormControl>
                          <Input placeholder="Scan barcode..." {...field} className="dark:bg-slate-900 dark:border-slate-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-2 dark:bg-slate-700" />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 dark:border-slate-700">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="dark:text-slate-300">Active Product</FormLabel>
                          <FormDescription className="text-xs">
                            Product will be visible in shop.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>
          </div>

          <Separator className="dark:bg-slate-700" />

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-[180px] bg-indigo-600 hover:bg-indigo-500">
              {(isSubmitting || isLoading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Create Product
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