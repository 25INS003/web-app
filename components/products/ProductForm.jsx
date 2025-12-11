"use client";
import React, { useEffect, useMemo } from 'react';
// Import the store and the constants exported from the store file
import useProductStore, { DUMMY_UNITS, DUMMY_BRANDS } from '@/store/productStore'; 
// import { shallow } from 'zustand/shallow'; // No longer needed if fetching props individually

/**
 * A form component for creating and editing products.
 * @param {boolean} isEditing - Set to true if this form is being used to edit an existing product.
 * @param {string} productId - Optional: The ID of the product to load for editing.
 */
const ProductForm = ({ isEditing = false, productId = null }) => {
    // 1. Select state and actions from the store
    // RESOLUTION: Fetch state and actions individually to prevent the creation of a new selector object {}
    // on every render, which is best practice for performance and avoiding SSR/hydration issues.
    const productForm = useProductStore((state) => state.productForm);
    const isLoading = useProductStore((state) => state.isLoading);
    const error = useProductStore((state) => state.error);
    const success = useProductStore((state) => state.success);
    
    // Actions are stable, so they can be selected individually without performance concern
    const setProductField = useProductStore((state) => state.setProductField);
    const setAttributeField = useProductStore((state) => state.setAttributeField);
    const saveProduct = useProductStore((state) => state.saveProduct);
    const clearMessages = useProductStore((state) => state.clearMessages);
    const getFilteredCategories = useProductStore((state) => state.getFilteredCategories);
    const currentShop = useProductStore((state) => state.currentShop);
    const getCategoryAttributes = useProductStore((state) => state.getCategoryAttributes);
    const fetchProductById = useProductStore((state) => state.fetchProductById);
    const loadProductForEditing = useProductStore((state) => state.loadProductForEditing);


    // 2. Fetch and Load Product data if in editing mode
    useEffect(() => {
        if (isEditing && productId) {
            // Fetch product data from API and load it into the form state
            fetchProductById(productId)
                .then(product => {
                    if (product) {
                        loadProductForEditing(product);
                    }
                })
                .catch(err => {
                    console.error("Failed to load product for editing:", err);
                    // The error state is assumed to be set within fetchProductById or the store's error handling
                });
        }
        
        // Cleanup function for when the component unmounts or switches from editing
        return () => {
             // Clear messages on unmount/re-render to prevent stale messages
             clearMessages();
             
             // Optionally, reset the form state if needed, though often managed by the store's flow
             // loadProductForEditing({}); 
        };
        // Dependency Array: Ensure all external functions and values used inside useEffect are listed.
        // Actions (like fetchProductById, clearMessages) are stable functions provided by Zustand.
    }, [isEditing, productId, fetchProductById, loadProductForEditing, clearMessages]);


    // 3. Handlers
    const handleChange = (e) => {
        clearMessages();
        const { name, value, type, checked } = e.target;
        // Process value to ensure correct type for numbers/booleans
        const processedValue = type === 'number' ? Number(value) : type === 'checkbox' ? checked : value;
        setProductField(name, processedValue);
    };

    const handleAttributeChange = (attributeName, type) => (e) => {
        clearMessages();
        // Use e.target.checked for boolean, otherwise e.target.value
        const value = type === 'boolean' ? e.target.checked : e.target.value;
        setAttributeField(attributeName, value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveProduct(); // Store handles the POST/PUT logic
    };

    // Use useMemo for computed values to avoid recalculation on every render
    const categories = useMemo(() => getFilteredCategories(), [getFilteredCategories]);
    const dynamicAttributes = useMemo(() => getCategoryAttributes(), [getCategoryAttributes]);
    const units = DUMMY_UNITS;
    const brands = DUMMY_BRANDS; 

    // 4. Render Form
    return (
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl px-8 pt-6 pb-8 mb-4 border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? `Editing: ${productForm.name || 'Product'}` : 'New Product Details'}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={productForm.name || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" rows="3" value={productForm.description || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                        <select name="category_id" value={productForm.category_id || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                            <option value="">Select a Category ({currentShop.type?.split('_').pop()})</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Brand</label>
                        <select name="brand" value={productForm.brand || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
                            <option value="">Select or leave blank</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* COLUMN 2: Pricing, Stock, and Attributes */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-1">Pricing & Inventory</h3>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Regular Price (USD) <span className="text-red-500">*</span></label>
                        <input type="number" name="price" min="0.01" step="0.01" value={productForm.price || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>

                    {/* Discounted Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Discounted Price (USD)</label>
                        <input type="number" name="discounted_price" min="0" step="0.01" value={productForm.discounted_price || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>

                    <div className="flex space-x-4">
                        {/* Stock Quantity */}
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Stock <span className="text-red-500">*</span></label>
                            <input type="number" name="stock_quantity" min="0" value={productForm.stock_quantity || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </div>
                        {/* Unit */}
                        <div className="w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Unit</label>
                            <select name="unit" value={productForm.unit || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border bg-white">
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
                                                // Default to false if attribute doesn't exist yet
                                                checked={!!productForm.attributes[attr.name]}
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
                            <input type="checkbox" name="is_available" checked={!!productForm.is_available} onChange={handleChange} className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            Product is available (Live on site)
                        </label>
                        <label className="flex items-center text-sm font-medium text-gray-700">
                            <input 
                                type="checkbox" 
                                name="is_verified" 
                                checked={!!productForm.is_verified} 
                                onChange={handleChange} 
                                className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded" 
                                // Verification should only be editable in Edit mode (isEditing is true)
                                disabled={!isEditing} 
                            />
                            Is Verified (Admin only field)
                        </label>
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