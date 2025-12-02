import { adminDB } from '@/lib/firebase-admin';
import { ScrapeResult } from '../types';
import crypto from 'crypto';

const CACHE_COLLECTION = 'scraper_cache';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getCacheKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

export async function getCachedResult(url: string): Promise<ScrapeResult | null> {
  try {
    const key = getCacheKey(url);
    const doc = await adminDB.collection(CACHE_COLLECTION).doc(key).get();
    
    if (!doc.exists) return null;
    
    const data = doc.data();
    if (!data) return null;
    
    // Check TTL
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      return null; // Expired
    }
    
    return { ...data.result, meta: { ...data.result.meta, cached: true } };
  } catch (error) {
    console.warn('[Scraper Cache] Get failed:', error);
    return null;
  }
}

export async function setCachedResult(url: string, result: ScrapeResult): Promise<void> {
  try {
    const key = getCacheKey(url);
    await adminDB.collection(CACHE_COLLECTION).doc(key).set({
      url,
      result,
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn('[Scraper Cache] Set failed:', error);
  }
}
