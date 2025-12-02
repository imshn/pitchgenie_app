import robotsParser from 'robots-parser';
import axios from 'axios';
import { getRandomUserAgent } from '../utils/ua';

export async function checkRobotsTxt(url: string): Promise<{ allowed: boolean; warning: boolean }> {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
    
    const ua = getRandomUserAgent();
    const response = await axios.get(robotsUrl, {
      headers: { 'User-Agent': ua },
      timeout: 5000,
      validateStatus: () => true // Don't throw on 404
    });

    if (response.status !== 200) {
      // If robots.txt doesn't exist or fails, assume allowed
      return { allowed: true, warning: false };
    }

    const robots = robotsParser(robotsUrl, response.data);
    const isAllowed = robots.isAllowed(url, ua);
    const isAllowedWildcard = robots.isAllowed(url, '*');

    // Soft check: If disallowed, we return warning=true but allowed=true (bypass)
    // In a strict scraper, we would return allowed=false
    
    if (!isAllowed || !isAllowedWildcard) {
      return { allowed: true, warning: true };
    }

    return { allowed: true, warning: false };
  } catch (error) {
    // Fail open
    return { allowed: true, warning: false };
  }
}
