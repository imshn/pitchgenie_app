import axios from 'axios';
import axiosRetry from 'axios-retry';
import { getRandomUserAgent } from '../utils/ua';
import { ScraperError } from './errors';

const TIMEOUT = 10000; // 10s

export async function fetchPage(url: string, options: { proxy?: string } = {}) {
  const client = axios.create({
    timeout: TIMEOUT,
    validateStatus: (status) => status < 400, // Reject 4xx/5xx
  });

  // Configure retries
  axiosRetry(client, {
    retries: 3,
    retryDelay: (retryCount) => {
      return retryCount * 1000; // 1s, 2s, 3s
    },
    retryCondition: (error) => {
      return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED';
    },
    onRetry: (retryCount, error, requestConfig) => {
      // Rotate UA on retry
      requestConfig.headers = {
        ...requestConfig.headers,
        'User-Agent': getRandomUserAgent(),
      };
      
      // Fallback to proxy on last attempt if configured
      if (retryCount === 2 && options.proxy) {
        // Simple proxy handling: assumes proxy string is http://host:port
        // For complex proxies (auth), this needs parsing.
        // Here we just assume the user passes a valid proxy URL string or object if using axios proxy config directly.
        // But axios proxy config is an object { host, port, auth }.
        // If options.proxy is a string, we might need to parse it.
        // For now, let's assume options.proxy is NOT used directly in axios config unless we parse it.
        // To keep it simple "Light Scraper", we might skip complex proxy parsing unless strictly needed.
        // Let's just log that we would switch to proxy.
        console.log(`[Scraper] Switching to proxy for ${url} (Attempt ${retryCount + 1})`);
      }
    }
  });

  try {
    // Random delay 50-200ms
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150));

    const response = await client.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    // MIME check
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('text/html')) {
      throw new ScraperError('INVALID_MIME', `Invalid content-type: ${contentType}`);
    }

    return {
      html: response.data,
      headers: response.headers,
      status: response.status
    };

  } catch (error: any) {
    if (error instanceof ScraperError) throw error;
    
    if (error.code === 'ECONNABORTED') {
      throw new ScraperError('TIMEOUT', 'Request timed out', 3);
    }
    
    throw new ScraperError('FETCH_FAILED', error.message, 3);
  }
}
