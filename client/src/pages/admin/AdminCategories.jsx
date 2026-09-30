import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, FolderTree } from 'lucide-react';
import API from '../../services/api';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    subcategoriesStr: '',
  });

  const loadCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      subcategoriesStr: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      subcategoriesStr: Array.isArray(cat.subcategories)
        ? cat.subcategories.map((s) => s.name).join(', ')
        : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subcats = formData.subcategoriesStr
      ? formData.subcategoriesStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name: formData.name,
      description: formData.description,
      image: formData.image,
      subcategories: subcats,
    };

    try {
      if (editingCategory) {
        await API.put(`/categories/${editingCategory._id}`, payload);
        toast.success('Category updated successfully!');
      } else {
        await API.post('/categories', payload);
        toast.success('Category created successfully!');
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await API.delete(`/categories/${id}`);
      toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Category Management</h1>
          <p className="text-sm text-slate-400 mt-1">Organize catalog into main categories and subcategories</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-32 bg-slate-800 rounded-xl overflow-hidden">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-bold text-lg text-white">{cat.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
              <p className="text-xs text-indigo-400 font-mono">Slug: {cat.slug}</p>
              {cat.subcategories && cat.subcategories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {cat.subcategories.map((sub, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                      {sub.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => handleOpenEditModal(cat)}
                className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                title="Edit Category"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(cat._id)}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subcategories (comma separated)</label>
            <input
              type="text"
              value={formData.subcategoriesStr}
              onChange={(e) => setFormData({ ...formData, subcategoriesStr: e.target.value })}
              placeholder="e.g. Audio, Wearables, Smartphones"
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl">
            {editingCategory ? 'Update Category' : 'Save Category'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
