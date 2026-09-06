import type { Env } from "./types"

interface ConfirmationOptions {
  email: string
  unsubscribeToken: string
}

export async function sendConfirmation(env: Env, options: ConfirmationOptions) {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured")

  const siteUrl = env.SITE_URL || "https://hena.dev"
  const from = env.RESEND_FROM_EMAIL || "Hena <updates@hena.dev>"
  const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(options.unsubscribeToken)}`

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.email],
      subject: "You’re on the Hena waitlist",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
      },
      html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f7f7f2;color:#11120f;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px">
      <div style="display:inline-block;background:#c8ff36;border-radius:6px;padding:7px 10px;font:bold 12px monospace">HENA</div>
      <h1 style="font-size:34px;line-height:1.08;letter-spacing:-1.5px;margin:32px 0 16px">Your workspace is taking shape.</h1>
      <p style="color:#62645c;font-size:16px;line-height:1.6;margin:0 0 28px">You’re on the list for the Hena desktop beta and open-source release in September 2026. We’ll only email you with meaningful beta and launch updates.</p>
      <p style="font-size:14px;line-height:1.6;margin:0">Chat, code, and autonomous work.<br>One local workspace.</p>
      <div style="border-top:1px solid #d9dbd1;margin-top:40px;padding-top:18px;color:#777a71;font-size:12px;line-height:1.6">
        Ambivalent Co. · <a style="color:#62645c" href="${siteUrl}/privacy">Privacy</a> · <a style="color:#62645c" href="${unsubscribeUrl}">Unsubscribe</a>
      </div>
    </div>
  </body>
</html>`,
      text: `You’re on the Hena waitlist.\n\nWe’ll send meaningful beta and launch updates ahead of the September 2026 release.\n\nUnsubscribe: ${unsubscribeUrl}`,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend request failed (${response.status}): ${detail}`)
  }
}
