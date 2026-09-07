import { notifyDiscord } from "../_lib/discord"
import { createToken, hashToken, isEmail, json } from "../_lib/http"
import { sendConfirmation } from "../_lib/mail"
import type { PagesContext } from "../_lib/types"

interface WaitlistBody {
  email?: unknown
  token?: unknown
  consentVersion?: unknown
}

interface Subscriber {
  status: "pending" | "subscribed" | "unsubscribed"
}

interface ClaimedSubscriber extends Subscriber {
  unsubscribed_at: string | null
}

interface TurnstileResult {
  success: boolean
}

const CLAIM_LEASE_MS = 60_000

export async function onRequestPost({ request, env, waitUntil }: PagesContext) {
  if (!env.DB || !env.TURNSTILE_SECRET_KEY || !env.RESEND_API_KEY) {
    return json({ message: "Waitlist service is not configured." }, 503)
  }

  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > 4096) return json({ message: "Request is too large." }, 413)

  let body: WaitlistBody
  try {
    body = (await request.json()) as WaitlistBody
  } catch {
    return json({ message: "Send a valid JSON request." }, 400)
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const token = typeof body.token === "string" ? body.token : ""
  const currentConsentVersion = env.CONSENT_VERSION || "2026-09-05"

  if (!isEmail(email)) return json({ message: "Enter a valid email address." }, 400)
  if (!token) return json({ message: "Complete the security check." }, 400)
  if (body.consentVersion !== currentConsentVersion) {
    return json({ message: "Refresh the page and try again." }, 400)
  }

  const turnstileBody = new FormData()
  turnstileBody.set("secret", env.TURNSTILE_SECRET_KEY)
  turnstileBody.set("response", token)
  const remoteIp = request.headers.get("CF-Connecting-IP")
  if (remoteIp) turnstileBody.set("remoteip", remoteIp)

  let turnstile: TurnstileResult
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: turnstileBody,
    })
    turnstile = (await response.json()) as TurnstileResult
  } catch {
    return json({ message: "Security check is temporarily unavailable." }, 503)
  }

  if (!turnstile.success) return json({ message: "Security check failed. Try again." }, 400)

  const existing = await env.DB.prepare("SELECT status FROM waitlist_subscribers WHERE email = ?")
    .bind(email)
    .first<Subscriber>()

  if (existing?.status === "subscribed") {
    return json({ message: "You’re already on the list. We’ll keep you posted." })
  }

  const unsubscribeToken = createToken()
  const unsubscribeTokenHash = await hashToken(unsubscribeToken)
  const now = new Date().toISOString()
  const leaseCutoff = new Date(Date.now() - CLAIM_LEASE_MS).toISOString()

  // Claim the email atomically so concurrent requests cannot rotate an in-flight link.
  const claimed = await env.DB.prepare(
    `INSERT INTO waitlist_subscribers (
      email, status, consent_version, unsubscribe_token_hash, created_at, updated_at, unsubscribed_at
    ) VALUES (?, 'pending', ?, ?, ?, ?, NULL)
    ON CONFLICT(email) DO UPDATE SET
      status = 'pending',
      consent_version = excluded.consent_version,
      unsubscribe_token_hash = excluded.unsubscribe_token_hash,
      updated_at = excluded.updated_at
    WHERE waitlist_subscribers.status = 'unsubscribed'
       OR (waitlist_subscribers.status = 'pending' AND waitlist_subscribers.updated_at <= ?)
    RETURNING status, unsubscribed_at`,
  )
    .bind(email, currentConsentVersion, unsubscribeTokenHash, now, now, leaseCutoff)
    .first<ClaimedSubscriber>()

  if (!claimed) {
    const current = await env.DB.prepare("SELECT status FROM waitlist_subscribers WHERE email = ?")
      .bind(email)
      .first<Subscriber>()
    if (current?.status === "subscribed") {
      return json({ message: "You’re already on the list. We’ll keep you posted." })
    }
    return json({ message: "A confirmation is already being sent. Please try again shortly." }, 409)
  }

  try {
    await sendConfirmation(env, { email, unsubscribeToken })
  } catch {
    await env.DB.prepare(
      `UPDATE waitlist_subscribers
       SET updated_at = ?
       WHERE email = ? AND status = 'pending' AND unsubscribe_token_hash = ?`,
    )
      .bind(leaseCutoff, email, unsubscribeTokenHash)
      .run()
    console.error("Waitlist confirmation delivery failed")
    return json({ message: "Confirmation email could not be sent. Please try again." }, 503)
  }

  const subscribed = await env.DB.prepare(
    `UPDATE waitlist_subscribers
     SET status = 'subscribed', updated_at = ?, unsubscribed_at = NULL
     WHERE email = ? AND status = 'pending' AND unsubscribe_token_hash = ?`,
  )
    .bind(new Date().toISOString(), email, unsubscribeTokenHash)
    .run()

  if (subscribed.meta.changes !== 1) {
    return json({ message: "Your confirmation could not be completed. Please try again." }, 409)
  }

  if (env.DISCORD_WEBHOOK_URL) {
    waitUntil(
      notifyDiscord(env, {
        email,
        kind: claimed.unsubscribed_at ? "resubscribe" : "new",
        timestamp: new Date().toISOString(),
      }).catch(() => {
        console.error("Waitlist Discord notification failed")
      }),
    )
  }

  return json({ message: "We’ll email you with beta and launch updates." }, 201)
}

export function onRequest() {
  return json({ message: "Method not allowed." }, 405)
}
