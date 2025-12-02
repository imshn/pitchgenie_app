import puppeteer from 'puppeteer';

export interface PuppeteerFetchOptions {
  timeout?: number;
  waitForSelector?: string;
}

export async function fetchPageWithPuppeteer(url: string, options: PuppeteerFetchOptions = {}): Promise<{ html: string; headers: any }> {
  const { timeout = 15000, waitForSelector } = options;
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the page
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout
    });

    // Optionally wait for a specific selector
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
        console.log(`Selector ${waitForSelector} not found, continuing anyway`);
      });
    }

    // Additional wait to ensure JavaScript has executed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the fully rendered HTML
    const html = await page.content();
    
    // Get response headers
    const headers = response?.headers() || {};

    await browser.close();

    return { html, headers };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}
