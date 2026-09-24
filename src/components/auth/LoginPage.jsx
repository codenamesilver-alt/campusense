import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Lock, Mail, Loader2 } from 'lucide-react';
import tahaaLogo from '@/assets/tahaa.png';

export default function LoginPage() {
  const { login, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  const serverNotice = authError?.message && authError.message !== 'Authentication required'
    ? authError.message
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#C0C0C0] relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-40 h-40 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 overflow-hidden">
            <img src={tahaaLogo} alt="Campusense logo" className="w-36 h-36 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CAMPUSENSE</h1>
          <p className="text-[#B8860B] font-medium mt-1">Smart Education Platform</p>
          <p className="text-slate-500 text-sm mt-3">Login to access the school management dashboard</p>
        </div>

        {serverNotice && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-200 mb-4">
            {serverNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-8 space-y-5 shadow-2xl">
          <div>
            <label htmlFor="login-email" className="block text-sm font-bold text-black mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-bold text-black mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg py-3 transition duration-200 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
