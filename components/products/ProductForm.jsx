"use client";
import React from 'react';
import useProductStore from '@/store/productStore'; // Assuming this component is in /components/
import { CATEGORY_ATTRIBUTES, DUMMY_UNITS, DUMMY_BRANDS } from '@/store/productStore'; // Import constants

const ProductForm = ({ isEditing = false }) => {
    const { 
        productForm, 
        setProductField, 
        setAttributeField, 
        saveProduct, 
        isLoading, 
        error, 
        success, 
        getFilteredCategories,
        brands,
        units,
        getCategoryAttributes,
        clearMessages,
        currentShop
    } = useProductStore();

    const handleChange = (e) => {
        clearMessages();
        const { name, value, type, checked } = e.target;
        const processedValue = type === 'number' ? Number(value) : type === 'checkbox' ? checked : value;
        setProductField(name, processedValue);
    };

    const handleAttributeChange = (attributeName, type) => (e) => {
        clearMessages();
        const value = type === 'boolean' ? e.target.checked : e.target.value;
        setAttributeField(attributeName, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveProduct();
    };

    const categories = getFilteredCategories();
    const dynamicAttributes = getCategoryAttributes();

    return (
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl px-8 pt-6 pb-8 mb-4 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? `Editing: ${productForm.name}` : 'New Product Details'}
            </h2>

            {/* Status Messages */}
            {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4">{success}</div>
            )}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4">{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUMN 1: Basic Info */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-1">Primary Information</h3>
                    
                    {/* Name */}
                    <label className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={productForm.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />

                    {/* Description */}
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" rows="3" value={productForm.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>

                    {/* Category */}
                    <label className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                    <select name="category_id" value={productForm.category_id} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                        <option value="">Select a Category ({currentShop.type})</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    {/* Brand */}
                    <label className="block text-sm font-medium text-gray-700">Brand</label>
                    <select name="brand" value={productForm.brand} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                        <option value="">Select or leave blank</option>
                        {brands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                    
                    {/* Images (Simplified Mock) */}
                    <div className="py-2 border-t mt-4">
                        <label className="block text-sm font-medium text-gray-700">Images (Mock Upload)</label>
                        <div className="flex space-x-2 mt-1">
                            {productForm.images.map((img, index) => (
                                <img key={index} src={img} alt={`Product Image ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                            ))}
                            {/* In a real app, this would be an image uploader */}
                            <div className="w-16 h-16 border border-dashed rounded flex items-center justify-center text-gray-400 text-xs">
                                + Image
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Pricing, Stock, and Attributes */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-1">Pricing & Inventory</h3>

                    {/* Price */}
                    <label className="block text-sm font-medium text-gray-700">Regular Price (USD) <span className="text-red-500">*</span></label>
                    <input type="number" name="price" min="0.01" step="0.01" value={productForm.price} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />

                    {/* Discounted Price */}
                    <label className="block text-sm font-medium text-gray-700">Discounted Price (USD)</label>
                    <input type="number" name="discounted_price" min="0" step="0.01" value={productForm.discounted_price} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />

                    <div className="flex space-x-4">
                        {/* Stock Quantity */}
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Stock <span className="text-red-500">*</span></label>
                            <input type="number" name="stock_quantity" min="0" value={productForm.stock_quantity} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </div>
                        {/* Unit */}
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select name="unit" value={productForm.unit} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                                {units.map(u => (
                                    <option key={u.value} value={u.value}>{u.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Attributes */}
                    {dynamicAttributes.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-md mb-2">Specific Attributes</h4>
                            {dynamicAttributes.map(attr => (
                                <div key={attr.name} className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">{attr.label}</label>
                                    {attr.type === 'boolean' ? (
                                        <div className="flex items-center mt-1">
                                            <input 
                                                type="checkbox"
                                                name={attr.name}
                                                checked={productForm.attributes[attr.name] || false}
                                                onChange={handleAttributeChange(attr.name, attr.type)}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{productForm.attributes[attr.name] ? 'Yes' : 'No'}</span>
                                        </div>
                                    ) : (
                                        <input 
                                            type={attr.type}
                                            name={attr.name}
                                            value={productForm.attributes[attr.name] || ''}
                                            onChange={handleAttributeChange(attr.name, attr.type)}
                                            placeholder={attr.placeholder}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Status Toggles */}
                    <div className="border-t pt-4 space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input type="checkbox" name="is_available" checked={productForm.is_available} onChange={handleChange} className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            Product is available (Live on site)
                        </label>
                        {isEditing && (
                            <label className="flex items-center text-sm font-medium text-gray-700">
                                <input type="checkbox" name="is_verified" checked={productForm.is_verified} onChange={handleChange} className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded" disabled={!isEditing} />
                                Is Verified (Admin only field)
                            </label>
                        )}
                    </div>

                </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 mt-6 border-t flex justify-end">
                <button
                    type="submit"
                    className={`font-bold py-2 px-6 rounded-lg shadow-md transition ${
                        isLoading
                            ? 'bg-indigo-300 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Add Product')}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;