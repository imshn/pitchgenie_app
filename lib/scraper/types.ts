export interface ScrapeOptions {
  proxy?: string;
  timeout?: number;
  bypassCache?: boolean;
}

export interface TeamMember {
  name: string;
  role: string | null;
  bio: string | null;
  image: string | null;
  socials: {
    linkedin?: string;
    twitter?: string;
  };
}

export interface ScrapeResult {
  url: string;
  title: string | null;
  description: string | null;
  keywords: string[];
  favicon: string | null;
  image: string | null; // og:image or logo
  logo: string | null;
  
  emails: string[];
  phones: string[];
  socials: Record<string, string>;
  
  techStack: string[];
  
  summary: string | null;
  content: string; // Full extracted text content
  team: TeamMember[];
  
  links: {
    text: string;
    url: string;
    type: 'internal' | 'external';
  }[];

  meta: {
    fetchTimeMs: number;
    cached: boolean;
    confidenceScore: number; // 0-100
    isPartial: boolean;
    robotWarning: boolean;
  };
}

export interface ScrapeHistoryItem {
  id: string;
  url: string;
  title: string | null;
  favicon: string | null;
  timestamp: string;
  status: 'success' | 'failed';
  result: ScrapeResult;
  data?: ScrapeResult; // Optional full data
  generatedEmail?: {
    subject: string;
    email: string;
    generatedAt: string;
  };
}

export interface ScrapeError {
  error: true;
  code: "FETCH_FAILED" | "INVALID_MIME" | "TIMEOUT" | "ROBOT_BLOCK" | "INTERNAL_ERROR";
  message: string;
  retryAttempts: number;
}
