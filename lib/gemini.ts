import { GoogleGenAI } from "@google/genai";
import { OpportunityCategory } from "@/config/sources";

export interface StudentProfileUnderstanding {
  categories: OpportunityCategory[];
  keywords: string[];
  skills: string[];
  level: string;
  location_preference: string;
  search_queries: string[];
}

export interface TriagedUrl {
  url: string;
  reason: string;
}

export type OpportunityType =
  | "Internship"
  | "Hackathon"
  | "Competition"
  | "Scholarship"
  | "Fellowship"
  | "Open Source";

export type OpportunityMode =
  | "Online"
  | "In-person"
  | "Hybrid"
  | "Remote"
  | "Unknown";

export interface ExtractedOpportunity {
  title: string;
  organization: string;
  type: OpportunityType;
  mode: OpportunityMode;
  location: string;
  deadline_text: string;
  deadline_iso: string | null;
  eligibility: string;
  stipend_or_prize: string | null;
  link: string;
  evidence: string;
  keyword_matches: string[];
  fit_score: number; // 1-10
  why_it_fits: string;
  source_name?: string;
}

function getGeminiClient(): GoogleGenAI {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API key in .env.local"
    );
  }
  return new GoogleGenAI({ apiKey });
}

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

function getCandidateModels(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  const candidates = [
    configured,
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
  ].filter((m): m is string => Boolean(m && m.length > 0));
  return Array.from(new Set(candidates));
}

