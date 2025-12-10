"use client";

import { Package } from "lucide-react";

export default function BestSellingProducts() {

  const products = [
    { name: "product_01", sales: 2450, trend: "+15%", isBest: false },
    { name: "product_02", sales: 1820, trend: "+18%", isBest: true },
    { name: "product_03", sales: 1640, trend: "+12%", isBest: false },
    { name: "product_04", sales: 1420, trend: "+5%", isBest: false }
  ];
  
  return (
    <div className="border rounded-2xl p-5 shadow-sm transition-colors duration-300 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 border-gray-200 dark:border-blue-900/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-900 dark:text-white font-semibold">
          Best Selling Products
        </h3>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          Top Performers
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {products.map((product, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-xl transition-all ${
              product.isBest 
                ? 'bg-blue-50 dark:bg-blue-500/20 border-2 border-blue-500' 
                : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className={`w-4 h-4 ${
                product.isBest 
                  ? 'text-blue-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
              {product.isBest && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                  Top
                </span>
              )}
            </div>
            <p className={`text-sm font-semibold mb-1 ${
              product.isBest ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-300'
            }`}>
              {product.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-500">
              {product.sales} units
            </p>
            <p className={`text-xs font-medium mt-1 ${
              product.isBest 
                ? 'text-blue-600' 
                : 'text-gray-600 dark:text-gray-500'
            }`}>
              {product.trend}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}