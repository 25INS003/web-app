"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import ProductForm from '@/components/products/ProductForm'; // Adjust path as necessary
import useProductStore from '@/store/productStore';

const EditProductPage = () => {
    const router = useRouter();
    const { id: productId } = router.query;
    
    const { 
        products, 
        loadProductForEdit, 
        productForm, 
        clearMessages,
        isLoading
    } = useProductStore();
    
    // 1. Load the product data when the component mounts or the ID changes
    useEffect(() => {
        if (productId) {
            clearMessages();
            loadProductForEdit(productId);
        }
    }, [productId, loadProductForEdit, clearMessages]);

    // 2. Check if the product is available in the store (after load)
    const product = products.find(p => p.product_id === productId);

    if (isLoading) {
        return <div className="text-center p-10 text-xl text-indigo-600">Loading Product Data...</div>;
    }
    
    // Handle case where product ID is invalid or not found
    if (!product && productId) {
        return (
            <div className="text-center p-10">
                <h1 className="text-3xl font-bold text-red-600">Product Not Found</h1>
                <p className="mt-3 text-gray-600">Could not find product with ID: {productId}.</p>
                <button 
                    onClick={() => router.push('/dashboard/products')}
                    className="mt-6 bg-indigo-500 text-white py-2 px-4 rounded"
                >
                    Back to Product List
                </button>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4">
            <Head>
                <title>Edit {productForm.name || 'Product'} | E-Shop Admin</title>
            </Head>

            <ProductForm isEditing={true} />
        </div>
    );
};

export default EditProductPage;