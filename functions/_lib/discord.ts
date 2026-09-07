import type { Env } from "./types"

interface SignupNotification {
  email: string
  kind: "new" | "resubscribe"
  timestamp: string
}

function isDiscordWebhookUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname === "discord.com" &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)
    )
  } catch {
    return false
  }
}

export async function notifyDiscord(env: Env, notification: SignupNotification) {
  const webhookUrl = env.DISCORD_WEBHOOK_URL
  if (!webhookUrl || !isDiscordWebhookUrl(webhookUrl)) return

  const environment =
    (env.SITE_URL || "https://hena.dev") === "https://hena.dev" ? "Production" : "Preview"
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "Waitlist signup",
            color: 0xc8ff36,
            timestamp: notification.timestamp,
            fields: [
              { name: "Email", value: notification.email, inline: false },
              { name: "Signup", value: notification.kind, inline: true },
              { name: "Environment", value: environment, inline: true },
            ],
          },
        ],
      }),
    })
    if (!response.ok) throw new Error("Discord notification request failed")
  } finally {
    clearTimeout(timeout)
  }
}
