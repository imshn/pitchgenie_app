
import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugScraper(url: string) {
  try {
    console.log(`Fetching ${url}...`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);

    console.log('--- Meta Tags ---');
    $('meta[property^="og:"]').each((_, el) => console.log($(el).attr('property'), $(el).attr('content')));
    $('meta[name^="twitter:"]').each((_, el) => console.log($(el).attr('name'), $(el).attr('content')));

    console.log('--- Images in Body ---');
    $('img').each((i, el) => {
      if (i < 5) console.log($(el).attr('src'));
    });

    // Regex test
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    console.log('--- Regex Matches ---');
    let count = 0;
    while ((match = imgRegex.exec(html)) !== null && count < 5) {
      console.log(match[1]);
      count++;
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugScraper('https://lmshn.vercel.app/');
