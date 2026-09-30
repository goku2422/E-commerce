import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, AlertCircle, Minus, Plus, Check, ArrowLeft, Heart } from 'lucide-react';
import API from '../../services/api';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/products/${identifier}`);
        const p = res.data.data;
        setProduct(p);
        setSelectedImage(p.images && p.images[0] ? p.images[0] : '');
      } catch (err) {
        setError('Product not found or unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [identifier]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse space-y-8">
        <div className="h-[600px] bg-zinc-200/60 rounded-3xl" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto text-center py-32 space-y-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-zinc-900">Item Unavailable</h2>
        <p className="text-zinc-500 text-xs">{error}</p>
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-3 bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest rounded-full"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const isOutOfStock = product.stock <= 0;
  const maxQty = product.stock;

  const handleAddToCart = async () => {
    await addToCart(product._id, quantity);
  };

  const handleBuyNow = async () => {
    const success = await addToCart(product._id, quantity);
    if (success) {
      navigate('/cart');
    }
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? 'Saved to Wishlist' : 'Removed from Wishlist');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#faf9f6]">
      {/* Back Link */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square bg-[#f4f3ef] rounded-3xl overflow-hidden border border-zinc-200/80 p-8 flex items-center justify-center group">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
            />
            <button
              onClick={toggleWishlist}
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full text-zinc-700 hover:text-red-500 shadow-sm transition-colors"
              title="Toggle Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto py-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all p-2 bg-[#f4f3ef] ${
                    selectedImage === img ? 'border-zinc-900 ring-2 ring-zinc-900/10' : 'border-zinc-200/80 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Purchase Actions */}
        <div className="lg:col-span-5 space-y-8 bg-white p-5 sm:p-8 lg:p-10 rounded-3xl border border-zinc-200/80 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
              <span>{product.category?.name || 'Collection'}</span>
              <span>SKU: {product.SKU}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-zinc-900 leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 pb-6 border-b border-zinc-100">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-extrabold text-zinc-900">₹{product.discountPrice.toLocaleString()}</span>
                <span className="text-lg text-zinc-400 line-through font-normal">₹{product.price.toLocaleString()}</span>
                <span className="bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Save ₹{(product.price - product.discountPrice).toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-3xl font-extrabold text-zinc-900">₹{product.price.toLocaleString()}</span>
            )}
          </div>

          {/* Stock & Quantity Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-zinc-500">Status</span>
              {isOutOfStock ? (
                <span className="text-red-600 flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Out of Stock
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> In Stock ({product.stock} available)
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Quantity</span>
                <div className="flex items-center border border-zinc-200 rounded-full bg-zinc-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-zinc-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    className="p-3 text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
                    disabled={quantity >= maxQty}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Bag</span>
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-4 bg-white hover:bg-zinc-100 disabled:bg-zinc-100 border border-zinc-300 text-zinc-900 font-bold text-xs uppercase tracking-widest rounded-full transition-all"
            >
              Buy Now
            </button>
          </div>

          {/* Description */}
          <div className="pt-6 border-t border-zinc-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900">Details & Specifications</h3>
            <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-100 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-zinc-900" />
              <span>Free Delivery &gt; ₹999</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-zinc-900" />
              <span>100% Authentic Item</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
