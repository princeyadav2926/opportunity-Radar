"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Globe, ShieldCheck } from "lucide-react";
import { TRUSTED_SOURCES } from "@/config/sources";
import { SourceFetchStatus } from "@/lib/tinyfish";

interface SourcesPanelProps {
  sourcesStatus: SourceFetchStatus[];
}

export function SourcesPanel({ sourcesStatus }: SourcesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Map status by URL
  const statusMap = new Map<string, SourceFetchStatus>();
  sourcesStatus.forEach((s) => statusMap.set(s.url, s));

  const totalOpps = sourcesStatus.reduce((acc, curr) => acc + (curr.opportunityCount || 0), 0);

  return (
    <div className="w-full pt-4">
      <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800 overflow-hidden shadow-sm transition-all">
        {/* Accordion Header */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between text-left hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  20 Live Monitored Portals
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Real-Time Web
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click to inspect portal health, character counts & verified opportunity yields
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {totalOpps > 0 && (
              <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {totalOpps} active items found
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50/40 dark:bg-zinc-950/40">
            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Portal Status:</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Rich content (&ge; 500 chars)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Thin content (&lt; 500 chars)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Failed</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                <span>Not queried this run</span>
              </div>
            </div>

            {/* Sources Grid with 3D Hover Tilt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {TRUSTED_SOURCES.map((source) => {
                const liveStatus = statusMap.get(source.url);
                const status = liveStatus?.status || "not_used";
                const chars = liveStatus?.charCount || 0;
                const oppCount = liveStatus?.opportunityCount || 0;

                const dotColor =
                  status === "ok"
                    ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm"
                    : status === "thin"
                    ? "bg-amber-400"
                    : status === "failed"
                    ? "bg-rose-500"
                    : "bg-zinc-300 dark:bg-zinc-600";

                return (
                  <div
                    key={source.url}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 flex flex-col justify-between text-xs hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                          <span className="font-bold text-zinc-900 dark:text-white truncate">
                            {source.name}
                          </span>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                        <span>{source.category}</span>
                        {source.jsHeavy && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-600 dark:text-zinc-400">
                            jsHeavy
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">
                        {chars > 0 ? `${chars} chars` : status}
                      </span>
                      {oppCount > 0 ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {oppCount} items
                        </span>
                      ) : (
                        <span className="text-zinc-400">0 items</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
