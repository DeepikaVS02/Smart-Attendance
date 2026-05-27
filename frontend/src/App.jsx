import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check localStorage for active login
    const savedToken = localStorage.getItem('teacher_token');
    if (savedToken) {
      setToken(savedToken);
    }
    setInitialized(true);
  }, []);

  const handleLogin = (jwtToken) => {
    localStorage.setItem('teacher_token', jwtToken);
    setToken(jwtToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_token');
    setToken(null);
  };

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 bg-slate-950">
      {token ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
