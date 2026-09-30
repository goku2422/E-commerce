import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Check, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? 'Saved to Wishlist' : 'Removed from Wishlist');
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative bg-white border border-zinc-200/60 rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl hover:border-zinc-300 transition-all duration-300 hover:-translate-y-1">
      {/* Top Image Box */}
      <div>
        <div className="relative aspect-square w-full rounded-2xl bg-[#f4f3ef] overflow-hidden flex items-center justify-center p-6 group">
          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute top-3 left-3 z-10 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          )}

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              Sold Out
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur-md rounded-full text-zinc-700 hover:text-red-500 shadow-sm transition-all duration-200 hover:scale-110 active:scale-95"
            title="Toggle Wishlist"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
          </button>

          {/* Main Product Image */}
          <Link to={`/products/${product.slug || product._id}`} className="w-full h-full flex items-center justify-center">
            <img
              src={product.images && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </Link>
        </div>

        {/* Info Content */}
        <div className="pt-5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            <span>{product.category?.name || 'Collection'}</span>
            {isLowStock && <span className="text-amber-600 font-semibold">{product.stock} left</span>}
          </div>

          <Link to={`/products/${product.slug || product._id}`}>
            <h3 className="font-semibold text-sm sm:text-base text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Bottom Pricing & Action */}
      <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between">
        <div>
          {hasDiscount ? (
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-base font-extrabold text-zinc-900">₹{product.discountPrice.toLocaleString()}</span>
              <span className="text-xs text-zinc-400 line-through">₹{product.price.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-base font-extrabold text-zinc-900 font-mono">₹{product.price.toLocaleString()}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all duration-200 active:scale-95 ${
            addedSuccess
              ? 'bg-emerald-600 text-white shadow-md'
              : isOutOfStock
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-md hover:scale-105'
          }`}
        >
          {adding ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Adding</span>
            </>
          ) : addedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added ✓</span>
            </>
          ) : (
            <>
              <span>Add</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
