"use client";

import React from "react";
import { Clock, ArrowUpDown, Filter, Search } from "lucide-react";
import { OpportunityType } from "@/lib/gemini";

interface FilterBarProps {
  totalCount: number;
  filteredCount: number;
  selectedType: string;
  onSelectType: (type: string) => void;
  closingSoonOnly: boolean;
  onToggleClosingSoon: () => void;
  sortBy: "fit" | "deadline";
  onSelectSort: (sort: "fit" | "deadline") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TYPES = [
  "All",
  "Internship",
  "Hackathon",
  "Competition",
  "Scholarship",
  "Fellowship",
  "Open Source",
];

export function FilterBar({
  totalCount,
  filteredCount,
  selectedType,
  onSelectType,
  closingSoonOnly,
  onToggleClosingSoon,
  sortBy,
  onSelectSort,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 space-y-4">
      {/* Top Row: Count & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Count */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">
            Matches Found:
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {filteredCount} of {totalCount}
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter by keyword..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
            />
          </div>

          {/* Closing Soon Toggle */}
          <button
            type="button"
            onClick={onToggleClosingSoon}
            className={`inline-flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
              closingSoonOnly
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 font-bold"
                : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${closingSoonOnly ? "text-rose-500" : ""}`} />
            <span>Closing soon (7d)</span>
          </button>

          {/* Sort Selector */}
          <div className="inline-flex items-center space-x-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl p-0.5 bg-zinc-50 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => onSelectSort("fit")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sortBy === "fit"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Best Match
            </button>
            <button
              type="button"
              onClick={() => onSelectSort("deadline")}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                sortBy === "deadline"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Nearest Deadline
            </button>
          </div>
        </div>
      </div>

      {/* Type Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-1" />
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelectType(type)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all ${
              selectedType === type
                ? "bg-indigo-600 text-white shadow-xs font-semibold scale-[1.02]"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}
