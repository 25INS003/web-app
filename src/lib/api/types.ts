// The envelope every backend endpoint wraps its payload in
// (backend: src/utils/ApiResponse.js / ApiError.js).
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Normalized client-side error. Every rejected request surfaces as this, so
// callers get a consistent `.status` / `.message` regardless of failure mode.
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}
