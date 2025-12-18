"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useShopOwnerStore } from "@/store/adminShopownerStore";
import { Eye, CheckCircle, ShieldCheck, RefreshCcw, MapPin, Building2 } from "lucide-react";

export default function ShopOwnerListPage() {
    const { shopOwners, isLoading, fetchAllOwners, updateStatus, verifyOwner } = useShopOwnerStore();

    useEffect(() => {
        fetchAllOwners();
    }, [fetchAllOwners]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Shop Owner Management</h1>
                    <p className="text-sm text-gray-500">Manage business verifications and approval status</p>
                </div>
                <button
                    onClick={() => fetchAllOwners()}
                    className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                    <RefreshCcw size={16} className={`${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Business Details</th>
                            <th className="p-4 font-semibold text-gray-600">GST / Tax ID</th>
                            <th className="p-4 font-semibold text-gray-600">Location</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-500">Loading shop owners...</td></tr>
                        )}
                        {!isLoading && shopOwners.length === 0 && (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-500">No shop owners found.</td></tr>
                        )}

                        {shopOwners.map((owner) => (
                            <tr key={owner._id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 flex items-center gap-1">
                                            <Building2 size={14} className="text-gray-400" />
                                            {owner.business_name}
                                        </span>
                                        {/* Assuming user_id is populated by your backend to show the owner's name */}
                                        <span className="text-xs text-gray-500 lowercase">
                                            Owner: {owner.user_id?.full_name || "Unknown"}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm font-mono text-gray-600">
                                    {owner.gst_number || <span className="text-gray-400 italic">Not Provided</span>}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <MapPin size={14} className="text-red-400" />
                                        {owner.business_address_district}, {owner.business_address_state}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${owner.is_approved
                                            ? "bg-green-100 text-green-700 border border-green-200"
                                            : "bg-amber-100 text-amber-700 border border-amber-200"
                                        }`}>
                                        {owner.is_approved ? "Approved" : "Pending Review"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <Link
                                            href={`/verify-owner/${owner._id}`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="View Full Profile"
                                        >
                                            <Eye size={18} />
                                        </Link>

                                        {!owner.is_approved && (
                                            <button
                                                onClick={() => updateStatus(owner._id, true)}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                title="Quick Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => verifyOwner(owner._id)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                            title="Verify & Formalize"
                                        >
                                            <ShieldCheck size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}