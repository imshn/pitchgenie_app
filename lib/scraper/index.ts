import { ScrapeOptions, ScrapeResult } from './types';
import { normalizeUrl } from './utils/url';
import { getCachedResult, setCachedResult } from './utils/cache';
import { checkRobotsTxt } from './core/robots';
import { fetchPage } from './core/fetch';
import { extractMetadata, extractLogo, extractContacts, extractSocials, extractLinks } from './core/extract';
import { detectTechStack } from './core/tech-detect';
import { generateSummary, extractFullText } from './core/summary';
import { extractVisibleText } from './utils/text';
import { extractTeam } from './core/team';
import { fetchPageWithPuppeteer } from './core/puppeteer';

export async function scrapeLight(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const start = Date.now();
  const normalizedUrl = normalizeUrl(url);

  // 1. Check Cache
  if (!options.bypassCache) {
    const cached = await getCachedResult(normalizedUrl);
    if (cached) return cached;
  }

  // 2. Robots.txt (Soft Check)
  const robots = await checkRobotsTxt(normalizedUrl);
  
  // 3. Fetch Page (Initial attempt with axios + cheerio)
  let html: string;
  let headers: any;
  let usedPuppeteer = false;

  try {
    const initialFetch = await fetchPage(normalizedUrl, { proxy: options.proxy });
    html = initialFetch.html;
    headers = initialFetch.headers;

    // Quick check: if HTML is very small or looks like a React/Vue/Angular shell, use Puppeteer
    const isLikelySPA = html.includes('__NEXT_DATA__') || 
                        html.includes('id="__nuxt"') || 
                        html.includes('ng-version') ||
                        (html.length < 5000 && html.includes('<div id="root"'));

    // Also check if initial extraction yields no contacts
    const quickCheck = extractContacts(html);
    const hasNoContacts = quickCheck.emails.length === 0 && quickCheck.phones.length === 0;

    if (isLikelySPA || hasNoContacts) {
      console.log(`[Scraper] Detected likely SPA or no contacts, using Puppeteer for ${normalizedUrl}`);
      try {
        const puppeteerResult = await fetchPageWithPuppeteer(normalizedUrl);
        html = puppeteerResult.html;
        headers = puppeteerResult.headers;
        usedPuppeteer = true;
      } catch (puppeteerError) {
        console.error('[Scraper] Puppeteer fallback failed:', puppeteerError);
        // Continue with original HTML
      }
    }
  } catch (error) {
    throw error;
  }
  
  // 4. Extract Data
  const metadata = extractMetadata(html, normalizedUrl);
  const logo = extractLogo(html, normalizedUrl);
  const contacts = extractContacts(html);
  const socials = extractSocials(html);
  const links = extractLinks(html, normalizedUrl);
  const techStack = detectTechStack(html, headers);
  const summary = generateSummary(html);
  const content = extractFullText(html);
  
  // 5. Extract Team (Async, might fetch another page)
  const team = await extractTeam(html, normalizedUrl);

  // 6. Construct Result
  const result: ScrapeResult = {
    url: normalizedUrl,
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    favicon: metadata.favicon,
    image: metadata.image,
    logo,
    emails: contacts.emails,
    phones: contacts.phones,
    socials,
    techStack,
    summary,
    content,
    team,
    links,
    meta: {
      fetchTimeMs: Date.now() - start,
      cached: false,
      confidenceScore: calculateConfidence(metadata, contacts, techStack),
      isPartial: false,
      robotWarning: robots.warning
    }
  };

  // 7. Cache Result
  await setCachedResult(normalizedUrl, result);

  return result;
}

function calculateConfidence(meta: any, contacts: any, tech: any[]): number {
  let score = 0;
  if (meta.title) score += 20;
  if (meta.description) score += 20;
  if (contacts.emails.length > 0) score += 30;
  if (tech.length > 0) score += 10;
  if (meta.image) score += 10;
  if (meta.favicon) score += 10;
  return Math.min(100, score);
}
