"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShopOwnerStore } from "@/store/adminShopownerStore";
import {
    ArrowLeft, Building2, MapPin, Landmark,
    Receipt, Calendar, Check, X, hash
} from "lucide-react";

export default function ShopOwnerDetailPage() {
    const { ownerId } = useParams();
    const router = useRouter();
    const { selectedOwner, fetchOwnerById, updateStatus, isLoading, error } = useShopOwnerStore();

    useEffect(() => {
        if (ownerId) fetchOwnerById(ownerId);
    }, [ownerId, fetchOwnerById]);

    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-500">Loading business credentials...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-medium">{error}</div>;
    if (!selectedOwner) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto mb-10">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-all group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Management List
            </button>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {/* --- Hero Header --- */}
                <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-blue-400" size={28} />
                            <h2 className="text-3xl font-bold tracking-tight">{selectedOwner.business_name}</h2>
                        </div>
                        <p className="text-slate-400 font-mono text-sm tracking-wider">
                            REG_ID: {selectedOwner.owner_id}
                        </p>
                    </div>
                    <div className={`px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest border-2 ${selectedOwner.is_approved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                        {selectedOwner.is_approved ? "● Fully Approved" : "○ Verification Pending"}
                    </div>
                </div>

                {/* --- Dashboard Content --- */}
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Column 1: Business & Tax */}
                        <div className="space-y-8">
                            <SectionTitle title="Business Identity" />
                            <InfoTile
                                icon={<Receipt className="text-blue-600" />}
                                label="GST Number"
                                value={selectedOwner.gst_number || "Not Registered"}
                                color="bg-blue-50"
                            />
                            <InfoTile
                                icon={<Calendar className="text-purple-600" />}
                                label="In Business Since"
                                value={new Date(selectedOwner.business_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                color="bg-purple-50"
                            />
                            <InfoTile
                                icon={<Calendar className="text-slate-600" />}
                                label="Application Date"
                                value={new Date(selectedOwner.createdAt).toLocaleDateString()}
                                color="bg-slate-50"
                            />
                        </div>

                        {/* Column 2: Address & Location */}
                        <div className="space-y-8">
                            <SectionTitle title="Operating Address" />
                            <div className="flex gap-4">
                                <div className="p-3 h-fit bg-red-50 text-red-600 rounded-2xl"><MapPin size={24} /></div>
                                <div>
                                    <p className="font-semibold text-gray-800 leading-tight">
                                        {selectedOwner.business_address_line1}
                                        {selectedOwner.business_address_line2 && <span className="block text-gray-600 font-normal">{selectedOwner.business_address_line2}</span>}
                                    </p>
                                    <p className="text-gray-500 mt-2 text-sm uppercase tracking-wide">
                                        {selectedOwner.business_address_district}, {selectedOwner.business_address_state}
                                    </p>
                                    <p className="text-gray-500 font-mono text-xs mt-1">
                                        PIN: {selectedOwner.business_address_pincode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Financials & Actions */}
                        <div className="space-y-8">
                            <SectionTitle title="Banking & Settlement" />
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <Landmark className="text-emerald-600" size={20} />
                                    <span className="text-sm font-bold text-gray-700 uppercase">Bank Account</span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Account Number</p>
                                        <p className="font-mono text-gray-800 break-all">{selectedOwner.bank_account_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">IFSC Code</p>
                                        <p className="font-mono text-gray-800">{selectedOwner.ifsc_code}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Actions */}
                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-tighter">Decision Panel</h4>
                                <button
                                    onClick={() => updateStatus(ownerId, !selectedOwner.is_approved)}
                                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${selectedOwner.is_approved
                                            ? "bg-white border-2 border-red-100 text-red-600 hover:bg-red-50"
                                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200"
                                        }`}
                                >
                                    {selectedOwner.is_approved ? <X size={20} /> : <Check size={20} />}
                                    {selectedOwner.is_approved ? "Revoke Approval" : "Approve Business"}
                                </button>
                                <p className="text-[10px] text-center text-gray-400 mt-4 italic">
                                    Action will be logged and owner will be notified.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components for Cleanliness ---

function SectionTitle({ title }) {
    return <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{title}</h3>;
}

function InfoTile({ icon, label, value, color }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`p-3 ${color} rounded-2xl`}>{icon}</div>
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                <p className="font-bold text-gray-800 leading-tight">{value}</p>
            </div>
        </div>
    );
}