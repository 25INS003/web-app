"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useShopOwnerStore } from "@/store/useShopOwnerStore";
import { Eye, CheckCircle, ShieldCheck, RefreshCcw } from "lucide-react";

export default function ShopOwnerListPage() {
    const { shopOwners, isLoading, fetchAllOwners, updateStatus, verifyOwner } = useShopOwnerStore();

    useEffect(() => {
        fetchAllOwners();
    }, [fetchAllOwners]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Shop Owner Management</h1>
                <button
                    onClick={() => fetchAllOwners()}
                    className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                    <RefreshCcw size={16} /> Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Owner Name</th>
                            <th className="p-4 font-semibold text-gray-600">Email</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan="4" className="p-10 text-center text-gray-500">Loading shop owners...</td></tr>
                        )}
                        {!isLoading && shopOwners.length === 0 && (
                            <tr><td colSpan="4" className="p-10 text-center text-gray-500">No shop owners found.</td></tr>
                        )}
                        {shopOwners.map((owner) => (
                            <tr key={owner._id} className="border-b hover:bg-gray-50 transition">
                                <td className="p-4 font-medium text-gray-900">{owner.full_name || "N/A"}</td>
                                <td className="p-4 text-gray-600">{owner.email}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${owner.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {owner.is_approved ? "Approved" : "Pending"}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-3">
                                        <Link
                                            href={`/verify-owner/${owner._id}`}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                        {!owner.is_approved && (
                                            <button
                                                onClick={() => updateStatus(owner._id, true)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                title="Approve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => verifyOwner(owner._id)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                            title="Verify & Approve"
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