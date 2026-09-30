import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Power } from 'lucide-react';
import API from '../../services/api';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '500',
    maxDiscount: '200',
    expiryDate: '2030-12-31',
    usageLimit: '100',
    isActive: true,
  });

  const loadCoupons = async () => {
    try {
      const res = await API.get('/coupons');
      setCoupons(res.data.data);
    } catch (err) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await API.post('/coupons', formData);
      toast.success('Coupon created successfully!');
      setShowModal(false);
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await API.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Coupons & Promo Codes</h1>
          <p className="text-sm text-slate-400 mt-1">Manage promotional discounts, minimum order thresholds, and expiry</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Code</th>
                <th className="p-4">Type & Value</th>
                <th className="p-4">Min Order</th>
                <th className="p-4">Max Discount</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Used / Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-mono font-bold text-white tracking-wider uppercase">{c.code}</td>
                  <td className="p-4 font-semibold text-emerald-400">
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                  </td>
                  <td className="p-4">₹{c.minOrderValue}</td>
                  <td className="p-4">{c.maxDiscount ? `₹${c.maxDiscount}` : 'No cap'}</td>
                  <td className="p-4 font-mono">{new Date(c.expiryDate).toLocaleDateString()}</td>
                  <td className="p-4 font-semibold">{c.usedCount} / {c.usageLimit}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.isActive && new Date() < new Date(c.expiryDate)
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {new Date() > new Date(c.expiryDate) ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(c._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Coupon">
        <form onSubmit={handleCreateCoupon} className="space-y-4 text-gray-900">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Coupon Code (Uppercase)</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. SALE20"
              className="w-full px-3 py-2 text-sm border rounded-xl uppercase font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Value</label>
              <input
                type="number"
                required
                min={1}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order Value (₹)</label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Discount Cap (₹)</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Total Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl">
            Save Coupon Code
          </button>
        </form>
      </Modal>
    </div>
  );
}
