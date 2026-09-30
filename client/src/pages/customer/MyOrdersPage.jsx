import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import API from '../../services/api';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/my-orders')
      .then((res) => {
        const orderList = res.data?.data?.orders || res.data?.orders || res.data?.data || [];
        setOrders(Array.isArray(orderList) ? orderList : []);
      })
      .catch((err) => console.error('Failed to load My Orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-rose-50 text-rose-800 border-rose-200/60';
      case 'SHIPPED':
      case 'OUT FOR DELIVERY':
        return 'bg-sky-50 text-sky-800 border-sky-200/60';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200/60';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 animate-pulse space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 bg-stone-200/60 rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 space-y-10">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="text-4xl sm:text-5xl font-display font-light text-neutral-900 tracking-tight">
          My Orders
        </h1>
        <p className="text-xs text-neutral-400 font-mono uppercase tracking-widest mt-2">
          Purchase Archive & Shipment Tracking
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-neutral-200/80 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-display font-light text-neutral-900">No Orders Placed Yet</h3>
            <p className="text-sm text-neutral-500 font-light">Explore our curated catalog to begin shopping.</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-widest transition-all rounded-xl"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-neutral-400 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-neutral-900 text-lg">#{order.orderNumber}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 font-light">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-neutral-400" />
                    {new Date(order.createdAt).toLocaleDateString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</span>
                  <span>•</span>
                  <span className="font-semibold text-neutral-900 font-mono text-sm">
                    ₹{order.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                to={`/orders/${order._id}`}
                className="inline-flex items-center px-6 py-3 bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-900 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shrink-0"
              >
                <span>View Details</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
