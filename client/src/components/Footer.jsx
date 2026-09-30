import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram, Twitter, Facebook, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Thank you for subscribing to ApexCart drops!');
    setEmail('');
  };

  return (
    <footer className="bg-[#0f0f0f] text-neutral-300 mt-24 border-t border-neutral-800/80 font-sans selection:bg-white selection:text-black">
      {/* Top Brand Statement Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20 border-b border-neutral-800/60">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-amber-300" /> APEXCART ESSENTIALS
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-light text-white tracking-tight">
              APEXCART
            </h2>
            <p className="text-base sm:text-lg text-neutral-300 font-light max-w-xl leading-relaxed">
              "Everything you need. Curated for the way you live."
            </p>
          </div>
          <p className="text-xs text-neutral-400 font-light max-w-xs leading-relaxed border-t sm:border-t-0 sm:border-l border-neutral-800 pt-4 sm:pt-0 pl-0 sm:pl-6">
            Premium minimalist marketplace engineered for modern living. Verified stock & express dispatch.
          </p>
        </div>
      </div>

      {/* Main Grid: Navigation Columns & Newsletter */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-12 sm:gap-10">
          
          {/* Column 1: SHOP */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-[0.2em] border-b border-neutral-800/80 pb-2">
              Shop
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <Link to="/products" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Deals & Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: ACCOUNT */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-[0.2em] border-b border-neutral-800/80 pb-2">
              Account
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <Link to="/profile" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: SUPPORT */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-[0.2em] border-b border-neutral-800/80 pb-2">
              Support
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400 font-light">
              <li>
                <Link to="/my-orders" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition-colors duration-300 inline-block hover:translate-x-0.5 transform">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: NEWSLETTER */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-[0.2em] border-b border-neutral-800/80 pb-2">
              Newsletter
            </h4>
            <div className="space-y-2">
              <h5 className="text-sm font-display font-light text-white tracking-tight">
                STAY IN THE LOOP.
              </h5>
              <p className="text-xs text-neutral-400 font-light leading-relaxed">
                Get product drops, exclusive offers and updates.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="pt-2 space-y-2">
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-24 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 font-light transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-3 py-1.5 bg-white text-black hover:bg-neutral-200 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 uppercase tracking-wider"
                  title="Subscribe"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Social Links Row */}
        <div className="mt-16 pt-8 border-t border-neutral-800/60 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>

          <span className="text-[11px] font-mono text-neutral-400">
            SECURE PAYMENTS BY RAZORPAY
          </span>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-neutral-800/60 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-light gap-4">
          <p>© 2026 ApexCart. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
