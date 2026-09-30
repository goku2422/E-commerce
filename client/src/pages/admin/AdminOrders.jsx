import React, { useState, useEffect } from 'react';
import { ShoppingBag, Edit2, Search, Filter } from 'lucide-react';
import API from '../../services/api';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Status Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadOrders = async () => {
    try {
      let url = '/orders/admin/all?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (search) url += `&search=${search}`;
      const res = await API.get(url);
      setOrders(res.data.data.orders);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, search]);

  const handleOpenStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNote('');
    setShowModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await API.put(`/orders/admin/${selectedOrder._id}/status`, {
        status: newStatus,
        note,
      });
      toast.success(`Order status updated to ${newStatus}`);
      setShowModal(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const statuses = [
    'PLACED',
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'OUT FOR DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED',
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Customer Orders</h1>
          <p className="text-sm text-slate-400 mt-1">Review orders, manage fulfillment timeline, and update status</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search order # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Order Ref #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Count</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Delivery Status</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {orders.map((ord) => (
                <tr key={ord._id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-white">#{ord.orderNumber}</td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{ord.customer?.name || ord.deliveryAddress?.fullName}</p>
                    <p className="text-[10px] text-slate-500">{ord.customer?.email}</p>
                  </td>
                  <td className="p-4">{ord.items.length} items</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.paymentInfo?.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {ord.paymentInfo?.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded font-bold text-[11px] bg-indigo-500/20 text-indigo-300">
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400">₹{ord.totalAmount?.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleOpenStatusModal(ord)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      Manage Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Status Modal */}
      {showModal && selectedOrder && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedOrder(null);
          }}
          title="Update Order Status"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4 text-slate-100">
            {/* Selected Order Summary Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Order Ref #</span>
                <span className="font-bold font-mono text-white">#{selectedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Customer</span>
                <span className="font-semibold text-slate-200">
                  {selectedOrder.customer?.name || selectedOrder.deliveryAddress?.fullName || 'Customer'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Current Status</span>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/20">
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Select New Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                New Fulfillment Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Note / Tracking Info */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Status Note / Tracking Info
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Package packed and dispatched via Bluedart AWB-98213..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                Update Status
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
