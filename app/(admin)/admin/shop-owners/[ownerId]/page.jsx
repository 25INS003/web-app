"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShopOwnerStore } from "@/store/adminShopownerStore";
import { toast } from "sonner";
import {
    ArrowLeft, Building2, MapPin, Landmark,
    Receipt, Calendar, Check, X, FileText, Download
} from "lucide-react";

export default function ShopOwnerDetailPage() {
    const { ownerId } = useParams();
    const router = useRouter();
    const { selectedOwner, fetchOwnerById, approveOwner, rejectOwner, revokeOwner, isLoading, error } = useShopOwnerStore();

    useEffect(() => {
        if (ownerId) fetchOwnerById(ownerId);
    }, [ownerId, fetchOwnerById]);

    const handleApprove = async () => {
        const result = await approveOwner(ownerId);
        if (result.success) {
            toast.success("Shop Owner Approved Successfully");
        }
    };

    const handleReject = async () => {
        const result = await rejectOwner(ownerId);
        if (result.success) {
            toast.success("Application Rejected");
        }
    };

    const handleRevoke = async () => {
        const result = await revokeOwner(ownerId);
        if (result.success) {
            toast.success("Application Revoked");
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-500">Loading business credentials...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-medium">{error}</div>;
    if (!selectedOwner) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto mb-10">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-all group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Management List
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-800 overflow-hidden">
                {/* --- Hero Header --- */}
                <div className="bg-slate-900 dark:bg-slate-950 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-blue-400" size={28} />
                            <h2 className="text-3xl font-bold tracking-tight">{selectedOwner.business_name}</h2>
                        </div>
                        <p className="text-slate-400 font-mono text-sm tracking-wider">
                            REG_ID: {selectedOwner.owner_id}
                        </p>
                    </div>
                    <div className={`px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest border-2 ${
                            selectedOwner.verification_status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            selectedOwner.verification_status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                        {selectedOwner.verification_status === "approved" ? "● Fully Approved" : 
                         selectedOwner.verification_status === "rejected" ? "⊗ Application Rejected" : 
                         "○ Verification Pending"}
                    </div>
                </div>

                {/* --- Dashboard Content --- */}
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Column 1: Business & Tax */}
                        <div className="space-y-8">
                            <SectionTitle title="Business Identity" />
                            
                            {/* Logo Preview */}
                            {selectedOwner.business_logo && (
                                <div className="mb-6">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Shop Logo</p>
                                    <div className="relative h-32 w-32 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                         {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={selectedOwner.business_logo} 
                                            alt="Shop Logo" 
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            <InfoTile
                                icon={<Receipt className="text-blue-600" />}
                                label="GST Number"
                                value={selectedOwner.gst_number || "Not Registered"}
                                color="bg-blue-50 dark:bg-blue-500/10"
                            />
                             
                            {/* Uploaded Documents */}
                            <div className="space-y-4 pt-2">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">Documents</p>
                                {selectedOwner.documents && selectedOwner.documents.length > 0 ? (
                                    selectedOwner.documents.map((doc, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                     <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={doc.name}>{doc.name}</p>
                                                     <span className="text-[10px] text-gray-400 uppercase">{doc.mime_type?.split('/')[1] || 'FILE'}</span>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Download/View"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
                                )}
                            </div>

                            <InfoTile
                                icon={<Calendar className="text-purple-600" />}
                                label="In Business Since"
                                value={new Date(selectedOwner.business_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                color="bg-purple-50 dark:bg-purple-500/10"
                            />
                            <InfoTile
                                icon={<Calendar className="text-slate-600 dark:text-slate-400" />}
                                label="Application Date"
                                value={new Date(selectedOwner.createdAt).toLocaleDateString()}
                                color="bg-slate-50 dark:bg-slate-800"
                            />
                        </div>

                        {/* Column 2: Address & Location */}
                        <div className="space-y-8">
                            <SectionTitle title="Operating Address" />
                            <div className="flex gap-4">
                                <div className="p-3 h-fit bg-red-50 dark:bg-red-500/10 text-red-600 rounded-2xl"><MapPin size={24} /></div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white leading-tight">
                                        {selectedOwner.business_address_line1}
                                        {selectedOwner.business_address_line2 && <span className="block text-gray-600 dark:text-slate-400 font-normal">{selectedOwner.business_address_line2}</span>}
                                    </p>
                                    <p className="text-gray-500 dark:text-slate-500 mt-2 text-sm uppercase tracking-wide">
                                        {selectedOwner.business_address_district}, {selectedOwner.business_address_state}
                                    </p>
                                    <p className="text-gray-500 dark:text-slate-500 font-mono text-xs mt-1">
                                        PIN: {selectedOwner.business_address_pincode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Financials & Actions */}
                        <div className="space-y-8">
                            <SectionTitle title="Banking & Settlement" />
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <Landmark className="text-emerald-600" size={20} />
                                    <span className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase">Bank Account</span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Account Number</p>
                                        <p className="font-mono text-gray-800 dark:text-white break-all">{selectedOwner.bank_account_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">IFSC Code</p>
                                        <p className="font-mono text-gray-800 dark:text-white">{selectedOwner.ifsc_code}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Actions */}
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-tighter">Decision Panel</h4>
                                <div className="flex flex-col gap-3">
                                    {/* Approved State: Show Revoke */}
                                    {selectedOwner.verification_status === "approved" && (
                                        <button
                                            onClick={handleRevoke}
                                            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border-2 border-amber-100 dark:border-amber-900/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                                        >
                                            <X size={20} /> Revoke Approval
                                        </button>
                                    )}

                                    {/* Pending or Revoked State: Show Approve & Reject */}
                                    {(selectedOwner.verification_status === "pending" || selectedOwner.verification_status === "revoked" || selectedOwner.verification_status === "draft") && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleReject}
                                                className="flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20"
                                            >
                                                <X size={20} /> Reject
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                className="flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none"
                                            >
                                                <Check size={20} /> Approve
                                            </button>
                                        </div>
                                    )}

                                    {/* Rejected State: Show Approve (Reconsider) */}
                                    {selectedOwner.verification_status === "rejected" && (
                                        <button
                                            onClick={handleApprove}
                                            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-200 dark:shadow-none"
                                        >
                                            <Check size={20} /> Reconsided & Approve
                                        </button>
                                    )}
                                </div>
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

// --- Helper Components ---

function SectionTitle({ title }) {
    return <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{title}</h3>;
}

function InfoTile({ icon, label, value, color }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`p-3 ${color} rounded-2xl`}>{icon}</div>
            <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                <p className="font-bold text-gray-800 dark:text-white leading-tight">{value}</p>
            </div>
        </div>
    );
}
