import * as cheerio from 'cheerio';
import { fetchPage } from './fetch';
import { TeamMember } from '../types';

export async function extractTeam(html: string, baseUrl: string): Promise<TeamMember[]> {
  try {
    const $ = cheerio.load(html);
    let teamUrl: string | null = null;

    // 1. Find Team Page URL
    // Priority: /team -> /about -> /people -> /company
    // Also handle .php, .html extensions
    const candidates = [
      $('a[href*="/team"]').first().attr('href'),
      $('a[href*="/about"]').first().attr('href'),
      $('a[href*="/people"]').first().attr('href'),
      $('a[href*="/company"]').first().attr('href'),
      $('a[href*="team"]').first().attr('href'), // looser match
      $('a[href*="about"]').first().attr('href')
    ];

    for (const href of candidates) {
      if (href) {
        try {
          // Handle ./ relative paths
          teamUrl = new URL(href, baseUrl).toString();
          break;
        } catch (e) {}
      }
    }

    if (!teamUrl) return [];

    // 2. Fetch Team Page
    let teamHtml = html;
    if (teamUrl !== baseUrl && !teamUrl.includes('#')) {
      try {
        const res = await fetchPage(teamUrl);
        teamHtml = res.html;
      } catch (e) {
        console.warn(`[Team Scraper] Failed to fetch team page: ${teamUrl}`);
        // Fallback to current page if fetch fails
      }
    }

    // 3. Extract Members
    const $team = cheerio.load(teamHtml);
    const members: TeamMember[] = [];

    // Heuristic: Look for repeated structures with images and text
    const selectors = [
      '.team-member', '.team_member', '.member', '.person', '.profile', 
      '[class*="team-member"]', '[class*="team_member"]', '[class*="TeamMember"]',
      '.w-dyn-item', // Webflow
      '.elementor-widget-image-box', // Elementor
      '.wp-block-column', // WordPress columns often used for team
      'div[class*="col-"]' // Bootstrap columns (risky but common)
    ];

    let foundContainer = false;

    for (const selector of selectors) {
      const elements = $team(selector);
      if (elements.length >= 2) { // Need at least 2 to be considered a list
        elements.each((_, el) => {
          const name = $team(el).find('h3, h4, h5, .name, [class*="name"], strong').first().text().trim();
          const role = $team(el).find('.role, .position, .job-title, [class*="role"], p, em').first().text().trim();
          const img = $team(el).find('img').attr('src');
          
          // Basic validation: Name should be short, Role optional
          if (name && name.length > 2 && name.length < 40 && img) { 
             let imageUrl = null;
             try {
               imageUrl = new URL(img, teamUrl!).toString();
             } catch (e) {}

             members.push({
               name,
               role: role !== name ? role : null, // Role shouldn't be same as name
               bio: null,
               image: imageUrl,
               socials: {}
             });
          }
        });
        
        if (members.length > 0) {
          foundContainer = true;
          break; 
        }
      }
    }

    // Fallback: Look for sections with "Team" or "Leadership" headers
    if (!foundContainer) {
      const headers = $team('h1, h2, h3, h4').filter((_, el) => {
        const text = $team(el).text().toLowerCase();
        return text.includes('team') || text.includes('leadership') || text.includes('people') || text.includes('management');
      });

      headers.each((_, header) => {
        // Look in the parent section or container
        const container = $team(header).closest('section, div, main');
        const images = container.find('img');
        
        if (images.length >= 2) {
          images.each((_, img) => {
            const imgEl = $team(img);
            // Skip small icons
            const width = imgEl.attr('width');
            if (width && parseInt(width) < 50) return;

            const name = imgEl.parent().text().trim() || imgEl.parent().next().text().trim() || imgEl.attr('alt');
            const src = imgEl.attr('src');

            if (name && name.length > 2 && name.length < 40 && src) {
               let imageUrl = null;
               try {
                 imageUrl = new URL(src, teamUrl!).toString();
               } catch (e) {}

               // Avoid duplicates
               if (!members.find(m => m.name === name)) {
                 members.push({
                   name: name.split('\n')[0].trim(), // Take first line
                   role: null,
                   bio: null,
                   image: imageUrl,
                   socials: {}
                 });
               }
            }
          });
        }
      });
    }

    return members.slice(0, 20); // Limit to 20 members
  } catch (error) {
    console.error("[Team Scraper] Error:", error);
    return [];
  }
}
