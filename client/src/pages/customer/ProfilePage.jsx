import React, { useState, useEffect } from 'react';
import { User, Lock, MapPin, Plus, Trash2, CheckCircle, Save, ArrowRight } from 'lucide-react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfileState } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [addresses, setAddresses] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

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

  const loadAddresses = async () => {
    try {
      const res = await API.get('/addresses');
      setAddresses(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await API.put('/auth/profile', {
        name: profileData.name,
        mobile: profileData.mobile,
      });
      updateProfileState(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPass(true);
    try {
      await API.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      await API.post('/addresses', newAddress);
      toast.success('Address added!');
      setShowAddressModal(false);
      loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await API.delete(`/addresses/${id}`);
      toast.success('Address removed');
      loadAddresses();
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await API.patch(`/addresses/${id}/default`);
      toast.success('Default address updated');
      loadAddresses();
    } catch (err) {
      toast.error('Failed to set default address');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="text-4xl sm:text-5xl font-display font-light text-neutral-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-neutral-400 font-mono uppercase tracking-widest mt-2">
          Personal Information, Security & Addresses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center border-b border-neutral-100 pb-4">
            <User className="w-4 h-4 mr-2 text-neutral-700" /> Personal Details
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full px-4 py-3 text-sm bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <input
                type="text"
                required
                value={profileData.mobile}
                onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 pt-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center border-b border-neutral-100 pb-4">
            <Lock className="w-4 h-4 mr-2 text-neutral-700" /> Security & Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Address Book Management Section */}
      <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-neutral-700" /> Saved Delivery Addresses
          </h3>
          <button
            onClick={() => setShowAddressModal(true)}
            className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-5 py-3 rounded-xl transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <p className="text-sm text-neutral-500 font-light py-4">No saved delivery addresses found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <div key={addr._id} className="p-6 rounded-2xl border border-neutral-200/80 space-y-3 relative bg-[#faf9f6]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-neutral-900">{addr.fullName}</span>
                  {addr.isDefault ? (
                    <span className="text-[9px] font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultAddress(addr._id)}
                      className="text-[11px] text-neutral-500 hover:text-black font-semibold uppercase tracking-wider underline"
                    >
                      Make Default
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-600 font-light">{addr.addressLine1} {addr.addressLine2}</p>
                <p className="text-xs text-neutral-600 font-light">{addr.city}, {addr.state} - {addr.postalCode}</p>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-200/60">
                  <span className="text-xs text-neutral-500 font-mono">Mobile: {addr.mobile}</span>
                  <button
                    onClick={() => handleDeleteAddress(addr._id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Delete Address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for adding address */}
      <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Add Delivery Address">
        <form onSubmit={handleCreateAddress} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newAddress.fullName}
                onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={newAddress.mobile}
                onChange={(e) => setNewAddress({ ...newAddress, mobile: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Address Line 1</label>
            <input
              type="text"
              required
              value={newAddress.addressLine1}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">City</label>
              <input
                type="text"
                required
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">State</label>
              <input
                type="text"
                required
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">Pincode</label>
              <input
                type="text"
                required
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-widest rounded-xl mt-4 transition-all"
          >
            Save Address
          </button>
        </form>
      </Modal>
    </div>
  );
}
