"use client";

import React from "react";
import { AlertCircle, RefreshCw, KeyRound, WifiOff } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const isKeyError =
    message.toLowerCase().includes("api key") ||
    message.toLowerCase().includes("401");

  const isNetwork =
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("couldn't reach");

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
            {isKeyError ? (
              <KeyRound className="w-5 h-5" />
            ) : isNetwork ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 mb-1">
              Notice
            </h4>
            <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center space-x-1.5 shrink-0 self-end sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
}
