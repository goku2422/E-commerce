import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sparkles, ArrowUpRight, ShieldCheck, RefreshCw, Truck } from 'lucide-react';
import API from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroProductIndex, setHeroProductIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get('/products?limit=12'),
          API.get('/categories'),
        ]);
        setProducts(prodRes.data.data.products || []);
        setCategories(catRes.data.data || []);
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeHeroProduct = products[heroProductIndex] || null;

  return (
    <div className="space-y-24 pb-24 bg-[#faf9f6]">
      {/* HERO SECTION — Inspired by Reference Editorial Layout */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 animate-fade-in">
        <div className="relative bg-[#f4f3ef] rounded-3xl p-8 sm:p-12 lg:p-16 border border-zinc-200/80 overflow-hidden shadow-sm">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-zinc-300/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Hero Pill */}
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-6 mb-10 animate-fade-down">
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-bold text-zinc-500">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <span>Season 2026 Editorial Collection</span>
            </div>
            <span className="hidden sm:block text-xs uppercase tracking-widest font-semibold text-zinc-400">
              Limited Edition • Single Vendor
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content (Dynamic Editorial Headline & CTA) */}
            <div className="lg:col-span-6 space-y-6">
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-zinc-900 leading-[1.05] animate-fade-up stagger-1">
                {activeHeroProduct ? activeHeroProduct.name.split(' ')[0] : 'NEXT'}{' '}
                <span className="text-zinc-400 font-light block">GENERATION</span>
              </h1>

              <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-lg font-normal animate-fade-up stagger-2">
                {activeHeroProduct
                  ? activeHeroProduct.description
                  : 'Engineered for distinction. Experience seamless shopping with real-time stock sync and verified instant dispatch.'}
              </p>

              {/* Price & CTA Row */}
              {activeHeroProduct && (
                <div className="flex items-baseline space-x-4 pt-2 animate-fade-up stagger-3 font-mono">
                  <span className="text-3xl font-extrabold text-zinc-900">
                    ₹{(activeHeroProduct.discountPrice || activeHeroProduct.price).toLocaleString()}
                  </span>
                  {activeHeroProduct.discountPrice > 0 && activeHeroProduct.discountPrice < activeHeroProduct.price && (
                    <span className="text-sm text-zinc-400 line-through">₹{activeHeroProduct.price.toLocaleString()}</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-4 animate-fade-up stagger-4">
                {activeHeroProduct && (
                  <button
                    onClick={() => addToCart(activeHeroProduct._id, 1)}
                    className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-3"
                  >
                    <span>Add to Bag</span>
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                )}

                <Link
                  to="/products"
                  className="px-8 py-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-full border border-zinc-300 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <span>View Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Center Visual Focus (Large Product Photo as Visual Hero) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div
                key={activeHeroProduct?._id || 'hero'}
                className="relative w-full max-w-md aspect-square rounded-3xl bg-white p-8 flex items-center justify-center shadow-xl border border-zinc-200/60 group animate-scale-in"
              >
                {activeHeroProduct ? (
                  <img
                    src={activeHeroProduct.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                    alt={activeHeroProduct.name}
                    className="w-full h-full object-contain animate-float transition-all duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 animate-pulse rounded-2xl" />
                )}

                <Link
                  to={activeHeroProduct ? `/products/${activeHeroProduct.slug || activeHeroProduct._id}` : '/products'}
                  className="absolute bottom-4 right-4 p-3 bg-zinc-900 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                  title="View Details"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Dynamic Product Selector Thumbnails */}
              {products.length > 0 && (
                <div className="mt-8 flex items-center space-x-3 overflow-x-auto max-w-full pb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mr-2 hidden sm:inline">
                    Select Item:
                  </span>
                  {products.slice(0, 4).map((item, idx) => (
                    <button
                      key={item._id}
                      onClick={() => setHeroProductIndex(idx)}
                      className={`w-16 h-16 rounded-2xl bg-white p-2 border transition-all duration-300 flex items-center justify-center ${
                        heroProductIndex === idx
                          ? 'border-zinc-900 ring-2 ring-zinc-900/10 shadow-md scale-105'
                          : 'border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      title={item.name}
                    >
                      <img
                        src={item.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL CATEGORY NAVIGATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 border-b border-zinc-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Lines & Collections</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-900 mt-1">
              Curated Categories
            </h2>
          </div>
          <Link to="/products" className="text-xs uppercase tracking-widest font-bold text-zinc-900 hover:underline flex items-center group">
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat.slug}`}
              className={`group relative h-80 rounded-3xl overflow-hidden bg-zinc-900 shadow-sm border border-zinc-200/80 animate-fade-up stagger-${(idx % 4) + 1}`}
            >
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600'}
                alt={cat.name}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Category Line</span>
                <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                  {cat.name}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TRENDING PRODUCTS / FEATURED INVENTORY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 border-b border-zinc-200 pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Live Inventory</span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-900 mt-1">
              Trending Products
            </h2>
          </div>
          <Link to="/products" className="text-xs uppercase tracking-widest font-bold text-zinc-900 hover:underline flex items-center group">
            <span>Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 bg-zinc-200/60 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product, idx) => (
              <div key={product._id} className={`animate-fade-up stagger-${(idx % 4) + 1}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BRAND STATEMENT & FEATURES BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-up">
        <div className="bg-zinc-900 text-white rounded-3xl p-10 sm:p-16 border border-zinc-800 space-y-12">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">ApexCart Ethos</span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight leading-tight">
              ENGINEERED PRECISION. UNCOMPROMISED ESTHETICS.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-light">
              Every item is dynamically synchronized with our backend database to ensure transparent stock availability and instant Razorpay payment verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-6 border-t border-zinc-800">
            <div className="space-y-2">
              <Truck className="w-6 h-6 text-white" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Express Dispatch</h4>
              <p className="text-xs text-zinc-400 font-light">Guaranteed nationwide delivery with real-time tracking updates.</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="w-6 h-6 text-white" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Encrypted Payments</h4>
              <p className="text-xs text-zinc-400 font-light">Server-side verified HMAC SHA256 payment verification via Razorpay.</p>
            </div>
            <div className="space-y-2">
              <RefreshCw className="w-6 h-6 text-white" />
              <h4 className="font-bold text-sm uppercase tracking-wider">Automated Refunds</h4>
              <p className="text-xs text-zinc-400 font-light">Idempotent stock restoration & prompt refund processing on cancellation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
