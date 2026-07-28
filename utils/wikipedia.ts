/**
 * Looks up a short Wikipedia summary for a celestial object name.
 * Tries the raw name first, then a cleaned version with catalog
 * prefixes (NGC/M/HD/...) and parenthetical suffixes stripped, since
 * Wikipedia article titles rarely match catalog designations exactly.
 */
export async function fetchWikipediaSummary(objectName: string): Promise<string | null> {
  const cleanName = objectName
    .replace(/^(HD|HR|HIP|NGC|M|IC)\s+/, "")
    .replace(/\s+\([^)]+\)$/, "")
    .trim();

  const candidates = Array.from(new Set([objectName, cleanName].filter(Boolean)));

  for (const term of candidates) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(
        term
      )}&prop=extracts&exintro&explaintext&exsentences=3&redirects=1`;

      const response = await fetch(url);
      const data = await response.json();
      const pages = data?.query?.pages ?? {};
      const pageId = Object.keys(pages)[0];

      if (pageId && pageId !== "-1" && pages[pageId]?.extract) {
        return pages[pageId].extract as string;
      }
    } catch (err) {
      console.warn(`Wikipedia fetch failed for "${term}":`, err);
    }
  }

  return null;
}
