import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Tag, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cartSummary, updateQuantity, removeFromCart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const res = await API.post('/coupons/validate', { code: couponCode.trim() });
      toast.success(res.data.message || 'Coupon applied successfully!');
      fetchCart(couponCode.trim());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    fetchCart(null);
    toast.success('Coupon removed');
  };

  const handleAnimatedRemove = (productId) => {
    setRemovingId(productId);
    setTimeout(() => {
      removeFromCart(productId);
      setRemovingId(null);
    }, 280);
  };

  if (cartSummary.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center space-y-6 bg-[#faf9f6] animate-fade-in">
        <div className="w-16 h-16 bg-zinc-200/60 text-zinc-900 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-zinc-900">Your Bag is Empty</h2>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            Discover our curated lines and add items to your shopping bag.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all hover:scale-105"
        >
          <span>Discover Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#faf9f6] animate-fade-in">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Shopping Selection</span>
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-zinc-900 mt-1">
            Shopping Bag ({cartSummary.items.length})
          </h1>
        </div>
        <Link
          to="/products"
          className="hidden sm:flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Items List */}
        <div className="lg:col-span-7 space-y-4">
          {cartSummary.items.map((item, idx) => (
            <div
              key={item.product._id}
              className={`bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-all duration-300 ${
                removingId === item.product._id ? 'animate-slide-out' : `animate-fade-up stagger-${(idx % 4) + 1}`
              }`}
            >
              <div className="flex items-center space-x-5 flex-1 min-w-0">
                <div className="w-20 h-20 bg-[#f4f3ef] rounded-2xl p-2 shrink-0 flex items-center justify-center">
                  <img
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                    alt={item.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Link
                    to={`/products/${item.product.slug || item.product._id}`}
                    className="font-bold text-sm text-zinc-900 hover:text-zinc-600 truncate block"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400">SKU: {item.product.SKU}</p>
                  <p className="text-xs font-extrabold text-zinc-900 pt-1 font-mono">
                    ₹{item.product.effectivePrice?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex items-center justify-between w-full sm:w-auto space-x-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <div className="flex items-center border border-zinc-200 rounded-full bg-zinc-50">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="p-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 transition-transform active:scale-90"
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-zinc-900 font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="p-2.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 transition-transform active:scale-90"
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="text-sm font-extrabold text-zinc-900 font-mono">
                    ₹{item.itemTotal?.toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => handleAnimatedRemove(item.product._id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all hover:scale-110 active:scale-90"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon Box */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 flex items-center">
              <Tag className="w-4 h-4 mr-2 text-zinc-400" /> Coupon & Promo Code
            </h3>

            {cartSummary.couponApplied ? (
              <div className="flex items-center justify-between bg-zinc-900 text-white px-4 py-3 rounded-2xl">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">{cartSummary.couponApplied.code}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">Discount: ₹{cartSummary.couponApplied.discountAmount}</p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-red-400 hover:underline font-bold uppercase"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="CODE (e.g. WELCOME10)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 text-xs uppercase bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:border-zinc-900 font-bold tracking-wider"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
            <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-zinc-900 border-b border-zinc-100 pb-4">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs uppercase tracking-wider font-semibold text-zinc-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-extrabold text-zinc-900 font-mono">₹{cartSummary.subtotal?.toLocaleString()}</span>
              </div>

              {cartSummary.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-mono">
                  <span>Discount Savings</span>
                  <span className="font-extrabold">- ₹{cartSummary.discount?.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-extrabold text-zinc-900 font-mono">
                  {cartSummary.deliveryFee === 0 ? (
                    <span className="text-emerald-700 uppercase font-extrabold">FREE</span>
                  ) : (
                    `₹${cartSummary.deliveryFee}`
                  )}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-widest font-extrabold text-zinc-900">Total Payable</span>
              <span className="font-display text-3xl font-extrabold text-zinc-900 font-mono">₹{cartSummary.totalPayable?.toLocaleString()}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2 active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
