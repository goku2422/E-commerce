import React from 'react';
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
} from 'lucide-react';

export default function AdminSidebar() {
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
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Admin Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="font-bold text-white tracking-wide">Admin Portal</span>
        </div>
      </div>

      {/* Nav Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
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
      <div className="p-4 border-t border-slate-800">
        <Link
          to="/"
          className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Storefront
        </Link>
      </div>
    </aside>
  );
}
