"use client";

import React, { useState } from "react";
import {
  Globe2,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

interface StatItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  stat: string;
  badge: string;
  description: string;
  accent: {
    border: string;
    bg: string;
    glow: string;
    text: string;
  };
}

const STATS_DATA: StatItem[] = [
  {
    id: "portals",
    icon: Globe2,
    title: "Live Source Portals",
    stat: "20 Portals",
    badge: "Auto-Scanned",
    description: "Unstop, Devfolio, Internshala, Kaggle, GSoC & IIT/NIT notice boards",
    accent: {
      border: "border-indigo-400/60 dark:border-indigo-600/60",
      bg: "from-indigo-500/15 via-indigo-500/5 to-transparent",
      glow: "hover:shadow-indigo-500/20",
      text: "text-indigo-600 dark:text-indigo-400",
    },
  },
  {
    id: "accuracy",
    icon: ShieldCheck,
    title: "AI Grounded Proof",
    stat: "100% Verified",
    badge: "No Hallucinations",
    description: "Every opportunity includes exact verbatim quotes from the live portal",
    accent: {
      border: "border-emerald-400/60 dark:border-emerald-600/60",
      bg: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      glow: "hover:shadow-emerald-500/20",
      text: "text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    id: "deadlines",
    icon: Clock,
    title: "Active Deadlines",
    stat: "Live Filter",
    badge: "Closing Soon Alerts",
    description: "Deadlines calculated relative to right now with 7-day urgency tags",
    accent: {
      border: "border-rose-400/60 dark:border-rose-600/60",
      bg: "from-rose-500/15 via-rose-500/5 to-transparent",
      glow: "hover:shadow-rose-500/20",
      text: "text-rose-600 dark:text-rose-400",
    },
  },
  {
    id: "presets",
    icon: Zap,
    title: "Student Presets",
    stat: "16 Profiles",
    badge: "1-Click Auto Fill",
    description: "Tailored for LNCT, CS, AI/ML, Web3, Design, MCA & B.Tech batches",
    accent: {
      border: "border-purple-400/60 dark:border-purple-600/60",
      bg: "from-purple-500/15 via-purple-500/5 to-transparent",
      glow: "hover:shadow-purple-500/20",
      text: "text-purple-600 dark:text-purple-400",
    },
  },
];

export function StatsHoloDeck3D() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [tilt, setTilt] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14; // max 7 deg
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14;
    setTilt({ id, x, y });
  };

  const handleMouseLeave = () => {
    setTilt(null);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {STATS_DATA.map((item) => {
          const isTilted = tilt?.id === item.id;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onMouseMove={(e) => handleMouseMove(e, item.id)}
              onMouseEnter={() => setActiveCard(item.id)}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: isTilted
                  ? `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(12px)`
                  : "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
                transformStyle: "preserve-3d",
                transition: isTilted ? "transform 0.08s ease-out" : "transform 0.35s ease",
              }}
              className={`group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-3.5 sm:p-4.5 shadow-sm hover:shadow-xl ${item.accent.glow} transition-all duration-200 overflow-hidden cursor-default`}
            >
              {/* Subtle Ambient Gradient Sheen */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.accent.bg} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`}
              />

              {/* 3D Glass Surface Lighting */}
              <div
                style={{ transform: "translateZ(18px)", transformStyle: "preserve-3d" }}
                className="relative z-10 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 ${item.accent.text}`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                    {item.badge}
                  </span>
                </div>

                <div style={{ transform: "translateZ(14px)" }}>
                  <div className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {item.stat}
                  </div>
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {item.title}
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* 3D Bottom Edge Accent Bar */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.accent.bg} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
