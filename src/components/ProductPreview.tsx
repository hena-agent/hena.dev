import { Braces, Check, ChevronDown, Globe2, MessageSquareText, Plus, Terminal } from "lucide-react"
import { useId, useState } from "react"

const projects = [
  {
    id: "chat",
    label: "Chat",
    name: "Product strategy",
    path: "Personal project",
    icon: MessageSquareText,
    sessions: ["Launch brief from interviews", "Pricing research", "Positioning alternatives"],
    title: "Turn these interview notes into a launch brief.",
    response:
      "The strongest signal is continuity: teams want every new conversation to begin with what the project already knows, not another blank prompt.",
  },
  {
    id: "code",
    label: "Code",
    name: "Hena",
    path: "~/Development/hena",
    icon: Braces,
    sessions: ["Add organization context", "Refactor auth middleware", "Fix desktop reconnect"],
    title: "Add organization context to every agent run.",
    response:
      "I traced the session lifecycle and added scoped context loading while keeping repository instructions as the final override.",
  },
  {
    id: "claw",
    label: "Claw",
    name: "Market watch",
    path: "Browser workspace",
    icon: Globe2,
    sessions: ["Weekly competitor scan", "Track pricing changes", "Collect release notes"],
    title: "Collect this week’s competitor updates.",
    response:
      "I’m checking the tracked release pages, comparing changes, and preparing a source-linked digest for review.",
  },
] as const

export function ProductPreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const baseId = useId()
  const active = projects[activeIndex]

  const selectProject = (index: number, focus = false) => {
    setActiveIndex(index)
    if (focus) document.getElementById(`${baseId}-project-${projects[index].id}`)?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (index + 1) % projects.length
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (index - 1 + projects.length) % projects.length
    }
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = projects.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    selectProject(nextIndex, true)
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
          {active.name} <span>·</span> {active.path} <ChevronDown size={12} aria-hidden="true" />
        </div>
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>

      <div className="preview-body preview-body--projects">
        <nav className="project-rail" aria-label="Projects">
          <div role="tablist" aria-label="Project modes" aria-orientation="vertical">
            {projects.map((project, index) => (
              <button
                type="button"
                role="tab"
                id={`${baseId}-project-${project.id}`}
                aria-selected={activeIndex === index}
                aria-controls={`${baseId}-panel-${project.id}`}
                tabIndex={activeIndex === index ? 0 : -1}
                onClick={() => selectProject(index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                key={project.id}
              >
                <span className={`project-tile project-tile--${project.id}`} aria-hidden="true">
                  <project.icon size={15} />
                </span>
                <span>{project.label}</span>
              </button>
            ))}
          </div>
          <button className="project-add" type="button" aria-label="Open project" disabled>
            <Plus size={14} aria-hidden="true" />
          </button>
        </nav>

        {projects.map((project, projectIndex) => (
          <div
            className="preview-project-panel"
            role="tabpanel"
            id={`${baseId}-panel-${project.id}`}
            aria-labelledby={`${baseId}-project-${project.id}`}
            hidden={activeIndex !== projectIndex}
            key={project.id}
          >
            <aside className="preview-sidebar" aria-label={`${project.name} sessions`}>
              <div className="project-heading">
                <div>
                  <strong>{project.name}</strong>
                  <span>{project.path}</span>
                </div>
                <span className="project-mode">{project.label}</span>
              </div>
              <button className="sidebar-new" type="button" disabled>
                <span>New session</span>
                <kbd>⌘ K</kbd>
              </button>
              <nav aria-label="Sessions">
                <p className="sidebar-label">Recent</p>
                {project.sessions.map((session, index) => (
                  <a
                    className={
                      index === 0 ? "sidebar-session--active sidebar-session" : "sidebar-session"
                    }
                    href={`#${baseId}-session-${project.id}`}
                    key={session}
                  >
                    <project.icon size={13} aria-hidden="true" />
                    <span>{session}</span>
                  </a>
                ))}
              </nav>
              <div className="sidebar-local">
                <span className="status-dot" aria-hidden="true" />
                Running locally
              </div>
            </aside>

            <section
              className={`preview-session project-surface project-surface--${project.id}`}
              id={`${baseId}-session-${project.id}`}
            >
              <div className="session-header">
                <div>
                  <project.icon size={14} aria-hidden="true" />
                  <span>{project.sessions[0]}</span>
                </div>
                {project.id === "code" && <span className="branch-label">main</span>}
                {project.id === "claw" && <span className="running-label">Running</span>}
              </div>

              <div className="session-thread">
                <div className="message message--user">
                  <span className="message-avatar">SK</span>
                  <div>
                    <p className="message-author">You</p>
                    <p>{project.title}</p>
                  </div>
                </div>
                <div className="message message--agent">
                  <span className="message-avatar message-avatar--hena">H</span>
                  <div>
                    <p className="message-author">Hena</p>
                    <p>{project.response}</p>
                    {project.id === "chat" && <ChatActivity />}
                    {project.id === "code" && <CodeActivity />}
                    {project.id === "claw" && <ClawActivity />}
                  </div>
                </div>
                <div className="composer" aria-hidden="true">
                  <span>
                    {project.id === "claw" ? "Steer the running task…" : "Continue this session…"}
                  </span>
                  <div className="composer-controls">
                    <span>{project.label} agent</span>
                    <span className="composer-submit">↑</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ))}
      </div>
    </section>
  )
}

function ChatActivity() {
  return (
    <div className="chat-artifacts">
      <span>6 interviews</span>
      <span>3 key signals</span>
      <span>Brief ready</span>
    </div>
  )
}

function CodeActivity() {
  return (
    <div className="workspace-activity">
      <div>
        <Check size={12} aria-hidden="true" />
        <span>Read session lifecycle</span>
      </div>
      <div>
        <Check size={12} aria-hidden="true" />
        <span>Changed 4 files</span>
        <b>+86 −12</b>
      </div>
      <div>
        <Terminal size={12} aria-hidden="true" />
        <span>bun test</span>
        <b>37 passed</b>
      </div>
    </div>
  )
}

function ClawActivity() {
  return (
    <div className="claw-activity">
      <div className="claw-browser">
        <span className="claw-browser-dot" />
        <span>release-notes.example</span>
        <i />
      </div>
      <ol>
        <li className="is-complete">
          <Check size={11} aria-hidden="true" /> Open tracked sources
        </li>
        <li className="is-complete">
          <Check size={11} aria-hidden="true" /> Compare page changes
        </li>
        <li className="is-running">
          <span /> Extract updates with sources
        </li>
        <li>
          <span /> Prepare weekly digest
        </li>
      </ol>
    </div>
  )
}
