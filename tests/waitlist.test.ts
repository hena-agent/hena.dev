/// <reference types="bun" />
import { Database } from "bun:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import type { D1Database, D1PreparedStatement, Env } from "../functions/_lib/types"
import { onRequestPost } from "../functions/api/waitlist"

const originalFetch = globalThis.fetch
const originalConsoleError = console.error

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
type SqlValue = string | number | bigint | boolean | null

async function database() {
  const sqlite = new Database(":memory:")
  sqlite.exec(await Bun.file(new URL("../migrations/0001_waitlist.sql", import.meta.url)).text())

  const db: D1Database = {
    prepare(query: string) {
      let values: unknown[] = []
      const statement: D1PreparedStatement = {
        bind(...boundValues) {
          values = boundValues
          return statement
        },
        async first<T>() {
          return (sqlite.query(query).get(...(values as SqlValue[])) as T | undefined) ?? null
        },
        async run() {
          const result = sqlite.query(query).run(...(values as SqlValue[]))
          return { success: true, meta: { changes: result.changes } }
        },
      }
      return statement
    },
  }

  return { db, sqlite }
}

function env(DB: D1Database, webhook?: string): Env {
  return {
    DB,
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    RESEND_API_KEY: "resend-secret",
    SITE_URL: "https://hena.dev",
    DISCORD_WEBHOOK_URL: webhook,
  }
}

function request(email = "person@example.com") {
  return new Request("https://hena.dev/api/waitlist", {
    method: "POST",
    body: JSON.stringify({ email, token: "turnstile-token", consentVersion: "2026-09-05" }),
    headers: { "content-type": "application/json" },
  })
}

function response(status = 200) {
  return new Response(JSON.stringify({ success: status === 200 }), { status })
}

function setFetch(mock: FetchMock) {
  globalThis.fetch = Object.assign(mock, { preconnect: originalFetch.preconnect }) as typeof fetch
}

