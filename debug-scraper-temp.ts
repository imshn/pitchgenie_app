import { fetchPage } from "./lib/scraper/core/fetch";
import { extractMetadata } from "./lib/scraper/core/extract";
import { extractTeam } from "./lib/scraper/core/team";
import * as cheerio from "cheerio";

const targetUrl = "https://inflowtek.com/";

async function run() {
  console.log(`Scraping ${targetUrl}...`);
  
  try {
    // 1. Fetch Page
    const { html } = await fetchPage(targetUrl);
    
    // 2. Extract Data
    const metadata = extractMetadata(html, targetUrl);
    const team = await extractTeam(html, targetUrl);

    console.log("--- Scrape Result ---");
    console.log("Title:", metadata.title);
    console.log("Image:", metadata.image);
    console.log("Favicon:", metadata.favicon);
    console.log("Team Count:", team.length);
    console.log("---------------------");

    // 3. Deep dive into HTML if image is missing
    if (!metadata.image) {
      console.log("\n[DEBUG] Image is missing. Fetching raw HTML to inspect...");
      const $ = cheerio.load(html);
      
      console.log("og:image:", $('meta[property="og:image"]').attr('content'));
      console.log("twitter:image:", $('meta[name="twitter:image"]').attr('content'));
      console.log("rel=icon:", $('link[rel="icon"]').attr('href'));
      console.log("rel=shortcut icon:", $('link[rel="shortcut icon"]').attr('href'));
      
      // Check for team links
      console.log("\n[DEBUG] Checking for team links...");
      const links = $('a').map((_, el) => $(el).attr('href')).get();
      const teamLinks = links.filter(l => l && (l.includes('team') || l.includes('about') || l.includes('people')));
      console.log("Potential Team Links:", teamLinks);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

run();
