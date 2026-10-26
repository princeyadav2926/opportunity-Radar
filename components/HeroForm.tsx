"use client";

import React, { useState } from "react";
import {
  Search,
  Sparkles,
  UserCheck,
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
  RotateCcw,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

interface HeroFormProps {
  lookingFor: string;
  setLookingFor: (val: string) => void;
  profile: string;
  setProfile: (val: string) => void;
  category: string;
  onSubmit: (data: { lookingFor: string; profile: string; category: string }) => void;
  isLoading: boolean;
  onClear: () => void;
}

export function HeroForm({
  lookingFor = "",
  setLookingFor = () => {},
  profile = "",
  setProfile = () => {},
  category = "All",
  onSubmit,
  isLoading = false,
  onClear = () => {},
}: HeroFormProps) {
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookingFor?.trim() && !profile?.trim()) return;
    onSubmit({ lookingFor, profile, category });
  };

  const isFormFilled = Boolean(lookingFor?.trim() || profile?.trim());

  const handleMouseMove = (e: React.MouseEvent<HTMLFormElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5; // max 2.5 deg subtle tilt
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 5;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt(null);
  };

  return (
    <div className="w-full">
      {/* Hero Intro Header */}
      <div className="mb-6 space-y-2.5">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/70 dark:to-purple-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold tracking-wide shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Real-Time Web Intelligence &bull; Verified Deadlines</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Find Your Next{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400">
            Opportunity
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          AI scans 20 authoritative Indian and global student portals, validates active deadlines, and matches opportunities to your exact skills and college year.
        </p>
      </div>

      {/* 3D Holo-Terminal Main Form Box */}
      <form
        onSubmit={handleSubmit}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: tilt
            ? `perspective(1200px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(8px)`
            : "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
          transformStyle: "preserve-3d",
          transition: tilt ? "transform 0.08s ease-out" : "transform 0.35s ease",
        }}
        className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl shadow-indigo-500/10 p-5 sm:p-7 space-y-5 overflow-hidden"
      >
        {/* Cyber Reticles (+) in corners for 3D terminal look */}
        <div className="absolute top-3 left-3 text-zinc-300 dark:text-zinc-700 text-[10px] font-mono pointer-events-none select-none">
          +
        </div>
        <div className="absolute top-3 right-3 text-zinc-300 dark:text-zinc-700 text-[10px] font-mono pointer-events-none select-none">
          +
        </div>
        <div className="absolute bottom-3 left-3 text-zinc-300 dark:text-zinc-700 text-[10px] font-mono pointer-events-none select-none">
          +
        </div>
        <div className="absolute bottom-3 right-3 text-zinc-300 dark:text-zinc-700 text-[10px] font-mono pointer-events-none select-none">
          +
        </div>

        {/* Top Active Scope Bar */}
        <div
          style={{ transform: "translateZ(14px)" }}
          className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800"
        >
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              Target Scope:
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>{category === "All" ? "All Categories" : category}</span>
            </span>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              (select category on the left sidebar)
            </span>
          </div>

          {isFormFilled && (
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading}
              className="inline-flex items-center space-x-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear fields</span>
            </button>
          )}
        </div>

        {/* Input 1: What are you looking for */}
        <div style={{ transform: "translateZ(12px)" }} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="lookingFor"
              className="block text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100"
            >
              What opportunity are you looking for?
            </label>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Role, stipend, topic, or location
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="lookingFor"
              type="text"
              required
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. Paid AI/ML internship in Bengaluru or remote with stipend"
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 dark:focus:ring-indigo-400 transition text-sm font-medium"
            />
          </div>
        </div>

        {/* Input 2: Student Profile */}
        <div style={{ transform: "translateZ(12px)" }} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="profile"
              className="block text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100"
            >
              Your Student Profile & Background
            </label>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              College, year, branch, tech stack & interests
            </span>
          </div>
          <textarea
            id="profile"
            rows={3}
            required
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="e.g. 3rd year B.Tech Computer Science at LNCT Bhopal. Skills: Python, PyTorch, React, SQL. Looking for remote or hybrid positions."
            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 dark:focus:ring-indigo-400 transition text-sm font-medium resize-none leading-relaxed"
          />
        </div>

        {/* Submit Button with 3D Tactile Push Elevation */}
        <div style={{ transform: "translateZ(20px)" }}>
          <button
            type="submit"
            disabled={isLoading || (!lookingFor.trim() && !profile.trim())}
            className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2.5 transition-all duration-200 cursor-pointer text-sm sm:text-base tracking-wide btn-3d-tactile"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning 20 Trusted Portals in Real-Time...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Launch Opportunity Radar</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Highlights Trust Strip */}
        <div
          style={{ transform: "translateZ(10px)" }}
          className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-zinc-500 dark:text-zinc-400"
        >
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>20 Verified Portals</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>0 Expired Posts</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span>AI Fit Scoring (1-10)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Personalized Advice</span>
          </div>
        </div>
      </form>
    </div>
  );
}
