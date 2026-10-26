"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  Quote,
  Clock,
  Sparkles,
  Banknote,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ExtractedOpportunity } from "@/lib/gemini";

interface OpportunityCardProps {
  opportunity: ExtractedOpportunity;
}

const TYPE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  Internship: {
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    label: "Internship",
  },
  Hackathon: {
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    label: "Hackathon",
  },
  Competition: {
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    label: "Competition",
  },
  Scholarship: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    label: "Scholarship",
  },
  Fellowship: {
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    label: "Fellowship",
  },
  "Open Source": {
    bg: "bg-teal-50 dark:bg-teal-950/60",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
    label: "Open Source",
  },
};

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const typeConfig = TYPE_CONFIG[opportunity.type] || {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
    label: opportunity.type || "Opportunity",
  };

  // Safe deadline calculations
  const deadlineDaysDiff = (() => {
    if (!opportunity.deadline_iso) return null;
    const deadlineTime = new Date(opportunity.deadline_iso).getTime();
    if (isNaN(deadlineTime)) return null;
    const nowTime = Date.now();
    return Math.ceil((deadlineTime - nowTime) / (1000 * 60 * 60 * 24));
  })();

  const isClosingSoon =
    deadlineDaysDiff !== null && deadlineDaysDiff >= 0 && deadlineDaysDiff <= 7;

  const fitScore = Math.max(1, Math.min(10, Math.round(opportunity.fit_score || 8)));

  const fitBadge =
    fitScore >= 9
      ? {
          color: "text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 shadow-emerald-500/20",
          tag: "Top Match",
        }
      : fitScore >= 7
      ? {
          color: "text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/70 shadow-blue-500/20",
          tag: "Strong Fit",
        }
      : {
          color: "text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/70 shadow-amber-500/20",
          tag: "Good Match",
        };

  // Safe external link
  const safeLink =
    opportunity.link && opportunity.link.startsWith("http")
      ? opportunity.link
      : `https://${opportunity.link || "google.com"}`;

  // 3D Parallax Tilt Math
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 9.5; // Max 9.5 deg
    const rotY = ((x - centerX) / centerX) * 9.5;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotX, rotY, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotX: 0, rotY: 0, glareX: 50, glareY: 50 });
    setIsHovered(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1200px) rotateX(${tilt.rotX}deg) rotateY(${tilt.rotY}deg) translateZ(18px)`
          : "perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        transformStyle: "preserve-3d",
        transition: isHovered
          ? "transform 0.08s ease-out"
          : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease",
      }}
      className="group relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-5 sm:p-6 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-400/80 dark:hover:border-indigo-600/80 flex flex-col justify-between overflow-hidden will-change-transform transition-all"
    >
      {/* 3D Holographic Dynamic Glare Sheen that tracks the cursor */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-3xl transition-opacity duration-300 opacity-65 dark:opacity-45"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.3) 0%, rgba(99, 102, 241, 0.12) 40%, transparent 75%)`,
          }}
        />
      )}

      {/* Top subtle highlight gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-indigo-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div style={{ transform: "translateZ(12px)", transformStyle: "preserve-3d" }}>
        {/* Top Header: Category, Mode, and 3D Popout Fit Score */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5" style={{ transform: "translateZ(20px)" }}>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
            >
              {typeConfig.label}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80">
              {opportunity.mode || "Online / Remote"}
            </span>
            {isClosingSoon && (
              <span className="inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
                <Clock className="w-3 h-3 text-rose-500" />
                <span>
                  {deadlineDaysDiff === 0
                    ? "Ends Today"
                    : `${deadlineDaysDiff}d left`}
                </span>
              </span>
            )}
          </div>

          {/* 3D Pop-Out Fit Score Meter */}
          <div
            style={{
              transform: isHovered ? "translateZ(34px) scale(1.12)" : "translateZ(0px) scale(1)",
              transition: "transform 0.15s ease-out",
            }}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border-2 shrink-0 shadow-lg ${fitBadge.color}`}
            title={`Fit Score: ${fitScore}/10 (${fitBadge.tag})`}
          >
            <span className="text-base font-extrabold leading-none">{fitScore}</span>
            <span className="text-[8px] font-bold uppercase tracking-tight mt-0.5 opacity-90">
              / 10
            </span>
          </div>
        </div>

        {/* Opportunity Title with 3D Elevation */}
        <h3
          style={{
            transform: isHovered ? "translateZ(24px)" : "translateZ(10px)",
            transition: "transform 0.15s ease-out",
          }}
          className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-1.5 leading-snug tracking-tight"
        >
          {opportunity.title}
        </h3>

        {/* Organization Name */}
        <div
          style={{ transform: "translateZ(16px)" }}
          className="flex items-center space-x-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-3.5"
        >
          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{opportunity.organization || "Verified Organization"}</span>
        </div>

        {/* Location & Deadline Bar */}
        <div
          style={{ transform: "translateZ(14px)" }}
          className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50/80 dark:bg-zinc-800/40 p-2.5 rounded-2xl mb-3.5 border border-zinc-100 dark:border-zinc-800"
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{opportunity.location || "Online / India"}</span>
          </div>

          <div className="flex items-center space-x-1.5 min-w-0">
            <Calendar
              className={`w-3.5 h-3.5 shrink-0 ${
                isClosingSoon ? "text-rose-500" : "text-zinc-400"
              }`}
            />
            <span
              className={`truncate font-medium ${
                isClosingSoon
                  ? "text-rose-600 dark:text-rose-400 font-bold"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {opportunity.deadline_text || "Rolling deadline"}
            </span>
          </div>
        </div>

        {/* Stipend / Prize Pool Highlight Banner */}
        {opportunity.stipend_or_prize && (
          <div
            style={{ transform: isHovered ? "translateZ(22px)" : "translateZ(12px)", transition: "transform 0.15s ease-out" }}
            className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl mb-3.5 shadow-xs"
          >
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{opportunity.stipend_or_prize}</span>
          </div>
        )}

        {/* Eligibility Note */}
        {opportunity.eligibility && (
          <div
            style={{ transform: "translateZ(12px)" }}
            className="flex items-start space-x-1.5 text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed"
          >
            <GraduationCap className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{opportunity.eligibility}</span>
          </div>
        )}

        {/* Keyword Match Badges */}
        {opportunity.keyword_matches && opportunity.keyword_matches.length > 0 && (
          <div
            style={{ transform: "translateZ(14px)" }}
            className="flex flex-wrap gap-1.5 mb-3.5"
          >
            {opportunity.keyword_matches.slice(0, 4).map((kw, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200/60 dark:border-zinc-700/60"
              >
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* AI "Why it fits you" reasoning block */}
        {opportunity.why_it_fits && (
          <div
            style={{
              transform: isHovered ? "translateZ(18px)" : "translateZ(10px)",
              transition: "transform 0.15s ease-out",
            }}
            className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/90 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 mb-3.5 space-y-1 shadow-xs"
          >
            <div className="flex items-center space-x-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>AI Fit Insight:</span>
            </div>
            <p className="leading-relaxed text-[11px] font-normal">
              {opportunity.why_it_fits}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer: Live Evidence & Apply Button with 3D Popout */}
      <div
        style={{
          transform: isHovered ? "translateZ(26px)" : "translateZ(14px)",
          transition: "transform 0.15s ease-out",
        }}
        className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2"
      >
        {/* Evidence Toggle */}
        {opportunity.evidence && (
          <div>
            <button
              type="button"
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 py-1 transition cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <Quote className="w-3 h-3 text-indigo-500" />
                <span>Verified Source Proof</span>
              </div>
              {showEvidence ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showEvidence && (
              <div className="mt-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                &ldquo;{opportunity.evidence}&rdquo;
                {opportunity.source_name && (
                  <span className="block text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-1 not-italic">
                    — Sourced from {opportunity.source_name}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Apply CTA Button with 3D Tactile Push */}
        <a
          href={safeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-center text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 cursor-pointer group/btn btn-3d-tactile"
        >
          <span>Apply Directly on Portal</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
