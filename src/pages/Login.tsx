import React, { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Mail, Lock, Shield, Store, Truck, ShoppingBag, Eye, EyeOff, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const { loginDemo } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();

  // Form Inputs
  const [email, setEmail] = useState('distributor@orderlink.io');
  const [password, setPassword] = useState('demo123');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Fast-path for demo password or when Supabase is not yet configured
    if (!isSupabaseConfigured || password === 'demo123') {
      loginDemo(selectedRole);
      navigate('/');
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        navigate('/');
      }
    } catch (err: unknown) {
      if (password === 'demo123') {
        loginDemo(selectedRole);
        navigate('/');
        return;
      }
      setError((err as Error).message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Supabase belum terhubung. Konfigurasikan VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env atau gunakan Login Demo.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        navigate('/');
      } else {
        setSuccess('Registration successful! Please check your email for confirmation or sign in.');
        setIsRegisterMode(false);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (authError) throw authError;
    } catch (err: unknown) {
      setError((err as Error).message || 'Google Sign-In failed');
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword('demo123');
    loginDemo(role);
    navigate('/');
  };

  // 1. INFORMATIONAL PANEL COLUMN (Welcome / Register info)
  const renderInfoSection = () => (
    <motion.div
      layout
      key="info-section-column"
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className={`bg-emerald-950/15 p-8 flex flex-col justify-center relative overflow-hidden hidden md:flex w-1/2 min-h-[640px] border-[#1e2427] ${
        isRegisterMode
          ? 'border-l'
          : 'border-r'
      }`}
    >
      {/* Radial glow background */}
      <div className="absolute inset-0 bg-radial-gradient from-[#10b981]/10 via-transparent to-transparent opacity-80 pointer-events-none"></div>

      <div className="relative z-10 h-[460px] flex flex-col justify-between">
       
        {/* BRAND LOGO - PLACED DIRECTLY ABOVE THE GREEN PILL */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#10b981]/10 rounded-lg flex items-center justify-center border border-[#10b981]/30">
              <ShoppingBag className="w-4.5 h-4.5 text-[#10b981]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">OrderLink</span>
          </div>

          {/* Green Pill */}
          <div className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest bg-[#10b981]/10 px-3 py-1 rounded-full w-max border border-[#10b981]/20">
            Enterprise SCM Portal
          </div>
        </div>

        {/* VERTICAL SLIDING INFORMATION */}
        <div className="flex-1 flex items-center relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {!isRegisterMode ? (
              /* LOGIN INFO PANEL */
              <motion.div
                key="login-info"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="space-y-4 py-4"
              >
                <h3 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                  Streamline Your Supply Chain Flow.
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Access the ultimate fulfillment panel. Monitor high-volume shipments, manage warehouse stock levels, and review CRM business partners in real-time.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>Real-Time Shipment Tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>Automated Low-Stock Inventory Alerts</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>Enterprise-Grade Role-Based Access Control</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* REGISTER INFO PANEL */
              <motion.div
                key="register-info"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                className="space-y-4 py-4"
              >
                <h3 className="text-2xl font-extrabold tracking-tight text-white leading-tight">
                  Connect to a Global Logistics Network.
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Register your secure portal account today. Connect instantly with trusted wholesale distributors, retail hubs, and verified shipping fleets worldwide.
                </p>
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>Multi-Tenant SCM Integrations</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>Instant Automated Clearing & Invoicing</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                    <span>End-to-End Encrypted Data Security</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom demo account info */}
        <div className="bg-[#121618]/50 border border-[#1e2427]/40 rounded-xl p-3.5 text-xs space-y-2">
          <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider block">Quick Access Demo Accounts</span>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleDemoSelect('Distributor', 'distributor@orderlink.io')}
              className="text-left p-1.5 rounded-lg bg-[#1a2023] hover:bg-[#232a2e] border border-[#283236] transition-all cursor-pointer"
            >
              <div className="font-semibold text-slate-200">Distributor</div>
              <div className="text-slate-400 text-[9px] truncate">distributor@orderlink.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('Retailer', 'retailer@orderlink.io')}
              className="text-left p-1.5 rounded-lg bg-[#1a2023] hover:bg-[#232a2e] border border-[#283236] transition-all cursor-pointer"
            >
              <div className="font-semibold text-slate-200">Retailer</div>
              <div className="text-slate-400 text-[9px] truncate">retailer@orderlink.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('Driver', 'driver@orderlink.io')}
              className="text-left p-1.5 rounded-lg bg-[#1a2023] hover:bg-[#232a2e] border border-[#283236] transition-all cursor-pointer"
            >
              <div className="font-semibold text-slate-200">Driver</div>
              <div className="text-slate-400 text-[9px] truncate">driver@orderlink.io</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSelect('Admin', 'admin@orderlink.io')}
              className="text-left p-1.5 rounded-lg bg-[#1a2023] hover:bg-[#232a2e] border border-[#283236] transition-all cursor-pointer"
            >
              <div className="font-semibold text-slate-200">Admin</div>
              <div className="text-slate-400 text-[9px] truncate">admin@orderlink.io</div>
            </button>
          </div>
          <p className="text-slate-400 text-[10px] text-center pt-0.5">
            Password: <code className="text-slate-200 font-mono">demo123</code>
          </p>
        </div>
      </div>
    </motion.div>
  );

  // 2. FORM CONTAINER COLUMN
  const renderFormSection = () => (
    <motion.div
      layout
      key="form-section-column"
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="p-8 flex flex-col justify-center relative overflow-hidden w-full md:w-1/2 min-h-[640px]"
    >
      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none"></div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/20 border border-red-800/40 rounded-xl text-red-400 text-xs flex items-center gap-2 relative z-10 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-emerald-950/20 border border-[#10b981]/40 rounded-xl text-[#10b981] text-xs flex items-center gap-2 relative z-10 animate-in fade-in duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0"></span>
          <span>{success}</span>
        </div>
      )}

      {/* SLIDE TRANSITION FOR FORMS */}
      <div className="relative flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {!isRegisterMode ? (
            /* LOGIN FORM */
            <motion.div
              key="login-form"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4"
            >
              <div className="mb-2">
                <h2 className="text-xl font-bold text-white">Welcome Back</h2>
                <p className="text-xs text-slate-400 mt-1">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Admin', 'Distributor', 'Retailer', 'Driver'] as UserRole[]).map((r) => {
                      const isActive = selectedRole === r;
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setSelectedRole(r)}
                          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]'
                              : 'bg-[#121618] border-[#1e2427] text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {r === 'Admin' && <Shield className="w-4 h-4 mb-1" />}
                          {r === 'Distributor' && <Store className="w-4 h-4 mb-1" />}
                          {r === 'Retailer' && <ShoppingBag className="w-4 h-4 mb-1" />}
                          {r === 'Driver' && <Truck className="w-4 h-4 mb-1" />}
                          <span className="text-[10px] font-semibold">{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] pl-9 pr-4 py-2 rounded-xl text-xs transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] pl-9 pr-9 py-2 rounded-xl text-xs transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-slate-500 py-1">
                <span className="w-[30%] h-[1px] bg-[#1e2427]"></span>
                <span>OR CONTINUE WITH</span>
                <span className="w-[30%] h-[1px] bg-[#1e2427]"></span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-[#121618] hover:bg-[#151a1c] border border-[#1e2427] text-slate-300 font-medium py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.3C17.65 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.76 3.46-4.51 6.76-4.51z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.48c-.28 1.48-1.07 2.74-2.33 3.59l3.61 2.8c2.11-1.95 3.73-4.82 3.73-8.63z" />
                  <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.39 2.96C.5 4.77 0 6.8 0 8.95s.5 4.18 1.39 5.99l3.85-2.99c-.24-.72-.38-1.49-.38-2.35z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.61-2.8c-1.1.74-2.52 1.18-4.35 1.18-3.3 0-5.84-1.75-6.76-4.51L1.39 14.9C3.37 18.78 7.35 23 12 23z" />
                </svg>
                Google
              </button>

              {/* Switch to Register */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegisterMode(true);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
                >
                  Don't have an account? Register <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* REGISTER FORM */
            <motion.div
              key="register-form"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4"
            >
              <div className="mb-2">
                <h2 className="text-xl font-bold text-white">Create Account</h2>
                <p className="text-xs text-slate-400 mt-1">Get started with your SCM portal</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] pl-9 pr-4 py-2 rounded-xl text-xs transition-all"
                      placeholder="Budi Santoso"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] pl-9 pr-4 py-2 rounded-xl text-xs transition-all"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Password
                    </label>
                    <input
                      id="reg-password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] px-4 py-2 rounded-xl text-xs transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-confirm" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirm
                    </label>
                    <input
                      id="reg-confirm"
                      name="confirm"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] px-4 py-2 rounded-xl text-xs transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Distributor', 'Retailer', 'Driver'] as UserRole[]).map((r) => {
                      const isActive = selectedRole === r;
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setSelectedRole(r)}
                          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]'
                              : 'bg-[#121618] border-[#1e2427] text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {r === 'Distributor' && <Shield className="w-4 h-4 mb-1" />}
                          {r === 'Retailer' && <Store className="w-4 h-4 mb-1" />}
                          {r === 'Driver' && <Truck className="w-4 h-4 mb-1" />}
                          <span className="text-[10px] font-semibold">{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-slate-500 py-1">
                <span className="w-[30%] h-[1px] bg-[#1e2427]"></span>
                <span>OR CONTINUE WITH</span>
                <span className="w-[30%] h-[1px] bg-[#1e2427]"></span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-[#121618] hover:bg-[#151a1c] border border-[#1e2427] text-slate-300 font-medium py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.3C17.65 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.76 3.46-4.51 6.76-4.51z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.48c-.28 1.48-1.07 2.74-2.33 3.59l3.61 2.8c2.11-1.95 3.73-4.82 3.73-8.63z" />
                  <path fill="#FBBC05" d="M5.24 10.55c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.39 2.96C.5 4.77 0 6.8 0 8.95s.5 4.18 1.39 5.99l3.85-2.99c-.24-.72-.38-1.49-.38-2.35z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.61-2.8c-1.1.74-2.52 1.18-4.35 1.18-3.3 0-5.84-1.75-6.76-4.51L1.39 14.9C3.37 18.78 7.35 23 12 23z" />
                </svg>
                Google
              </button>

              {/* Switch to Login */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-slate-400 hover:text-[#10b981] transition-colors cursor-pointer inline-flex items-center gap-1.5 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Already have an account? Sign In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0c0e] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#10b981/5_0%,_transparent_70%)]"></div>
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981/5_1px,transparent_1px),linear-gradient(to_bottom,#10b981/5_1px,transparent_1px)] bg-[size:60px_60px] opacity-20"></div>

      {/* Centered Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 22 }}
        className="relative z-10 w-full max-w-5xl mx-4 md:mx-auto rounded-2xl bg-[#121618] border border-[#1e2427] overflow-hidden shadow-2xl shadow-black/50"
      >
        <div className="flex flex-col md:flex-row">
          {renderInfoSection()}
          {renderFormSection()}
        </div>
        
        {/* Footer credit */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-slate-600 px-4 py-2 border-t border-[#1e2427]">
          Developed by <a href="https://instagram.com/ranzxyz77" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:text-[#059669] font-medium">Imbran Darwis</a>
        </div>
      </motion.div>
    </div>
  );
};