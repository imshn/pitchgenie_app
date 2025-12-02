import UserAgent from 'user-agents';

export function getRandomUserAgent(): string {
  const userAgent = new UserAgent({ deviceCategory: 'desktop' });
  return userAgent.toString();
}
