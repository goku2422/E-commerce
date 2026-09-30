import React, { useState, useEffect } from 'react';
import { Truck, Save } from 'lucide-react';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDeliveryConfig() {
  const [formData, setFormData] = useState({
    minAmountForFreeDelivery: 999,
    defaultDeliveryFee: 50,
    expressDeliveryFee: 100,
    estimatedDays: '3-5 Business Days',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/admin/delivery-config')
      .then((res) => {
        if (res.data.data) {
          setFormData({
            minAmountForFreeDelivery: res.data.data.minAmountForFreeDelivery,
            defaultDeliveryFee: res.data.data.defaultDeliveryFee,
            expressDeliveryFee: res.data.data.expressDeliveryFee || 100,
            estimatedDays: res.data.data.estimatedDays || '3-5 Business Days',
          });
        }
      })
      .catch((err) => toast.error('Failed to load delivery config'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/admin/delivery-config', formData);
      toast.success(res.data.message || 'Delivery rules updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update delivery rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100 animate-pulse">
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div>
        <h1 className="text-3xl font-black text-white">Delivery Charges Management</h1>
        <p className="text-sm text-slate-400 mt-1">Configure threshold for free shipping, standard shipping rates, and delivery estimates</p>
      </div>

      <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 text-indigo-400 border-b border-slate-800 pb-4">
          <Truck className="w-6 h-6" />
          <h3 className="text-lg font-bold text-white">Shipping Rates & Thresholds</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Minimum Order Value for Free Delivery (₹)</label>
            <input
              type="number"
              required
              min={0}
              value={formData.minAmountForFreeDelivery}
              onChange={(e) => setFormData({ ...formData, minAmountForFreeDelivery: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-semibold text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">Orders with subtotal $\ge$ this amount will get FREE shipping.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Standard Shipping Fee (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={formData.defaultDeliveryFee}
                onChange={(e) => setFormData({ ...formData, defaultDeliveryFee: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-semibold text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Express Delivery Fee (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.expressDeliveryFee}
                onChange={(e) => setFormData({ ...formData, expressDeliveryFee: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-semibold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Estimated Delivery Days Banner</label>
            <input
              type="text"
              required
              value={formData.estimatedDays}
              onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 mt-6"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Update Delivery Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
