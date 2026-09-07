/// <reference types="bun" />
import { afterEach, describe, expect, test } from "bun:test"
import { notifyDiscord } from "../functions/_lib/discord"
import type { Env } from "../functions/_lib/types"

const originalFetch = globalThis.fetch

function env(webhook?: string, siteUrl?: string): Env {
  return {
    DB: {} as Env["DB"],
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    RESEND_API_KEY: "resend-secret",
    DISCORD_WEBHOOK_URL: webhook,
    SITE_URL: siteUrl,
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("notifyDiscord", () => {
  test("posts a mentions-disabled embed with production and preview environments", async () => {
    const requests: Request[] = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push(input instanceof Request ? input : new Request(String(input), init))
      return new Response(null, { status: 204 })
    }) as unknown as typeof fetch

    await notifyDiscord(env("https://discord.com/api/webhooks/123/token", "https://hena.dev"), {
      email: "person@example.com",
      kind: "new",
      timestamp: "2026-09-07T00:00:00.000Z",
    })
    await notifyDiscord(
      env("https://discord.com/api/webhooks/123/token", "https://preview.pages.dev"),
      {
        email: "person@example.com",
        kind: "resubscribe",
        timestamp: "2026-09-07T00:00:00.000Z",
      },
    )
    await notifyDiscord(env("https://discord.com/api/webhooks/123/token"), {
      email: "person@example.com",
      kind: "new",
      timestamp: "2026-09-07T00:00:00.000Z",
    })

    const production = JSON.parse(await requests[0].text())
    const preview = JSON.parse(await requests[1].text())
    const defaultProduction = JSON.parse(await requests[2].text())
    expect(production.allowed_mentions).toEqual({ parse: [] })
    expect(production.embeds[0].fields).toContainEqual({
      name: "Email",
      value: "person@example.com",
      inline: false,
    })
    expect(production.embeds[0].timestamp).toBe("2026-09-07T00:00:00.000Z")
    expect(production.embeds[0].fields).toContainEqual({
      name: "Signup",
      value: "new",
      inline: true,
    })
    expect(production.embeds[0].fields).toContainEqual({
      name: "Environment",
      value: "Production",
      inline: true,
    })
    expect(preview.embeds[0].fields).toContainEqual({
      name: "Signup",
      value: "resubscribe",
      inline: true,
    })
    expect(preview.embeds[0].fields).toContainEqual({
      name: "Environment",
      value: "Preview",
      inline: true,
    })
    expect(defaultProduction.embeds[0].fields).toContainEqual({
      name: "Environment",
      value: "Production",
      inline: true,
    })
  })

  test("rejects unsafe webhook URLs before making a request", async () => {
    const calls: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input))
      return new Response(null, { status: 204 })
    }) as unknown as typeof fetch
    const unsafe = [
      "http://discord.com/api/webhooks/123/token",
      "https://discord.com.evil.example/api/webhooks/123/token",
      "https://discord.com/api/webhooks/123/token@evil.example",
      "https://discord.com/userinfo",
      "https://discord.com/api/webhooks/123/token/../../userinfo",
    ]

    for (const webhook of unsafe)
      await notifyDiscord(env(webhook), {
        email: "person@example.com",
        kind: "new",
        timestamp: "2026-09-07T00:00:00.000Z",
      })
    expect(calls).toEqual([])
  })

  test("passes a five-second abort signal and clears it after completion", async () => {
    let signal: AbortSignal | undefined
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal as AbortSignal
      return new Response(null, { status: 204 })
    }) as unknown as typeof fetch
    await notifyDiscord(env("https://discord.com/api/webhooks/123/token"), {
      email: "person@example.com",
      kind: "new",
      timestamp: "2026-09-07T00:00:00.000Z",
    })
    expect(signal).toBeDefined()
    expect(signal?.aborted).toBe(false)
  })

  test("rejects on timeout abort without waiting five seconds", async () => {
    let signal: AbortSignal | undefined
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      signal = init?.signal as AbortSignal
      await new Promise<never>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true })
      })
      throw new Error("unreachable")
    }) as unknown as typeof fetch

    const notification = notifyDiscord(env("https://discord.com/api/webhooks/123/token"), {
      email: "person@example.com",
      kind: "new",
      timestamp: "2026-09-07T00:00:00.000Z",
    })
    while (!signal) await Bun.sleep(0)
    signal.dispatchEvent(new Event("abort"))
    await expect(notification).rejects.toThrow("aborted")
  })
})
