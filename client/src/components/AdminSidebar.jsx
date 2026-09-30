import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Ticket,
  Users,
  ArrowLeft,
  ShieldAlert,
  CreditCard,
  Truck,
  Menu,
  X,
} from 'lucide-react';

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
    { name: 'Customers', path: '/admin/users', icon: Users },
    { name: 'Delivery Charges', path: '/admin/delivery-config', icon: Truck },
    { name: 'Payments Audit', path: '/admin/payments', icon: CreditCard },
  ];

  return (
    <>
      {/* Mobile Top Header Bar for Admin Portal */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-bold text-white tracking-wide text-sm">Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Toggle Admin Navigation"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto w-64 bg-slate-900 text-slate-300 h-screen flex flex-col border-r border-slate-800 shrink-0 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Admin Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="font-bold text-white tracking-wide">Admin Portal</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Back to store */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Storefront
          </Link>
        </div>
      </aside>
    </>
  );
}
