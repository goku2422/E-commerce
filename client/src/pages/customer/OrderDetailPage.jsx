import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, AlertCircle, ArrowLeft, XCircle } from 'lucide-react';
import API from '../../services/api';
import OrderTracker from '../../components/OrderTracker';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to load order details';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await API.put(`/orders/${id}/cancel`, { reason: cancelReason });
      toast.success('Order cancelled successfully!');
      setOrder(res.data.data);
      setShowCancelModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 animate-pulse space-y-6">
        <div className="h-64 bg-stone-200/60 rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-24 px-6">
        <h2 className="text-2xl font-display font-light text-neutral-900">Order details not available</h2>
        <button
          onClick={() => navigate('/my-orders')}
          className="mt-6 px-8 py-4 bg-neutral-900 text-white font-semibold text-xs uppercase tracking-widest transition-all rounded-xl"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const canCancel = ['PLACED', 'CONFIRMED', 'PACKED'].includes(order.status);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 space-y-10">
      {/* Back button */}
      <button
        onClick={() => navigate('/my-orders')}
        className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Orders
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-display font-light text-neutral-900">
            Order <span className="font-mono font-bold">#{order.orderNumber}</span>
          </h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs uppercase tracking-widest rounded-xl border border-rose-200/60 transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Interactive Visual Order Tracker Timeline */}
      <OrderTracker status={order.status} statusHistory={order.statusHistory} />

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm space-y-6">
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
                    <h4 className="font-semibold text-neutral-900 text-sm line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">SKU: {item.SKU}</p>
                    <p className="text-xs text-neutral-500 font-light mt-1">
                      Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-neutral-900 text-sm font-mono">
                  ₹{item.total?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 pt-6 space-y-3 text-xs text-neutral-600 font-light">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-neutral-900">₹{order.subtotal?.toLocaleString()}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied</span>
                <span className="font-mono font-semibold">- ₹{order.discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono font-semibold text-neutral-900">₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between font-semibold text-neutral-900 text-base border-t border-neutral-100 pt-4">
              <span>Total Amount</span>
              <span className="font-mono font-bold">₹{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Address & Payment Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-neutral-700" /> Delivery Address
            </h3>
            <div className="text-xs text-neutral-600 space-y-1 font-light pt-2">
              <p className="font-semibold text-neutral-900 text-sm">{order.deliveryAddress?.fullName}</p>
              <p>{order.deliveryAddress?.addressLine1} {order.deliveryAddress?.addressLine2}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.postalCode}</p>
              <p className="pt-2 font-mono font-semibold text-neutral-800">Mobile: {order.deliveryAddress?.mobile}</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-neutral-700" /> Payment Info
            </h3>
            <div className="text-xs text-neutral-600 space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <span>Method</span>
                <span className="font-semibold text-neutral-900">{order.paymentInfo?.method || 'Razorpay'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {order.paymentInfo?.status}
                </span>
              </div>
              {order.paymentInfo?.razorpayPaymentId && (
                <p className="text-[10px] font-mono text-neutral-400 break-all pt-1">
                  ID: {order.paymentInfo.razorpayPaymentId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl border border-neutral-200">
            <h3 className="text-lg font-display font-light text-rose-700 flex items-center">
              <XCircle className="w-5 h-5 mr-2 shrink-0" /> Cancel Order #{order.orderNumber}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-light">
              Are you sure you want to cancel this order? Stock will be immediately restored to inventory.
            </p>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Cancellation Reason</label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full p-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
