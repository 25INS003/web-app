"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import ViewProductPage from "./product";
import VariantList from "./variant";
import { useProductStore } from "@/store/productStore";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ViewPage() {
    const params = useParams();
    const { shopId, productId } = params;
    const {
        currentProduct,
        currentVariants,
        getProductDetails,
        isLoading
    } = useProductStore();

    useEffect(() => {
        const init = () => {
            if (shopId && productId) {
                getProductDetails(shopId, productId);
            }
        };
        init();
    }, [shopId, productId, getProductDetails]);

    return (
        <div>
            <ViewProductPage />



            <div className="m-10 p-4 relative">
                <div className="flex flex-col mb-10 md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Variants</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Total items: <span className="font-medium text-indigo-600">0</span>
                        </p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Link href={`products/${shopId}/add`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
                            <Plus className="h-4 w-4" /> Add
                        </Link>
                    </div>
                </div>
                <VariantList variants={currentVariants} />
            </div>

        </div>


    );
}