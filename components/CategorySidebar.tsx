"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Briefcase,
  Flame,
  Trophy,
  GraduationCap,
  Compass,
  GitBranch,
  Clock,
  Search,
  CheckCircle2,
  X,
  Layers,
  Zap,
  Code2,
  Database,
  Smartphone,
  ShieldAlert,
  Cloud,
  HeartHandshake,
  Star,
  Check,
} from "lucide-react";
import { OpportunityCategory } from "@/config/sources";

export interface CategorySidebarProps {
  selectedCategory: string; // "All" or OpportunityCategory
  onSelectCategory: (category: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  closingSoonOnly: boolean;
  onToggleClosingSoon: () => void;
  sortBy: "fit" | "deadline";
  onSelectSort: (sort: "fit" | "deadline") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalOpportunitiesCount: number;
  filteredCount: number;
  onApplyPreset: (lookingFor: string, profile: string, category: string) => void;
  isLoading: boolean;
}

const CATEGORIES: Array<{
  id: string;
  name: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  countKey?: string;
}> = [
    {
      id: "All",
      name: "All",
      label: "All Categories",
      description: "Scan all 20 live portals across India",
      icon: Sparkles,
      color: "text-indigo-600 dark:text-indigo-400",
      badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800",
    },
    {
      id: "Internships",
      name: "Internships",
      label: "Internships",
      description: "Paid stipends, remote & summer roles",
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
    },
    {
      id: "Hackathons",
      name: "Hackathons",
      label: "Hackathons",
      description: "Live sprints, cash prizes & team bounties",
      icon: Flame,
      color: "text-purple-600 dark:text-purple-400",
      badgeBg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
    },
    {
      id: "Competitions",
      name: "Competitions",
      label: "Competitions",
      description: "Case studies, algorithms & quizzes",
      icon: Trophy,
      color: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    },
    {
      id: "Scholarships",
      name: "Scholarships",
      label: "Scholarships",
      description: "Merit, state & need-based college grants",
      icon: GraduationCap,
      color: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "Fellowships",
      name: "Fellowships",
      label: "Fellowships",
      description: "Research academies, policy & summer fellows",
      icon: Compass,
      color: "text-rose-600 dark:text-rose-400",
      badgeBg: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
    },
    {
      id: "Open Source",
      name: "Open Source",
      label: "Open Source",
      description: "GSoC 2027, Outreachy, GSSoC & grants",
      icon: GitBranch,
      color: "text-teal-600 dark:text-teal-400",
      badgeBg: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800",
    },
  ];

interface PresetItem {
  id: string;
  title: string;
  subtitle: string;
  group: "all" | "tech" | "grants" | "beginner";
  icon: React.ComponentType<{ className?: string }>;
  lookingFor: string;
  profile: string;
  category: OpportunityCategory | "All";
  badgeText: string;
}

const PRESETS: PresetItem[] = [
  {
    id: "ai-ml",
    title: "AI / ML & GenAI Intern",
    subtitle: "PyTorch, LLMs, LangChain (Stipend)",
    group: "tech",
    icon: Sparkles,
    category: "Internships",
    badgeText: "High Demand",
    lookingFor: "Paid AI/ML and Generative AI internship, remote or Bengaluru with stipend",
    profile:
      "3rd year B.Tech Computer Science, LNCT Bhopal.\nSkills: Python, PyTorch, Scikit-learn, LangChain, FastAPI, SQL.\nInterested in generative AI, LLMs, and Computer Vision.",
  },
  {
    id: "web-dev",
    title: "Full-Stack Web Dev (MERN/Next.js)",
    subtitle: "React, Next.js, Node.js Hackathons",
    group: "tech",
    icon: Code2,
    category: "Hackathons",
    badgeText: "Cash Prizes",
    lookingFor: "Upcoming web dev hackathons with cash prizes, team matching, and live project mentorship",
    profile:
      "2nd/3rd year B.Tech Information Technology student in India.\nSkills: JavaScript, TypeScript, React, Next.js, Tailwind CSS, Node.js, PostgreSQL.\nExcited to build fullstack web applications.",
  },
  {
    id: "data-science",
    title: "Data Science & Analytics",
    subtitle: "Python, Pandas, SQL & Dashboards",
    group: "tech",
    icon: Database,
    category: "Internships",
    badgeText: "Stipend",
    lookingFor: "Data Analyst or Data Science intern position with stipend, remote or hybrid in India",
    profile:
      "3rd year engineering student.\nSkills: Python, SQL, Pandas, NumPy, Tableau, Power BI, Excel.\nExperienced in data analysis, EDA, and business dashboards.",
  },
  {
    id: "mobile-dev",
    title: "Mobile App Dev (Flutter/React Native)",
    subtitle: "Cross-platform Android & iOS apps",
    group: "tech",
    icon: Smartphone,
    category: "Internships",
    badgeText: "Remote",
    lookingFor: "Mobile application developer internship for Flutter or React Native, remote with stipend",
    profile:
      "3rd year engineering student.\nSkills: Flutter, Dart, React Native, Firebase, REST APIs, Git, UI/UX.\nBuilt and published student utility mobile apps.",
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity & Bug Bounty",
    subtitle: "CTFs, Pentesting & Network Defense",
    group: "tech",
    icon: ShieldAlert,
    category: "Competitions",
    badgeText: "CTF Challenges",
    lookingFor: "Cybersecurity capture-the-flag competitions, bug bounty programs & student security challenges",
    profile:
      "College student studying Information Security & Networks.\nSkills: Web app pentesting, OWASP Top 10, Wireshark, Burp Suite, Linux, Cryptography basics.",
  },
  {
    id: "cloud-devops",
    title: "DevOps & Cloud Engineering",
    subtitle: "Docker, Kubernetes, AWS & CI/CD",
    group: "tech",
    icon: Cloud,
    category: "Internships",
    badgeText: "Cloud",
    lookingFor: "DevOps, Cloud Engineer, or SRE student internship with stipend in India or remote",
    profile:
      "Final year B.Tech CSE student.\nSkills: Linux, Docker, Kubernetes, AWS (EC2/S3), GitHub Actions CI/CD pipelines, Terraform, Bash scripting.",
  },
  {
    id: "open-source",
    title: "Open Source & GSoC 2027",
    subtitle: "Global Mentorship & Contributor Grants",
    group: "tech",
    icon: GitBranch,
    category: "Open Source",
    badgeText: "Global",
    lookingFor: "Open source contributor programs, Google Summer of Code (GSoC 2027), and Outreachy grants",
    profile:
      "2nd year B.Tech student eager to contribute to open source organizations.\nSkills: Git, GitHub, Python, TypeScript, Markdown, Docker, REST APIs.",
  },
  {
    id: "merit-scholarship",
    title: "Engineering Merit & Need Scholarships",
    subtitle: "Govt NSP & Corporate Grants (<6 LPA)",
    group: "grants",
    icon: GraduationCap,
    category: "Scholarships",
    badgeText: "Tuition Support",
    lookingFor: "Merit and need-based government and corporate scholarships for Indian engineering students 2026-27",
    profile:
      "1st/2nd year B.Tech student at Indian engineering college.\nAnnual family income under 6 LPA, scored 85%+ in 12th board.\nSeeking college tuition fee assistance grants.",
  },
  {
    id: "women-in-tech",
    title: "Women in Tech Scholarships",
    subtitle: "Exclusive Grants & Fellowships for Women",
    group: "grants",
    icon: HeartHandshake,
    category: "Scholarships",
    badgeText: "Women Only",
    lookingFor: "Women in tech scholarships, coding fellowships, and diversity grants for female engineers in India",
    profile:
      "Female undergraduate engineering student in India (2nd/3rd year B.Tech).\nPassion for computer science and tech community leadership.\nSeeking scholarship grants and mentorship.",
  },
  {
    id: "beginner-explorer",
    title: "1st/2nd Year Beginner Explorer",
    subtitle: "No prior experience required",
    group: "beginner",
    icon: Star,
    category: "Competitions",
    badgeText: "Beginner Friendly",
    lookingFor: "Beginner-friendly coding contests, hackathons for first-year students, and student innovation awards",
    profile:
      "1st year B.Tech student learning computer science basics.\nSkills: C++, basic Java, HTML/CSS.\nEager to participate in college hackathons and starter coding challenges.",
  },
];

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  selectedType,
  onSelectType,
  closingSoonOnly,
  onToggleClosingSoon,
  sortBy,
  onSelectSort,
  searchQuery,
  onSearchChange,
  totalOpportunitiesCount,
  filteredCount,
  onApplyPreset,
  isLoading,
}: CategorySidebarProps) {
  const [activePresetGroup, setActivePresetGroup] = useState<"all" | "tech" | "grants" | "beginner">("all");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const filteredPresets = PRESETS.filter(
    (p) => activePresetGroup === "all" || p.group === activePresetGroup
  );

  return (
    <aside className="w-full space-y-4">
      {/* Target Category Card */}
      <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-4 sm:p-5 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider block">
                Target Category
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Picks portals & filters feed
              </span>
            </div>
          </div>

          {selectedCategory !== "All" && (
            <button
              type="button"
              onClick={() => onSelectCategory("All")}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold px-2 py-0.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Category Items List */}
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full group text-left px-3 py-2.5 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${isSelected
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md shadow-indigo-600/25 font-semibold scale-[1.01]"
                    : "bg-zinc-50/70 dark:bg-zinc-800/40 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected
                        ? "bg-white/20 text-white"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 " +
                        cat.color
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs font-semibold block truncate leading-tight">
                      {cat.label}
                    </span>
                    <span
                      className={`text-[10px] block truncate mt-0.5 ${isSelected
                          ? "text-indigo-100"
                          : "text-zinc-400 dark:text-zinc-500"
                        }`}
                    >
                      {cat.description}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-indigo-400 transition-colors shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Click Student Presets Card (Expanded to 10 Options!) */}
      <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-4 sm:p-5 space-y-3.5 transition-all">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
              1-Click Student Presets
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
            {PRESETS.length} Profiles
          </span>
        </div>

        {/* Filter Pills for Presets */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setActivePresetGroup("all")}
            className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${activePresetGroup === "all"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            All (10)
          </button>
          <button
            type="button"
            onClick={() => setActivePresetGroup("tech")}
            className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${activePresetGroup === "tech"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            Tech
          </button>
          <button
            type="button"
            onClick={() => setActivePresetGroup("grants")}
            className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${activePresetGroup === "grants"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            Grants
          </button>
          <button
            type="button"
            onClick={() => setActivePresetGroup("beginner")}
            className={`flex-1 py-1 rounded-lg text-center transition cursor-pointer ${activePresetGroup === "beginner"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "hover:text-zinc-900 dark:hover:text-white"
              }`}
          >
            Starter
          </button>
        </div>

        {/* Preset Items List with max-height and custom scroll */}
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          {filteredPresets.map((preset) => {
            const Icon = preset.icon;
            const isApplied = selectedPresetId === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  onApplyPreset(preset.lookingFor, preset.profile, preset.category);
                }}
                className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer group flex items-start justify-between gap-2 ${isApplied
                    ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400/50"
                    : "border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 hover:bg-zinc-100/90 dark:hover:bg-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800"
                  }`}
              >
                <div className="flex items-start space-x-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {preset.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate mt-0.5">
                      {preset.subtitle}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                    {preset.badgeText}
                  </span>
                  {isApplied && (
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Results Filter Controls (shown if results exist) */}
      {totalOpportunitiesCount > 0 && (
        <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
              Filter Active Results
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {filteredCount} of {totalOpportunitiesCount}
            </span>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="e.g. React, Remote, Python..."
                className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Closing Soon Toggle */}
          <button
            type="button"
            onClick={onToggleClosingSoon}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border text-xs font-semibold transition cursor-pointer ${closingSoonOnly
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold shadow-xs"
                : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
          >
            <div className="flex items-center space-x-2">
              <Clock
                className={`w-3.5 h-3.5 ${closingSoonOnly ? "text-rose-500 animate-pulse" : "text-zinc-400"
                  }`}
              />
              <span>Closing Soon (within 7d)</span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center ${closingSoonOnly
                  ? "bg-rose-500 border-rose-600 text-white"
                  : "border-zinc-300 dark:border-zinc-600"
                }`}
            >
              {closingSoonOnly && <span className="text-[10px]">✓</span>}
            </div>
          </button>

          {/* Sort By Toggle */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Sort By
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => onSelectSort("fit")}
                className={`text-xs py-1.5 px-2 rounded-xl font-bold transition cursor-pointer text-center ${sortBy === "fit"
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
              >
                Best Fit Score
              </button>
              <button
                type="button"
                onClick={() => onSelectSort("deadline")}
                className={`text-xs py-1.5 px-2 rounded-xl font-bold transition cursor-pointer text-center ${sortBy === "deadline"
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
              >
                Nearest Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verified Portals Trust Badge */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-indigo-100/90 dark:border-zinc-800 text-xs space-y-1.5 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
            20 Live Portals Monitored
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Internshala, AICTE, Devfolio, MLH, Unstop, Kaggle, NSP, DAAD, GSoC,
          GirlScript, Outreachy & more.
        </p>
      </div>
    </aside>
  );
}
