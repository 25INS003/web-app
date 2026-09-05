"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useProductStore } from "@/store/productStore";
import { useVariantStore } from "@/store/productVariantStore";
import CascadingCategorySelect from "@/components/Dropdowns/CascadingCategorySelect";
import { asNumber, fromNumericInput } from "@/lib/forms/number";

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
  MapPin,
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

/** The variant payload, with every numeric field a real number. */
/**
 * The variant payload, with every numeric field present turned into a number.
 *
 * Presence-aware on purpose. Coercing unconditionally would turn a field the
 * caller deliberately left out into `asNumber(undefined)` — zero — so a save
 * of just the price would post a stock of 0 alongside it. Absent has to stay
 * absent, because that is what tells the API to leave the column alone.
 */
const NUMERIC_VARIANT_FIELDS = {
  price: 0,
  stock_quantity: 0,
  cost_price: 0,
  per_unit_qty: 1,
};

// Not in the table above, because it has no sensible zero. An empty MRP means
// "no reference price"; coercing it to 0 claims the item used to be free, and
// the storefront renders that as a struck-through nothing beside the price.
const compareAtOrOmit = (raw) =>
  raw === "" || raw === null || raw === undefined ? undefined : asNumber(raw, 0);

const variantPayload = (data) => {
  const out = { ...data };
  for (const [field, fallback] of Object.entries(NUMERIC_VARIANT_FIELDS)) {
    if (field in out) out[field] = asNumber(out[field], fallback);
  }
  // Handled apart from the table: a blank MRP is dropped from the payload
  // entirely, so the API leaves the column alone rather than writing a 0.
  if ("compare_at_price" in out) {
    const compare = compareAtOrOmit(out.compare_at_price);
    if (compare === undefined) delete out.compare_at_price;
    else out.compare_at_price = compare;
  }
  return out;
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

  // The row's editable copy of the variant.
  const fromVariant = (v) => ({
    name: v.name || "",
    price: v.price || 0,
    stock_quantity: v.stock_quantity || 0,
    sku: v.sku || "",
    // `?? ""` so a variant nobody has located loads as a blank box rather than
    // the string "null", and so clearing it stays distinguishable from leaving
    // it — the API reads "" as "clear this".
    warehouse_location: v.warehouse_location ?? "",
    cost_price: v.cost_price || 0,
    // `?? ""`, not `|| 0`: a variant with no reference price has null here,
    // and `|| 0` turned that into a real 0 on load — so opening a product and
    // saving it invented an MRP of zero. Blank round-trips as absent.
    compare_at_price: v.compare_at_price ?? "",
    unit: v.unit || "piece",
    per_unit_qty: v.per_unit_qty || 1,
    tax: normalizeTax(v.tax),
    attributes: v.attributes || []
  });

  const [data, setData] = useState(() => fromVariant(variant));

  // Re-read the variant whenever the server's copy moves.
  //
  // `useState` runs its initialiser once, so this held a snapshot taken when
  // the page first loaded and nothing ever refreshed it. Combined with a save
  // that posts every field, that made editing one field rewrite the others
  // from stale values — sell three units, change the price, and the save put
  // the pre-sale stock back. After the first save the row still held the old
  // snapshot, so saving twice re-sent it.
  //
  // Keyed on `updated_at`: a row the user is typing in has not moved on the
  // server, so their edits are never yanked out from under them — only a row
  // that actually changed is re-read.
  const serverVersion = variant.updated_at;
  useEffect(() => {
    // Seeding local form state from the server's copy, which is what the whole
    // comment above is about — the rule wants derived-during-render or a
    // remount key, and either would undo the stale-snapshot fix described
    // there. Pre-existing: this file sat in the eslint-exempt legacy tree
    // until it moved here to be shared with the admin route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(fromVariant(variant));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.id, serverVersion]);

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

    // Only the fields this row actually changed.
    //
    // Posting the whole variant meant every save asserted a value for stock,
    // price and the rest — so editing one field silently rewrote the others
    // from whatever the form was holding. The API leaves absent fields alone,
    // so sending only what moved makes a save say what it means.
    const current = fromVariant(variant);
    const changed = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) =>
          JSON.stringify(value) !== JSON.stringify(current[key])
      )
    );

    if (Object.keys(changed).length === 0 && pendingFiles.length === 0) {
      toast.info("Nothing to save");
      setIsSaving(false);
      return;
    }

    const updateSuccess = await updateVariant(variant.id, variantPayload(changed));
    let uploadSuccess = true;
    if (pendingFiles.length > 0) {
      const res = await uploadVariantImages(variant.id, pendingFiles);
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
      toast.error(
        `${useVariantStore.getState().error} The other details were saved.`,
        { duration: 8000 }
      );
      onRefresh();
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this variant?")) return;
    const success = await deleteVariant(variant.id);
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
    const success = await deleteVariantImage(variant.id, index);
    if (success) {
      toast.success("Image removed");
      onRefresh();
    }
  };

  return (
    <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
            {variant.images && variant.images.length > 0 && variant.images[0]?.url && variant.images[0].url.trim() !== '' ? (
              <ProgressiveImage src={variant.images[0].url} className="h-full w-full object-cover" alt="variant" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{variant.name || "Unnamed Variant"}</h4>
            <div className="text-xs text-muted-foreground flex gap-2 items-center mt-0.5">
              <span className="font-medium text-primary">{formatPrice(variant.price)}</span>
              <span>•</span>
              <span>Stock: {variant.stock_quantity}</span>
              <span>•</span>
              <span className="font-mono text-muted-foreground">SKU: {variant.sku}</span>
              {variant.warehouse_location && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <MapPin className="h-3 w-3 shrink-0 text-primary" />
                    {variant.warehouse_location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="rounded-xl">
          {isOpen ? "Close" : "Edit"}
        </Button>
      </div>

      {isOpen && (
        <div className="p-5 pt-0 space-y-5 border-t border-border bg-muted/50">
          <div className="grid grid-cols-1 gap-4 mt-5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Variant Name</label>
              <Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} className="h-10 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Selling Price *</label>
              <Input type="number" value={data.price} onChange={e => setData({ ...data, price: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Stock Qty *</label>
              <Input type="number" value={data.stock_quantity} onChange={e => setData({ ...data, stock_quantity: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cost Price</label>
              <Input type="number" value={data.cost_price} onChange={e => setData({ ...data, cost_price: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">MRP (Compare At)</label>
              <Input type="number" value={data.compare_at_price} onChange={e => setData({ ...data, compare_at_price: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">SKU</label>
              <Input value={data.sku} onChange={e => setData({ ...data, sku: e.target.value })} className="h-10 rounded-xl" />
            </div>
          </div>

          {/* Where this variant's stock sits. Empty the box to say the location
              is no longer known — the API stores that as cleared rather than
              keeping a stale aisle number that sends a picker to the wrong
              shelf. */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Warehouse Location</label>
            <Input placeholder="e.g. Aisle 3, Rack B" value={data.warehouse_location} onChange={e => setData({ ...data, warehouse_location: e.target.value })} className="h-10 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Unit</label>
              <Select value={data.unit} onValueChange={(val) => setData({ ...data, unit: val })}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
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
              <label className="text-xs font-medium text-muted-foreground">Per Unit Qty</label>
              <Input type="number" value={data.per_unit_qty} onChange={e => setData({ ...data, per_unit_qty: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
            </div>
          </div>

          {/* Tax Section */}
          <div className="space-y-3 border-t pt-4 border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Tax / GST</label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] rounded-lg hover:bg-warning/10 hover:text-warning"
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
                    className="h-9 text-xs rounded-xl"
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
                      className="h-9 text-xs rounded-xl pr-6"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-muted-foreground">%</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive/80 rounded-xl"
                    onClick={() => setData({ ...data, tax: (data.tax || []).filter((_, i) => i !== idx) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(data.tax || []).length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">No taxes applied.</p>
              )}
            </div>
          </div>

          {/* Attributes Manager */}
          <div className="space-y-3 border-t pt-4 border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Attributes (Color, Size, etc.)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] rounded-lg hover:bg-primary/10 hover:text-primary"
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
                    className="h-9 text-xs flex-1 rounded-xl"
                  />
                  <Input
                    placeholder="Value (e.g. Red)"
                    value={attr.value}
                    onChange={(e) => {
                      const newAttrs = [...data.attributes];
                      newAttrs[idx] = { ...newAttrs[idx], value: e.target.value };
                      setData({ ...data, attributes: newAttrs });
                    }}
                    className="h-9 text-xs flex-1 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive/80 rounded-xl"
                    onClick={() => setData({ ...data, attributes: data.attributes.filter((_, i) => i !== idx) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(data.attributes || []).length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">No attributes defined.</p>
              )}
            </div>
          </div>

          {/* Image Manager */}
          <div className="space-y-3 border-t pt-4 border-border">
            <label className="text-xs font-medium text-muted-foreground block">Variant Images</label>
            <div className="flex flex-wrap gap-2">
              {variant.images?.filter(img => img?.url && img.url.trim() !== '').map((img, idx) => (
                <div key={`existing-${idx}`} className="relative h-16 w-16 rounded-xl border-2 border-border overflow-hidden group shadow-sm">
                  <ProgressiveImage src={img.url} className="h-full w-full object-cover" alt={`variant-${idx}`} />
                  <div className="absolute top-0 right-0 bg-primary text-[8px] text-primary-foreground px-1.5 py-0.5 rounded-bl-lg font-medium">Saved</div>
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
                <div key={`pending-${idx}`} className="relative h-16 w-16 rounded-xl border-2 border-success overflow-hidden group shadow-sm">
                  <img src={url} className="h-full w-full object-cover opacity-80" />
                  <div className="absolute top-0 right-0 bg-success text-[8px] text-success-foreground px-1.5 py-0.5 rounded-bl-lg font-medium">New</div>
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
                <label className="h-16 w-16 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted border-border transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-1">Add</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            {pendingFiles.length > 0 && (
              <p className="text-[10px] text-success mt-1">* {pendingFiles.length} new image(s) selected. Click Save Changes to upload.</p>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 rounded-xl">
              <Trash2 className="h-3 w-3 mr-2" /> Delete Variant
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-primary hover:bg-primary/90 h-9 rounded-xl shadow-lg shadow-primary/25">
              {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />} Save Changes
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};


// --- Add Variant Form Component ---
const AddVariantForm = ({ productId, onRefresh, existingVariantCount = 0 }) => {
  const { addVariant, uploadVariantImages, isLoading } = useVariantStore();
  const [isOpen, setIsOpen] = useState(false);

  // `attributes` belongs here as much as price does.
  //
  // A product may hold exactly one variant with no attributes — the database
  // enforces it on (product_id, combination_signature). This form had no way
  // to set any, so every variant it created was the attribute-less one, and
  // the second attempt could only ever fail. There was no combination of
  // inputs on this screen that produced a working second variant.
  const EMPTY_VARIANT = {
    name: "",
    price: 0,
    stock_quantity: 0,
    sku: "",
    warehouse_location: "",
    cost_price: 0,
    compare_at_price: "",
    attributes: []
  };

  const [newData, setNewData] = useState(EMPTY_VARIANT);

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
    // A half-typed row ("Size" with no value) is not an attribute yet, and
    // sending it would make the signature disagree with what is on screen.
    const attributes = (newData.attributes || []).filter(
      (a) => a.name?.trim() && a.value?.trim()
    );

    // Said here rather than left to the constraint: the rule is about this
    // product's other variants, which the server can only answer with a 400
    // after the round trip.
    if (attributes.length === 0 && existingVariantCount > 0) {
      toast.error(
        "Add at least one attribute (e.g. Size / M). This product already has a variant with none."
      );
      return;
    }

    const newVariant = await addVariant(
      productId,
      variantPayload({ ...newData, attributes })
    );
    if (newVariant) {
      // Same as above: false, not a throw, so the answer has to be read.
      const imageOk = imageFile
        ? Boolean(await uploadVariantImages(newVariant.id, [imageFile]))
        : true;
      if (imageOk) {
        toast.success("New variant added!");
      } else {
        toast.error(
          `${useVariantStore.getState().error} The variant itself was added.`,
          { duration: 8000 }
        );
      }
      setNewData(EMPTY_VARIANT);
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
    <Card className="border-dashed border-2 rounded-2xl border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/15">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          Add New Variant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input placeholder="e.g. Blue" value={newData.name} onChange={e => setNewData({ ...newData, name: e.target.value })} className="h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Selling Price *</label>
            <Input type="number" value={newData.price} onChange={e => setNewData({ ...newData, price: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Stock Qty *</label>
            <Input type="number" value={newData.stock_quantity} onChange={e => setNewData({ ...newData, stock_quantity: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Cost Price</label>
            <Input type="number" value={newData.cost_price} onChange={e => setNewData({ ...newData, cost_price: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">MRP (Compare At)</label>
            <Input type="number" value={newData.compare_at_price} onChange={e => setNewData({ ...newData, compare_at_price: fromNumericInput(e.target.value) })} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">SKU</label>
            <Input placeholder="Optional" value={newData.sku} onChange={e => setNewData({ ...newData, sku: e.target.value })} className="h-10 rounded-xl" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Warehouse Location</label>
          <Input placeholder="e.g. Aisle 3, Rack B" value={newData.warehouse_location} onChange={e => setNewData({ ...newData, warehouse_location: e.target.value })} className="h-10 rounded-xl" />
        </div>

        {/* Attributes — what actually distinguishes this variant from the
            others. A product may hold only one variant with none, so from the
            second onwards these are required, not decorative. */}
        <div className="space-y-3 border-t pt-4 border-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Attributes (Color, Size, etc.)
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] rounded-lg hover:bg-primary/10 hover:text-primary"
              onClick={() => setNewData({ ...newData, attributes: [...(newData.attributes || []), { name: "", value: "" }] })}
            >
              + Add Attribute
            </Button>
          </div>
          <div className="space-y-2">
            {(newData.attributes || []).map((attr, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  placeholder="Name (e.g. Color)"
                  value={attr.name}
                  onChange={(e) => {
                    const newAttrs = [...newData.attributes];
                    newAttrs[idx] = { ...newAttrs[idx], name: e.target.value };
                    setNewData({ ...newData, attributes: newAttrs });
                  }}
                  className="h-9 text-xs flex-1 rounded-xl"
                />
                <Input
                  placeholder="Value (e.g. Red)"
                  value={attr.value}
                  onChange={(e) => {
                    const newAttrs = [...newData.attributes];
                    newAttrs[idx] = { ...newAttrs[idx], value: e.target.value };
                    setNewData({ ...newData, attributes: newAttrs });
                  }}
                  className="h-9 text-xs flex-1 rounded-xl"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive/80 rounded-xl"
                  onClick={() => setNewData({ ...newData, attributes: newData.attributes.filter((_, i) => i !== idx) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(newData.attributes || []).length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">
                No attributes yet — add one (e.g. Size / M) so this variant is
                distinguishable from the others.
              </p>
            )}
          </div>
        </div>

        {/* Image Upload for New Variant */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Variant Image (Optional)</label>
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <div className="relative h-16 w-16 rounded-xl border-2 border-border overflow-hidden group">
                <img src={previewUrl} className="h-full w-full object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="h-16 w-16 flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted border-border transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-[9px] text-muted-foreground mt-1">Select</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </label>
            )}
            {previewUrl && <span className="text-xs text-success">Image selected</span>}
          </div>
        </div>

      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="rounded-xl">Cancel</Button>
        <Button onClick={handleAdd} disabled={isLoading} size="sm" className="bg-primary hover:bg-primary/90 rounded-xl">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create Variant"}
        </Button>
      </CardFooter>
    </Card>
  );
};


/**
 * Editing a product, for whoever is allowed to.
 *
 * Lifted out of the shop-owner route so the admin reviewing a submission can
 * correct it before approving. The API has always permitted that — the update
 * route guards on ["admin", "shop_owner"] and validateResourceOwnership lets an
 * admin past the shop check — but the only edit screen sat behind
 * requireApprovedShopOwner, which redirects an admin away.
 *
 * Reads its ids from `useParams` rather than props, and both routes name their
 * segments [shopId] and [productId], so the same component serves both without
 * either caller threading anything through. Navigation is `back()` and
 * `refresh()` only, so it returns wherever it was opened from — the owner's
 * catalogue, or the admin's review queue.
 */
export const EditProductForm = () => {
  const params = useParams();
  const router = useRouter();
  const { shopId, productId } = params;

  const {
    currentProduct,
    currentVariants,
    getProductDetails,
    updateProduct,
    uploadProductImages,
    deleteProductMainImage,
    isLoading: storeLoading
  } = useProductStore();

  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [existingImage, setExistingImage] = useState(null);
  const [removingImage, setRemovingImage] = useState(false);
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
        ? currentProduct.category_id?.id
        : currentProduct.category_id;

      form.reset({
        name: currentProduct.name || "",
        description: currentProduct.description || "",
        brand: currentProduct.brand || "",
        is_available: currentProduct.is_available,
        category_id: catId || "",
      });

      if (currentProduct.main_image && currentProduct.main_image_url) {
        // Same pre-existing pattern as the variant row above: hydrating local
        // state from fetched data. `existingImage` is not purely derived — the
        // upload and delete handlers write it too — so it cannot simply be
        // computed during render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setExistingImage(currentProduct.main_image_url);
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

  /**
   * Remove the main image.
   *
   * Two different things wear the same button. Dropping a picture that has not
   * been uploaded yet is local — nothing has been sent, so nothing has to be
   * unsent. Removing one that is SAVED has to reach the server, and this used
   * to only clear the three pieces of local state: the image disappeared from
   * the page, came back on the next load, and the owner had no way to tell the
   * difference until they reloaded.
   */
  const handleRemoveImage = async () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setNewImageFile(null);
    setPreviewUrl(null);

    // Nothing saved behind it — the pending file is simply dropped.
    if (!existingImage) return;

    setRemovingImage(true);
    const removed = await deleteProductMainImage(shopId, productId);
    setRemovingImage(false);

    if (!removed) {
      // Left on screen deliberately. Clearing it would show the owner an image
      // that is gone while the server still has it.
      toast.error(useProductStore.getState().error);
      return;
    }
    setExistingImage(null);
    toast.success("Main image removed");
  };

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = { ...values };
      const success = await updateProduct(shopId, productId, payload);

      if (success) {
        // The upload action reports failure by returning false rather than
        // throwing, so the result has to be read. Ignoring it reported a
        // successful update for a picture that never attached.
        let imageOk = true;
        if (newImageFile) {
          const formData = new FormData();
          formData.append("file", newImageFile);
          imageOk = Boolean(
            await uploadProductImages(shopId, productId, formData)
          );
        }
        if (imageOk) {
          toast.success("Product updated successfully");
        } else {
          toast.error(
            `${useProductStore.getState().error} The other details were saved.`,
            { duration: 8000 }
          );
        }
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
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Edit3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Product</h1>
            <p className="text-sm text-muted-foreground">Manage details, main image, and variants.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: Product Info */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">

          {/* General Info Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/15">
                      <Tag className="h-5 w-5 text-primary" />
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
                        <FormControl><Input {...field} className="rounded-xl h-11" /></FormControl>
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
                          <FormControl><Input {...field} className="rounded-xl h-10" /></FormControl>
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
                          <Textarea {...field} className="min-h-[120px] rounded-xl" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 border rounded-xl p-4 border-border bg-muted/50">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-success" />
                        </FormControl>
                        <div>
                          <FormLabel className="font-medium">Visible to Customers</FormLabel>
                          <p className="text-xs text-muted-foreground">Product will appear in your store</p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting || storeLoading} className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
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
              <div className="p-2 rounded-xl bg-primary/15">
                <Boxes className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Product Variants</h2>
            </div>

            <div className="space-y-4">
              {currentVariants?.map((variant) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  shopId={shopId}
                  onRefresh={refreshData}
                />
              ))}
            </div>

            <div className="mt-6">
              <AddVariantForm
                productId={productId}
                onRefresh={refreshData}
                existingVariantCount={currentVariants?.length ?? 0}
              />
            </div>
          </div>

        </motion.div>

        {/* RIGHT COLUMN: Main Image */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="rounded-2xl border-border shadow-sm bg-card overflow-hidden sticky top-6">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/15">
                  <ImagePlus className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Main Product Image</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {activeImage ? (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-border bg-muted group">
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
                        disabled={removingImage}
                        onClick={handleRemoveImage}
                        aria-label="Remove the main image"
                        className="rounded-xl"
                      >
                        {removingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
                      {previewUrl ? "New Upload" : "Saved"}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 rounded-xl bg-muted mb-3">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Click to upload</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
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
