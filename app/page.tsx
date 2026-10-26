"use client";

import React, { useState, useMemo, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroForm } from "@/components/HeroForm";
import { CategorySidebar } from "@/components/CategorySidebar";
import { ProgressTracker } from "@/components/ProgressTracker";
import { OpportunityCard } from "@/components/OpportunityCard";
import { SourcesPanel } from "@/components/SourcesPanel";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ExtractedOpportunity } from "@/lib/gemini";
import { PipelineProgressEvent } from "@/lib/radar-pipeline";
import { SourceFetchStatus } from "@/lib/tinyfish";
import { TRUSTED_SOURCES } from "@/config/sources";
import { Scene3DBackground } from "@/components/Scene3DBackground";
import { ScrollProgress3D } from "@/components/ScrollProgress3D";
import { StatsHoloDeck3D } from "@/components/StatsHoloDeck3D";
import { Sparkles, ArrowDownUp, CheckCircle, ShieldCheck } from "lucide-react";

function matchesCategory(itemType: string, selectedCat: string): boolean {
  if (!selectedCat || selectedCat === "All") return true;
  const normType = (itemType || "").toLowerCase().replace(/[^a-z]/g, "");
  const normCat = (selectedCat || "").toLowerCase().replace(/[^a-z]/g, "");
  return normType.includes(normCat) || normCat.includes(normType);
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<PipelineProgressEvent | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [readPages, setReadPages] = useState<
    Array<{ url: string; title: string; status: string; charCount: number; sourceName: string }>
  >([]);
  const [opportunities, setOpportunities] = useState<ExtractedOpportunity[]>([]);
  const [sourcesStatus, setSourcesStatus] = useState<SourceFetchStatus[]>(() =>
    TRUSTED_SOURCES.map((s) => ({
      sourceName: s.name,
      domain: s.domain,
      url: s.url,
      status: "not_used",
      charCount: 0,
      opportunityCount: 0,
    }))
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [lookingFor, setLookingFor] = useState("");
  const [profile, setProfile] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Secondary Filter & Sort State
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"fit" | "deadline">("fit");
  const [searchQuery, setSearchQuery] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleStartRadar = async (formInput: {
    lookingFor: string;
    profile: string;
    category: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentEvent(null);
    setKeywords([]);
    setReadPages([]);
    setOpportunities([]);

    try {
      const response = await fetch("/api/radar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formInput),
      });

      if (!response.ok) {
        let errMessage = "Failed to start Opportunity Radar";
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore json parse error
        }
        setErrorMessage(errMessage);
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response stream body received from server");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(trimmed.slice(6)) as PipelineProgressEvent;
              setCurrentEvent(eventData);

              if (eventData.data?.keywords && eventData.data.keywords.length > 0) {
                setKeywords(eventData.data.keywords);
              }

              if (eventData.data?.readPages) {
                setReadPages(eventData.data.readPages);
              }

              if (eventData.data?.sourcesStatus) {
                setSourcesStatus(eventData.data.sourcesStatus);
              }

              if (eventData.data?.opportunities) {
                setOpportunities(eventData.data.opportunities);
              }

              if (eventData.stage === "error") {
                setErrorMessage(eventData.message);
              }
            } catch (err) {
              console.error("Failed to parse SSE event chunk:", err, trimmed);
            }
          }
        }
      }

      // Smooth scroll to results once scan finishes
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err: unknown) {
      console.error("Pipeline streaming failure:", err);
      setErrorMessage(
        (err as Error).message ||
        "An unexpected error occurred while communicating with the radar server."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (newLookingFor: string, newProfile: string, newCat: string) => {
    setLookingFor(newLookingFor);
    setProfile(newProfile);
    setSelectedCategory(newCat);
  };

  // Filter & Sort Pipeline
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities];

    // Filter by Category from left sidebar
    if (selectedCategory !== "All") {
      list = list.filter((item) => matchesCategory(item.type, selectedCategory));
    }

    // Filter by Closing Soon (within 7 days)
    if (closingSoonOnly) {
      list = list.filter((item) => {
        if (!item.deadline_iso) return false;
        const diff = (new Date(item.deadline_iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      });
    }

    // Filter by keyword query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        return (
          item.title?.toLowerCase().includes(q) ||
          item.organization?.toLowerCase().includes(q) ||
          item.eligibility?.toLowerCase().includes(q) ||
          item.why_it_fits?.toLowerCase().includes(q) ||
          item.mode?.toLowerCase().includes(q) ||
          item.keyword_matches?.some((k) => k.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "fit") {
        const scoreA = a.fit_score || 0;
        const scoreB = b.fit_score || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.deadline_iso && b.deadline_iso) return a.deadline_iso.localeCompare(b.deadline_iso);
        if (a.deadline_iso) return -1;
        if (b.deadline_iso) return 1;
        return 0;
      } else {
        // Nearest deadline
        if (a.deadline_iso && b.deadline_iso) return a.deadline_iso.localeCompare(b.deadline_iso);
        if (a.deadline_iso) return -1;
        if (b.deadline_iso) return 1;
        return (b.fit_score || 0) - (a.fit_score || 0);
      }
    });

    return list;
  }, [opportunities, selectedCategory, closingSoonOnly, searchQuery, sortBy]);

  const hasFiltersApplied =
    selectedCategory !== "All" || closingSoonOnly || searchQuery.trim().length > 0;

  return (
    <div className="relative min-h-screen bg-zinc-50/60 dark:bg-zinc-950/60 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* 3D Scroll Progress Visualizer */}
      <ScrollProgress3D />

      {/* 3D Depth Particle & Wireframe Universe that reacts to scrolling */}
      <Scene3DBackground />

      {/* Top Navigation */}
      <Navbar />

      {/* Full-Width Workspace: Pura Left Side Dock + Main Feed */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-5 lg:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* PURA LEFT SIDE DOCK: Sticky on scroll so it stays visible while scrolling down! */}
          <div className="w-full lg:w-80 xl:w-88 shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-1 scrollbar-thin">
            <CategorySidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedType={selectedCategory}
              onSelectType={setSelectedCategory}
              closingSoonOnly={closingSoonOnly}
              onToggleClosingSoon={() => setClosingSoonOnly(!closingSoonOnly)}
              sortBy={sortBy}
              onSelectSort={setSortBy}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalOpportunitiesCount={opportunities.length}
              filteredCount={filteredOpportunities.length}
              onApplyPreset={handleApplyPreset}
              isLoading={isLoading}
            />
          </div>

          {/* RIGHT MAIN SECTION: Hero Form, Live Pipeline Stepper, Opportunities Grid */}
          <div className="flex-1 w-full min-w-0 space-y-6">
            {/* Search and Profile Console (Find Your Next Opportunity) */}
            <HeroForm
              lookingFor={lookingFor}
              setLookingFor={setLookingFor}
              profile={profile}
              setProfile={setProfile}
              category={selectedCategory}
              onSubmit={handleStartRadar}
              isLoading={isLoading}
              onClear={() => {
                setLookingFor("");
                setProfile("");
              }}
            />

            {/* 3D Interactive Holographic Command Deck (4 Boxes) */}
            <StatsHoloDeck3D />

            {/* Live SSE AI Pipeline Stepper */}
            <ProgressTracker
              currentEvent={currentEvent}
              keywords={keywords}
              readPages={readPages}
            />

            {/* Error Banner with Retry */}
            {errorMessage && (
              <ErrorBanner
                message={errorMessage}
                onRetry={() =>
                  handleStartRadar({
                    lookingFor,
                    profile,
                    category: selectedCategory,
                  })
                }
              />
            )}

            {/* Opportunities Feed Container */}
            <div ref={resultsRef} className="space-y-4">
              {opportunities.length > 0 && (
                <>
                  {/* Results Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                            Verified Live Opportunities
                          </h2>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Verified Open
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Showing {filteredOpportunities.length} of {opportunities.length}{" "}
                          matches {selectedCategory !== "All" && `in ${selectedCategory}`}
                        </span>
                      </div>
                    </div>

                    {/* Quick Sort Options */}
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline">
                        Sort by:
                      </span>
                      <div className="inline-flex rounded-2xl p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700">
                        <button
                          type="button"
                          onClick={() => setSortBy("fit")}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${sortBy === "fit"
                              ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                        >
                          Best Fit Score
                        </button>
                        <button
                          type="button"
                          onClick={() => setSortBy("deadline")}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${sortBy === "deadline"
                              ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                        >
                          Nearest Deadline
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Opportunities Grid */}
                  {filteredOpportunities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                      {filteredOpportunities.map((opp, index) => (
                        <OpportunityCard
                          key={`${opp.title}-${opp.organization}-${index}`}
                          opportunity={opp}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      hasFiltersApplied={hasFiltersApplied}
                      onResetFilters={() => {
                        setSelectedCategory("All");
                        setClosingSoonOnly(false);
                        setSearchQuery("");
                      }}
                    />
                  )}
                </>
              )}

              {/* Zero Results State */}
              {!isLoading &&
                currentEvent?.step === 6 &&
                opportunities.length === 0 &&
                !errorMessage && <EmptyState />}
            </div>

            {/* 20 Trusted Sources Accordion */}
            <SourcesPanel sourcesStatus={sourcesStatus} />
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-zinc-700 dark:text-zinc-300">
            Opportunity Radar &bull; Intelligent Web Intelligence for Indian College Students
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Scanning 20 trusted Indian and global portals. Deadlines and status verified against live web data.
          </p>
        </div>
      </footer>
    </div>
  );
}
