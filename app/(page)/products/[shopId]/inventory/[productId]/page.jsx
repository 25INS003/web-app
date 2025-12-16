"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/productStore";
import { useInventoryStore } from "@/store/inventoryStore";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  PackageX,
  Loader2
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for merging classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function UpdateStockPage() {
  const router = useRouter();
  const { shopId, productId } = useParams();

  // Store hooks
  const { updateStock, isLoading: isUpdating } = useInventoryStore();
  const { getProductDetails, currentProduct, isLoading: isLoadingProduct } = useProductStore();

  // Local state
  const [quantityInput, setQuantityInput] = useState("");
  const [changeType, setChangeType] = useState("increment");
  const [reason, setReason] = useState("");
  const [previewStock, setPreviewStock] = useState(0);

  // Initial Fetch
  useEffect(() => {
    if (productId) {
      getProductDetails(shopId, productId);
    }
  }, [productId, getProductDetails]);

  // Update preview whenever input changes
  useEffect(() => {
    if (!currentProduct) return;

    const current = currentProduct.stock_quantity || 0;
    const inputVal = parseInt(quantityInput) || 0;

    let calculated = current;

    switch (changeType) {
      case "set":
        calculated = inputVal;
        break;
      case "increment":
      case "returned":
        calculated = current + inputVal;
        break;
      case "decrement":
      case "sold":
      case "damaged":
        calculated = current - inputVal;
        break;
      default:
        calculated = current;
    }

    setPreviewStock(calculated < 0 ? 0 : calculated);
  }, [quantityInput, changeType, currentProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    try {
      await updateStock(shopId, productId, {
        new_stock: previewStock,
        change_type: changeType,
        reason: reason,
      });

      await getProductDetails(shopId, productId);
      setQuantityInput("");
      setReason("");
      router.push(`/products/${shopId}/view/${productId}`);
      toast.success("Stock updated successfully!");
    } catch (error) {
      toast.error("Failed to update stock: " + error.message);
    }
  };

  if (isLoadingProduct || !currentProduct) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <span className="text-sm font-medium">Loading inventory data...</span>
      </div>
    );
  }

  return (
    <div className="text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">

        {/* Header Navigation */}
        <button
          onClick={() => router.back()}
          className="group flex items-center text-slate-400 hover:text-slate-100 mb-8 transition-colors duration-200"
        >
          <div className="mr-2 rounded-full p-1 group-hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Inventory</span>
        </button>

        {/* Main Card */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl shadow-black/40 overflow-hidden">

          {/* Product Info Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900 flex gap-5 items-center relative">
            {/* Subtle highlight at top */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>

            {currentProduct.images?.[0]?.url ? (
              <img
                src={currentProduct.images[0].url}
                alt={currentProduct.name}
                className="w-16 h-16 rounded-lg object-cover border border-slate-700 bg-slate-800 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                <PackageX className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-slate-100 truncate">
                {currentProduct.name}
              </h1>
              <p className="text-sm text-slate-400 font-mono mt-1">
                SKU: {currentProduct.sku}
              </p>
            </div>

            <div className="text-right pl-4 border-l border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Current Stock
              </span>
              <span className="text-3xl font-mono font-bold text-slate-100 tracking-tighter">
                {currentProduct.stock_quantity}
              </span>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

            {/* 1. Operation Type Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">
                Select Operation
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <TypeButton
                  active={changeType === "increment"}
                  onClick={() => setChangeType("increment")}
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Restock"
                  // Emerald Glow
                  activeClass="bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]"
                />
                <TypeButton
                  active={changeType === "sold"}
                  onClick={() => setChangeType("sold")}
                  icon={<TrendingDown className="w-4 h-4" />}
                  label="Sale"
                  // Blue Glow
                  activeClass="bg-blue-950/40 border-blue-500/50 text-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]"
                />
                <TypeButton
                  active={changeType === "returned"}
                  onClick={() => setChangeType("returned")}
                  icon={<RefreshCcw className="w-4 h-4" />}
                  label="Return"
                  // Indigo Glow
                  activeClass="bg-indigo-950/40 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]"
                />
                <TypeButton
                  active={changeType === "damaged"}
                  onClick={() => setChangeType("damaged")}
                  icon={<PackageX className="w-4 h-4" />}
                  label="Damaged"
                  // Red Glow
                  activeClass="bg-red-950/40 border-red-500/50 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]"
                />
                <TypeButton
                  active={changeType === "set"}
                  onClick={() => setChangeType("set")}
                  icon={<Save className="w-4 h-4" />}
                  label="Set Exact"
                  // Slate/White Glow
                  activeClass="bg-slate-800 border-slate-500 text-slate-200"
                />
              </div>
            </div>

            {/* 2. Calculation Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {changeType === 'set' ? "New Total Count" : "Quantity"}
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    placeholder="0"
                    className="flex h-12 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xl font-mono text-slate-100 placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="h-12 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between px-4 relative overflow-hidden">
                <div className="flex flex-col justify-center z-10">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Resulting Stock
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 line-through text-sm font-mono opacity-60">
                      {currentProduct.stock_quantity}
                    </span>
                    <span className="text-slate-600 text-xs">→</span>
                    <span className={cn(
                      "text-xl font-bold font-mono transition-colors duration-300",
                      previewStock < (currentProduct.min_stock_alert || 5)
                        ? "text-red-400"
                        : "text-emerald-400"
                    )}>
                      {previewStock}
                    </span>
                  </div>
                </div>

                {previewStock < 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium z-10">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Negative
                  </div>
                )}

                {/* Background Pattern for Preview Area */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]"></div>
              </div>
            </div>

            {/* 3. Notes Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Reason / Notes <span className="text-slate-500 font-normal text-xs ml-1">(Optional)</span>
              </label>
              <textarea
                rows="2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., Batch #452 arrived..."
                className="flex min-h-[80px] w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-slate-700 focus:ring-2 focus:ring-slate-800 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isUpdating || !quantityInput}
              className={cn(
                "w-full h-12 inline-flex items-center justify-center rounded-lg text-sm font-semibold tracking-wide transition-all duration-200",
                isUpdating || !quantityInput
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                  : "bg-blue-600 text-white hover:bg-blue-500 border border-blue-500 shadow-[0_0_20px_-5px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_-5px_rgba(37,99,235,0.5)] active:scale-[0.99]"
              )}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Confirm Update
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Styled Selection Button
function TypeButton({ active, onClick, icon, label, activeClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 text-sm font-medium group relative overflow-hidden",
        active
          ? cn(activeClass)
          : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700"
      )}
    >
      <div className={cn("mb-2 transition-transform duration-200 group-hover:scale-110", active ? "opacity-100" : "opacity-70")}>
        {icon}
      </div>
      <span className="z-10 relative">{label}</span>

      {/* Hover Light Effect */}
      {!active && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}