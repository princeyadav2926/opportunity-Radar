"use client";

import React from "react";
import { SearchX, Sparkles, FilterX } from "lucide-react";

interface EmptyStateProps {
  onResetFilters?: () => void;
  hasFiltersApplied?: boolean;
}

export function EmptyState({ onResetFilters, hasFiltersApplied }: EmptyStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
        {hasFiltersApplied ? (
          <FilterX className="w-8 h-8" />
        ) : (
          <SearchX className="w-8 h-8" />
        )}
      </div>

      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
        {hasFiltersApplied
          ? "No opportunities match your current filters"
          : "No active opportunities found right now"}
      </h3>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
        {hasFiltersApplied
          ? "Try resetting the filters or toggling off 'Closing soon' to see all matches found by the radar."
          : "We scanned live portals and eliminated expired items to ensure you only see currently open deadlines. Try broadening your keywords or selecting 'All' categories."}
      </p>

      {hasFiltersApplied && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}
