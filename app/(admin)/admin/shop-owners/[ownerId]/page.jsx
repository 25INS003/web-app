"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useShopOwnerStore } from "@/store/adminShopownerStore";
import { toast } from "sonner";
import {
    ArrowLeft, Building2, MapPin, Landmark,
    Receipt, Calendar, Check, X, FileText, Download
} from "lucide-react";

// `createdAt` is a Mongo-era name. The column is `created_at`, so this read
// was `undefined`, and `new Date(undefined)` is an Invalid Date that
// `toLocaleDateString()` prints verbatim — the same silent field drift that
// `_id`/`id` and `order_id`/`order_number` caused elsewhere.
//
// Both dates are also genuinely absent for most owners — `business_since` is
// null on every seeded row — so a missing value has to read as missing rather
// than as a broken clock.
const formatDate = (value, options) => {
    if (!value) return "Not provided";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? "Not provided"
        : d.toLocaleDateString("en-IN", options);
};

const formatMonthYear = (value) =>
    formatDate(value, { month: "long", year: "numeric" });

const formatDay = (value) =>
    formatDate(value, { day: "numeric", month: "short", year: "numeric" });

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

    if (isLoading) return <div className="p-10 text-center animate-pulse text-muted-foreground">Loading business credentials...</div>;
    if (error) return <div className="p-10 text-center text-destructive font-medium">{error}</div>;
    if (!selectedOwner) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto mb-10">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-white mb-6 transition-all group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Management List
            </button>

            <div className="bg-card rounded-3xl shadow-xl shadow-sm dark:shadow-none border border-border overflow-hidden">
                {/* --- Hero Header --- */}
                <div className="bg-popover p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-primary" size={28} />
                            <h2 className="text-3xl font-bold tracking-tight">{selectedOwner.business_name}</h2>
                        </div>
                        <p className="text-muted-foreground font-mono text-sm tracking-wider">
                            REG_ID: {selectedOwner.owner_id}
                        </p>
                    </div>
                    <div className={`px-5 py-2 rounded-full font-bold text-sm uppercase tracking-widest border-2 ${
                            selectedOwner.verification_status === "approved" ? "bg-success/10 text-success border-success/20" :
                            selectedOwner.verification_status === "rejected" ? " text-destructive border-destructive/30/20" :
                            "bg-warning/10 text-warning-foreground border-warning/20"
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
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Shop Logo</p>
                                    <div className="relative h-32 w-32 rounded-2xl overflow-hidden border dark:border-border">
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
                                icon={<Receipt className="text-primary" />}
                                label="GST Number"
                                value={selectedOwner.gst_number || "Not Registered"}
                                color="bg-primary/10"
                            />
                             
                            {/* Uploaded Documents */}
                            <div className="space-y-4 pt-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Documents</p>
                                {selectedOwner.documents && selectedOwner.documents.length > 0 ? (
                                    selectedOwner.documents.map((doc, idx) => (
                                        <div key={idx} className="p-3 bg-muted rounded-xl border border-border dark:border-border flex items-center justify-between group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-primary/20 dark:bg-primary/20 text-primary rounded-lg shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                     <p className="text-xs font-semibold text-muted-foreground truncate" title={doc.name}>{doc.name}</p>
                                                     <span className="text-[10px] text-muted-foreground uppercase">{doc.mime_type?.split('/')[1] || 'FILE'}</span>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                                title="Download/View"
                                            >
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                                )}
                            </div>

                            <InfoTile
                                icon={<Calendar className="text-primary" />}
                                label="In Business Since"
                                value={formatMonthYear(selectedOwner.business_since)}
                                color="bg-primary/10"
                            />
                            <InfoTile
                                icon={<Calendar className="text-muted-foreground" />}
                                label="Application Date"
                                value={formatDay(selectedOwner.created_at)}
                                color="bg-muted"
                            />
                        </div>

                        {/* Column 2: Address & Location */}
                        <div className="space-y-8">
                            <SectionTitle title="Operating Address" />
                            <div className="flex gap-4">
                                <div className="p-3 h-fit bg-destructive/10 text-destructive rounded-2xl"><MapPin size={24} /></div>
                                <div>
                                    <p className="font-semibold text-foreground dark:text-white leading-tight">
                                        {selectedOwner.business_address_line1}
                                        {selectedOwner.business_address_line2 && <span className="block text-muted-foreground dark:text-muted-foreground font-normal">{selectedOwner.business_address_line2}</span>}
                                    </p>
                                    <p className="text-muted-foreground dark:text-muted-foreground mt-2 text-sm uppercase tracking-wide">
                                        {selectedOwner.business_address_district}, {selectedOwner.business_address_state}
                                    </p>
                                    <p className="text-muted-foreground dark:text-muted-foreground font-mono text-xs mt-1">
                                        PIN: {selectedOwner.business_address_pincode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Financials & Actions */}
                        <div className="space-y-8">
                            <SectionTitle title="Banking & Settlement" />
                            <div className="bg-muted dark:bg-popover/50 p-5 rounded-2xl border border-border">
                                <div className="flex items-center gap-3 mb-4">
                                    <Landmark className="text-success" size={20} />
                                    <span className="text-sm font-bold text-muted-foreground dark:text-muted-foreground uppercase">Bank Account</span>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Account Number</p>
                                        <p className="font-mono text-foreground dark:text-white break-all">{selectedOwner.bank_account_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">IFSC Code</p>
                                        <p className="font-mono text-foreground dark:text-white">{selectedOwner.ifsc_code}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Actions */}
                            <div className="pt-4 border-t border-border">
                                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-tighter">Decision Panel</h4>
                                <div className="flex flex-col gap-3">
                                    {/* Approved State: Show Revoke */}
                                    {selectedOwner.verification_status === "approved" && (
                                        <button
                                            onClick={handleRevoke}
                                            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-card border-2 text-warning-foreground"
                                        >
                                            <X size={20} /> Revoke Approval
                                        </button>
                                    )}

                                    {/* Pending or Revoked State: Show Approve & Reject */}
                                    {(selectedOwner.verification_status === "pending" || selectedOwner.verification_status === "revoked" || selectedOwner.verification_status === "draft") && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleReject}
                                                className="flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-destructive/10 dark:bg-destructive/20 text-destructive border border-destructive/20 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                                            >
                                                <X size={20} /> Reject
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                className="flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-success text-white hover:bg-success/90 shadow-xl shadow-success/20 dark:shadow-none"
                                            >
                                                <Check size={20} /> Approve
                                            </button>
                                        </div>
                                    )}

                                    {/* Rejected State: Show Approve (Reconsider) */}
                                    {selectedOwner.verification_status === "rejected" && (
                                        <button
                                            onClick={handleApprove}
                                            className="w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-success text-white hover:bg-success/90 shadow-xl shadow-success/20 dark:shadow-none"
                                        >
                                            <Check size={20} /> Reconsided & Approve
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
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
    return <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">{title}</h3>;
}

function InfoTile({ icon, label, value, color }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`p-3 ${color} rounded-2xl`}>{icon}</div>
            <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{label}</p>
                <p className="font-bold text-foreground dark:text-white leading-tight">{value}</p>
            </div>
        </div>
    );
}
