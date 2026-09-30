import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      // Toast error handled in AuthContext
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden border border-neutral-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2">
        {/* Left Visual Editorial Hero */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-neutral-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black opacity-90 -z-0" />
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">APEXCART ESSENTIALS</span>
            <h2 className="text-3xl font-display font-light leading-tight tracking-tight">
              Curated Luxury <br />& Minimalist Design.
            </h2>
          </div>
          <div className="relative z-10 pt-16 space-y-4">
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Sign in to manage your orders, saved address book, and exclusive member recommendations.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Session encrypted & protected</span>
            </div>
          </div>
        </div>

        {/* Right Auth Form */}
        <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-display font-light text-neutral-900">Welcome Back</h2>
            <p className="text-xs text-neutral-400 font-light">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@apexcart.com"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-light"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-neutral-500 hover:text-black font-semibold uppercase tracking-wider underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-light"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700 focus:outline-none"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-neutral-900 hover:bg-black text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2 pt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 bg-[#faf9f6] rounded-xl border border-neutral-200/60 text-[11px] text-neutral-500 font-mono space-y-1 break-words">
            <p className="font-semibold text-neutral-800">Quick Credentials:</p>
            <p className="break-all">Customer: customer@apexcart.com / Customer@123456</p>
            <p className="break-all">Admin: admin@apexcart.com / Admin@123456</p>
          </div>

          <p className="text-center text-xs text-neutral-500 font-light">
            Don't have an account?{' '}
            <Link to="/register" className="text-neutral-900 font-semibold uppercase tracking-wider underline ml-1">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
