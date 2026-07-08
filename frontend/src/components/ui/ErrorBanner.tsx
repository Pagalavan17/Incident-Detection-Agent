import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  code?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ code = "PIPELINE_ERROR", message, onRetry }) => {
  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-5 font-mono text-left mb-6">
      <div className="flex items-start space-x-3">
        <div className="p-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
          <AlertOctagon size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-widest mb-1">
            ERROR: {code}
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 font-sans leading-relaxed">
            {message}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 cursor-pointer transition-all"
            >
              <RefreshCw size={12} className="mr-1.5" />
              RETRY PIPELINE RUN
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default ErrorBanner;
