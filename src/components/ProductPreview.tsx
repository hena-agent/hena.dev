import {
  Braces,
  Check,
  ChevronDown,
  Globe2,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"
import { usePreviewPlayback } from "@/components/usePreviewPlayback"
import { type PreviewProject, type PreviewStep, projects, streamedText } from "@/data/preview"
import { cn } from "@/lib/utils"

const icons = { chat: MessageSquareText, code: Braces, claw: Globe2 }

export function ProductPreview() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [railOrientation, setRailOrientation] = useState<"vertical" | "horizontal">("vertical")
  const baseId = useId()
  const active = projects[activeIndex]
  useEffect(() => {
    const media = window.matchMedia("(max-width: 48rem)")
    const update = () => setRailOrientation(media.matches ? "horizontal" : "vertical")
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const selectProject = (index: number, focus = false) => {
    setActiveIndex(index)
    if (focus) document.getElementById(`${baseId}-project-${projects[index].id}`)?.focus()
  }
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? projects.length - 1
          : (
                railOrientation === "vertical"
                  ? event.key === "ArrowDown"
                  : event.key === "ArrowRight"
              )
            ? (index + 1) % projects.length
            : (railOrientation === "vertical" ? event.key === "ArrowUp" : event.key === "ArrowLeft")
              ? (index - 1 + projects.length) % projects.length
              : null
    if (next === null) return
    event.preventDefault()
    selectProject(next, true)
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
          <div role="tablist" aria-label="Project modes" aria-orientation={railOrientation}>
            {projects.map((project, index) => {
              const Icon = icons[project.id]
              return (
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
                  <span
                    className={cn("project-tile", `project-tile--${project.id}`)}
                    aria-hidden="true"
                  >
                    <Icon size={15} />
                  </span>
                  <span>{project.label}</span>
                </button>
              )
            })}
          </div>
          <button className="project-add" type="button" aria-label="Open project" disabled>
            <Plus size={14} aria-hidden="true" />
          </button>
        </nav>
        {projects.map((project, projectIndex) => (
          <ProjectPanel
            key={project.id}
            project={project}
            projectIndex={projectIndex}
            activeIndex={activeIndex}
            baseId={baseId}
            active={activeIndex === projectIndex}
          />
        ))}
      </div>
    </section>
  )
}

function ProjectPanel({
  project,
  projectIndex,
  activeIndex,
  baseId,
  active,
}: {
  project: PreviewProject
  projectIndex: number
  activeIndex: number
  baseId: string
  active: boolean
}) {
  const Icon = icons[project.id]
  const hostRef = useRef<HTMLElement>(null)
  const playback = usePreviewPlayback(project, hostRef, active)
  const currentStage = project.stages[playback.stageIndex]
  const currentStep = currentStage.steps[playback.stepIndex]
  const announcement = playback.isComplete
    ? "Demo complete"
    : `${currentStage.label}: ${currentStep.kind === "tool" ? currentStep.label : currentStep.kind === "observation" ? "Observation" : "Hena response"}${playback.isPaused ? ", paused" : ""}`

  return (
    <div
      className="preview-project-panel"
      role="tabpanel"
      id={`${baseId}-panel-${project.id}`}
      aria-labelledby={`${baseId}-project-${project.id}`}
      hidden={activeIndex !== projectIndex}
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
            <span
              className={cn("sidebar-session", index === 0 && "sidebar-session--active")}
              key={session}
            >
              <Icon size={13} aria-hidden="true" />
              <span>{session}</span>
            </span>
          ))}
        </nav>
        <div className="sidebar-local">
          <span className="status-dot" aria-hidden="true" />
          Running locally
        </div>
      </aside>
      <section
        ref={hostRef}
        className={cn("preview-session", "project-surface", `project-surface--${project.id}`)}
        id={`${baseId}-session-${project.id}`}
      >
        <div className="session-header">
          <div>
            <Icon size={14} aria-hidden="true" />
            <span>{project.sessions[0]}</span>
          </div>
          {project.id === "code" && <span className="branch-label">main</span>}
          {project.id === "claw" && (
            <span className="running-label">
              {playback.isComplete ? "Completed" : playback.isPaused ? "Paused" : "Running"}
            </span>
          )}
        </div>
        <div className="session-toolbar" role="toolbar" aria-label="Demo playback">
          <div className="session-toolbar__status">
            <span
              className={cn("status-dot", playback.isComplete && "status-dot--complete")}
              aria-hidden="true"
            />
            <span>Simulation</span>
            <strong>{playback.isComplete ? "Finished" : currentStage.label}</strong>
            <span className="session-toolbar__progress">
              {Math.round(playback.progress * 100)}%
            </span>
          </div>
          <div className="session-toolbar__actions">
            {!playback.isComplete && (
              <button
                type="button"
                onClick={playback.isPaused ? playback.resume : playback.pause}
                disabled={playback.reducedMotion}
                aria-label={playback.isPaused ? "Resume demo" : "Pause demo"}
              >
                {playback.isPaused ? (
                  <Play size={12} aria-hidden="true" />
                ) : (
                  <Pause size={12} aria-hidden="true" />
                )}
                {playback.isPaused ? "Resume" : "Pause"}
              </button>
            )}
            <button type="button" onClick={playback.replay} disabled={playback.reducedMotion}>
              <RotateCcw size={12} aria-hidden="true" /> Replay
            </button>
          </div>
        </div>
        <Conversation className="session-thread" key={`${project.id}-${playback.run}`}>
          <ConversationContent>
            <Message from="user">
              <MessageContent>
                <span className="message-avatar">SK</span>
                <div>
                  <p className="message-author">You</p>
                  <p>{project.title}</p>
                </div>
              </MessageContent>
            </Message>
            <Message from="assistant">
              <MessageContent>
                <span className="message-avatar message-avatar--hena">H</span>
                <div>
                  <p className="message-author">Hena</p>
                  <Activity
                    project={project}
                    stageIndex={playback.stageIndex}
                    stepIndex={playback.stepIndex}
                    stepProgress={playback.stepProgress}
                    complete={playback.isComplete}
                    paused={playback.isPaused}
                  />
                </div>
              </MessageContent>
            </Message>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
        <div className="composer" aria-hidden="true">
          <span>
            {project.id === "claw" && !playback.isComplete
              ? "Steer the running task…"
              : "Continue this session…"}
          </span>
          <div className="composer-controls">
            <span>{project.label} agent</span>
            <span className="composer-submit">↑</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function Activity({
  project,
  stageIndex,
  stepIndex,
  stepProgress,
  complete,
  paused,
}: {
  project: PreviewProject
  stageIndex: number
  stepIndex: number
  stepProgress: number
  complete: boolean
  paused: boolean
}) {
  return (
    <div className={cn("preview-activity", paused && "is-paused")}>
      {project.stages.map((stage, currentStageIndex) => {
        const stageVisible = complete || currentStageIndex <= stageIndex
        if (!stageVisible) return null
        const visibleStepIndex =
          complete || currentStageIndex < stageIndex ? stage.steps.length - 1 : stepIndex
        return (
          <div className="preview-stage" key={stage.label}>
            {renderStageSteps(
              stage.steps,
              visibleStepIndex,
              stage.agent,
              currentStageIndex === stageIndex,
              stepProgress,
              paused,
            )}
          </div>
        )
      })}
      {complete && <CompletionArtifact project={project} />}
    </div>
  )
}

