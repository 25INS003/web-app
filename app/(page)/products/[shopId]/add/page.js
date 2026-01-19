"use client";

import React, { useState } from "react";
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import { useVariantStore } from "@/store/productVariantStore";
import CascadingCategorySelect from "@/components/Dropdowns/CascadingCategorySelect";

// --- Icons ---
import {
  ArrowLeft,
  X,
  Loader2,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  Copy
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// --- Validation Schemas ---

// Verify a single variant
const variantSchema = z.object({
  name: z.string().optional(), // Can be auto-generated if empty
  price: z.coerce.number().min(0, "Price cannot be negative"),
  compare_at_price: z.coerce.number().min(0).optional(),
  cost_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative"),
  sku: z.string().optional(),
  
  // Unit Info (Moved from Product level)
  unit: z.enum(["piece", "kg", "gram", "liter", "pair", "set", "loaf", "dozen", "meter", "yard", "bottle", "pack"]).default("piece"),
  per_unit_qty: z.coerce.number().min(0.1, "Qty must be at least 0.1").default(1),

  attributes: z.array(z.object({
    name: z.string().min(1, "Attribute name is required"),
    value: z.string().min(1, "Attribute value is required")
  })).optional(),
  // Object format: { "IGST": 20, "CGST": 10 }
  tax: z.record(z.string(), z.coerce.number().min(0)).optional()
});

const productSchema = z.object({
  // Global Product Details
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  // unit: Moved to Variant
  // cost_against: Moved to Variant
  is_active: z.boolean().default(true),

  // Variants Array
  variants: z.array(variantSchema).min(1, "At least one variant is required")
});

// --- Sub-Components (Moved Outside) ---

  // Helper to manage Variant Attributes
  const VariantAttributesNew = ({ variantIndex }) => {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
      control,
      name: `variants.${variantIndex}.attributes`
    });
    
    const addAttr = () => append({ name: "", value: "" });
    const removeAttr = (index) => remove(index);

    return (
      <div className="space-y-2">
         <div className="flex items-center justify-between">
           <FormLabel className="text-xs text-slate-500">Attributes</FormLabel>
           <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={addAttr}>
             <Plus className="w-3 h-3 mr-1" /> Add
           </Button>
         </div>
         {fields.length === 0 && (
            <div className="text-xs text-slate-400 italic">No attributes defined</div>
         )}
         {fields.map((field, idx) => (
          <div key={field.id} className="flex gap-2 mb-2 items-start">
              <FormField
                control={control}
                name={`variants.${variantIndex}.attributes.${idx}.name`}
                render={({ field }) => (
                  <Input {...field} placeholder="Name (e.g. Color)" className="h-7 text-xs w-1/3" />
                )}
              />
               <FormField
                control={control}
                name={`variants.${variantIndex}.attributes.${idx}.value`}
                render={({ field }) => (
                  <Input {...field} placeholder="Value (e.g. Red)" className="h-7 text-xs flex-1" />
                )}
              />
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => removeAttr(idx)}>
                <Trash2 className="w-3 h-3" />
              </Button>
          </div>
        ))}
      </div>
    );
  };

  // Helper component to manage TAX entries within a specific variant (Object format)
  const VariantTaxNew = ({ variantIndex }) => {
    const { watch, setValue } = useFormContext();
    const taxObj = watch(`variants.${variantIndex}.tax`) || {};
    const taxEntries = Object.entries(taxObj);

    const addTax = () => {
      const newTax = { ...taxObj, "": 0 }; 
      setValue(`variants.${variantIndex}.tax`, newTax, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    };

    const updateTaxName = (oldName, newName, rate) => {
      if (oldName === newName) return;
      const newTax = { ...taxObj };
      delete newTax[oldName];
      newTax[newName.toUpperCase()] = rate;
      setValue(`variants.${variantIndex}.tax`, newTax);
    };

    const updateTaxRate = (name, rate) => {
      const newTax = { ...taxObj };
      newTax[name] = parseFloat(rate) || 0;
      setValue(`variants.${variantIndex}.tax`, newTax);
    };

    const removeTax = (name) => {
      const newTax = { ...taxObj };
      delete newTax[name];
      setValue(`variants.${variantIndex}.tax`, newTax);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-xs text-slate-500">GST / Tax</FormLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={addTax}
          >
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        
        {taxEntries.length === 0 && (
          <div className="text-xs text-slate-400 italic">No tax defined</div>
        )}

        {taxEntries.map(([name, rate], idx) => (
          <div key={idx} className="flex gap-2 mb-2 items-center">
             <Input 
               value={name} 
               placeholder="e.g. GST" 
               className="h-7 text-xs" 
               onChange={e => updateTaxName(name, e.target.value, rate)} 
             />
             <div className="relative flex items-center">
               <Input 
                 type="number" 
                 value={rate} 
                 placeholder="%" 
                 className="h-7 text-xs w-20 pr-5" 
                 onChange={e => updateTaxRate(name, e.target.value)}
               />
               <span className="absolute right-2 text-xs text-slate-400">%</span>
             </div>
             <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => removeTax(name)}>
               <X className="w-3 h-3" />
             </Button>
          </div>
        ))}
      </div>
    );
  };

