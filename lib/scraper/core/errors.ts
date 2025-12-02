export class ScraperError extends Error {
  code: "FETCH_FAILED" | "INVALID_MIME" | "TIMEOUT" | "ROBOT_BLOCK" | "INTERNAL_ERROR";
  retryAttempts: number;

  constructor(code: "FETCH_FAILED" | "INVALID_MIME" | "TIMEOUT" | "ROBOT_BLOCK" | "INTERNAL_ERROR", message: string, retryAttempts: number = 0) {
    super(message);
    this.code = code;
    this.retryAttempts = retryAttempts;
    this.name = 'ScraperError';
  }
}
