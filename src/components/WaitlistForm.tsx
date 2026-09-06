import { ArrowRight, Check } from "lucide-react"
import { type FormEvent, useEffect, useId, useRef, useState } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          "expired-callback": () => void
          "error-callback": () => void
          theme: "auto"
        },
      ) => string
      reset: (widgetId: string) => void
    }
  }
}

type Status = "idle" | "submitting" | "success" | "error"

interface Props {
  siteKey: string
  consentVersion: string
}

let turnstileScript: Promise<void> | null = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScript) return turnstileScript

  turnstileScript = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-hena-turnstile]")
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
    script.async = true
    script.defer = true
    script.dataset.henaTurnstile = "true"
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener("error", () => reject(), { once: true })
    document.head.append(script)
  })

  return turnstileScript
}

export function WaitlistForm({ siteKey, consentVersion }: Props) {
  const emailId = useId()
  const messageId = useId()
  const widgetContainer = useRef<HTMLFieldSetElement>(null)
  const widgetId = useRef<string | null>(null)
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let mounted = true

    loadTurnstile()
      .then(() => {
        if (!mounted || !widgetContainer.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(widgetContainer.current, {
          sitekey: siteKey,
          callback: setToken,
          "expired-callback": () => setToken(""),
          "error-callback": () => {
            setToken("")
            setStatus("error")
            setMessage("Security check failed. Please refresh and try again.")
          },
          theme: "auto",
        })
      })
      .catch(() => {
        if (!mounted) return
        setStatus("error")
        setMessage("Security check could not load. Please refresh and try again.")
      })

    return () => {
      mounted = false
    }
  }, [siteKey])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get("email") ?? "").trim()

    if (!form.reportValidity()) return
    if (!token) {
      setStatus("error")
      setMessage("Complete the security check before joining.")
      return
    }

    setStatus("submitting")
    setMessage("")

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, consentVersion }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(body.message || "Could not join the waitlist.")

      setStatus("success")
      setMessage(body.message || "You’re on the list. Check your inbox for confirmation.")
      form.reset()
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Could not join the waitlist.")
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
      setToken("")
    }
  }

  if (status === "success") {
    return (
      <div className="waitlist-success" role="status" aria-live="polite">
        <span>
          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <div>
          <strong>You’re on the list.</strong>
          <p>{message}</p>
        </div>
      </div>
    )
  }

  return (
    <form className="waitlist-form" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor={emailId}>
        Work email
      </label>
      <div className="waitlist-form__row">
        <input
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-describedby={message ? messageId : undefined}
          required
        />
        <button type="submit" disabled={status === "submitting"}>
          <span>{status === "submitting" ? "Joining…" : "Join the waitlist"}</span>
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
      <fieldset ref={widgetContainer} className="turnstile-container">
        <legend className="sr-only">Security check</legend>
      </fieldset>
      {message && (
        <p id={messageId} className="form-message" role="alert">
          {message}
        </p>
      )}
      <p className="form-consent">
        By joining, you agree to receive Hena beta and launch updates from Ambivalent Co. You can
        unsubscribe at any time. <a href="/privacy">Privacy</a>
      </p>
    </form>
  )
}
