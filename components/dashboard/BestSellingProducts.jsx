"use client";

import { Package } from "lucide-react";
import { useTheme } from "@/store/themeStore";

export default function BestSellingProducts() {
  const { isDark } = useTheme();

  const products = [
    { name: "product_01", sales: 2450, trend: "+15%", isBest: false },
    { name: "product_02", sales: 1820, trend: "+18%", isBest: true },
    { name: "product_03", sales: 1640, trend: "+12%", isBest: false },
    { name: "product_04", sales: 1420, trend: "+5%", isBest: false }
  ];
  
  return (
    <div className={`${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-950 border-blue-900/30' 
        : 'bg-white border-gray-200'
    } border rounded-2xl p-5 shadow-sm transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold`}>
          Best Selling Products
        </h3>
        <span className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          Top Performers
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {products.map((product, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-xl transition-all ${
              product.isBest 
                ? isDark 
                  ? 'bg-blue-500/20 border-2 border-blue-500' 
                  : 'bg-blue-50 border-2 border-blue-500'
                : isDark
                  ? 'bg-gray-800/50 border border-gray-700/50'
                  : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className={`w-4 h-4 ${
                product.isBest 
                  ? 'text-blue-600' 
                  : isDark ? 'text-gray-400' : 'text-gray-500'
              }`} />
              {product.isBest && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                  Top
                </span>
              )}
            </div>
            <p className={`text-sm font-semibold mb-1 ${
              isDark ? (product.isBest ? 'text-white' : 'text-gray-300') : 'text-gray-900'
            }`}>
              {product.name}
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              {product.sales} units
            </p>
            <p className={`text-xs font-medium mt-1 ${
              product.isBest 
                ? 'text-blue-600' 
                : isDark ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {product.trend}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}