function seed(
  sqlite: Database,
  status: string,
  updatedAt: string,
  unsubscribedAt: string | null = null,
) {
  sqlite
    .query(
      `INSERT INTO waitlist_subscribers
       (email, status, consent_version, unsubscribe_token_hash, created_at, updated_at, unsubscribed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      "person@example.com",
      status,
      "2026-09-05",
      `${status}-token-hash`,
      "2026-09-06T00:00:00.000Z",
      updatedAt,
      unsubscribedAt,
    )
}

afterEach(() => {
  globalThis.fetch = originalFetch
  console.error = originalConsoleError
})

describe("waitlist signup", () => {
  test("keeps Resend required and skips Discord when no webhook is configured", async () => {
    const { db } = await database()
    const calls: string[] = []
    const waiters: Promise<unknown>[] = []
    setFetch(async (input) => {
      calls.push(String(input))
      return response()
    })
    const context = {
      request: request(),
      env: { ...env(db), RESEND_API_KEY: "" },
      waitUntil: (p: Promise<unknown>) => {
        waiters.push(p)
      },
    }
    expect((await onRequestPost(context)).status).toBe(503)
    expect(calls).toHaveLength(0)
    expect((await onRequestPost({ ...context, request: request(), env: env(db) })).status).toBe(201)
    expect(calls).toHaveLength(2)
    expect(waiters).toHaveLength(0)
  })

  test("does not send mail or notifications for an existing subscription", async () => {
    const { db, sqlite } = await database()
    seed(sqlite, "subscribed", new Date().toISOString())
    const calls: string[] = []
    const waiters: Promise<unknown>[] = []
    setFetch(async (input) => {
      calls.push(String(input))
      return response()
    })
    const result = await onRequestPost({
      request: request(),
      env: env(db, "https://discord.com/api/webhooks/123/token"),
      waitUntil: (p) => {
        waiters.push(p)
      },
    })
    expect(result.status).toBe(200)
    expect(calls).toHaveLength(1)
    expect(waiters).toHaveLength(0)
  })
  test("allows one in-flight claim while Resend is unresolved", async () => {
    const { db } = await database()
    const calls: string[] = []
    let releaseResend!: () => void
    const resend = new Promise<void>((resolve) => {
      releaseResend = resolve
    })
    setFetch(async (input) => {
      const url = String(input)
      calls.push(url)
      if (url.includes("turnstile")) return response()
      await resend
      return response()
    })

    const first = onRequestPost({ request: request(), env: env(db), waitUntil: () => undefined })
    while (calls.filter((url) => url.includes("resend")).length !== 1) await Bun.sleep(0)
    const second = await onRequestPost({
      request: request(),
      env: env(db),
      waitUntil: () => undefined,
    })
    expect(second.status).toBe(409)
    releaseResend()
    expect((await first).status).toBe(201)
    expect(calls.filter((url) => url.includes("resend"))).toHaveLength(1)
  })

  test("sends new and resubscribe notification kinds", async () => {
    const { db, sqlite } = await database()
    const discordBodies: Record<string, unknown>[] = []
    setFetch(async (input, init) => {
      const url = String(input)
      if (url.includes("turnstile")) return response()
      if (url.includes("resend")) return response()
      discordBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>)
      return response()
    })
    const waiters: Promise<unknown>[] = []
    await onRequestPost({
      request: request(),
      env: env(db, "https://discord.com/api/webhooks/123/token"),
      waitUntil: (promise) => waiters.push(promise),
    })
    await Promise.all(waiters)
    expect(
      (
        discordBodies[0].embeds as { fields: { name: string; value: string; inline: boolean }[] }[]
      )[0].fields,
    ).toContainEqual({ name: "Signup", value: "new", inline: true })

    sqlite
      .query("UPDATE waitlist_subscribers SET status = 'unsubscribed', unsubscribed_at = ?")
      .run("2026-09-07T01:00:00.000Z")
    const resubscribeWaiters: Promise<unknown>[] = []
    await onRequestPost({
      request: request(),
      env: env(db, "https://discord.com/api/webhooks/123/token"),
      waitUntil: (promise) => resubscribeWaiters.push(promise),
    })
    await Promise.all(resubscribeWaiters)
    expect(
      (
        discordBodies[1].embeds as { fields: { name: string; value: string; inline: boolean }[] }[]
      )[0].fields,
    ).toContainEqual({ name: "Signup", value: "resubscribe", inline: true })
    expect(sqlite.query("SELECT status, unsubscribed_at FROM waitlist_subscribers").get()).toEqual({
      status: "subscribed",
      unsubscribed_at: null,
    })
  })

  test("preserves a resubscribe event across a failed delivery retry", async () => {
    const { db, sqlite } = await database()
    seed(sqlite, "unsubscribed", "2026-09-07T00:00:00.000Z", "2026-09-07T00:00:00.000Z")
    let resendAttempts = 0
    const kinds: string[] = []
    setFetch(async (input, init) => {
      const url = String(input)
      if (url.includes("turnstile")) return response()
      if (url.includes("resend")) {
        resendAttempts += 1
        if (resendAttempts === 1) throw new Error("provider detail")
        return response()
      }
      const body = JSON.parse(String(init?.body)) as {
        embeds: { fields: { name: string; value: string }[] }[]
      }
      kinds.push(body.embeds[0].fields.find((field) => field.name === "Signup")?.value ?? "")
      return response()
    })
    const errors: string[] = []
    console.error = (...args: unknown[]) => errors.push(args.join(" "))
    expect(
      (await onRequestPost({ request: request(), env: env(db), waitUntil: () => undefined }))
        .status,
    ).toBe(503)
    expect(
      (
        await onRequestPost({
          request: request(),
          env: env(db, "https://discord.com/api/webhooks/123/token"),
          waitUntil: (p) => p.catch(() => undefined),
        })
      ).status,
    ).toBe(201)
    expect(kinds).toEqual(["resubscribe"])
    expect(errors.join(" ")).not.toContain("provider detail")
  })

  test("allows a stale pending claim", async () => {
    const { db, sqlite } = await database()
    seed(sqlite, "pending", "1970-01-01T00:00:00.000Z")
    setFetch(async () => response())
    expect(
      (await onRequestPost({ request: request(), env: env(db), waitUntil: () => undefined }))
        .status,
    ).toBe(201)
  })

  test("does not notify when the guarded subscribed transition misses", async () => {
    const { db, sqlite } = await database()
    const calls: string[] = []
    setFetch(async (input) => {
      const url = String(input)
      calls.push(url)
      if (url.includes("turnstile")) return response()
      if (url.includes("resend")) {
        sqlite.query("UPDATE waitlist_subscribers SET status = 'unsubscribed'").run()
        return response()
      }
      throw new Error("Discord must not be called")
    })
    expect(
      (
        await onRequestPost({
          request: request(),
          env: env(db, "https://discord.com/api/webhooks/123/token"),
          waitUntil: () => undefined,
        })
      ).status,
    ).toBe(409)
    expect(calls.some((url) => url.includes("discord"))).toBe(false)
  })

  test("does not wait for an optional Discord notification", async () => {
    const { db } = await database()
    let resolveDiscord!: () => void
    const discord = new Promise<void>((resolve) => {
      resolveDiscord = resolve
    })
    setFetch(async (input) => {
      const url = String(input)
      if (url.includes("turnstile") || url.includes("resend")) return response()
      await discord
      return response()
    })
    const waiters: Promise<unknown>[] = []
    const signup = await onRequestPost({
      request: request(),
      env: env(db, "https://discord.com/api/webhooks/123/token"),
      waitUntil: (promise) => waiters.push(promise),
    })
    expect(signup.status).toBe(201)
    expect(waiters).toHaveLength(1)
    resolveDiscord()
    await Promise.all(waiters)
  })

  test("treats Discord 500, 429, and network errors as best effort", async () => {
    for (const failure of [500, 429, "network"]) {
      const { db } = await database()
      setFetch(async (input) => {
        const url = String(input)
        if (url.includes("turnstile") || url.includes("resend")) return response()
        if (failure === "network") throw new Error("network detail")
        return response(typeof failure === "number" ? failure : 500)
      })
      console.error = () => undefined
      const waiters: Promise<unknown>[] = []
      expect(
        (
          await onRequestPost({
            request: request(),
            env: env(db, "https://discord.com/api/webhooks/123/token"),
            waitUntil: (p) => waiters.push(p),
          })
        ).status,
      ).toBe(201)
      await Promise.all(waiters)
    }
  })

  test("skips an invalid optional webhook without leaking errors", async () => {
    const { db } = await database()
    const calls: string[] = []
    setFetch(async (input) => {
      calls.push(String(input))
      return response()
    })
    const waiters: Promise<unknown>[] = []
    expect(
      (
        await onRequestPost({
          request: request(),
          env: env(db, "http://evil.example/api/webhooks/x"),
          waitUntil: (p) => waiters.push(p),
        })
      ).status,
    ).toBe(201)
    await Promise.all(waiters)
    expect(calls.some((url) => url.includes("evil.example"))).toBe(false)
  })
})
