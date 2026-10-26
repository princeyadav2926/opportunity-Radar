/**
 * Source Testing Script
 * Runnable with: npm run test:sources
 *
 * Fetches all 20 trusted source URLs with TinyFish Fetch and prints a table:
 * name, status, characters returned, first 120 characters of text.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { TRUSTED_SOURCES } from "../config/sources";

// Load .env.local first, fallback to .env
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

async function runTestSource() {
  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey || apiKey === "your_tinyfish_api_key_here") {
    console.error("❌ Error: Missing TINYFISH_API_KEY in .env.local");
    console.error("Please add your key to .env.local and retry.");
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`📡 OPPORTUNITY RADAR - TESTING ALL 20 TRUSTED SOURCES`);
  console.log(`======================================================\n`);
  console.log(`Total sources: ${TRUSTED_SOURCES.length}`);
  console.log(`Calling TinyFish Fetch API (max 10 URLs per batch)...\n`);

  const urls = TRUSTED_SOURCES.map((s) => s.url);
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += 10) {
    batches.push(urls.slice(i, i + 10));
  }

  const resultsMap = new Map<string, { text: string; title: string; status: "ok" | "thin" | "failed"; error?: string }>();

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Fetching batch ${i + 1}/${batches.length} (${batch.length} URLs)...`);

    try {
      const response = await fetch("https://api.fetch.tinyfish.ai", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls: batch }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Batch ${i + 1} HTTP Error ${response.status}: ${errorText}`);
        batch.forEach((url) => {
          resultsMap.set(url, { text: "", title: "", status: "failed", error: `HTTP ${response.status}` });
        });
        continue;
      }

      const data = (await response.json()) as {
        results?: Array<{ url: string; title?: string; text?: string }>;
        errors?: Array<{ url: string; error?: string }>;
      };

      if (data.results) {
        for (const item of data.results) {
          const text = item.text || "";
          const status: "ok" | "thin" | "failed" = text.length >= 500 ? "ok" : text.length > 0 ? "thin" : "failed";
          resultsMap.set(item.url, { text, title: item.title || "", status });
        }
      }

      if (data.errors) {
        for (const err of data.errors) {
          resultsMap.set(err.url, { text: "", title: "", status: "failed", error: err.error });
        }
      }

      // Any missed URLs
      for (const u of batch) {
        if (!resultsMap.has(u)) {
          resultsMap.set(u, { text: "", title: "", status: "failed", error: "Not returned" });
        }
      }
    } catch (err: unknown) {
      console.error(`❌ Batch ${i + 1} network failure:`, err);
      batch.forEach((url) => {
        resultsMap.set(url, { text: "", title: "", status: "failed", error: (err as Error).message });
      });
    }
  }

  console.log(`\n========================================================================================`);
  console.log(`SOURCE FETCH RESULTS TABLE`);
  console.log(`========================================================================================\n`);

  const tableData = TRUSTED_SOURCES.map((source) => {
    const res = resultsMap.get(source.url);
    const chars = res?.text?.length || 0;
    const cleanSnippet = (res?.text || res?.error || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);

    return {
      "Source Name": source.name,
      Category: source.category,
      Status: res?.status === "ok" ? "✅ ok" : res?.status === "thin" ? "⚠️ thin" : "❌ failed",
      "Chars Returned": chars,
      "First 120 Characters": cleanSnippet || "—",
      "jsHeavy?": source.jsHeavy ? "Yes" : "No",
    };
  });

  console.table(tableData);

  const okCount = tableData.filter((t) => t.Status.includes("ok")).length;
  const thinCount = tableData.filter((t) => t.Status.includes("thin")).length;
  const failedCount = tableData.filter((t) => t.Status.includes("failed")).length;

  console.log(`\nSummary: ${okCount} ok (>=500 chars), ${thinCount} thin (<500 chars), ${failedCount} failed`);
  console.log(`Note: Sources marked jsHeavy may render minimally with direct fetch and are prime candidates for TinyFish Agent API in future releases.\n`);
}

runTestSource().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
