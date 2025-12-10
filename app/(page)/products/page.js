"use client";
import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import useProductStore, { getStockStatus, formatCurrency, calculateDiscountPercentage } from '@/store/productStore';

const ProductsListPage = () => {
    // FIX: Ensure clearMessages is destructured here.
    const { 
        getProductsByCurrentShop, 
        deleteProduct, 
        isLoading, 
        currentShop, 
        success, 
        error,
        clearMessages,       // <--- ADDED/CONFIRMED
        loadProductForEdit   // <--- ADDED/CONFIRMED
    } = useProductStore();

    // Get the filtered list of products
    const products = getProductsByCurrentShop();

    // Clear messages on component mount/unmount and reset form state
    useEffect(() => {
        // Fix is on line 25/26 now that clearMessages is destructured
        clearMessages();
        loadProductForEdit(null); // Ensure form is reset if coming from edit/add
    }, [clearMessages, loadProductForEdit]); // Dependecy array is also correct

    const handleDelete = (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete product: "${productName}"? This action cannot be undone.`)) {
            deleteProduct(productId);
        }
    };
    
    // Helper to get status class names
    const getStatusClasses = (status) => {
        switch (status) {
            case 'out-of-stock':
                return 'bg-red-100 text-red-800';
            case 'low-stock':
                return 'bg-yellow-100 text-yellow-800';
            case 'in-stock':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Head>
                <title>{currentShop.name} Product Inventory | E-Shop Admin</title>
            </Head>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">🛒 {currentShop.name} Inventory ({products.length})</h1>
                <Link href="/dashboard/products/add" passHref>
                    <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition">
                        + Add New Product
                    </button>
                </Link>
            </div>

            {/* Status Messages */}
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Success!</p>
                    <p>{success}</p>
                </div>
            )}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {products.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-gray-50 text-gray-600">
                    <p className="text-lg">No products found for this shop.</p>
                    <p className="text-sm mt-2">Click "Add New Product" to get started.</p>
                </div>
            ) : (
                <div className="shadow overflow-x-auto border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price / Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => {
                                const status = getStockStatus(product.stock_quantity, product.min_stock_alert);
                                const discount = calculateDiscountPercentage(product.price, product.discounted_price);
                                return (
                                    <tr key={product.product_id} className={status.status === 'low-stock' ? 'bg-yellow-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatCurrency(product.price)}
                                            {discount > 0 && (
                                                <span className="ml-2 text-red-500 font-semibold text-xs">(-{discount}%)</span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${status.text}`}>
                                            {product.stock_quantity} {product.unit}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(status.status)}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.is_verified ? '✅ Yes' : '❌ No'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/dashboard/products/edit/${product.product_id}`} passHref>
                                                <button 
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                                                    disabled={isLoading}
                                                >
                                                    Edit
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.product_id, product.name)}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            
        </div>
    );
};

export default ProductsListPage;