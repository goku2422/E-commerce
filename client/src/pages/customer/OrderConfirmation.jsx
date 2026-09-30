import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import API from '../../services/api';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center animate-pulse">
        <div className="h-48 bg-stone-200/60 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6 animate-fade-in">
        <h2 className="text-3xl font-display font-light text-neutral-900 tracking-tight">Order Not Found</h2>
        <Link
          to="/products"
          className="mt-6 inline-block px-8 py-4 bg-neutral-900 hover:bg-black text-white text-xs font-semibold uppercase tracking-widest transition-all hover:scale-105"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 space-y-12 animate-fade-in">
      {/* Top Banner */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 animate-check">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-800 bg-emerald-100/60 px-4 py-1.5 rounded-full animate-fade-up stagger-1">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Payment Verified & Order Confirmed
        </span>
        <h1 className="text-4xl sm:text-5xl font-display font-light text-neutral-900 tracking-tight animate-fade-up stagger-2">
          Thank You For Your Order
        </h1>
        <p className="text-sm text-neutral-500 font-light animate-fade-up stagger-3">
          Order Reference: <span className="font-mono font-bold text-neutral-900">{order.orderNumber}</span>
        </p>
        {order.paymentInfo?.razorpayPaymentId && (
          <p className="text-xs text-neutral-400 font-mono animate-fade-up stagger-4">
            Transaction ID: {order.paymentInfo.razorpayPaymentId}
          </p>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-sm space-y-8 animate-fade-up">
        {/* Items List */}
        <div className="space-y-6">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-3">
            Items Ordered
          </h3>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item) => (
              <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-20 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-neutral-100">
                    <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500 font-light mt-0.5">
                      Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-neutral-900 font-mono">
                  ₹{item.total?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Delivery Address */}
        <div className="bg-[#faf9f6] p-6 rounded-2xl border border-neutral-200/60 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            <MapPin className="w-4 h-4 text-neutral-700" />
            <span>Shipping Address</span>
          </div>
          <p className="text-sm font-medium text-neutral-900 pt-1">{order.deliveryAddress?.fullName} ({order.deliveryAddress?.mobile})</p>
          <p className="text-xs text-neutral-600 leading-relaxed font-light">
            {order.deliveryAddress?.addressLine1}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.postalCode}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-100">
          <Link
            to={`/orders/${order._id}`}
            className="flex-1 py-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-widest transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 rounded-xl active:scale-95"
          >
            <Package className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>
          <Link
            to="/products"
            className="flex-1 py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs uppercase tracking-widest transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 rounded-xl active:scale-95"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
