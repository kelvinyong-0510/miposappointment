import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Zap, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/login`, credentials);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/admin');
    } catch {
      setError('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)' }}>

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF6600]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6600] flex items-center justify-center shadow-xl shadow-orange-500/30">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-extrabold text-xl leading-none tracking-wide">MIPOS</p>
            <p className="text-orange-400/80 text-xs font-semibold tracking-[0.2em] uppercase mt-0.5">ShopTech Centre</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight mb-4">
            Manage Your<br />
            <span className="text-[#FF6600]">Sales Funnel</span><br />
            Smarter.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm">
            Track walk-ins, manage leads, close deals — all from one elegant dashboard.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mt-10">
            {[
              { value: '8', label: 'Pipeline Stages' },
              { value: '3', label: 'Staff Views' },
              { value: '100%', label: 'Web-based' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-white/40 text-xs font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">© 2026 MIPOS ShopTech Centre · All rights reserved</p>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6600] flex items-center justify-center shadow-xl shadow-orange-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-xl leading-none">MIPOS</p>
              <p className="text-orange-400/80 text-xs font-semibold tracking-widest uppercase mt-0.5">Admin Portal</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-[#151C2C]/80 backdrop-blur-xl ring-1 ring-white/10 rounded-3xl shadow-2xl shadow-black/60 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-white mb-1">Welcome back 👋</h1>
              <p className="text-slate-400 text-sm">Sign in to your admin account</p>
            </div>

            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-200 rounded-2xl px-4 py-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-[#FF6600] transition-colors" />
                  <input
                    id="login-username"
                    type="text"
                    name="username"
                    required
                    value={credentials.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-white/10 text-sm bg-black/20 focus:bg-white/5 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/30 outline-none transition-all text-white placeholder:text-slate-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-[#FF6600] transition-colors" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    required
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-white/10 text-sm bg-black/20 focus:bg-white/5 focus:border-[#FF6600] focus:ring-4 focus:ring-[#FF6600]/30 outline-none transition-all text-white placeholder:text-slate-500 [color-scheme:dark]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#FF6600] hover:bg-[#E65C00] disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            MIPOS ShopTech Centre · Staff Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
