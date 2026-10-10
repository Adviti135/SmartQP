import React from 'react';
import { useToast } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const colors = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-yellow-200 bg-yellow-50',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-md ${colors[t.type]} animate-slide-in`}
          role="alert"
        >
          {icons[t.type]}
          <p className="flex-1 text-sm font-medium text-gray-800">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss notification"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