const AddProductPage = () => {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId;

  const { createProduct, uploadProductImages, isLoading } = useProductStore();
  const { uploadVariantImages } = useVariantStore();

  const [mainImageFile, setMainImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [variantImages, setVariantImages] = useState({}); // { [index]: File[] }
  const [variantPreviews, setVariantPreviews] = useState({}); // { [index]: string[] }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Form
  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      brand: "",
      category_id: "",
      // unit: "piece", // REMOVED
      // cost_against: 1, // REMOVED
      is_active: true,
      variants: [
        {
          price: 0,
          compare_at_price: 0,
          cost_price: 0,
          stock_quantity: 0,
          sku: "",
          unit: "piece", // ADDED
          per_unit_qty: 1, // ADDED
          attributes: [],
          tax: {} // Object format: { "IGST": 20, "CGST": 10 }
        }
      ]
    },
  });

  // Dynamic Variants Field Array
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
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

  // --- Variant Image Handlers ---
  const handleVariantImageChange = (index, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setVariantImages(prev => ({
        ...prev,
        [index]: [...(prev[index] || []), ...files]
      }));

      // Previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setVariantPreviews(prev => ({
        ...prev,
        [index]: [...(prev[index] || []), ...newPreviews]
      }));
    }
  };

  const removeVariantImage = (variantIndex, imgIndex) => {
     setVariantImages(prev => {
        const newImgs = [...(prev[variantIndex] || [])];
        newImgs.splice(imgIndex, 1);
        return { ...prev, [variantIndex]: newImgs };
     });
     setVariantPreviews(prev => {
        const newPrevs = [...(prev[variantIndex] || [])];
        URL.revokeObjectURL(newPrevs[imgIndex]); // Cleanup
        newPrevs.splice(imgIndex, 1);
        return { ...prev, [variantIndex]: newPrevs };
     });
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Calculate min/max price for parent metadata if needed (backend handles denormalization mostly)
      const prices = values.variants.map(v => v.price);
      const minPrice = Math.min(...prices);

      // Construct Payload - unit and cost_against are now at variant level
      const productPayload = {
        shop_id: shopId,
        name: values.name,
        description: values.description,
        brand: values.brand,
        category_id: values.category_id,
        is_active: values.is_active,
        
        // Pass the first variant's price as the "main" price for simplicity in list views initially
        price: minPrice, 
        
        // The array of variants for the backend to process
        variants: values.variants
      };

      const response = await createProduct(shopId, productPayload);
      
      // Store returns { product: {...} } where product has _id and variants
      const createdProduct = response?.product;
      
      console.log("Create product response:", response);
      console.log("Created product:", createdProduct);

      if (!createdProduct || !createdProduct._id) {
        toast.error("Product created but ID missing. Check console.");
        return;
      }

      const productId = createdProduct._id;

      if (mainImageFile) {
        const formData = new FormData();
        formData.append("file", mainImageFile);
        await uploadProductImages(shopId, productId, formData);
      }

      // 2. Upload Variant Images
      if (createdProduct.variants && Object.keys(variantImages).length > 0) {
           const uploadPromises = Object.entries(variantImages).map(async ([vIndex, files]) => {
               const variantId = createdProduct.variants[vIndex]?._id;
               if (variantId && files && files.length > 0) {
                    await uploadVariantImages(variantId, files);
               }
           });
           await Promise.all(uploadPromises);
      }

      toast.success("Product created successfully!");
      router.push(`/products`);

    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-6xl dark:text-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5 dark:text-slate-200" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-slate-100">Add New Product</h1>
          <p className="text-muted-foreground dark:text-slate-400">Create a product and its initial variants.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* --- SECTION 1: GLOBAL PRODUCT DETAILS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                  <CardDescription>These details apply to all variants.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Cotton T-Shirt" {...field} className="dark:bg-slate-900" />
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
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Nike" {...field} className="dark:bg-slate-900" />
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
                          <FormLabel>Category *</FormLabel>
                          <FormControl>
                            <CascadingCategorySelect
                              value={field.value}
                              onCategorySelect={(id) => field.onChange(id)}
                              isInvalid={!!form.formState.errors.category_id}
                              placeholder="Select Category..."
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Product features and details..."
                            className="resize-none min-h-[100px] dark:bg-slate-900"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

               {/* Main Image Upload */}
               <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Main Product Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center w-full">
                    {imagePreview ? (
                      <div className="relative w-full max-w-sm aspect-square rounded-lg overflow-hidden border dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                        <img src={imagePreview} alt="Main Preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-600/90 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-300 dark:border-slate-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Click to upload</span>
                          </p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Global Settings */}
            <div className="space-y-6">
               <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm dark:border-slate-700">
                          <div className="space-y-0.5">
                            <FormLabel>Active Status</FormLabel>
                          </div>
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  
                  {/* Unit Fields Moved to Variant Level */}
                </CardContent>
               </Card>
            </div>
          </div>

          <Separator />

          {/* --- SECTION 2: VARIANTS --- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold dark:text-slate-100">Product Variants</h3>
                <p className="text-sm text-slate-500">Manage different versions (e.g. sizes, colors) of this product.</p>
              </div>
              <Button type="button" onClick={() => appendVariant({ price: 0, stock_quantity: 0, unit: "piece", per_unit_qty: 1, attributes: [], tax: {} })} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Add Variant
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {variantFields.map((field, index) => (
                <Card key={field.id} className="relative dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
                  {/* Remove Button */}
                  {variantFields.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 hover:bg-red-50 z-10"
                      onClick={() => removeVariant(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="flex flex-col md:flex-row border-l-4 border-blue-500">
                    {/* Index Indicator */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 min-w-[120px] flex flex-col justify-center items-center border-r dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {index === 0 ? "Default" : `Variant #${index + 1}`}
                        </span>
                        {index === 0 && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                    </div>

                    <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* Name/Attributes */}
                      <div className="md:col-span-4 space-y-3">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Variant Name (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Red / XL" {...field} className="dark:bg-slate-900 h-9" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <VariantAttributesNew variantIndex={index} />
                          <VariantTaxNew variantIndex={index} />
                      </div>

                      {/* Pricing */}
                      <div className="md:col-span-3 space-y-3">
                         <FormField
                            control={form.control}
                            name={`variants.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Selling Price *</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} className="dark:bg-slate-900 h-9" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.compare_at_price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">MRP (Compare At)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} className="dark:bg-slate-900 h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                      </div>

                      {/* Stock & SKU */}
                      <div className="md:col-span-3 space-y-3">
                           <FormField
                            control={form.control}
                            name={`variants.${index}.stock_quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Stock Qty *</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} className="dark:bg-slate-900 h-9" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name={`variants.${index}.sku`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">SKU</FormLabel>
                                <FormControl>
                                  <Input placeholder="Automatic if empty" {...field} className="dark:bg-slate-900 h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                      </div>
                      
                      {/* Unit & Cost */}
                      <div className="md:col-span-2 space-y-3">
                        <FormField
                            control={form.control}
                            name={`variants.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="dark:bg-slate-900 h-9 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {["piece", "kg", "gram", "liter", "pair", "set", "loaf", "dozen", "meter", "yard", "bottle", "pack"].map((u) => (
                                      <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.per_unit_qty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Per Unit</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} className="dark:bg-slate-900 h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                             control={form.control}
                             name={`variants.${index}.cost_price`}
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel className="text-xs">Cost Price</FormLabel>
                                 <FormControl>
                                   <Input type="number" {...field} className="dark:bg-slate-900 h-9" />
                                 </FormControl>
                               </FormItem>
                             )}
                           />
                      </div>

                      {/* Variant Images */}
                      <div className="md:col-span-12 border-t pt-4 mt-2 dark:border-slate-800">
                         <div className="flex items-center gap-4 mb-3">
                             <div className="flex-1">
                                <FormLabel className="text-xs font-semibold">Variant Images (Optional)</FormLabel>
                                <p className="text-[10px] text-slate-500">Add visuals specific to this variant.</p>
                             </div>
                             <div className="relative">
                                  <input 
                                     type="file" 
                                     multiple 
                                     accept="image/*"
                                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                     onChange={(e) => handleVariantImageChange(index, e)}
                                     disabled={isSubmitting}
                                  />
                                   <Button type="button" variant="outline" size="sm" className="h-8 text-xs relative">
                                     <ImageIcon className="w-3 h-3 mr-2" /> Select Images
                                   </Button>
                             </div>
                         </div>
                         
                         {/* Previews */}
                         {variantPreviews[index]?.length > 0 && (
                             <div className="flex flex-wrap gap-2">
                                 {variantPreviews[index].map((src, imgIdx) => (
                                     <div key={imgIdx} className="relative w-16 h-16 border rounded overflow-hidden group bg-slate-100 dark:bg-slate-900">
                                         <img src={src} className="w-full h-full object-cover" />
                                          <button
                                             type="button"
                                             onClick={() => removeVariantImage(index, imgIdx)}
                                             className="absolute top-0 right-0 bg-red-500/80 hover:bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
                </Card>
              ))}
            </div>
          </div>


          <Separator className="dark:bg-slate-700" />

          {/* Actions */}
          <div className="sticky bottom-4 z-20 flex justify-end gap-4 bg-white/80 dark:bg-slate-950/80 p-4 rounded-lg backdrop-blur border border-slate-200 dark:border-slate-800 shadow-lg">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
              className="dark:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading} className="w-[200px] bg-indigo-600 hover:bg-indigo-500">
              {(isSubmitting || isLoading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
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