async function generateContentWithFallback(
  ai: GoogleGenAI,
  req: { contents: string; config?: any },
  label: string
) {
  const models = getCandidateModels();
  let lastError: any;

  for (const model of models) {
    try {
      console.log(`[${label}] Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: req.contents,
        config: req.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isTransientOrUnavailable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.status === 404 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("RESOURCE_EXHAUSTED") ||
        err?.message?.includes("quota") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("no longer available") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("not found");

      console.warn(
        `[${label}] Model ${model} failed (${err?.status || "err"}): ${err?.message?.slice(0, 100)}`
      );

      if (isTransientOrUnavailable) {
        if (err?.status === 429 || err?.message?.includes("429")) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        console.warn(`[${label}] Falling back to next available Gemini model...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Step 1: Understand user request and profile using Gemini
 */
export async function understandStudentProfile(params: {
  lookingFor: string;
  profile: string;
  selectedCategories?: string[];
  todayIso: string;
}): Promise<StudentProfileUnderstanding> {
  const ai = getGeminiClient();

  const systemPrompt = `You are an expert advisor for Indian college students seeking opportunities.
Today's date is: ${params.todayIso}.

Analyze the user's intent and student profile to extract structured search criteria.
Allowed categories: ["Internships", "Hackathons", "Competitions", "Scholarships", "Fellowships", "Open Source"].
If the user specified selected categories other than "All", prioritize those.

Return a valid JSON object matching this schema:
{
  "categories": ["Internships", ...],
  "keywords": ["machine learning", "NLP", "Python", "stipend"], // 5-8 specific keywords
  "skills": ["Python", ...],
  "level": "1st year | 2nd year | 3rd year | final year | graduate",
  "location_preference": "remote | <city> | any",
  "search_queries": [
    // 5 short, specific search queries combining keywords with opportunity words like:
    // "internship apply", "hackathon registration open", "scholarship 2026-27 last date", "fellowship 2027 apply"
  ]
}`;

  const userPrompt = `What I'm looking for:
${params.lookingFor || "Opportunities matching my profile"}

My Profile:
${params.profile || "College student in India"}

Category preference: ${params.selectedCategories?.join(", ") || "All"}`;

  const response = await generateContentWithFallback(
    ai,
    {
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    },
    "Gemini Understand"
  );

  const text = response.text || "{}";
  const parsed = JSON.parse(cleanJsonText(text)) as StudentProfileUnderstanding;

  console.log("[Gemini Understand] Extracted categories:", parsed.categories);
  console.log("[Gemini Understand] Extracted keywords:", parsed.keywords);
  console.log("[Gemini Understand] Search queries:", parsed.search_queries);

  return parsed;
}

/**
 * Step 3: Triage search results to pick 8 most promising URLs
 */
export async function triageSearchResults(params: {
  searchResults: Array<{ title: string; snippet?: string; url: string; date?: string; site_name?: string }>;
  keywords: string[];
  todayIso: string;
}): Promise<TriagedUrl[]> {
  if (params.searchResults.length === 0) return [];

  const ai = getGeminiClient();

  const prompt = `You are evaluating web search results for an Indian student seeking current opportunities.
Today's date: ${params.todayIso}
Keywords: ${params.keywords.join(", ")}

Search Results:
${JSON.stringify(params.searchResults.slice(0, 30), null, 2)}

Instructions:
1. Pick up to 8 of the MOST PROMISING URLs that look like a SPECIFIC opportunity page or a live listing page.
2. REJECT listicles ("top 10", "best", "how to", "tips", "blogs"), news recaps, winners/results pages, past events, and anything clearly past its date.
3. Return a JSON array:
[
  { "url": "https://...", "reason": "Specific live hackathon page matching ML keywords" }
]`;

  console.log(`[Gemini Triage] Triaging ${params.searchResults.length} search results`);

  const response = await generateContentWithFallback(
    ai,
    {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    },
    "Gemini Triage"
  );

  const text = response.text || "[]";
  const parsed = JSON.parse(cleanJsonText(text)) as TriagedUrl[];
  console.log(`[Gemini Triage] Selected ${parsed.length} promising URLs:`);
  parsed.forEach((item) => console.log(`  - [${item.url}] -> Reason: ${item.reason}`));

  return parsed;
}

/**
 * Step 5: Extract and match opportunities from a single page's text
 */
export async function extractAndMatchPage(params: {
  pageText: string;
  pageUrl: string;
  sourceName: string;
  todayIso: string;
  keywords: string[];
  profile: string;
}): Promise<ExtractedOpportunity[]> {
  const truncatedText = params.pageText.slice(0, 20000);
  if (truncatedText.trim().length < 50) {
    return [];
  }

  const ai = getGeminiClient();

  const prompt = `Extract ONLY real, specific opportunities that are currently open or upcoming as of today (${params.todayIso}).
Ignore ads, navigation, and expired items.
If the page only shows past dates or the program is between cycles, return an empty array.
NEVER invent or guess deadlines.

Page URL: ${params.pageUrl}
Source Name: ${params.sourceName}
Student Profile: ${params.profile}
Target Keywords: ${params.keywords.join(", ")}

Page Content:
${truncatedText}

Return a JSON array, max 10 items:
[
  {
    "title": "Opportunity Title",
    "organization": "Organizer or Company Name",
    "type": "Internship" | "Hackathon" | "Competition" | "Scholarship" | "Fellowship" | "Open Source",
    "mode": "Online" | "In-person" | "Hybrid" | "Remote" | "Unknown",
    "location": "City/Country or Remote",
    "deadline_text": "e.g. 15 March 2026 or Rolling",
    "deadline_iso": "YYYY-MM-DD or null",
    "eligibility": "one line summary of who can apply",
    "stipend_or_prize": "e.g. ₹25,000/month or ₹5,00,000 prize or null",
    "link": "specific opportunity URL if present in the page, otherwise the page URL",
    "evidence": "short quote from the page showing the deadline or open status",
    "keyword_matches": ["machine learning", "Python"],
    "fit_score": 9, // integer 1-10 based on keywords, skills, level, location
    "why_it_fits": "One sentence written directly to the student explaining why this matches their background"
  }
]`;

  try {
    const response = await generateContentWithFallback(
      ai,
      {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      },
      "Gemini Extract"
    );

    const text = response.text || "[]";
    const parsed = JSON.parse(cleanJsonText(text)) as ExtractedOpportunity[];
    console.log(`[Gemini Extract] ${params.sourceName} (${params.pageUrl}) -> Found ${parsed.length} items`);
    return parsed.map((item) => ({
      ...item,
      source_name: params.sourceName,
    }));
  } catch (err) {
    console.error(`[Gemini Extract] Error parsing page ${params.pageUrl}:`, err);
    return [];
  }
}

