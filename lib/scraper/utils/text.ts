import * as cheerio from 'cheerio';

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .trim();
}

export function sanitizeHtml(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove scripts, styles, and other non-content elements
  $('script, style, noscript, iframe, svg, link, meta').remove();
  
  // Remove comments
  $('*').contents().each(function() {
    if (this.type === 'comment') $(this).remove();
  });
  
  return $.html();
}

export function extractVisibleText(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove non-content elements
  $('script, style, noscript, iframe, svg, nav, footer, header, aside').remove();
  
  return cleanText($('body').text());
}
