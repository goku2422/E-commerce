import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import API from '../../services/api';

// Animated Counter from 0 to target value (Section 17 & 18 requirement)
function CountUpNumber({ target, isCurrency = false }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = typeof target === 'number' ? target : 0;
    if (end === 0) {
      setCurrent(0);
      return;
    }
    const duration = 600; // ms
    const steps = 30;
    const increment = end / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCurrent(end);
        clearInterval(timer);
      } else {
        setCurrent(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="font-mono">
      {isCurrency ? `₹${current.toLocaleString()}` : current.toLocaleString()}
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error('Admin stats load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-800/80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', target: stats?.totalRevenue || 0, isCurrency: true, icon: DollarSign, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Total Orders', target: stats?.totalOrders || 0, isCurrency: false, icon: ShoppingBag, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: "Today's Orders", target: stats?.todaysOrders || 0, isCurrency: false, icon: Clock, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Total Customers', target: stats?.totalCustomers || 0, isCurrency: false, icon: Users, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { label: 'Total Products', target: stats?.totalProducts || 0, isCurrency: false, icon: Package, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Pending Orders', target: stats?.pendingOrders || 0, isCurrency: false, icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Delivered Orders', target: stats?.deliveredOrders || 0, isCurrency: false, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    { label: 'Cancelled Orders', target: stats?.cancelledOrders || 0, isCurrency: false, icon: XCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100 animate-fade-in">
      <div className="animate-fade-down">
        <h1 className="text-3xl font-black tracking-tight text-white font-display">Platform Control Dashboard</h1>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mt-1">Real-time statistics, revenue metrics, and inventory alerts</p>
      </div>

      {/* KPI Cards Grid with Stagger & CountUp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-lg hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 animate-fade-up stagger-${(idx % 4) + 1}`}
            >
              <div>
                <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  <CountUpNumber target={kpi.target} isCurrency={kpi.isCurrency} />
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Low Stock Alert Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg animate-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Low Stock Inventory Alerts (Stock ≤ 5)</h3>
          </div>
          <Link to="/admin/products" className="text-xs font-semibold text-indigo-400 hover:underline flex items-center group">
            <span>Manage Products</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {stats?.lowStockProducts?.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No low stock items currently.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {stats?.lowStockProducts?.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-white">{prod.name}</td>
                    <td className="p-3 font-mono text-slate-400">{prod.SKU}</td>
                    <td className="p-3">{prod.category?.name || 'General'}</td>
                    <td className="p-3 font-bold font-mono text-emerald-400">₹{prod.price}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-md font-mono">
                        {prod.stock} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg animate-fade-up">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Recent Customer Orders</h3>
          <Link to="/admin/orders" className="text-xs font-semibold text-indigo-400 hover:underline flex items-center group">
            <span>View All Orders</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {stats?.recentOrders?.map((ord) => (
                <tr key={ord._id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold font-mono text-white">#{ord.orderNumber}</td>
                  <td className="p-3">{ord.customer?.name || 'Customer'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/20">
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold font-mono text-emerald-400">₹{ord.totalAmount?.toLocaleString()}</td>
                  <td className="p-3 text-slate-500 font-mono">{new Date(ord.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
