import { hashToken, json } from "../_lib/http"
import type { PagesContext } from "../_lib/types"

interface UnsubscribeBody {
  token?: unknown
}

export async function onRequestPost({ request, env }: PagesContext) {
  if (!env.DB) return json({ message: "Subscription service is not configured." }, 503)

  let body: UnsubscribeBody
  try {
    body = (await request.json()) as UnsubscribeBody
  } catch {
    return json({ message: "Send a valid JSON request." }, 400)
  }

  const token = typeof body.token === "string" ? body.token : ""
  if (!token || token.length > 200) return json({ message: "This link is invalid." }, 400)

  const tokenHash = await hashToken(token)
  const now = new Date().toISOString()
  const result = await env.DB.prepare(
    `UPDATE waitlist_subscribers
     SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ?
     WHERE unsubscribe_token_hash = ?`,
  )
    .bind(now, now, tokenHash)
    .run()

  if (result.meta.changes === 0) {
    return json({ message: "This link is invalid or has already been used." }, 404)
  }

  return json({ message: "You have been unsubscribed from Hena updates." })
}

export function onRequest() {
  return json({ message: "Method not allowed." }, 405)
}