function renderStageSteps(
  steps: readonly PreviewStep[],
  visibleStepIndex: number,
  agent: string,
  current: boolean,
  stepProgress: number,
  paused: boolean,
) {
  const rows: React.ReactNode[] = []
  let index = 0
  while (index <= visibleStepIndex) {
    const step = steps[index]
    if (step.kind === "tool") {
      const allTools: Extract<PreviewStep, { kind: "tool" }>[] = []
      const start = index
      while (index < steps.length && steps[index]?.kind === "tool") {
        allTools.push(steps[index] as Extract<PreviewStep, { kind: "tool" }>)
        index += 1
      }
      const visibleTools = allTools.slice(0, visibleStepIndex - start + 1)
      const complete = !current || visibleStepIndex >= start + allTools.length
      rows.push(
        <ToolGroup
          key={`${agent}-${start}`}
          agent={agent}
          tools={visibleTools}
          running={current && !complete}
          paused={paused}
        />,
      )
      continue
    }
    const progress = current && index === visibleStepIndex ? stepProgress : 1
    rows.push(
      <PreviewStepRow
        key={`${step.kind}-${index}`}
        step={step}
        progress={progress}
        running={current && index === visibleStepIndex}
      />,
    )
    index += 1
  }
  return rows
}

function ToolGroup({
  agent,
  tools,
  running,
  paused,
}: {
  agent: string
  tools: Extract<PreviewStep, { kind: "tool" }>[]
  running: boolean
  paused: boolean
}) {
  return (
    <details className="preview-tools" open={running}>
      <summary>
        <span>{agent}</span>
        <small className="preview-tools-summary">
          {running
            ? `${paused ? "Paused at" : "Running"} task ${tools.length}`
            : `${tools.length} tasks completed`}
        </small>
      </summary>
      <div className="preview-tools__list">
        {tools.map((tool, index) => (
          <PreviewStepRow
            key={tool.label}
            step={tool}
            progress={1}
            running={running && index === tools.length - 1}
            paused={paused}
          />
        ))}
      </div>
    </details>
  )
}

