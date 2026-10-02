import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [mobileTouched, setMobileTouched] = useState(false);
  const [mobileError, setMobileError] = useState('');

  const validateMobile = (val) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!val || !phoneRegex.test(val)) {
      setMobileError('Enter a valid 10-digit mobile number.');
      return false;
    }
    setMobileError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMobileTouched(true);
    if (!validateMobile(formData.mobile)) {
      return;
    }
    try {
      await register(formData);
      navigate('/');
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">JOIN APEXCART</span>
            <h2 className="text-3xl font-display font-light leading-tight tracking-tight">
              Create Your <br />Private Account.
            </h2>
          </div>
          <div className="relative z-10 pt-16 space-y-4">
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Register now to enjoy instant checkouts, order history tracking, and curated editorial arrivals.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Unique email & mobile validation</span>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-display font-light text-neutral-900">Create Account</h2>
            <p className="text-xs text-neutral-400 font-light">Join ApexCart for fast & secure shopping</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-light"
                />
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black font-light"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={formData.mobile}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, mobile: sanitized });
                    if (mobileTouched) validateMobile(sanitized);
                  }}
                  onBlur={() => {
                    setMobileTouched(true);
                    validateMobile(formData.mobile);
                  }}
                  placeholder="9876543210"
                  className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none font-mono font-light ${
                    mobileTouched && mobileError
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-neutral-200 focus:ring-1 focus:ring-black'
                  }`}
                />
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              </div>
              {mobileTouched && mobileError && (
                <p className="text-xs text-red-500 font-semibold mt-1 animate-fade-in">{mobileError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              <span>{loading ? 'Registering Account...' : 'Register'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-neutral-500 font-light">
            Already have an account?{' '}
            <Link to="/login" className="text-neutral-900 font-semibold uppercase tracking-wider underline ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
