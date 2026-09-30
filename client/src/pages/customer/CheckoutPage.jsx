import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, CheckCircle, ShieldCheck, Loader2, CreditCard, Truck, AlertTriangle, ArrowRight } from 'lucide-react';
import API from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { cartSummary, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  // Add address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'Home',
  });

  // Fetch addresses
  const loadAddresses = async () => {
    try {
      const res = await API.get('/addresses');
      const list = res.data.data || [];
      setAddresses(list);
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }
    } catch (err) {
      toast.error('Failed to load saved addresses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch verified order summary from backend
  const fetchOrderSummary = async (addressId = selectedAddressId) => {
    try {
      const res = await API.post('/checkout/summary', {
        addressId: addressId || null,
        couponCode: cartSummary.couponApplied?.code,
      });
      setSummaryData(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error loading order summary');
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    fetchOrderSummary(selectedAddressId);
  }, [selectedAddressId, cartSummary.couponApplied]);

  // Handle creating a new address
  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/addresses', newAddress);
      toast.success('Address saved successfully!');
      setShowAddressModal(false);
      const createdAddr = res.data.data;
      setAddresses((prev) => [...prev, createdAddr]);
      setSelectedAddressId(createdAddr._id);
      await fetchOrderSummary(createdAddr._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    }
  };

  // Execute payment verification call
  const executePaymentVerification = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
    try {
      const res = await API.post('/payments/verify', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId,
      });

      if (res.data.success) {
        toast.success('Payment Verified & Order Placed Successfully!');
        fetchCart();
        navigate(`/order-confirmation/${orderId}`);
      } else {
        const errorMsg = res.data.message || 'Payment Verification Failed';
        setPaymentError(errorMsg);
        toast.error(errorMsg);
        setProcessingPayment(false);
      }
    } catch (verifyErr) {
      const errorMsg = verifyErr.response?.data?.message || 'Payment verification API failed';
      console.error('Payment Verification Exception:', verifyErr);
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      setProcessingPayment(false);
    }
  };

  // Trigger Razorpay Payment Integration
  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      toast.error('Please select or add a delivery address');
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // 1. Create order on backend
      const res = await API.post('/payments/create-order', {
        addressId: selectedAddressId,
        couponCode: cartSummary.couponApplied?.code,
      });

      const { orderId, razorpayOrderId, amountInPaise, key_id, customer } = res.data.data;

      if (!window.Razorpay) {
        const errorMsg = 'Razorpay Checkout SDK failed to load in browser.';
        setPaymentError(errorMsg);
        toast.error(errorMsg);
        setProcessingPayment(false);
        return;
      }

      // 2. Open Razorpay Checkout modal
      const options = {
        key: key_id,
        amount: amountInPaise,
        currency: 'INR',
        name: 'ApexCart Store',
        description: `Order Payment #${res.data.data.orderNumber}`,
        order_id: razorpayOrderId,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.mobile,
        },
        theme: {
          color: '#09090b',
        },
        handler: async function (response) {
          // Safe debug logging (Step 3: no secrets/passwords printed)
          console.log('[DEBUG] Razorpay Payment Success Callback:', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            hasSignature: Boolean(response.razorpay_signature),
          });

          await executePaymentVerification({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });
        },
        modal: {
          ondismiss: function () {
            setPaymentError('Payment modal was closed by user.');
            toast.error('Payment cancelled');
            setProcessingPayment(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('[ERROR] Razorpay Payment Failed Event:', response.error);
        const errorMsg = response.error?.description || 'Razorpay payment processing failed.';
        setPaymentError(errorMsg);
        toast.error(`Payment Failed: ${errorMsg}`);
        setProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Payment initialization failed';
      console.error('Payment Create Order Error:', err);
      setPaymentError(errorMsg);
      toast.error(errorMsg);
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-900 mx-auto" />
      </div>
    );
  }

  // Calculate current effective delivery fee and final total safely
  const effectiveDeliveryFee =
    shippingMethod === 'express'
      ? summaryData?.expressDeliveryFee || 100
      : summaryData?.deliveryFee || 0;

  const currentSubtotal = summaryData?.subtotal || cartSummary.subtotal || 0;
  const currentDiscount = summaryData?.discount || cartSummary.discount || 0;
  const currentFinalTotal = Math.max(0, currentSubtotal - currentDiscount + effectiveDeliveryFee);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#faf9f6]">
      {/* Editorial Header */}
      <div className="border-b border-zinc-200 pb-6">
        <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Checkout Dispatch</span>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-zinc-900 mt-1">
          Finalize Order
        </h1>
      </div>

      {/* Progress Indicator Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        <div className={`p-3 rounded-2xl border ${selectedAddressId ? 'border-zinc-900 text-zinc-900 bg-white' : 'border-zinc-200 bg-zinc-50'}`}>
          01 Address
        </div>
        <div className={`p-3 rounded-2xl border ${selectedAddressId ? 'border-zinc-900 text-zinc-900 bg-white' : 'border-zinc-200 bg-zinc-50'}`}>
          02 Delivery
        </div>
        <div className={`p-3 rounded-2xl border ${processingPayment ? 'border-zinc-900 text-zinc-900 bg-white' : 'border-zinc-200 bg-zinc-50'}`}>
          03 Payment
        </div>
        <div className="p-3 rounded-2xl border border-zinc-200 bg-zinc-50">
          04 Confirmation
        </div>
      </div>

      {/* Payment Failure Error Box */}
      {paymentError && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start space-x-4 text-red-900">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-wider">Payment Failure Notice</h4>
            <p>{paymentError}</p>
            <p className="text-red-700 font-semibold pt-1">
              Your cart items and delivery address remain saved. You can click "Retry Payment" below to try paying again.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Section: Address & Delivery Selection */}
        <div className="lg:col-span-7 space-y-8">
          {/* Address Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-zinc-400" /> Delivery Address
              </h3>
              <button
                onClick={() => setShowAddressModal(true)}
                className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-zinc-900 hover:underline"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-3">
                <p className="text-xs text-zinc-500">No delivery address saved yet.</p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-6 py-3 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-full"
                >
                  Add Address Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-50 shadow-sm'
                          : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-zinc-900 text-xs">{addr.fullName}</span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-zinc-900" />}
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">{addr.addressLine1} {addr.addressLine2}</p>
                      <p className="text-[11px] text-zinc-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                      <p className="text-[10px] text-zinc-400 mt-2 font-semibold uppercase tracking-wider">Mobile: {addr.mobile}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping Method Options */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-zinc-400" /> Dispatch Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Standard Shipping */}
              <div
                onClick={() => setShippingMethod('standard')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  shippingMethod === 'standard'
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider text-zinc-900">Standard Shipping</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">3 - 5 Business Days</p>
                </div>
                <span className="font-bold text-xs text-emerald-700 uppercase">
                  {summaryData?.deliveryFee === 0 ? 'FREE' : `₹${summaryData?.deliveryFee || 50}`}
                </span>
              </div>

              {/* Express Shipping */}
              <div
                onClick={() => setShippingMethod('express')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  shippingMethod === 'express'
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-zinc-200/80 hover:border-zinc-300 bg-white'
                }`}
              >
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider text-zinc-900">Express Delivery</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">1 - 2 Business Days</p>
                </div>
                <span className="font-bold text-xs text-zinc-900">
                  ₹{summaryData?.expressDeliveryFee || 100}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Order Summary & Razorpay Payment Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-display text-xl font-extrabold uppercase tracking-tight text-zinc-900 border-b border-zinc-100 pb-4">
              Order Breakdown
            </h3>

            {/* Item List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {(summaryData?.items || cartSummary.items).map((item) => (
                <div key={item.product._id} className="flex items-center justify-between text-xs text-zinc-700">
                  <span className="line-clamp-1 flex-1 font-semibold">{item.product.name} × {item.quantity}</span>
                  <span className="font-extrabold text-zinc-900 shrink-0 ml-2">
                    ₹{((item.product.effectivePrice || item.product.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-zinc-100 space-y-2 text-xs uppercase tracking-wider font-semibold text-zinc-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-extrabold text-zinc-900">₹{currentSubtotal.toLocaleString()}</span>
              </div>
              {currentDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount</span>
                  <span className="font-extrabold">- ₹{currentDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-extrabold text-zinc-900">
                  {effectiveDeliveryFee === 0 ? 'FREE' : `₹${effectiveDeliveryFee}`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-between items-baseline">
              <span className="text-xs uppercase tracking-widest font-extrabold text-zinc-900">Final Payable</span>
              <span className="font-display text-3xl font-extrabold text-zinc-900">₹{currentFinalTotal.toLocaleString()}</span>
            </div>

            {/* Razorpay Payment Button */}
            <button
              onClick={handleProceedToPayment}
              disabled={processingPayment || !selectedAddressId || cartSummary.items.length === 0}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : !selectedAddressId ? (
                <span>Select Address to Proceed</span>
              ) : paymentError ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Retry Payment — ₹{currentFinalTotal.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay with Razorpay — ₹{currentFinalTotal.toLocaleString()}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-2 text-[10px] text-zinc-400 uppercase tracking-widest pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
              <span>Razorpay 256-Bit SSL Encrypted Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Add Delivery Address">
        <form onSubmit={handleCreateAddress} className="space-y-4 text-zinc-900">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newAddress.fullName}
                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                placeholder="Jane Doe"
                className="w-full px-4 py-2.5 text-xs bg-zinc-50 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={newAddress.mobile}
                onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 text-xs bg-zinc-50 border rounded-2xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Address Line 1</label>
            <input
              type="text"
              required
              value={newAddress.addressLine1}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              placeholder="House/Flat No, Street Name"
              className="w-full px-4 py-2.5 text-xs bg-zinc-50 border rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">City</label>
              <input
                type="text"
                required
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-zinc-50 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">State</label>
              <input
                type="text"
                required
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-zinc-50 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Pincode</label>
              <input
                type="text"
                required
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="w-full px-3 py-2.5 text-xs bg-zinc-50 border rounded-2xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-full mt-4"
          >
            Save Address & Select
          </button>
        </form>
      </Modal>
    </div>
  );
}
