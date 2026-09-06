import { useEffect, useState } from "react"

type Status = "ready" | "submitting" | "success" | "error"

export function UnsubscribeForm() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<Status>("ready")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const unsubscribeToken = new URLSearchParams(window.location.search).get("token") || ""
    setToken(unsubscribeToken)
    if (unsubscribeToken) window.history.replaceState(null, "", window.location.pathname)
  }, [])

  const unsubscribe = async () => {
    if (!token) {
      setStatus("error")
      setMessage("This unsubscribe link is invalid.")
      return
    }

    setStatus("submitting")
    setMessage("")

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const body = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(body.message || "Could not update your subscription.")
      setStatus("success")
      setMessage(body.message || "You have been unsubscribed.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Could not update your subscription.")
    }
  }

  if (status === "success") {
    return (
      <p className="unsubscribe-message" role="status" aria-live="polite">
        {message}
      </p>
    )
  }

  return (
    <div>
      <button
        className="button button--primary"
        type="button"
        onClick={unsubscribe}
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Updating…" : "Unsubscribe"}
      </button>
      {message && (
        <p className="unsubscribe-message unsubscribe-message--error" role="alert">
          {message}
        </p>
      )}
    </div>
  )
}
