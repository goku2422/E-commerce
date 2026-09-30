import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, RotateCcw } from 'lucide-react';
import API from '../../services/api';
import ProductCard from '../../components/ProductCard';

export default function ProductCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters state from search params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const inStock = searchParams.get('inStock') === 'true';

  useEffect(() => {
    API.get('/categories').then((res) => setCategories(res.data.data || []));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (category) queryParams.set('category', category);
        if (sort) queryParams.set('sort', sort);
        if (inStock) queryParams.set('inStock', 'true');
        queryParams.set('page', page);
        queryParams.set('limit', 12);

        const res = await API.get(`/products?${queryParams.toString()}`);
        setProducts(res.data.data.products || []);
        setPagination({
          page: res.data.data.page || 1,
          pages: res.data.data.pages || 1,
          total: res.data.data.total || 0,
        });
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [search, category, sort, page, inStock]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-[#faf9f6]">
      {/* Editorial Title Section */}
      <div className="border-b border-zinc-200 pb-8 space-y-3">
        <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Master Index</span>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-zinc-900">
            {category ? category.replace('-', ' ') : search ? `Search: "${search}"` : 'All Products'}
          </h1>
          <span className="text-xs uppercase tracking-widest font-semibold text-zinc-500">
            Showing {pagination.total} item{pagination.total === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Editorial Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => updateFilter('category', '')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              !category ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Lines
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => updateFilter('category', c.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                category === c.slug ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Search */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:border-zinc-900 font-medium"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          {/* Sort Selection */}
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="px-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-full focus:outline-none focus:border-zinc-900 font-bold uppercase tracking-wider text-zinc-700"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical A-Z</option>
          </select>

          {/* Reset Filters */}
          {(category || search || inStock) && (
            <button
              onClick={() => setSearchParams({})}
              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-96 bg-zinc-200/60 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-zinc-200/80 shadow-sm space-y-4">
          <p className="font-display text-xl font-extrabold uppercase tracking-tight text-zinc-900">
            No Catalog Items Match Search Criteria
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category line.
          </p>
          <button
            onClick={() => setSearchParams({})}
            className="px-6 py-3 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-8 border-t border-zinc-200">
          <button
            disabled={page <= 1}
            onClick={() => updateFilter('page', page - 1)}
            className="p-3 rounded-full border border-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-900" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 px-4">
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page >= pagination.pages}
            onClick={() => updateFilter('page', page + 1)}
            className="p-3 rounded-full border border-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-zinc-900" />
          </button>
        </div>
      )}
    </div>
  );
}
