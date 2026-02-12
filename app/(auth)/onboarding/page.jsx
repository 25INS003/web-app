"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import Cookies from "js-cookie";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Loader2, Store, MapPin, CreditCard, CheckCircle2, Building2, UploadCloud, ChevronDown } from "lucide-react";

// Schema Validation
const onboardingSchema = z.object({
  business_name: z.string().min(3, "Business name is required"),
  gst_number: z.string().min(1, "GST Number is required").regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST Number"),
  business_address_line1: z.string().min(5, "Address Line 1 is required"),
  business_address_line2: z.string().min(3, "Address Line 2 is required"),
  business_address_state: z.string().min(2, "State is required"),
  business_address_district: z.string().min(2, "District is required"),
  business_address_pincode: z.string().length(6, "Pincode must be 6 digits"),
  bank_account_number: z.string().min(9, "Invalid Account Number"),
  ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC Code"),
  // File validation is basic here, refined in render or separate check if needed
  business_logo: z.any().optional(), 
  documents: z.any().refine((files) => files?.length > 0, "At least one document is required"),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
  });

  const watchedLogo = watch("business_logo");
  const watchedDocs = watch("documents");

  // ... inside OnboardingPage component
  useEffect(() => {
    const checkExistingStatus = async () => {
        try {
            const { data } = await apiClient.get("/shop-owners/status");
            const { is_approved, verification_status } = data.data;

            if (is_approved) {
                Cookies.set("approvalStatus", "approved", { expires: 7 });
                toast.success("You are already approved!");
                router.replace("/dashboard");
            } else if (verification_status === "pending") { 
                // Only redirect if explicitly pending verification
                Cookies.set("approvalStatus", "pending", { expires: 7 });
                router.replace("/status");
            }
            // If verification_status is "draft" or "rejected", stay on onboarding
        } catch (error) {
            // 404 means no profile, so stay here.
            console.log("No existing profile, stay on onboarding.");
        }
    };
    checkExistingStatus();
  }, [router]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append text fields
      Object.keys(data).forEach(key => {
        if (key !== "business_logo" && key !== "documents" && data[key]) {
             formData.append(key, data[key]);
        }
      });

      // Append files
      // Append files
      if (data.business_logo?.[0]) {
        formData.append("business_logo", data.business_logo[0]);
      }

      if (data.documents && data.documents.length > 0) {
          for (let i = 0; i < data.documents.length; i++) {
              formData.append("documents", data.documents[i]);
          }
      }


      await apiClient.post("/shop-owners/onboarding", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Cookies.set("approvalStatus", "pending", { expires: 7 }); 
      toast.success("Details submitted successfully!");
      router.push("/status");
    } catch (error) {
      console.error("Onboarding Error:", error);
      toast.error(error.response?.data?.message || "Failed to submit details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-3xl"
      >
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden rounded-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          <CardHeader className="text-center pt-10 pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
               <Store size={32} />
            </div>
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-base text-slate-500 dark:text-slate-400 mt-2">
              Tell us about your business to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 md:p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Section: Business Details */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      <Building2 size={18} className="text-blue-500" />
                      <span>Business Information</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <FloatingLabelInput 
                          label="Business Name" 
                          {...register("business_name")}
                          className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700" 
                      />
                      {errors.business_name && <p className="text-red-500 text-xs pl-1">{errors.business_name.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <FloatingLabelInput 
                          label="GST Number" 
                          {...register("gst_number")}
                          className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      />
                      {errors.gst_number && <p className="text-red-500 text-xs pl-1">{errors.gst_number.message}</p>}
                    </div>
                  </div>
              </div>

              {/* Section: Uploads */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      <UploadCloud size={18} className="text-purple-500" />
                      <span>Documents & Branding</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div className="space-y-3 group">
                        <label className={`block w-full cursor-pointer relative overflow-hidden rounded-2xl border-2 border-dashed transition-all p-4 text-center ${
                             watchedLogo?.[0] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/30'
                        }`}>
                            <input type="file" accept="image/*" className="hidden" {...register("business_logo")} />
                            <div className="flex flex-col items-center gap-2">
                                {watchedLogo?.[0] ? (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden mt-2">
                                         {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={URL.createObjectURL(watchedLogo[0])} 
                                            alt="Logo Preview" 
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Change Logo</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm text-slate-500 group-hover:text-blue-500 transition-colors">
                                            <Store size={20} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Upload Logo</span>
                                    </>
                                )}
                            </div>
                        </label>
                        {watchedLogo?.[0] && (
                            <p className="text-center text-xs text-blue-500 font-medium truncate px-2">
                                {watchedLogo[0].name}
                            </p>
                        )}
                     </div>

                     <div className="space-y-3 group">
                        <label className={`block w-full cursor-pointer relative overflow-hidden rounded-2xl border-2 border-dashed transition-all p-4 text-center ${
                             watchedDocs?.length > 0 ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-slate-50 dark:bg-slate-800/30'
                        }`}>
                            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" {...register("documents")} />
                            <div className="flex flex-col items-center gap-2">
                                <div className={`p-2 rounded-full shadow-sm transition-colors ${
                                    watchedDocs?.length > 0 ? 'bg-purple-100 text-purple-600' : 'bg-white dark:bg-slate-800 text-slate-500 group-hover:text-purple-500'
                                }`}>
                                    <UploadCloud size={20} />
                                </div>
                                <span className={`text-sm font-medium transition-colors ${
                                    watchedDocs?.length > 0 ? 'text-purple-600' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-500'
                                }`}>
                                    {watchedDocs?.length > 0 ? 'Add More / Change' : 'Upload Documents'}
                                </span>
                            </div>
                        </label>
                        
                        {/* Documents Preview List */}
                        {watchedDocs?.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {Array.from(watchedDocs).map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {errors.documents && <p className="text-red-500 text-xs pl-1">{errors.documents.message}</p>}
                     </div>
                  </div>
               </div>

              {/* Section: Location */}
              <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      <MapPin size={18} className="text-green-500" />
                      <span>Business Location</span>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1">
                        <FloatingLabelInput 
                            label="Address Line 1" 
                            {...register("business_address_line1")}
                            className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        />
                         {errors.business_address_line1 && <p className="text-red-500 text-xs pl-1">{errors.business_address_line1.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <FloatingLabelInput 
                                label="Address Line 2" 
                                {...register("business_address_line2")}
                                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <FloatingLabelInput 
                                label="Pincode" 
                                {...register("business_address_pincode")}
                                maxLength={6}
                                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                            />
                             {errors.business_address_pincode && <p className="text-red-500 text-xs pl-1">{errors.business_address_pincode.message}</p>}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1 relative">
                            {/* Native Select or Custom - keeping native for simplicity but styled */}
                            <Label className="text-xs font-semibold text-slate-500 ml-1 mb-1 block">State</Label>
                            
                            {/* Combobox Implementation */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full h-14 justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 font-normal hover:bg-slate-100 dark:hover:bg-slate-800",
                                    !watch("business_address_state") && "text-muted-foreground"
                                  )}
                                >
                                  {watch("business_address_state")
                                    ? watch("business_address_state")
                                    : "Select State"}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search state..." />
                                  <CommandList>
                                      <CommandEmpty>No state found.</CommandEmpty>
                                      <CommandGroup>
                                        {[
                                          "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", 
                                          "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", 
                                          "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", 
                                          "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
                                          "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", 
                                          "Ladakh", "Puducherry", "Chandigarh", "Andaman and Nicobar Islands", 
                                          "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
                                        ].map((state) => (
                                          <CommandItem
                                            key={state}
                                            value={state}
                                            onSelect={(currentValue) => {
                                              setValue("business_address_state", currentValue === watch("business_address_state") ? "" : currentValue, { shouldValidate: true });
                                            }}
                                          >
                                            <CheckCircle2
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                watch("business_address_state") === state ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            {state}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            {errors.business_address_state && <p className="text-red-500 text-xs pl-1">{errors.business_address_state.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <FloatingLabelInput 
                                label="District" 
                                {...register("business_address_district")}
                                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                            />
                             {errors.business_address_district && <p className="text-red-500 text-xs pl-1">{errors.business_address_district.message}</p>}
                        </div>
                    </div>
                  </div>
              </div>

              {/* Section: Banking */}
              <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      <CreditCard size={18} className="text-orange-500" />
                      <span>Banking Details</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1">
                            <FloatingLabelInput 
                                label="Account Number" 
                                type="password"
                                {...register("bank_account_number")}
                                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                            />
                            {errors.bank_account_number && <p className="text-red-500 text-xs pl-1">{errors.bank_account_number.message}</p>}
                       </div>
                       <div className="space-y-1">
                            <FloatingLabelInput 
                                label="IFSC Code" 
                                {...register("ifsc_code")}
                                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                            />
                            {errors.ifsc_code && <p className="text-red-500 text-xs pl-1">{errors.ifsc_code.message}</p>}
                       </div>
                  </div>
              </div>

              <div className="pt-6">
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                  Submit Application
                </Button>
                <p className="text-center text-xs text-slate-400 mt-4">
                    By submitting, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
