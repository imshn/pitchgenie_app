import * as cheerio from 'cheerio';

interface TechPattern {
  name: string;
  check: ($: cheerio.CheerioAPI, html: string, headers: Record<string, any>) => boolean;
}

const patterns: TechPattern[] = [
  {
    name: 'Next.js',
    check: ($, html) => 
      $('script[src*="/_next/"]').length > 0 || 
      html.includes('__NEXT_DATA__') ||
      $('meta[name="next-head-count"]').length > 0
  },
  {
    name: 'React',
    check: ($, html) => 
      html.includes('react-dom') || 
      $('[data-reactroot]').length > 0 ||
      $('script').text().includes('React')
  },
  {
    name: 'Vue.js',
    check: ($, html) => 
      html.includes('vue-server-renderer') || 
      $('[data-v-]').length > 0 ||
      html.includes('__VUE__')
  },
  {
    name: 'WordPress',
    check: ($, html) => 
      html.includes('wp-content') || 
      $('meta[name="generator"][content*="WordPress"]').length > 0 ||
      html.includes('wp-json')
  },
  {
    name: 'Shopify',
    check: ($, html) => 
      html.includes('cdn.shopify.com') || 
      html.includes('Shopify.shop') ||
      $('script[src*="shopify"]').length > 0
  },
  {
    name: 'Webflow',
    check: ($, html) => 
      html.includes('w-nav') || 
      html.includes('webflow.com') ||
      $('html').attr('data-wf-page') !== undefined
  },
  {
    name: 'Stripe',
    check: ($, html) => 
      html.includes('js.stripe.com') || 
      html.includes('m.stripe.network')
  },
  {
    name: 'Razorpay',
    check: ($, html) => 
      html.includes('checkout.razorpay.com')
  },
  {
    name: 'Vercel',
    check: ($, html, headers) => 
      headers['server'] === 'Vercel' ||
      headers['x-vercel-id'] !== undefined
  },
  {
    name: 'Cloudflare',
    check: ($, html, headers) => 
      headers['server'] === 'cloudflare' ||
      headers['cf-ray'] !== undefined
  },
  {
    name: 'Tailwind CSS',
    check: ($, html) => 
      html.includes('text-blue-500') || // heuristic
      html.includes('flex-col') ||
      $('link[href*="tailwind"]').length > 0
  },
  {
    name: 'Google Analytics',
    check: ($, html) => 
      html.includes('googletagmanager.com') || 
      html.includes('google-analytics.com')
  },
  {
    name: 'HubSpot',
    check: ($, html) => 
      html.includes('js.hs-scripts.com') ||
      html.includes('hs-script-loader')
  },
  {
    name: 'Intercom',
    check: ($, html) => 
      html.includes('widget.intercom.io')
  }
];

export function detectTechStack(html: string, headers: Record<string, any> = {}): string[] {
  const $ = cheerio.load(html);
  const detected: string[] = [];

  for (const pattern of patterns) {
    try {
      if (pattern.check($, html, headers)) {
        detected.push(pattern.name);
      }
    } catch (e) {
      // Ignore detection errors
    }
  }

  return detected;
}
