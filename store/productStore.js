"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =================================================================
// --- DUMMY DATA ---
// =================================================================

export const DUMMY_SHOPS = [
  { id: 'shop_001', name: 'Fresh Grocery Mart', type: 'grocery', location: 'Downtown' },
  { id: 'shop_002', name: 'Electro World', type: 'electronics', location: 'Mall' },
  { id: 'shop_003', name: 'Fashion Hub', type: 'clothing', location: 'Plaza' },
];

export const DUMMY_CATEGORIES = [
  { id: 'cat_001', name: 'Electronics', parent_id: null, shop_type: 'electronics' },
  { id: 'cat_002', name: 'Smartphones', parent_id: 'cat_001', shop_type: 'electronics' },
  { id: 'cat_003', name: 'Laptops', parent_id: 'cat_001', shop_type: 'electronics' },
  { id: 'cat_004', name: 'Grocery', parent_id: null, shop_type: 'grocery' },
  { id: 'cat_005', name: 'Fresh Produce', parent_id: 'cat_004', shop_type: 'grocery' },
  { id: 'cat_006', name: 'Dairy', parent_id: 'cat_004', shop_type: 'grocery' },
  { id: 'cat_007', name: 'Clothing', parent_id: null, shop_type: 'clothing' },
  { id: 'cat_008', name: 'Men\'s Wear', parent_id: 'cat_007', shop_type: 'clothing' },
  { id: 'cat_009', name: 'Women\'s Wear', parent_id: 'cat_007', shop_type: 'clothing' },
];

export const DUMMY_UNITS = [
  { value: 'piece', label: 'Piece', category: 'general' },
  { value: 'kg', label: 'Kilogram', category: 'weight' },
  { value: 'gram', label: 'Gram', category: 'weight' },
  { value: 'liter', label: 'Liter', category: 'volume' },
  { value: 'pair', label: 'Pair', category: 'general' },
  { value: 'set', label: 'Set', category: 'general' },
  { value: 'loaf', label: 'Loaf', category: 'general' },
];

export const DUMMY_BRANDS = {
  electronics: ['Apple', 'Samsung', 'Dell', 'HP', 'Sony', 'LG'],
  grocery: ['Local Farm', 'Organic Valley', 'Nature\'s Best', 'Premium Select'],
  clothing: ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s'],
};

export const CATEGORY_ATTRIBUTES = {
  'cat_002': [ // Smartphones
    { name: 'ram', label: 'RAM', type: 'text', placeholder: 'e.g., 8GB' },
    { name: 'storage', label: 'Storage', type: 'text', placeholder: 'e.g., 256GB' },
    { name: 'screen_size', label: 'Screen Size', type: 'text', placeholder: 'e.g., 6.7"' },
  ],
  'cat_005': [ // Fresh Produce
    { name: 'origin', label: 'Origin', type: 'text' },
    { name: 'organic', label: 'Organic', type: 'boolean' },
    { name: 'best_before', label: 'Best Before', type: 'date' },
  ],
};

export const MOCK_PRODUCTS = [
  {
    product_id: 'prod_001',
    shop_id: 'shop_002', // Electro World
    category_id: 'cat_002', // Smartphones
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with A17 Pro chip',
    brand: 'Apple',
    price: 999,
    discounted_price: 949,
    stock_quantity: 25,
    min_stock_alert: 5,
    unit: 'piece',
    weight_kg: 0.187,
    images: ['https://picsum.photos/200/300?random=1'],
    attributes: { ram: '8GB', storage: '256GB', screen_size: '6.1"' },
    is_available: true,
    is_verified: true,
    total_sold: 50,
    sku: 'WOR-PHE-2345',
    created_at: '2024-01-15',
  },
  {
    product_id: 'prod_002',
    shop_id: 'shop_001', // Fresh Grocery Mart
    category_id: 'cat_005', // Fresh Produce
    name: 'Organic Apples',
    description: 'Fresh organic apples from local farm',
    brand: 'Local Farm',
    price: 4.99,
    discounted_price: 3.99,
    stock_quantity: 4, // Low stock
    min_stock_alert: 5,
    unit: 'kg',
    weight_kg: 1,
    images: ['https://picsum.photos/200/300?random=2'],
    attributes: { organic: true, origin: 'California', best_before: '2024-12-25' },
    is_available: true,
    is_verified: false,
    total_sold: 120,
    sku: 'MAR-OCE-1122',
    created_at: '2024-01-16',
  },
];

// =================================================================
// --- INITIAL STATE ---
// =================================================================

const initialProductState = {
  product_id: '', 
  shop_id: DUMMY_SHOPS[0].id, 
  category_id: '',
  name: '',
  description: '',
  brand: '',
  price: 0,
  discounted_price: 0,
  stock_quantity: 0,
  min_stock_alert: 5,
  unit: 'piece',
  weight_kg: 0,
  images: [],
  attributes: {},
  is_available: true,
  is_verified: false,
  sku: '',
  total_sold: 0,
  created_at: '',
  updated_at: '',
};

// =================================================================
// --- ZUSTAND STORE ---
// =================================================================

