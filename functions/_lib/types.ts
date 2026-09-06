export interface D1RunResult {
  success: boolean
  meta: {
    changes: number
  }
}

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement
  first: <T = Record<string, unknown>>() => Promise<T | null>
  run: () => Promise<D1RunResult>
}

export interface D1Database {
  prepare: (query: string) => D1PreparedStatement
}

export interface Env {
  DB: D1Database
  TURNSTILE_SECRET_KEY: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL?: string
  SITE_URL?: string
  CONSENT_VERSION?: string
}

export interface PagesContext {
  request: Request
  env: Env
}
