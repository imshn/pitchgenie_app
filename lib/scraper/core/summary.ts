import * as cheerio from 'cheerio';
import { cleanText } from '../utils/text';

export function generateSummary(html: string): string | null {
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, noscript, iframe, svg, nav, footer, header, aside, form, button').remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  
  // Remove cookie banners, popups (heuristic)
  $('.cookie-banner, #cookie-banner, .popup, .modal').remove();

  // Extract paragraphs, headings, and other text content
  const blocks: string[] = [];
  
  // Try to extract from main content areas first
  $('main, article, section, .content, #content').find('h1, h2, h3, h4, p, li, div').each((_, el) => {
    const text = cleanText($(el).text());
    if (text.length > 20 && 
        !text.toLowerCase().includes('copyright') &&
        !text.toLowerCase().includes('all rights reserved') &&
        !text.toLowerCase().includes('subscribe')
    ) {
      blocks.push(text);
    }
  });

  // If no main content, try body
  if (blocks.length === 0) {
    $('h1, h2, h3, p, li').each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length > 20) {
        blocks.push(text);
      }
    });
  }

  // Filter for meaningful blocks
  const meaningfulBlocks = blocks.filter(b => b.includes(' ') && b.length > 30);
  
  if (meaningfulBlocks.length === 0) return null;

  // Take top 8 blocks to create a comprehensive summary
  return meaningfulBlocks.slice(0, 8).join(' ').substring(0, 600);
}

export function extractFullText(html: string): string {
  const $ = cheerio.load(html);

  // Remove noise
  $('script, style, noscript, iframe, svg, nav, footer, header, aside, form, button').remove();

  // Extract all visible text with proper spacing
  const textBlocks: string[] = [];
  
  // Process elements that should have newlines between them
  $('h1, h2, h3, h4, h5, h6, p, li, div, section, article').each((_, el) => {
    const $el = $(el);
    
    // Only process if this element doesn't contain other block-level elements as direct children
    const hasBlockChildren = $el.children('h1, h2, h3, h4, h5, h6, p, li, div, section, article').length > 0;
    
    if (!hasBlockChildren) {
      const text = cleanText($el.text());
      if (text.length > 10) {
        textBlocks.push(text);
      }
    }
  });

  return textBlocks.join('\n\n');
}
