import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Search, Menu, X, Shield, PackageCheck, Heart, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Focus search input on drawer open
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Real-time backend search API search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await API.get(`/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        setSearchResults(res.data.data.products || []);
      } catch (err) {
        console.error('Search API Error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#faf9f6]/90 backdrop-blur-md border-b border-zinc-200/60 transition-all duration-300 animate-fade-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* LEFT: Brand Wordmark */}
            <div className="flex items-center">
              <Link to="/" className="group flex items-center space-x-2">
                <span className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 group-hover:opacity-80 transition-opacity">
                  APEX<span className="font-light tracking-widest text-zinc-400">CART</span>
                </span>
              </Link>
            </div>

            {/* CENTER: Navigation Links (Desktop Editorial) */}
            <nav className="hidden md:flex items-center space-x-10 text-xs uppercase tracking-widest font-semibold text-zinc-600">
              <Link to="/products" className="hover:text-zinc-950 transition-colors py-1 link-underline">
                Shop
              </Link>
              <Link to="/products?category=electronics" className="hover:text-zinc-950 transition-colors py-1 link-underline">
                Electronics
              </Link>
              <Link to="/products?category=fashion-apparel" className="hover:text-zinc-950 transition-colors py-1 link-underline">
                Fashion
              </Link>
              <Link to="/products?category=home-living" className="hover:text-zinc-950 transition-colors py-1 link-underline">
                Home & Living
              </Link>
            </nav>

            {/* RIGHT: Actions (Search, Cart, User) */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Search Toggle Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-zinc-700 hover:text-zinc-950 transition-all duration-200 hover:scale-110 rounded-full hover:bg-zinc-200/50"
                title="Search Catalog"
              >
                <Search className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* Cart Icon with Badge */}
              <Link
                to="/cart"
                className="relative p-2 text-zinc-700 hover:text-zinc-950 transition-all duration-200 hover:scale-110 rounded-full hover:bg-zinc-200/50"
                title="Shopping Bag"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-zinc-950 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-badge-pulse">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-zinc-200/50 transition-all duration-200 hover:scale-105 border border-zinc-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-zinc-900 text-white font-semibold flex items-center justify-center text-xs">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-2 z-50 animate-scale-in"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-3 border-b border-zinc-100">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Signed in as</p>
                        <p className="text-xs font-semibold text-zinc-900 truncate mt-0.5">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2.5 text-xs text-indigo-600 font-bold hover:bg-indigo-50 transition-colors"
                        >
                          <Shield className="w-4 h-4 mr-2" /> Admin Dashboard
                        </Link>
                      )}

                      <Link
                        to="/my-orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4 mr-2 text-zinc-400" /> My Orders
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-2 text-zinc-400" /> Profile & Addresses
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center px-4 py-2.5 text-xs text-red-600 font-medium hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link
                    to="/login"
                    className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:text-zinc-950 px-2 sm:px-3 py-1.5 sm:py-2 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm transition-all hover:scale-105"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-zinc-700 hover:text-zinc-950 focus:outline-none transition-transform duration-200 hover:scale-110"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 px-6 py-6 space-y-4 animate-fade-down">
            <div className="flex flex-col space-y-3 font-display uppercase tracking-widest text-xs font-bold text-zinc-800">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">Home</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">Shop Catalog</Link>
              <Link to="/products?category=electronics" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">Electronics</Link>
              <Link to="/products?category=fashion-apparel" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">Fashion</Link>
              <Link to="/products?category=home-living" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">Home & Living</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">My Orders</Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-zinc-100">Profile & Addresses</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2 text-indigo-600 border-b border-zinc-100">Admin Dashboard</Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="py-2 text-left text-red-600 border-b border-zinc-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="pt-2 flex flex-col space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-zinc-100 text-zinc-900 rounded-xl font-bold"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-zinc-900 text-white rounded-xl font-bold"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* SEARCH OVERLAY DRAWER */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-md flex flex-col justify-start animate-fade-in">
          <div className="bg-white w-full border-b border-zinc-200 px-6 py-8 shadow-2xl animate-fade-down">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest font-bold text-zinc-400">Editorial Search</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, SKUs, styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 text-xl sm:text-2xl font-light border-b-2 border-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-300"
                />
                <Search className="w-6 h-6 text-zinc-400 absolute left-2 top-5" />
                {searching && <Loader2 className="w-5 h-5 text-zinc-400 animate-spin absolute right-4 top-5" />}
              </form>

              {/* Real-time backend search results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 pt-2 animate-fade-up">
                  <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Found {searchResults.length} Products</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {searchResults.map((p) => (
                      <Link
                        key={p._id}
                        to={`/products/${p.slug || p._id}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center space-x-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-900 transition-all hover:-translate-y-0.5 group bg-zinc-50/50"
                      >
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                          alt={p.name}
                          className="w-12 h-12 object-contain bg-white rounded-lg p-1 transition-transform group-hover:scale-105"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-zinc-900 group-hover:text-zinc-600 truncate">{p.name}</h4>
                          <p className="text-xs text-zinc-500 font-semibold mt-0.5">₹{(p.discountPrice || p.price).toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
