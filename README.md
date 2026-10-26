# 🛰️ Opportunity Radar

> Live opportunities from 20 trusted sources, matched directly to Indian college students using real-time web extraction & AI.

Opportunity Radar finds **CURRENTLY OPEN** internships, hackathons, competitions, scholarships, fellowships, and open-source programs that match a student's profile. It uses live web data from **TinyFish API** (Search & Fetch) combined with **Google Gemini** (`@google/genai`) to eliminate expired deadlines, verify live evidence quotes, score profile fit, and stream live progress via Server-Sent Events (SSE).

---

## ✨ Features

- **Live Web Intelligence:** Never shows outdated or hallucinated listings. Every opportunity is fetched live from official portals and verified against today's date.
- **Strict Deadline Validation:** Automatically drops expired listings in code. If an opportunity deadline has passed today's date, it is dropped. Missing deadlines are explicitly labeled.
- **20 Trusted Portals:** Includes Internshala, Devfolio, AICTE, Unstop, Kaggle, Buddy4Study, Teach For India, GSoC, GSSoC, DoraHacks, MLH, and more.
- **Fit Scoring & Personalization:** Scores match quality (1-10) and provides a personalized explanation (*"Why it matches you"*) for each recommendation.
- **Real-Time SSE Progress Stepper:** Live visual tracking:
  1. *Understanding you* (AI keyword extraction)
  2. *Searching trusted sites* (TinyFish Search across portal domains + open web)
  3. *AI Triaging* (Filters out listicles and blogs, keeps specific opportunity pages)
  4. *Reading pages* (TinyFish Fetch in batches of 10 with 30-min in-memory cache)
  5. *Matching & Scoring* (Gemini parallel extraction with fit scores & quote evidence)
  6. *Validation & Ranking* (Deduplication, deadline filtering, and sorting)
- **Portal Status Monitor:** Collapsible inspection drawer showing live health status (`ok`, `thin`, `failed`), character count, and opportunity count for all 20 sources.
- **Aesthetic Modern UI:** Indigo accent theme, responsive card grid, deadline proximity alerts (red badge for &le; 7 days), dark mode support, and filter controls.

---

## 🚀 Quick Setup in 4 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Keys
Create or edit `.env.local` in the root directory:
```env
# TinyFish API Key (from https://agent.tinyfish.ai/api-keys)
TINYFISH_API_KEY=your_tinyfish_api_key_here

# Google Gemini API Key (from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Fast Gemini Flash Model (default: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash
```
*(All keys remain strictly server-side and are never exposed to the client.)*

### Step 3: Test All 20 Trusted Sources
Verify your TinyFish connection and check live fetch status across all 20 portals:
```bash
npm run test:sources
```
This prints a clean console table showing:
- Source Name & Category
- Status (`✅ ok` &ge; 500 chars, `⚠️ thin` &lt; 500 chars, `❌ failed`)
- Characters returned
- First 120 characters snippet
- `jsHeavy` classification

### Step 4: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ How to Add or Remove Trusted Sources

All sources are configured in a single, typed file: [`config/sources.ts`](./config/sources.ts).

To add a new portal, add an entry to the `TRUSTED_SOURCES` array:
```typescript
{
  name: "Smart India Hackathon",
  url: "https://www.sih.gov.in/",
  domain: "sih.gov.in",
  category: "Hackathons",
  jsHeavy: false
}
```

To remove a portal, simply delete its object from `TRUSTED_SOURCES`. The pipeline automatically adjusts search domain filters and listing fetch targets accordingly.

---

## 📌 Note on `jsHeavy` Portals & TinyFish Agent API

Portals marked `jsHeavy: true` in `config/sources.ts` (e.g. Unstop, Buddy4Study, DoraHacks, Hack2skill) rely heavily on client-side JavaScript hydration.
- The standard **TinyFish Fetch API** strips scripts and renders clean textual content. For some Single Page Applications (SPAs), Fetch may return thin or shell HTML (&lt; 500 characters).
- These `jsHeavy` sources are prime candidates for the **TinyFish Agent API** (`client.agent.run`) in a future version to perform full browser rendering and autonomous page interaction.

---

## 🔍 Debugging & Console Logs

Opportunity Radar includes comprehensive server-side logging for transparency:
- **Generated Queries:** Shows search queries formulated from user profile and intent.
- **Search Results Gathered:** Logs candidate URLs per query and open-web search.
- **AI Triage Decisions:** Logs chosen URLs and reasons for keeping/rejecting pages.
- **Fetch Metrics:** Logs characters returned and cached status per URL.
- **Extraction Results:** Displays count of extracted opportunities per source page.
- **Validation Drops:** Logs items dropped due to expired deadlines or lack of information.

---

## 🛡️ License

MIT License. Built for Indian college students seeking active opportunities.