const useProductStore = create(
  persist(
    (set, get) => ({
      // --- CORE STATE ---
      productForm: { ...initialProductState },
      isLoading: false, 
      error: null,
      success: null,
      
      // --- DATA STATE ---
      products: [...MOCK_PRODUCTS], 
      categories: [...DUMMY_CATEGORIES],
      units: [...DUMMY_UNITS],
      brands: DUMMY_BRANDS[DUMMY_SHOPS[0].type], 

      // --- CONTEXT STATE (Simulated Auth/Shop Selection) ---
      currentShop: DUMMY_SHOPS[0], 

      // --- COMPUTED GETTERS ---
      getFilteredCategories: () => {
        const shopType = get().currentShop?.type;
        return get().categories.filter(cat => cat.shop_type === shopType);
      },

      getProductsByCurrentShop: () => {
        const shopId = get().currentShop.id;
        return get().products.filter(product => product.shop_id === shopId);
      },

      getCategoryAttributes: () => {
        const categoryId = get().productForm.category_id;
        return CATEGORY_ATTRIBUTES[categoryId] || [];
      },
      
      getLowStockProducts: () => {
        return get().getProductsByCurrentShop().filter(product =>
          product.stock_quantity <= product.min_stock_alert && product.is_available
        );
      },

      // --- ACTIONS ---

      setProductField: (field, value) => {
        set((state) => {
          let newForm = { ...state.productForm, [field]: value };
          let newState = { productForm: newForm, error: null, success: null };

          if (field === 'category_id' && state.productForm.category_id !== value) {
            const category = state.categories.find(c => c.id === value);
            if (category) {
              const shopType = category.shop_type;
              const categoryAttributes = CATEGORY_ATTRIBUTES[value] || [];
              const defaultAttributes = {};

              categoryAttributes.forEach(attr => {
                defaultAttributes[attr.name] = attr.type === 'boolean' ? false : '';
              });

              newForm.attributes = defaultAttributes;
              newState.brands = DUMMY_BRANDS[shopType] || [];
              newState.productForm = newForm;
            }
          }

          return newState;
        });
      },

      setAttributeField: (attributeName, value) => {
        set((state) => ({
          productForm: {
            ...state.productForm,
            attributes: {
              ...state.productForm.attributes,
              [attributeName]: value,
            },
          },
        }));
      },

      /**
       * Clears all notifications/messages (FIX IMPLEMENTED HERE)
       */
      clearMessages: () => { 
        set({ error: null, success: null });
      },

      resetForm: () => {
        set({
          productForm: { ...initialProductState, shop_id: get().currentShop.id },
          error: null,
          success: null,
        });
      },
      
      validateForm: () => {
        const form = get().productForm;
        const errors = [];

        if (!form.name.trim()) errors.push('Product name is required');
        if (!form.category_id) errors.push('Please select a category');
        if (form.price <= 0) errors.push('Price must be greater than 0');
        if (form.discounted_price > form.price) {
          errors.push('Discounted price cannot be higher than regular price');
        }
        if (form.stock_quantity < 0) errors.push('Stock quantity cannot be negative');

        return errors;
      },

      saveProduct: async () => {
        const form = get().productForm;
        const validationErrors = get().validateForm();

        if (validationErrors.length > 0) {
          set({ error: validationErrors.join('. ') });
          return false;
        }

        set({ isLoading: true, error: null, success: null });
        
        try {
          // --- MOCK API CALL START ---
          await new Promise(resolve => setTimeout(resolve, 1000)); 
          
          const isUpdating = !!form.product_id;
          const productId = isUpdating ? form.product_id : `prod_${Date.now()}`;
          const sku = form.sku || `${get().currentShop.id.toUpperCase().slice(0, 3)}-${productId.slice(-4)}`;
          
          const productData = {
            ...form,
            product_id: productId,
            sku,
            shop_id: get().currentShop.id, 
            updated_at: new Date().toISOString(),
            created_at: isUpdating ? form.created_at : new Date().toISOString(),
          };
          // --- MOCK API CALL END ---

          if (isUpdating) {
            set((state) => ({
              products: state.products.map(p => 
                p.product_id === productId ? { ...p, ...productData } : p
              ),
              success: 'Product updated successfully!',
            }));
          } else {
            set((state) => ({
              products: [...state.products, productData],
              success: 'Product added successfully!',
            }));
          }

          set({ isLoading: false });
          get().resetForm(); 
          return true;
          
        } catch (err) {
          set({
            isLoading: false,
            error: 'Failed to save product. Please check your data and network.',
          });
          return false;
        }
      },

      loadProductForEdit: (productId) => {
        const product = get().products.find(p => p.product_id === productId);
        if (product) {
          set({
            productForm: { ...initialProductState, ...product },
            error: null,
            success: null,
          });
          get().setProductField('category_id', product.category_id);
        }
      },

      deleteProduct: async (productId) => {
        set({ isLoading: true, error: null, success: null });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 800)); 
          
          set((state) => ({
            products: state.products.filter(p => p.product_id !== productId),
            isLoading: false,
            success: 'Product deleted successfully!',
          }));
          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Failed to delete product.',
          });
          return false;
        }
      },
    }),
    {
      name: 'product-storage',
      partialize: (state) => ({
        products: state.products,
        currentShop: state.currentShop,
      }),
    }
  )
);

export default useProductStore;

// =================================================================
// --- HELPER FUNCTIONS (Frontend Utils) ---
// =================================================================

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const getStockStatus = (quantity, minAlert) => {
  if (quantity === 0) return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-500', text: 'text-red-900' };
  if (quantity <= minAlert) return { status: 'low-stock', label: 'Low Stock', color: 'bg-orange-400', text: 'text-orange-900' };
  return { status: 'in-stock', label: 'In Stock', color: 'bg-green-500', text: 'text-green-900' };
};

export const calculateDiscountPercentage = (price, discountedPrice) => {
  if (discountedPrice <= 0 || discountedPrice >= price) return 0;
  return Math.round(((price - discountedPrice) / price) * 100);
};