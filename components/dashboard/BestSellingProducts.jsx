"use client";

import { Package, TrendingUp, Star } from "lucide-react";

export default function BestSellingProducts({ data, loading }) {
  const products = data || [];
  
  return (
    <div 
      className="relative overflow-hidden border rounded-2xl p-5 shadow-sm transition-all duration-300 
                 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
                 border-gray-200 dark:border-blue-900/30 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
            Best Selling Products
          </h3>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
            Top performers this month
          </p>
        </div>
        <span 
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full"
        >
          <Star className="w-3 h-3" />
          Top Performers
        </span>
      </div>

      <div 
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {products.map((product, idx) => (
          <div 
            key={idx}
            className={`relative p-4 rounded-xl transition-all duration-300 ${
              product.isBest 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400 shadow-lg shadow-blue-500/25' 
                : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg ${
                product.isBest 
                   ? 'bg-white/20' 
                   : 'bg-blue-50 dark:bg-blue-500/10'
              }`}>
                <Package className={`w-4 h-4 ${
                  product.isBest 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              {product.isBest && (
                <span 
                  className="text-xs px-1.5 py-0.5 rounded font-medium bg-white/20 text-white"
                >
                  Top
                </span>
              )}
            </div>
            
            <p className={`text-sm font-semibold mb-1 ${
              product.isBest ? 'text-white' : 'text-gray-900 dark:text-gray-200'
            }`}>
              {product.name}
            </p>
            <p className={`text-xs ${
              product.isBest ? 'text-white/80' : 'text-gray-500 dark:text-gray-500'
            }`}>
              {product.sales.toLocaleString()} units
            </p>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              product.isBest 
                ? 'text-white' 
                : product.trend?.startsWith('-') ? 'text-red-500' : 'text-green-600'
            }`}>
              {product.trend?.startsWith('-') ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {product.trend || '+0%'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}