"use client";
import React, { useEffect } from 'react';
import Head from 'next/head';
import ProductForm from '@/components/products/ProductForm'; // Adjust path as necessary
import useProductStore from '@/store/productStore';

const AddProductPage = () => {
    const { resetForm, clearMessages } = useProductStore();

    // Reset the form state when navigating to the Add page
    useEffect(() => {
        resetForm();
        clearMessages();
    }, [resetForm, clearMessages]);

    return (
        <div className="container mx-auto p-4">
            <Head>
                <title>Add New Product | E-Shop Admin</title>
            </Head>

            <div className="flex items-center mb-6">
                <h1 className="text-3xl font-bold">➕ Add New Product</h1>
            </div>

            <ProductForm isEditing={false} />
        </div>
    );
};

export default AddProductPage;