"use client";

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { 
  AlertTriangle, Clock, PieChart as PieIcon, ArrowRight,
  Package, TrendingUp, Users, Activity, ExternalLink,
  Target, Zap, ShoppingBag, Ticket, RotateCcw, MapPin, 
  TrendingDown, Percent
} from 'lucide-react';
import { motion } from "framer-motion";

import Link from 'next/link';

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const CardWrapper = ({ children, custom, className = "" }) => (
  <motion.div 
    custom={custom} variants={cardVariants} initial="hidden" animate="visible"
    className={`relative overflow-hidden border rounded-2xl p-6 shadow-sm transition-all duration-300 
               bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 
               border-gray-200 dark:border-blue-900/30 group h-full ${className}`}
  >
    {/* Subtle gradient glow on hover */}
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="relative z-10 h-full flex flex-col">
      {children}
    </div>
  </motion.div>
);

const TrendBadge = ({ value, label }) => {
  const isPositive = value >= 0;
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
      isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
    }`}>
      {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {Math.abs(value)}% 
      <span className="text-slate-400 font-normal ml-0.5">{label}</span>
    </div>
  );
};

export default function AdvancedAnalytics({ stats, loading }) {
  const [lastRefreshed, setLastRefreshed] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 60000); // Pulse ticker every minute
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const { 
    peakHours = [], 
    inventoryHealth = [], 
    categoryPerformance = [],
    paymentMethodStats = [],
    topCustomers = [],
    revenueByDay = [],
    refundStats = [],
    refundRate = 0,
    totalRefundedAmount = 0,
    slowMovers = []
  } = stats.advanced || {};
  
  const { 
    newCustomers = 0, 
    returningCustomers = 0,
    totalRevenue = 0,
    salesPercentChange = 0,
    customerPercentChange = 0,
    avgOrderPercentChange = 0
  } = stats.overview || {};

  const totalLoyalty = newCustomers + returningCustomers;
  const retentionPercent = totalLoyalty > 0 ? Math.round((returningCustomers / totalLoyalty) * 100) : 0;

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Advanced Analytics Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            .section { margin-bottom: 40px; }
            h2 { font-size: 18px; color: #334155; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
            .value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>Shop Owner Intelligence Report</h1>
          <div class="stat-grid">
            <div class="stat-card"><div class="value">₹${totalRevenue.toLocaleString()}</div><div class="label">Total Revenue</div></div>
            <div class="stat-card"><div class="value">${retentionPercent}%</div><div class="label">Customer Retention</div></div>
            <div class="stat-card"><div class="value">${inventoryHealth.length}</div><div class="label">Stock Alerts</div></div>
          </div>
          <div class="section">
            <h2>Category Performance</h2>
            <table>
              <thead><tr><th>Category</th><th>Orders</th><th>Revenue</th></tr></thead>
              <tbody>
                ${categoryPerformance.map(c => `<tr><td>${c._id}</td><td>${c.orders}</td><td>₹${c.revenue.toLocaleString()}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Payment Method Distribution</h2>
            <table>
              <thead><tr><th>Method</th><th>Usage</th><th>Total Collected</th></tr></thead>
              <tbody>
                ${paymentMethodStats.map(m => `<tr><td>${m._id}</td><td>${m.count}</td><td>₹${m.revenue.toLocaleString()}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="section">
            <h2>Top Customers</h2>
            <table>
              <thead><tr><th>Name</th><th>Total Orders</th><th>Total Lifetime Spend</th></tr></thead>
              <tbody>
                ${topCustomers.map(c => `<tr><td>${c.name}</td><td>${c.totalOrders}</td><td>₹${c.totalSpend.toLocaleString()}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Business Intelligence</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Live Real-Time Sync Active
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Export PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <CardWrapper custom={1}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <TrendBadge value={salesPercentChange} label="vs LW" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black dark:text-white">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Total Revenue</p>
          </div>
        </CardWrapper>

        <CardWrapper custom={2}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <TrendBadge value={customerPercentChange} label="vs LW" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black dark:text-white">{totalLoyalty.toLocaleString()}</h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Unique Customers</p>
          </div>
        </CardWrapper>

        <CardWrapper custom={3}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold">
              Stable
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black dark:text-white">{retentionPercent}%</h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Customer Retention</p>
          </div>
        </CardWrapper>

        <CardWrapper custom={4}>
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <TrendBadge value={avgOrderPercentChange} label="vs LW" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black dark:text-white">₹{totalRevenue > 0 ? Math.round(totalRevenue / (stats.overview?.totalOrders || 1)).toLocaleString() : 0}</h3>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Avg Order Value</p>
          </div>
        </CardWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardWrapper custom={5}>
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            Customer Loyalty Breakdown
            <Users className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="flex-1 min-h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Returning', v: retentionPercent },
                    { name: 'New', v: 100 - retentionPercent }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="v"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#e2e8f0" className="dark:fill-slate-800" />
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const isRetention = payload[0].payload.v === retentionPercent;
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-xl">
                          <p className="text-[10px] font-bold text-white mb-0.5">{isRetention ? 'Returning' : 'New'}</p>
                          <p className="text-[10px] text-slate-400">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <div className="text-lg font-black dark:text-white">{returningCustomers}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Returning</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black dark:text-white">{newCustomers}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">New</div>
              </div>
            </div>
          </div>
        </CardWrapper>

        <CardWrapper custom={6}>
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              Peak Traffic Hours
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
                <span className="text-[9px] font-black text-blue-500 uppercase">Live</span>
              </div>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="flex-1 min-h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHours}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis 
                  dataKey="hour" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}h`}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-xl">
                          <p className="text-[10px] font-bold text-white mb-0.5">{payload[0].payload.hour}:00</p>
                          <p className="text-[10px] text-slate-400">{payload[0].value} Orders</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  strokeWidth={3}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardWrapper custom={7}>
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              Refund Radar
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                </span>
                <span className="text-[9px] font-black text-rose-500 uppercase">Live Monitor</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span className="text-[7px] text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </h3>
          <div className="space-y-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={totalRefundedAmount}
              className="p-4 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/10"
            >
              <div className="text-2xl font-black text-rose-500">₹{totalRefundedAmount.toLocaleString()}</div>
              <div className="text-[10px] text-rose-500/70 uppercase font-black tracking-widest mt-1">Lost Revenue (Escaped)</div>
            </motion.div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between text-[11px] font-bold dark:text-slate-400 uppercase">
                <span>Identified Leaks</span>
                <span>Impact</span>
              </div>
              {refundStats && refundStats.length > 0 ? refundStats.map((r, i) => (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl"
                >
                  <span className="text-xs font-bold dark:text-white capitalize truncate max-w-[140px]">{r._id.replace(/_/g, ' ')}</span>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-500 block">₹{r.totalRefunded.toLocaleString()}</span>
                    <span className="text-[8px] text-slate-500 uppercase">{r.count} Orders</span>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">No leakage detected</div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Revenue Leakage Rate</span>
                  <span className={`text-xs font-black ${refundRate > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>{refundRate}%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, refundRate * 10)}%` }}
                    className={`h-full rounded-full ${refundRate > 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  />
               </div>
            </div>
          </div>
        </CardWrapper>

        <CardWrapper custom={9}>
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            Inventory Leakage (Dead Stock)
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </h3>
          <p className="text-[10px] text-slate-500 mb-4 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 italic">
            Products with no sales in the last 90 days.
          </p>
          <div className="space-y-4">
            {slowMovers.length > 0 ? slowMovers.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl group border border-transparent hover:border-amber-500/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:bg-amber-500/10 transition-colors">
                    <ShoppingBag className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                  </div>
                  <div className="max-w-[120px]">
                    <div className="text-[11px] font-bold dark:text-white truncate">{m.name}</div>
                    <div className="text-[9px] text-slate-500">Stock: {m.stock_quantity}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black dark:text-white">₹{m.price.toLocaleString()}</div>
                  <button className="text-[8px] text-amber-500 font-black uppercase hover:underline">Clearance</button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">All stock is moving healthy!</div>
            )}
          </div>
        </CardWrapper>

        <CardWrapper custom={11}>
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            Inventory Action Plan
            <Zap className="w-4 h-4 text-blue-500" />
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {inventoryHealth.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl group border border-transparent hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-transform group-hover:scale-110">
                    <ShoppingBag className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold dark:text-white truncate max-w-[100px]">{item.name}</div>
                    <div className={`text-[10px] font-black uppercase ${item.status === 'Out of Stock' ? 'text-rose-500' : 'text-amber-500'}`}>
                      {item.stock_quantity === 0 ? 'Empty' : `${item.stock_quantity} left`}
                    </div>
                  </div>
                </div>
                <Link 
                  href={`/products/${item.product_id}/edit/${item._id}`}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 dark:bg-white dark:text-slate-900 text-white dark:border-white rounded-xl text-[10px] font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                >
                  Restock
                </Link>
              </div>
            ))}
          </div>
        </CardWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* VIP Customers */}
        <CardWrapper custom={12}>
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            VIP Customers
            <Target className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="space-y-4">
            {topCustomers.map((customer, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-800/40 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold dark:text-white">{customer.name}</div>
                    <div className="text-[10px] text-slate-500">{customer.totalOrders} Orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black dark:text-white">₹{customer.totalSpend.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Lifetime Value</div>
                </div>
              </div>
            ))}
          </div>
        </CardWrapper>

        <CardWrapper custom={13} className="min-h-[350px]">
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            Revenue Rhythm
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">30-Day Trend</span>
          </h3>
          <div className="flex-1 min-h-[180px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl shadow-xl">
                          <p className="text-[10px] font-bold text-white mb-0.5">{payload[0].payload.day}</p>
                          <p className="text-[10px] text-slate-400">₹{payload[0].value.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {revenueByDay.map((entry, index) => (
                    <Cell key={index} fill={index > 4 ? '#6366f1' : '#3b82f6'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardWrapper>

        <CardWrapper custom={14} className="min-h-[350px]">
          <h3 className="text-sm font-bold dark:text-white mb-6 flex items-center justify-between">
            Category Share
            <PieIcon className="w-4 h-4 text-slate-400" />
          </h3>
          <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2">
            {categoryPerformance.map((cat, i) => {
              const totalRevenue = categoryPerformance.reduce((sum, c) => sum + c.revenue, 0);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold dark:text-white">
                    <span className="truncate max-w-[150px]">{cat._id}</span>
                    <span className="text-slate-500">₹{cat.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (cat.revenue / (totalRevenue || 1)) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardWrapper>
      </div>
    </div>
  );
}