function PreviewStepRow({
  step,
  progress,
  running,
  paused = false,
}: {
  step: PreviewStep
  progress: number
  running: boolean
  paused?: boolean
}) {
  if (step.kind === "tool") {
    return (
      <div
        className={cn("preview-tool", running && "is-running", running && paused && "is-paused")}
      >
        {running ? (
          <span className="preview-tool__spinner" aria-hidden="true" />
        ) : (
          <Check size={12} aria-hidden="true" />
        )}
        <div className="preview-tool__description">
          <span>{step.label}</span>
          {(step.detail || step.result) && (
            <small>{running ? step.detail : step.result || step.detail}</small>
          )}
        </div>
        <span className="preview-tool__status">
          {running ? (paused ? "Paused" : "Running") : "Done"}
        </span>
      </div>
    )
  }
  const text = streamedText(step.text, progress)
  if (!text) return null
  return (
    <div className={cn("preview-step-text", step.kind === "observation" && "is-observation")}>
      <p>{text}</p>
    </div>
  )
}

function CompletionArtifact({ project }: { project: PreviewProject }) {
  if (project.id === "chat") {
    return (
      <div className="chat-brief">
        <strong>Launch brief</strong>
        <p>
          <b>Audience:</b> Small teams working across research and delivery.
        </p>
        <p>
          <b>Message:</b> Start with what the project already knows.
        </p>
      </div>
    )
  }
  if (project.id === "code") {
    return (
      <section className="code-result" aria-label="Code result">
        <div className="artifact-heading">
          <Check size={14} aria-hidden="true" />
          <strong>Changes verified</strong>
        </div>
        <dl className="code-metrics">
          <div>
            <dt>Files changed</dt>
            <dd>4</dd>
          </div>
          <div>
            <dt>Diff</dt>
            <dd>
              +86 <span aria-hidden="true">/</span> −12
            </dd>
          </div>
          <div>
            <dt>Tests</dt>
            <dd>37 passed</dd>
          </div>
        </dl>
      </section>
    )
  }
  return (
    <div className="claw-digest">
      <div className="artifact-heading">
        <span className="completion-badge">Ready</span>
        <strong>Weekly digest ready</strong>
      </div>
      <p>New team controls and expanded usage reporting were announced.</p>
      <span>Source: release-notes.example, simulated</span>
    </div>
  )
}
