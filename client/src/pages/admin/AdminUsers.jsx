import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Lock, Unlock } from 'lucide-react';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.data.users);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleBlock = async (id) => {
    try {
      const res = await API.patch(`/admin/users/${id}/toggle-block`);
      toast.success(res.data.message);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle user status');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div>
        <h1 className="text-3xl font-black text-white">Registered Customers</h1>
        <p className="text-sm text-slate-400 mt-1">Manage customer accounts and access controls</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-white">{u.name}</td>
                  <td className="p-4 text-slate-400">{u.email}</td>
                  <td className="p-4 font-mono">{u.mobile}</td>
                  <td className="p-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleBlock(u._id)}
                      className={`px-3 py-1.5 font-bold rounded-lg text-xs flex items-center space-x-1 ml-auto ${
                        u.isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white'
                      }`}
                    >
                      {u.isBlocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 mr-1" /> Unblock Account
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 mr-1" /> Block Account
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
