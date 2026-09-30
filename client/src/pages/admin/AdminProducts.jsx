import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, Check, X } from 'lucide-react';
import API from '../../services/api';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    SKU: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    subcategory: '',
    images: '',
    description: '',
    isEnabled: true,
  });

  const loadProducts = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get('/admin/products?limit=50'),
        API.get('/categories'),
      ]);
      setProducts(prodRes.data.data.products);
      setCategories(catRes.data.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      SKU: 'APX-' + Math.floor(100 + Math.random() * 900),
      price: '',
      discountPrice: '',
      stock: '10',
      category: categories[0]?._id || '',
      subcategory: '',
      images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      description: '',
      isEnabled: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      SKU: product.SKU,
      price: product.price,
      discountPrice: product.discountPrice || '',
      stock: product.stock,
      category: product.category?._id || product.category,
      subcategory: product.subcategory || '',
      images: Array.isArray(product.images) ? product.images.join(', ') : product.images,
      description: product.description,
      isEnabled: product.isEnabled,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: Number(formData.price),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
      stock: Number(formData.stock),
      images: typeof formData.images === 'string' ? formData.images.split(',').map((s) => s.trim()) : formData.images,
    };

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct._id}`, payload);
        toast.success('Product updated!');
      } else {
        await API.post('/products', payload);
        toast.success('Product created!');
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await API.patch(`/products/${id}/toggle-status`);
      toast.success(res.data.message);
      loadProducts();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.SKU.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Product Inventory</h1>
          <p className="text-sm text-slate-400 mt-1">Manage product catalog, prices, stock levels, and SKUs</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
      </div>

      {/* Products Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="hover:bg-slate-800/50">
                  <td className="p-4 flex items-center space-x-3">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt=""
                      className="w-10 h-10 object-cover rounded-lg bg-slate-800"
                    />
                    <span className="font-semibold text-white line-clamp-1">{p.name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-400">{p.SKU}</td>
                  <td className="p-4">{p.category?.name || 'General'}</td>
                  <td className="p-4">
                    <span className="font-bold text-white">₹{p.price}</span>
                    {p.discountPrice > 0 && (
                      <span className="text-[10px] text-emerald-400 block font-semibold">₹{p.discountPrice} sale</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 font-bold rounded-md ${
                        p.stock <= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(p._id)}
                      className={`px-2.5 py-1 font-bold rounded-md flex items-center space-x-1 ${
                        p.isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{p.isEnabled ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      title="Delete"
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                required
                value={formData.SKU}
                onChange={(e) => setFormData({ ...formData, SKU: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm border rounded-xl uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                min={0}
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Regular Price (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Price (₹)</label>
              <input
                type="number"
                min={0}
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subcategory</label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                placeholder="e.g. Audio, Wearables"
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Image URLs (comma separated)</label>
            <input
              type="text"
              required
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isEnabled"
              checked={formData.isEnabled}
              onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <label htmlFor="isEnabled" className="text-xs font-semibold text-gray-700">
              Enable Product on Storefront
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl mt-4"
          >
            {editingProduct ? 'Update Product' : 'Save Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
