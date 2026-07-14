export type ActionResult<T = unknown> = 
  | { ok: true; data?: T }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string[]> }
