import React, { useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const typeStyles = {
    success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-400",
    error: "bg-red-50 dark:bg-red-950/20 border-red-500 text-red-800 dark:text-red-400",
    warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-500 text-amber-800 dark:text-amber-400",
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-800 dark:text-blue-400",
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertOctagon className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start space-x-3 p-4 border shadow-md font-mono ${typeStyles[type]} max-w-sm`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 text-xs leading-relaxed font-sans">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
export default Toast;
