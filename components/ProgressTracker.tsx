"use client";

import React from "react";
import { CheckCircle2, Loader2, Sparkles, Globe, FileText, Cpu, Check } from "lucide-react";
import { PipelineProgressEvent } from "@/lib/radar-pipeline";

interface ProgressTrackerProps {
  currentEvent: PipelineProgressEvent | null;
  keywords: string[];
  readPages: Array<{ url: string; title: string; status: string; charCount: number; sourceName: string }>;
}

const STEPS = [
  { id: 1, title: "Understanding you", icon: Sparkles },
  { id: 2, title: "Searching trusted sites", icon: Globe },
  { id: 4, title: "Reading pages", icon: FileText },
  { id: 5, title: "Matching", icon: Cpu },
  { id: 6, title: "Done", icon: Check },
];

export function ProgressTracker({
  currentEvent,
  keywords,
  readPages,
}: ProgressTrackerProps) {
  if (!currentEvent) return null;

  const currentStep = currentEvent.step;
  const isError = currentEvent.stage === "error";

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-md transition-all">
        {/* Step Indicator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center space-x-2">
            {!isError && currentStep < 6 ? (
              <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            ) : isError ? (
              <div className="w-3 h-3 rounded-full bg-rose-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {currentEvent.message}
            </h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
            {currentStep === 6 ? "Ready" : `Step ${Math.min(currentStep, 5)} of 5`}
          </span>
        </div>

        {/* 5-Step Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id || currentStep === 6;
            const isActive = currentStep === step.id && currentStep !== 6 && !isError;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 p-2.5 rounded-xl border transition-all text-xs font-medium ${
                  isCompleted
                    ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                    : isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-sm animate-pulse"
                    : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {isCompleted ? "✓" : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="truncate">{step.title}</span>
              </div>
            );
          })}
        </div>

        {/* Extracted Keywords Chips (User should SEE what AI understood) */}
        {keywords.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                AI Extracted Keywords:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live Page Reading Pills */}
        {readPages.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
            <span className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Live Sources Read ({readPages.length}):
            </span>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {readPages.map((page, idx) => {
                const isOk = page.status === "ok";
                const isThin = page.status === "thin";
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOk
                          ? "bg-emerald-500"
                          : isThin
                          ? "bg-amber-400"
                          : "bg-rose-400"
                      }`}
                    />
                    <span className="font-medium truncate max-w-[140px]">
                      {page.sourceName}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {page.charCount > 0 ? `${page.charCount}c` : page.status}
                    </span>
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
