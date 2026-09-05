import { Bot, Braces, Check, ChevronDown, Globe2, MessageSquareText, Route } from "lucide-react"
import { useId, useState } from "react"

const modes = [
  {
    id: "chat",
    label: "Chat",
    icon: MessageSquareText,
    title: "Turn these notes into a launch brief.",
    response:
      "I found three recurring signals: context is lost between sessions, model choice adds friction, and repetitive browser work still stays manual.",
    action: "Drafting a concise launch brief",
    model: "Claude Sonnet",
    reason: "Long-context synthesis",
    activity: ["Read 6 interview notes", "Grouped recurring signals", "Drafted launch brief"],
  },
  {
    id: "code",
    label: "Code",
    icon: Braces,
    title: "Add organization context to every agent run.",
    response:
      "I traced the session lifecycle, added scoped context loading, and kept repository instructions as the final override.",
    action: "Running the workspace test suite",
    model: "GPT-5.3 Codex",
    reason: "Repository-scale implementation",
    activity: ["Mapped 12 relevant files", "Changed 4 files", "37 tests passed"],
  },
  {
    id: "automate",
    label: "Automate",
    icon: Globe2,
    title: "Collect this week’s competitor updates.",
    response:
      "I checked 14 release pages, captured five meaningful changes, and prepared a source-linked digest for the team.",
    action: "Reviewing the final source",
    model: "Gemini Pro",
    reason: "Web research and extraction",
    activity: ["Visited 14 sources", "Dismissed 3 duplicates", "Prepared a cited digest"],
  },
] as const

export function ProductPreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [automatic, setAutomatic] = useState(true)
  const baseId = useId()
  const active = modes[activeIndex]

  const selectTab = (index: number) => {
    setActiveIndex(index)
    document.getElementById(`${baseId}-tab-${modes[index].id}`)?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null
    if (event.key === "ArrowRight") nextIndex = (index + 1) % modes.length
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + modes.length) % modes.length
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = modes.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    selectTab(nextIndex)
  }

  return (
    <section className="product-preview" aria-label="Hena product preview">
      <div className="preview-titlebar">
        <div className="preview-titlebar__brand">
          <span className="brand-mark brand-mark--small" aria-hidden="true">
            H
          </span>
          <span>Hena</span>
        </div>
        <div className="preview-titlebar__project">
          ambivalent / hena <ChevronDown size={12} aria-hidden="true" />
        </div>
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>

      <div className="preview-body">
        <aside className="preview-sidebar" aria-label="Workspace sessions">
          <p className="preview-eyebrow">Workspace</p>
          <div className="sidebar-new">
            <span>New session</span>
            <kbd>⌘ K</kbd>
          </div>
          <nav aria-label="Recent sessions">
            <p className="sidebar-label">Today</p>
            <a className="sidebar-session sidebar-session--active" href="#preview-panel">
              <active.icon size={14} aria-hidden="true" />
              <span>{active.title}</span>
            </a>
            <a className="sidebar-session" href="#preview-panel">
              <Braces size={14} aria-hidden="true" />
              <span>Refactor auth middleware</span>
            </a>
            <a className="sidebar-session" href="#preview-panel">
              <Globe2 size={14} aria-hidden="true" />
              <span>Weekly market scan</span>
            </a>
          </nav>
          <div className="sidebar-local">
            <span className="status-dot" aria-hidden="true" />
            Running locally
          </div>
        </aside>

        <section className="preview-session" id="preview-panel">
          <div className="mode-tabs" role="tablist" aria-label="Hena work modes">
            {modes.map((mode, index) => (
              <button
                type="button"
                role="tab"
                id={`${baseId}-tab-${mode.id}`}
                aria-selected={activeIndex === index}
                aria-controls={`${baseId}-panel-${mode.id}`}
                tabIndex={activeIndex === index ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                key={mode.id}
              >
                <mode.icon size={14} aria-hidden="true" />
                {mode.label}
              </button>
            ))}
          </div>

          {modes.map((mode, modeIndex) => (
            <div
              className="session-thread"
              role="tabpanel"
              id={`${baseId}-panel-${mode.id}`}
              aria-labelledby={`${baseId}-tab-${mode.id}`}
              hidden={activeIndex !== modeIndex}
              key={mode.id}
            >
              <div className="message message--user">
                <span className="message-avatar">SK</span>
                <div>
                  <p className="message-author">You</p>
                  <p>{mode.title}</p>
                </div>
              </div>
              <div className="message message--agent">
                <span className="message-avatar message-avatar--hena">H</span>
                <div>
                  <p className="message-author">Hena</p>
                  <p>{mode.response}</p>
                  <div className="activity-list">
                    {mode.activity.map((item, activityIndex) => (
                      <div key={item}>
                        {activityIndex === mode.activity.length - 1 ? (
                          <span className="activity-pulse" aria-hidden="true" />
                        ) : (
                          <Check size={12} aria-hidden="true" />
                        )}
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="composer" aria-hidden="true">
                <span>Steer the session…</span>
                <span className="composer-submit">↑</span>
              </div>
            </div>
          ))}
        </section>

        <aside className="route-panel" aria-label="Model routing preview">
          <div className="route-panel__header">
            <Route size={14} aria-hidden="true" />
            <span>Model routing</span>
          </div>
          <p className="preview-eyebrow">Selected for this task</p>
          <div className="model-card">
            <div className="model-card__icon">
              <Bot size={15} aria-hidden="true" />
            </div>
            <div>
              <strong>{automatic ? active.model : "Claude Sonnet"}</strong>
              <span>{automatic ? active.reason : "Manual override"}</span>
            </div>
          </div>
          <div className="route-path" aria-hidden="true">
            <span>Task</span>
            <i />
            <span>Router</span>
            <i />
            <span>Model</span>
          </div>
          <button
            className="routing-toggle"
            type="button"
            aria-pressed={automatic}
            onClick={() => setAutomatic((value) => !value)}
          >
            <span>
              <strong>{automatic ? "Automatic" : "Manual"}</strong>
              <small>{automatic ? "Optimized for quality" : "Model locked by you"}</small>
            </span>
            <span className="switch" aria-hidden="true">
              <span />
            </span>
          </button>
          <p className="route-status">
            <span className="status-dot" aria-hidden="true" />
            {active.action}
          </p>
        </aside>
      </div>
    </section>
  )
}
