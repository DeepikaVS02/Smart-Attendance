import React, { useState } from 'react';
import { Lock, User, AlertCircle, Bluetooth } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.token);
      } else {
        setError(data.detail || 'Invalid username or password');
      }
    } catch (err) {
      setError('Connection to server failed. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass-card p-8 rounded-2xl relative overflow-hidden glow-cyan">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/20">
            <Bluetooth className="w-9 h-9 animate-pulse" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white">
            Smart Attendance
          </h2>
          <p className="mt-1 text-center text-sm text-slate-400">
            Teacher Access Dashboard
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/80 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-xl border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm transition-colors"
                  placeholder="Enter admin username (e.g. admin)"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-700 bg-slate-900/50 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm transition-colors"
                  placeholder="Enter admin password (e.g. admin)"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 px-4 text-sm font-bold text-white transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2">
          Demo Credentials: <span className="text-cyan-400">admin / admin</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
