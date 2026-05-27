import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export const Toast = ({ id, message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/30 text-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-400" />,
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/30 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    },
    info: {
      bg: 'bg-slate-900/90 border-cyan-500/30 text-cyan-200',
      icon: <Info className="w-5 h-5 text-cyan-400" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-y-0 animate-fade-in ${config.bg} max-w-sm w-80`}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};
