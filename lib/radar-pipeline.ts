import { TRUSTED_SOURCES, OpportunityCategory, TrustedSource } from "@/config/sources";
import { searchTinyFish, fetchTinyFishUrls, SourceFetchStatus, TinyFishError } from "@/lib/tinyfish";
import {
  understandStudentProfile,
  triageSearchResults,
  extractAndMatchPage,
  ExtractedOpportunity,
  StudentProfileUnderstanding,
} from "@/lib/gemini";

export interface RadarPipelineInput {
  lookingFor: string;
  profile: string;
  category?: string; // "All" or a specific category name
}

export interface PipelineProgressEvent {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  stage: "understanding" | "searching" | "triaging" | "reading" | "matching" | "complete" | "error";
  message: string;
  data?: {
    understanding?: StudentProfileUnderstanding;
    keywords?: string[];
    queriesCount?: number;
    searchResultsCount?: number;
    pagesToReadCount?: number;
    activePage?: { url: string; sourceName: string; status: string; charCount: number };
    readPages?: Array<{ url: string; title: string; status: string; charCount: number; sourceName: string }>;
    opportunities?: ExtractedOpportunity[];
    sourcesStatus?: SourceFetchStatus[];
    errorDetails?: string;
  };
}

// Concurrency helper for Step 5 (max 4 concurrent Gemini extraction calls)
async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        console.error(`Error in worker at index ${idx}:`, err);
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function normalizeStr(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Execute the complete Opportunity Radar pipeline with SSE progress reporting
 */
export async function runOpportunityRadarPipeline(
  input: RadarPipelineInput,
  emit: (event: PipelineProgressEvent) => void
): Promise<ExtractedOpportunity[]> {
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  console.log(`[Radar Pipeline] Starting for: "${input.lookingFor}" (Date: ${todayIso})`);

  // Initialize source statuses
  const sourcesMap = new Map<string, SourceFetchStatus>();
  TRUSTED_SOURCES.forEach((s) => {
    sourcesMap.set(s.url, {
      sourceName: s.name,
      domain: s.domain,
      url: s.url,
      status: "not_used",
      charCount: 0,
      opportunityCount: 0,
    });
  });

  try {
    // ==========================================
    // STEP 1 - UNDERSTAND (Gemini)
    // ==========================================
    emit({
      step: 1,
      stage: "understanding",
      message: "Analyzing your profile and goal with Gemini AI...",
    });

    const understanding = await understandStudentProfile({
      lookingFor: input.lookingFor,
      profile: input.profile,
      selectedCategories: input.category && input.category !== "All" ? [input.category] : undefined,
      todayIso,
    });

    emit({
      step: 1,
      stage: "understanding",
      message: `Extracted ${understanding.keywords.length} target keywords & search queries`,
      data: {
        understanding,
        keywords: understanding.keywords,
      },
    });

    // Determine relevant categories and sources
    const activeCategories: OpportunityCategory[] =
      input.category && input.category !== "All"
        ? [input.category as OpportunityCategory]
        : understanding.categories && understanding.categories.length > 0
        ? understanding.categories
        : ["Internships", "Hackathons", "Competitions", "Scholarships", "Fellowships", "Open Source"];

    const relevantSources = TRUSTED_SOURCES.filter((s) =>
      activeCategories.includes(s.category)
    );
    const includeDomains = Array.from(new Set(relevantSources.map((s) => s.domain))).join(",");

    console.log(`[Radar Pipeline] Active categories: ${activeCategories.join(", ")}`);
    console.log(`[Radar Pipeline] Target domains: ${includeDomains}`);

    // ==========================================
    // STEP 2 - GATHER (Search & Source Listings in Parallel)
    // ==========================================
    emit({
      step: 2,
      stage: "searching",
      message: `Searching live web on ${relevantSources.length} trusted sources...`,
      data: {
        keywords: understanding.keywords,
        queriesCount: understanding.search_queries.length,
      },
    });

    // Run A (Search) and B (Source listing pages) in parallel
    const [rawSearchResults, listingUrls] = await Promise.all([
      // A) TinyFish searches
      (async () => {
        const searchPromises = understanding.search_queries.slice(0, 5).map(async (query) => {
          try {
            return await searchTinyFish({
              query,
              location: "IN",
              language: "en",
              after_date: sixtyDaysAgo,
              include_domains: includeDomains,
            });
          } catch (e) {
            console.warn(`[Radar Pipeline] Search failed for query "${query}":`, e);
            return [];
          }
        });

        // Plus ONE extra open-web search with best query excluding social media
        const bestQuery = understanding.search_queries[0] || `${understanding.keywords.join(" ")} opportunity`;
        const openWebPromise = (async () => {
          try {
            console.log(`[Radar Pipeline] Running extra open-web search for: "${bestQuery}"`);
            return await searchTinyFish({
              query: bestQuery,
              location: "IN",
              language: "en",
              after_date: sixtyDaysAgo,
              exclude_domains:
                "instagram.com,facebook.com,x.com,twitter.com,linkedin.com,youtube.com,reddit.com,pinterest.com,quora.com,medium.com",
            });
          } catch (e) {
            console.warn("[Radar Pipeline] Open web search failed:", e);
            return [];
          }
        })();

        const allResults = await Promise.all([...searchPromises, openWebPromise]);
        const flatResults = allResults.flat();

        // Dedupe by URL and max 3 per domain
        const seenUrls = new Set<string>();
        const domainCountMap = new Map<string, number>();
        const filteredResults: typeof flatResults = [];

        for (const r of flatResults) {
          if (!r.url || seenUrls.has(r.url)) continue;
          seenUrls.add(r.url);

          let domain = "";
          try {
            domain = new URL(r.url).hostname.replace(/^www\./, "");
          } catch {
            domain = r.site_name || "unknown";
          }

          const count = domainCountMap.get(domain) || 0;
          if (count < 3) {
            domainCountMap.set(domain, count + 1);
            filteredResults.push(r);
          }
        }

        console.log(`[Radar Pipeline] Gathered ${filteredResults.length} deduped search URLs`);
        return filteredResults;
      })(),

      // B) Source listing pages
      (async () => {
        const baseListingUrls = relevantSources.map((s) => s.url);

        // For Internshala, also try top 2 keyword slugs
        const internshalaKeywordUrls: string[] = [];
        const topKeywords = understanding.keywords.slice(0, 2);
        for (const kw of topKeywords) {
          const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (slug) {
            internshalaKeywordUrls.push(`https://internshala.com/internships/${slug}-internship/`);
          }
        }

        return [...baseListingUrls, ...internshalaKeywordUrls];
      })(),
    ]);

    emit({
      step: 2,
      stage: "searching",
      message: `Found ${rawSearchResults.length} candidate URLs across search queries. Triaging best leads...`,
      data: {
        searchResultsCount: rawSearchResults.length,
      },
    });

    // ==========================================
    // STEP 3 - TRIAGE SEARCH RESULTS (Gemini)
    // ==========================================
    emit({
      step: 3,
      stage: "triaging",
      message: "AI triaging top 8 high-signal opportunity pages...",
    });

    const triaged = await triageSearchResults({
      searchResults: rawSearchResults.map((r) => ({
        title: r.title,
        snippet: r.snippet,
        url: r.url,
        date: r.date,
        site_name: r.site_name,
      })),
      keywords: understanding.keywords,
      todayIso,
    });

    const triagedUrls = triaged.map((t) => t.url);
    const allUrlsToFetch = Array.from(new Set([...listingUrls, ...triagedUrls]));

    console.log(`[Radar Pipeline] Total URLs to fetch: ${allUrlsToFetch.length} (${listingUrls.length} listings + ${triagedUrls.length} triaged)`);

    // ==========================================
    // STEP 4 - FETCH (TinyFish Fetch in batches of max 10)
    // ==========================================
    emit({
      step: 4,
      stage: "reading",
      message: `Fetching clean content for ${allUrlsToFetch.length} live opportunity pages...`,
      data: {
        pagesToReadCount: allUrlsToFetch.length,
      },
    });

    const readPagesRecord: Array<{ url: string; title: string; status: string; charCount: number; sourceName: string }> = [];

    const fetchedPages = await fetchTinyFishUrls(allUrlsToFetch, (url, status, chars) => {
      // Find matching source
      const matchedSource = TRUSTED_SOURCES.find((s) => url.startsWith(s.url) || url.includes(s.domain));
      const sourceName = matchedSource ? matchedSource.name : new URL(url).hostname;

      if (matchedSource && sourcesMap.has(matchedSource.url)) {
        const current = sourcesMap.get(matchedSource.url)!;
        current.status = status === "ok" ? "ok" : status === "thin" ? "thin" : "failed";
        current.charCount = chars;
      }

      readPagesRecord.push({
        url,
        title: sourceName,
        status,
        charCount: chars,
        sourceName,
      });

      emit({
        step: 4,
        stage: "reading",
        message: `Reading: ${sourceName} (${chars > 0 ? `${chars} chars` : status})`,
        data: {
          activePage: { url, sourceName, status, charCount: chars },
          readPages: readPagesRecord.slice(-15),
          sourcesStatus: Array.from(sourcesMap.values()),
        },
      });
    });

    // Filter pages that have sufficient text (ok or thin > 50 chars)
    const validPages: Array<{ url: string; text: string; sourceName: string }> = [];
    for (const [url, data] of fetchedPages.entries()) {
      if (data.text && data.text.length >= 50) {
        const matchedSource = TRUSTED_SOURCES.find((s) => url.startsWith(s.url) || url.includes(s.domain));
        const sourceName = matchedSource ? matchedSource.name : new URL(url).hostname;
        validPages.push({
          url,
          text: data.text,
          sourceName,
        });
      }
    }

    console.log(`[Radar Pipeline] Fetch completed. ${validPages.length} pages ready for extraction.`);

    // ==========================================
    // STEP 5 - EXTRACT AND MATCH (Gemini, max 4 concurrent)
    // ==========================================
    emit({
      step: 5,
      stage: "matching",
      message: `Extracting active opportunities and scoring fit across ${validPages.length} pages...`,
    });

    let processedCount = 0;
    const extractedNested = await mapConcurrent(validPages, 2, async (page) => {
      const items = await extractAndMatchPage({
        pageText: page.text,
        pageUrl: page.url,
        sourceName: page.sourceName,
        todayIso,
        keywords: understanding.keywords,
        profile: input.profile,
      });

      processedCount++;
      emit({
        step: 5,
        stage: "matching",
        message: `Extracted from ${page.sourceName} (${processedCount}/${validPages.length} pages analyzed)`,
      });

      return items;
    });

    const allExtracted = extractedNested.flat().filter(Boolean);
    console.log(`[Radar Pipeline] Total raw extracted opportunities: ${allExtracted.length}`);

    // ==========================================
    // STEP 6 - VALIDATE AND RANK (In Code)
    // ==========================================
    emit({
      step: 6,
      stage: "matching",
      message: "Validating deadlines and ranking best matches...",
    });

    // 1. Drop items where deadline_iso is strictly before today
    const nonExpired: ExtractedOpportunity[] = [];
    let droppedExpiredCount = 0;

    for (const item of allExtracted) {
      if (item.deadline_iso) {
        const deadlineDate = item.deadline_iso.slice(0, 10);
        if (deadlineDate < todayIso) {
          droppedExpiredCount++;
          console.log(`[Radar Pipeline] Dropping expired opportunity: "${item.title}" (deadline was ${deadlineDate})`);
          continue;
        }
      }
      nonExpired.push(item);
    }
    console.log(`[Radar Pipeline] Dropped ${droppedExpiredCount} expired items. ${nonExpired.length} valid items remaining.`);

    // 2. Items with deadline_iso null are kept but labelled "Deadline not listed - check link"
    for (const item of nonExpired) {
      if (!item.deadline_iso && (!item.deadline_text || item.deadline_text.toLowerCase().includes("null"))) {
        item.deadline_text = "Deadline not listed - check link";
      }
    }

    // 3. Dedupe by normalized title + organization (keep the one with more info)
    const dedupedMap = new Map<string, ExtractedOpportunity>();
    for (const item of nonExpired) {
      const key = `${normalizeStr(item.title)}_${normalizeStr(item.organization)}`;
      const existing = dedupedMap.get(key);
      if (!existing) {
        dedupedMap.set(key, item);
      } else {
        // Compare information richness (length of eligibility + evidence + why_it_fits)
        const currentRichness = (item.eligibility?.length || 0) + (item.evidence?.length || 0) + (item.stipend_or_prize?.length || 0);
        const existingRichness = (existing.eligibility?.length || 0) + (existing.evidence?.length || 0) + (existing.stipend_or_prize?.length || 0);
        if (currentRichness > existingRichness) {
          dedupedMap.set(key, item);
        }
      }
    }

    const uniqueOpportunities = Array.from(dedupedMap.values());

    // 4. Sort by fit_score desc, then nearest deadline
    uniqueOpportunities.sort((a, b) => {
      if (b.fit_score !== a.fit_score) {
        return b.fit_score - a.fit_score;
      }
      if (a.deadline_iso && b.deadline_iso) {
        return a.deadline_iso.localeCompare(b.deadline_iso);
      }
      if (a.deadline_iso) return -1;
      if (b.deadline_iso) return 1;
      return 0;
    });

    // Max 30
    const finalOpportunities = uniqueOpportunities.slice(0, 30);

    // Update opportunity count per source
    finalOpportunities.forEach((opp) => {
      const matched = TRUSTED_SOURCES.find((s) => s.name === opp.source_name || opp.link.includes(s.domain));
      if (matched && sourcesMap.has(matched.url)) {
        sourcesMap.get(matched.url)!.opportunityCount++;
      }
    });

    console.log(`[Radar Pipeline] Completed successfully. Delivering ${finalOpportunities.length} ranked opportunities.`);

    emit({
      step: 6,
      stage: "complete",
      message: `Found ${finalOpportunities.length} currently open opportunities matched to you!`,
      data: {
        opportunities: finalOpportunities,
        sourcesStatus: Array.from(sourcesMap.values()),
        keywords: understanding.keywords,
      },
    });

    return finalOpportunities;
  } catch (err: unknown) {
    console.error("[Radar Pipeline] Unhandled pipeline error:", err);
    const errText = (err as Error)?.message || "";
    const isApiKeyMissing = errText.includes("GEMINI_API_KEY");
    const isQuotaExceeded =
      errText.includes("RESOURCE_EXHAUSTED") ||
      errText.includes("quota") ||
      errText.includes("429");

    const friendlyMessage =
      err instanceof TinyFishError
        ? err.friendlyMessage
        : isApiKeyMissing
        ? "Gemini API key is missing or invalid. Please check .env.local"
        : isQuotaExceeded
        ? "Gemini daily request quota exceeded. Please wait or use a different key."
        : errText || "An unexpected error occurred while running Opportunity Radar";

    emit({
      step: 6,
      stage: "error",
      message: friendlyMessage,
      data: {
        errorDetails: (err as Error).message,
        sourcesStatus: Array.from(sourcesMap.values()),
      },
    });

    throw err;
  }
}
