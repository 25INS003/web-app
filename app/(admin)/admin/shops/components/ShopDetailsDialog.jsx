import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Store, 
    MapPin, 
    Phone, 
    Mail, 
    Clock, 
    Calendar,
    CreditCard,
    X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function ShopDetailsDialog({ open, onOpenChange, shop }) {
    if (!shop) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl">
                
                {/* Header Section with Gradient */}
                <div className="relative p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                    <button 
                        onClick={() => onOpenChange(false)}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-300 hover:text-white" />
                    </button>

                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-xl">
                            {shop.logo_url ? (
                                <img src={shop.logo_url} alt={shop.name} className="h-full w-full object-cover" />
                            ) : (
                                <Store className="h-10 w-10 text-white/50" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {shop.name || shop.shop_name}
                                </h2>
                                <Badge className={`
                                    border-0 shadow-lg capitalize
                                    ${shop.shop_status === 'active' ? 'bg-emerald-500 text-white' : ''}
                                    ${shop.shop_status === 'pending' ? 'bg-amber-500 text-white' : ''}
                                    ${(shop.shop_status === 'inactive' || shop.shop_status === 'suspended') ? 'bg-red-500 text-white' : ''}
                                `}>
                                    {shop.shop_status === 'active' ? 'Approved' : shop.shop_status}
                                </Badge>
                            </div>
                            <p className="mt-1 text-slate-300 flex items-center gap-2 text-sm font-medium">
                                <span>{shop.owner_id?.user_id?.first_name} {shop.owner_id?.user_id?.last_name}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-500" />
                                <span className="font-mono opacity-75">{shop.owner_id?.user_id?.email}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50 dark:bg-slate-950/50">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Information</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-blue-500/50 transition-colors shadow-sm">
                                        <Phone className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{shop.phone}</p>
                                        <p className="text-xs text-slate-500">Phone Number</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-blue-500/50 transition-colors shadow-sm">
                                        <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{shop.email}</p>
                                        <p className="text-xs text-slate-500">Email Address</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:border-blue-500/50 transition-colors shadow-sm mt-1">
                                        <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug">{shop.address_line}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{shop.city}, {shop.state} - {shop.pincode}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operational Details */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operational Details</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-purple-500/50 transition-colors shadow-sm">
                                        <Clock className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{shop.opening_time} - {shop.closing_time}</p>
                                        <p className="text-xs text-slate-500">Operating Hours</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-purple-500/50 transition-colors shadow-sm">
                                        <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(shop.registered_at || shop.createdAt)}</p>
                                        <p className="text-xs text-slate-500">Registration Date</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:border-purple-500/50 transition-colors shadow-sm">
                                        <CreditCard className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{shop.payment_methods?.join(", ") || "Cash on Delivery"}</p>
                                        <p className="text-xs text-slate-500">Payment Methods</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About Shop */}
                    {shop.description && (
                        <div>
                            <Separator className="mb-6 bg-slate-200 dark:bg-slate-800" />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About Shop</h4>
                            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-sm">
                                {shop.description}
                            </div>
                        </div>
                    )}

                    {/* COD Settings - Only if available */}
                    {shop.cod_settings && (
                        <div>
                            <Separator className="mb-6 bg-slate-200 dark:bg-slate-800" />
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">COD Settings</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-900 text-white flex justify-between items-center shadow-lg">
                                    <span className="text-sm text-slate-400 font-medium">Status</span>
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${shop.cod_settings.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                        {shop.cod_settings.enabled ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
                                    <span className="text-sm text-slate-500 font-medium">Max Limit</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">₹{shop.cod_settings.max_amount}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                    <Button onClick={() => onOpenChange(false)} className="rounded-xl px-6">
                        Close Details
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
