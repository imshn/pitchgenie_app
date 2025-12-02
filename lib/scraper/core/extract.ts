import * as cheerio from 'cheerio';

function resolveUrl(url: string | undefined | null, baseUrl: string): string | null {
  if (!url) return null;
  try {
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('http')) return url;
    return new URL(url, baseUrl).toString();
  } catch (e) {
    return null;
  }
}

export function extractMetadata(html: string, url: string) {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url).origin;

  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || null;
  const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
  const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];

  const rawFavicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/favicon.ico';
  const favicon = resolveUrl(rawFavicon, baseUrl);

  const rawImage = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
  let image = resolveUrl(rawImage, baseUrl);

  // Fallback 1: Try to find the first large image or logo if no OG image
  if (!image) {
    const firstImg = $('main img, header img, article img').first().attr('src');
    image = resolveUrl(firstImg, baseUrl);
  }

  // Fallback 2: Regex search for common image formats in the raw HTML
  if (!image) {
    const imgRegex = /https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp|gif)/gi;
    const matches = html.match(imgRegex);
    if (matches) {
      const validImg = matches.find(m => !m.includes('favicon') && !m.includes('icon'));
      if (validImg) {
        image = resolveUrl(validImg, baseUrl);
      }
    }
  }

  // Fallback 3: Screenshot Service
  if (!image) {
    image = `https://image.thum.io/get/width/1200/crop/600/${url}`;
  }

  const logo = null;
  const author = $('meta[name="author"]').attr('content') || null;
  const publishedTime = $('meta[property="article:published_time"]').attr('content') || null;
  const modifiedTime = $('meta[property="article:modified_time"]').attr('content') || null;
  const themeColor = $('meta[name="theme-color"]').attr('content') || null;
  const language = $('html').attr('lang') || null;
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  const ogType = $('meta[property="og:type"]').attr('content') || null;
  const siteName = $('meta[property="og:site_name"]').attr('content') || null;

  return {
    title,
    description,
    keywords,
    favicon,
    image,
    logo,
    author,
    publishedTime,
    modifiedTime,
    themeColor,
    language,
    canonicalUrl,
    ogType,
    siteName
  };
}

export function extractLogo(html: string, baseUrl: string) {
  const $ = cheerio.load(html);

  // Heuristics for logo
  const selectors = [
    'img[alt*="logo" i]',
    'img[class*="logo" i]',
    'img[id*="logo" i]',
    'header img',
    '.logo img',
    'a[class*="brand"] img'
  ];

  for (const selector of selectors) {
    const src = $(selector).first().attr('src');
    if (src) {
      if (src.startsWith('http')) return src;
      if (src.startsWith('//')) return `https:${src}`;
      return new URL(src, baseUrl).toString();
    }
  }

  return null;
}

function isValidEmail(email: string): boolean {
  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(email)) return false;
  if (email.length < 5 || email.length > 254) return false;
  if (email.endsWith('.png') || email.endsWith('.jpg') || email.endsWith('.svg') || email.endsWith('.webp') || email.endsWith('.gif')) return false;
  if (email.startsWith('http')) return false;
  
  // Check for common false positives
  const lowercaseEmail = email.toLowerCase();
  if (lowercaseEmail.includes('example') || lowercaseEmail.includes('test@') || lowercaseEmail.includes('noreply')) return false;
  
  return true;
}

function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  // Must have at least 10 digits and at most 15 (international)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

export function extractContacts(html: string) {
  const $ = cheerio.load(html);
  
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();

  // 1. Extract from mailto links (most reliable)
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (isValidEmail(email)) {
      emailSet.add(email);
    }
  });

  // 2. Extract from tel links (most reliable for phones)
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const phone = href.replace('tel:', '').trim();
    if (isValidPhone(phone)) {
      phoneSet.add(phone);
    }
  });

  // 3. Extract from data attributes
  $('[data-email]').each((_, el) => {
    const email = ($(el).attr('data-email') || '').trim().toLowerCase();
    if (isValidEmail(email)) {
      emailSet.add(email);
    }
  });

  $('[data-phone]').each((_, el) => {
    const phone = ($(el).attr('data-phone') || '').trim();
    if (isValidPhone(phone)) {
      phoneSet.add(phone);
    }
  });

  // 4. Extract from visible text (less reliable, so only if we haven't found any yet)
  if (emailSet.size === 0 || phoneSet.size === 0) {
    // Only get text from main content areas to avoid false positives
    const contentText = $('main, article, section, .content, #content').text();
    
    if (emailSet.size === 0) {
      const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
      const emailMatches = contentText.match(emailRegex) || [];
      
      emailMatches.forEach(email => {
        const cleanEmail = email.trim().toLowerCase();
        if (isValidEmail(cleanEmail)) {
          emailSet.add(cleanEmail);
        }
      });
    }

    if (phoneSet.size === 0) {
      const phoneRegex = /(\+?\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
      const phoneMatches = contentText.match(phoneRegex) || [];
      
      phoneMatches.forEach(phone => {
        const cleanPhone = phone.trim();
        if (isValidPhone(cleanPhone)) {
          phoneSet.add(cleanPhone);
        }
      });
    }
  }

  return { 
    emails: Array.from(emailSet).slice(0, 5), // Limit to 5 emails max
    phones: Array.from(phoneSet).slice(0, 5)  // Limit to 5 phones max
  };
}

export function extractSocials(html: string) {
  const $ = cheerio.load(html);
  const socials: any = {};

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    
    // Only take the first occurrence of each platform
    if (!socials.linkedin && (href.includes('linkedin.com/company') || href.includes('linkedin.com/in'))) {
      socials.linkedin = href;
    }
    if (!socials.twitter && (href.includes('twitter.com') || href.includes('x.com'))) {
      socials.twitter = href;
    }
    if (!socials.facebook && href.includes('facebook.com')) {
      socials.facebook = href;
    }
    if (!socials.instagram && href.includes('instagram.com')) {
      socials.instagram = href;
    }
    if (!socials.youtube && href.includes('youtube.com')) {
      socials.youtube = href;
    }
    if (!socials.github && href.includes('github.com')) {
      socials.github = href;
    }
  });

  return socials;
}

export function extractLinks(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const links: { text: string; url: string; type: 'internal' | 'external' }[] = [];
  const seen = new Set<string>();
  const baseDomain = new URL(baseUrl).hostname.replace(/^www\./, '');

  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();

    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    let fullUrl: string;
    try {
      fullUrl = new URL(href, baseUrl).toString();
    } catch {
      return;
    }

    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);

    const linkDomain = new URL(fullUrl).hostname.replace(/^www\./, '');
    const type = linkDomain === baseDomain ? 'internal' : 'external';

    if (text && fullUrl) {
      links.push({ text, url: fullUrl, type });
    }
  });

  return links.slice(0, 50); // Limit to 50 links
}
