"use client";

import { TrendingUp, Package, BadgeIndianRupee, ShoppingCart, Users, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function DashboardPage() {
    const salesData = [
        { month: "Jan", value: 6200 },
        { month: "Feb", value: 1800 },
        { month: "Mar", value: 5100 },
        { month: "Apr", value: 4600 },
        { month: "May", value: 8800 },
        { month: "Jun", value: 6200 },
        { month: "Jul", value: 5900 },
        { month: "Aug", value: 2800 },
        { month: "Sep", value: 7200 },
        { month: "Oct", value: 6900 },
        { month: "Nov", value: 7800 },
        { month: "Dec", value: 8400 }
    ];

    const products = [
        { name: "product_01", sales: 2450, trend: "+15%", isBest: false },
        { name: "product_02", sales: 1820, trend: "+18%", isBest: true },
        { name: "product_03", sales: 1640, trend: "+12%", isBest: false },
        { name: "product_04", sales: 1420, trend: "+5%", isBest: false }
    ];

    const orderStatusData = [
        { name: "Completed", value: 65, color: "#10b981" },
        { name: "Pending", value: 25, color: "#f59e0b" },
        { name: "Cancelled", value: 10, color: "#ef4444" }
    ];

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden bg-black p-4">
            {/* Header */}
            <div className="mb-3">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome to your sales overview</p>
            </div>

            {/* Row 1: Profit + Top Products */}
            <div className="grid grid-cols-12 gap-4 mb-3">
                {/* Total Profit */}
                <div className="col-span-3 bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <BadgeIndianRupee className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded-full">+12.5%</span>
                    </div>
                    <h3 className="text-gray-500 text-xs mb-1">Total Profit</h3>
                    <p className="text-3xl font-bold text-white">₹12,304</p>
                    <p className="text-gray-600 text-xs mt-2">Return +₹1,230</p>
                </div>

                {/* Top Products - Larger */}
                <div className="col-span-9 bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">Best Selling Products</h3>
                        <span className="text-xs text-blue-400">Top Performers</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {products.map((product, idx) => (
                            <div 
                                key={idx}
                                className={`p-3 rounded-xl transition-all ${
                                    product.isBest 
                                        ? 'bg-blue-500/20 border-2 border-blue-500' 
                                        : 'bg-gray-800/50 border border-gray-700/50'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className={`w-4 h-4 ${product.isBest ? 'text-blue-400' : 'text-gray-400'}`} />
                                    {product.isBest && <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Top</span>}
                                </div>
                                <p className={`text-sm font-semibold mb-1 ${product.isBest ? 'text-white' : 'text-gray-300'}`}>
                                    {product.name}
                                </p>
                                <p className="text-xs text-gray-500">{product.sales} units</p>
                                <p className={`text-xs font-medium mt-1 ${product.isBest ? 'text-blue-400' : 'text-gray-500'}`}>
                                    {product.trend}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 2: Sales Performance Chart */}
            <div className="mb-3 bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">Sales Performance</h2>
                        <p className="text-gray-500 text-xs">Monthly sales trend for 2024</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Total Revenue</p>
                        <p className="text-xl font-bold text-blue-400">₹78,450</p>
                    </div>
                </div>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                            <XAxis 
                                dataKey="month" 
                                stroke="#475569"
                                style={{ fontSize: '11px' }}
                            />
                            <YAxis 
                                stroke="#475569"
                                style={{ fontSize: '11px' }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#0f172a', 
                                    border: '1px solid #1e40af',
                                    borderRadius: '12px',
                                    color: '#fff'
                                }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2.5}
                                dot={{ fill: '#3b82f6', r: 3 }}
                                activeDot={{ r: 5 }}
                                fill="url(#colorValue)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Row 3: Additional Stats */}
            <div className="grid grid-cols-3 gap-4">
                {/* Order Status - Circular Chart */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-3 text-sm">Order Status</h3>
                    <div className="flex items-center justify-between">
                        <div className="h-28 w-28">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={45}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 ml-4 space-y-2">
                            {orderStatusData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-xs text-gray-400">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-white">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Total Customers */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-1 rounded-full">+23%</span>
                    </div>
                    <h3 className="text-gray-500 text-xs mb-1">Total Customers</h3>
                    <p className="text-3xl font-bold text-white mb-2">8,549</p>
                    <div className="flex items-center gap-4 mt-3">
                        <div>
                            <p className="text-xs text-gray-600">New</p>
                            <p className="text-sm font-semibold text-green-400">+342</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Returning</p>
                            <p className="text-sm font-semibold text-blue-400">8,207</p>
                        </div>
                    </div>
                </div>

                {/* Avg Order Value */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-blue-900/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <ShoppingCart className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-xs text-orange-400 font-medium bg-orange-500/10 px-2 py-1 rounded-full">+5.4%</span>
                    </div>
                    <h3 className="text-gray-500 text-xs mb-1">Avg Order Value</h3>
                    <p className="text-3xl font-bold text-white mb-2">₹156.80</p>
                    <div className="flex items-center gap-4 mt-3">
                        <div>
                            <p className="text-xs text-gray-600">This Month</p>
                            <p className="text-sm font-semibold text-orange-400">₹164.20</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Last Month</p>
                            <p className="text-sm font-semibold text-gray-500">₹149.60</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}