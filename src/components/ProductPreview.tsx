import {
  Braces,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Folder,
  Globe2,
  MessageSquareText,
  Pause,
  Play,
  Plus,
  Repeat2,
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
import {
  invoiceTasks,
  type PreviewProject,
  type PreviewStep,
  projects,
  streamedText,
} from "@/data/preview"
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
  const [codeSurface, setCodeSurface] = useState<"session" | "changes">("session")
  const currentStage = project.stages[playback.stageIndex]
  const currentStep = currentStage.steps[playback.stepIndex]
  const selectCodeSurface = (surface: "session" | "changes", focus = false) => {
    setCodeSurface(surface)
    if (focus) document.getElementById(`${baseId}-code-${surface}-tab`)?.focus()
  }
  const handleCodeTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 1
          : event.key === "ArrowRight"
            ? (index + 1) % 2
            : event.key === "ArrowLeft"
              ? (index - 1 + 2) % 2
              : null
    if (next === null) return
    event.preventDefault()
    selectCodeSurface(next === 0 ? "session" : "changes", true)
  }
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
      <aside
        className="preview-sidebar"
        aria-label={`${project.name} ${project.id === "claw" ? "routines" : "sessions"}`}
      >
        <div className="project-heading">
          <div>
            <strong>{project.name}</strong>
            <span>{project.path}</span>
          </div>
          <span className="project-mode">{project.label}</span>
        </div>
        <button className="sidebar-new" type="button" disabled>
          <span>{project.id === "claw" ? "New routine" : "New session"}</span>
          <kbd>⌘ K</kbd>
        </button>
        <nav aria-label={project.id === "claw" ? "Routines" : "Sessions"}>
          <p className="sidebar-label">{project.id === "claw" ? "Routines" : "Recent"}</p>
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
            <button
              type="button"
              onClick={() => {
                if (project.id === "code") setCodeSurface("session")
                playback.replay()
              }}
              disabled={playback.reducedMotion}
            >
              <RotateCcw size={12} aria-hidden="true" /> Replay
            </button>
          </div>
        </div>
        {project.id === "claw" ? (
          <ClawAutomation
            stageIndex={playback.stageIndex}
            stepIndex={playback.stepIndex}
            stepProgress={playback.stepProgress}
            complete={playback.isComplete}
            paused={playback.isPaused}
          />
        ) : project.id === "code" ? (
          <div className="code-surfaces">
            <div className="mode-tabs" role="tablist" aria-label="Code session views">
              <button
                type="button"
                role="tab"
                id={`${baseId}-code-session-tab`}
                aria-selected={codeSurface === "session"}
                aria-controls={`${baseId}-code-session`}
                tabIndex={codeSurface === "session" ? 0 : -1}
                onClick={() => selectCodeSurface("session")}
                onKeyDown={(event) => handleCodeTabKeyDown(event, 0)}
              >
                Session
              </button>
              <button
                type="button"
                role="tab"
                id={`${baseId}-code-changes-tab`}
                aria-selected={codeSurface === "changes"}
                aria-controls={`${baseId}-code-changes`}
                tabIndex={codeSurface === "changes" ? 0 : -1}
                onClick={() => selectCodeSurface("changes")}
                onKeyDown={(event) => handleCodeTabKeyDown(event, 1)}
              >
                Changes
              </button>
            </div>
            <div
              className="code-session-view"
              id={`${baseId}-code-session`}
              role="tabpanel"
              aria-labelledby={`${baseId}-code-session-tab`}
              data-active={codeSurface === "session"}
            >
              <PreviewConversation project={project} playback={playback} />
            </div>
            <CodeChanges
              stageIndex={playback.stageIndex}
              stepIndex={playback.stepIndex}
              complete={playback.isComplete}
              active={codeSurface === "changes"}
              id={`${baseId}-code-changes`}
              labelledBy={`${baseId}-code-changes-tab`}
            />
          </div>
        ) : (
          <PreviewConversation project={project} playback={playback} />
        )}
        <span className="sr-only" aria-live="polite">
          {announcement}
        </span>
        {project.id === "claw" ? (
          <div className="claw-next-run">
            <Clock3 size={14} aria-hidden="true" />
            <span>
              Next run <strong>Fri, Sep 11 · 09:00 KST</strong>
            </span>
            <Repeat2 size={14} aria-hidden="true" />
          </div>
        ) : (
          <div className="composer" aria-hidden="true">
            <span>Continue this session…</span>
            <div className="composer-controls">
              <span>{project.label} agent</span>
              <span className="composer-submit">↑</span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function PreviewConversation({
  project,
  playback,
}: {
  project: PreviewProject
  playback: ReturnType<typeof usePreviewPlayback>
}) {
  return (
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
  )
}

const sourceFiles = [
  ["src/agents/context-loader.ts", "+30", "-6"],
  ["src/agents/run-context.ts", "+12", "-2"],
] as const

const testFiles = [
  {
    path: "tests/context-isolation.test.ts",
    additions: "+30",
    deletions: "-2",
    excerpt: [
      'it("keeps organization context isolated", async () => {',
      '  const context = await loadContext({ organizationId: "missing" })',
      "  expect(context.organization).toBeUndefined()",
      "})",
    ],
  },
  {
    path: "tests/context-loader.test.ts",
    additions: "+14",
    deletions: "-2",
    excerpt: [
      'it("does not reuse another organization", async () => {',
      "  expect(await loadContext(scope)).not.toEqual(otherContext)",
      "})",
    ],
  },
] as const

export function CodeChanges({
  stageIndex,
  stepIndex,
  complete,
  active = true,
  id,
  labelledBy,
}: {
  stageIndex: number
  stepIndex: number
  complete: boolean
  active?: boolean
  id?: string
  labelledBy?: string
}) {
  const loaderComplete = complete || stageIndex > 1 || (stageIndex === 1 && stepIndex >= 2)
  const testsComplete = complete || stageIndex > 1 || (stageIndex === 1 && stepIndex >= 3)
  return (
    <section
      className={cn("code-changes", !active && "code-changes--desktop")}
      id={id}
      role="tabpanel"
      aria-label="Code changes"
      aria-labelledby={labelledBy}
      data-active={active}
    >
      <div className="code-changes__header">
        <div>
          <span className="preview-eyebrow">Changes</span>
          <strong>{loaderComplete ? "Working tree" : "No changes yet"}</strong>
        </div>
        {loaderComplete && (
          <span className="code-changes__total">{testsComplete ? "+86 / -12" : "+42 / -8"}</span>
        )}
      </div>
      {!loaderComplete ? (
        <div className="code-changes__empty">
          <Braces size={17} aria-hidden="true" />
          <strong>Changes will appear here</strong>
          <span>Waiting for the context loader to finish.</span>
        </div>
      ) : (
        <div className="code-changes__body">
          <p className="code-changes__caption">
            Selected excerpts · {testsComplete ? "4" : "2"} files
          </p>
          <ul className="code-file-list" aria-label="Changed files">
            {sourceFiles.map(([file, additions, deletions]) => (
              <li key={file}>
                <FileText size={13} aria-hidden="true" />
                <span>{file}</span>
                <small>
                  {additions} {deletions}
                </small>
              </li>
            ))}
            {testsComplete &&
              testFiles.map((file) => (
                <li key={file.path}>
                  <FileText size={13} aria-hidden="true" />
                  <span>{file.path}</span>
                  <small>
                    {file.additions} {file.deletions}
                  </small>
                </li>
              ))}
          </ul>
          <section className="code-diff" aria-label="Unified diff excerpt">
            <span className="code-diff__file">src/agents/context-loader.ts</span>
            <code>
              <i>@@ context assembly @@</i>
            </code>
            <code className="code-diff__removed">- const project = await loadProject(scope)</code>
            <code className="code-diff__added">
              + const organization = await loadOrganization(scope)
            </code>
            <code className="code-diff__added">+ const project = await loadProject(scope)</code>
            <code> const repository = await loadRepository(project)</code>
            <code className="code-diff__added">+ return [organization, project, repository]</code>
          </section>
          {testsComplete &&
            testFiles.map((file) => (
              <details className="code-test-file" key={file.path}>
                <summary>
                  <span>
                    <Check size={13} aria-hidden="true" />{" "}
                    <span title={file.path}>{file.path}</span>
                  </span>
                  <small>
                    {file.additions} {file.deletions}
                  </small>
                </summary>
                {file.excerpt.map((line) => (
                  <code key={line}>{line}</code>
                ))}
              </details>
            ))}
          <div className={cn("code-verification", complete && "is-complete")}>
            <span className="status-dot" aria-hidden="true" />
            <span>{complete ? "Verified" : "Verification pending"}</span>
            {complete && <strong>37 passed</strong>}
          </div>
        </div>
      )}
    </section>
  )
}

export function ClawAutomation({
  stageIndex,
  stepIndex,
  stepProgress = 0,
  complete,
  paused,
}: {
  stageIndex: number
  stepIndex: number
  stepProgress?: number
  complete: boolean
  paused: boolean
}) {
  const processed = invoiceTasks.filter(
    (task) =>
      complete ||
      stageIndex > task.stageIndex ||
      (stageIndex === task.stageIndex && stepIndex > task.stepIndex),
  )
  const activeTask = !complete ? invoiceTasks.find((task) => !processed.includes(task)) : undefined
  const taskProgress =
    activeTask && stageIndex === activeTask.stageIndex && stepIndex === activeTask.stepIndex
      ? stepProgress
      : 0
  const activity = activeTask
    ? activeTask.activity[Math.min(2, Math.floor(taskProgress * 3))]
    : stepIndex < 2
      ? "Saving the monthly folder"
      : "Preparing the exception note"
  const saved = processed.filter((task) => task.result === "Saved").length
  const skipped = processed.filter((task) => task.result === "Skipped").length
  const attention = processed.filter((task) => task.result === "Needs attention").length
  return (
    <section
      className={cn("claw-automation", complete && "is-complete", paused && "is-paused")}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Keep overflow keyboard-accessible at enlarged text sizes.
      tabIndex={0}
      aria-label="Invoice automation run"
    >
      <div className="claw-routine">
        <div className="claw-eyebrow">
          <Repeat2 size={13} aria-hidden="true" /> Saved routine <span>Simulation</span>
        </div>
        <div className="claw-schedule">
          <Clock3 size={13} aria-hidden="true" /> Every Friday · 09:00 KST
        </div>
      </div>
      <div className={cn("claw-run-banner", complete && "is-complete")}>
        <div className="claw-run-banner__heading">
          <span className="claw-run-banner__icon" aria-hidden="true">
            {complete ? <Check size={22} /> : paused ? <Pause size={20} /> : <Repeat2 size={20} />}
          </span>
          <div>
            <span className="claw-eyebrow">
              {complete ? "Scheduled run complete" : paused ? "Run paused" : "Working for you"}
            </span>
            <h3>{complete ? "Friday admin, handled." : activity}</h3>
          </div>
        </div>
        {complete ? (
          <dl
            className="claw-outcome"
            aria-label={`${saved} saved · ${skipped} skipped · ${attention} needs attention`}
          >
            <div>
              <dd>{saved}</dd>
              <dt>PDFs saved</dt>
            </div>
            <div>
              <dd>{skipped}</dd>
              <dt>Duplicate skipped</dt>
            </div>
            <div>
              <dd>{attention}</dd>
              <dt>Needs attention</dt>
            </div>
          </dl>
        ) : (
          <div className="claw-live-summary">
            <span>
              {activeTask ? `${processed.length + 1} of 4 services` : "Finishing this run"}
            </span>
            <span>{saved} PDFs saved</span>
            <span className="claw-live-meter" aria-hidden="true">
              <span
                style={{
                  width: `${activeTask ? Math.max(5, taskProgress * 100) : Math.max(5, stepProgress * 100)}%`,
                }}
              />
            </span>
          </div>
        )}
      </div>
      <div className="claw-run-heading">
        <div>
          <strong>Sep 04</strong>
          <span>09:00 · Scheduled run</span>
        </div>
        <span>
          {processed.length} / {invoiceTasks.length} checked
        </span>
      </div>
      <ul className="claw-task-list" aria-label="Invoice collection status">
        {invoiceTasks.map((task) => {
          const done = processed.includes(task)
          const running = task === activeTask
          const status = done ? task.result : running ? (paused ? "Paused" : "Checking") : "Waiting"
          return (
            <li
              key={task.name}
              className={cn(
                "claw-task",
                running && "is-current",
                done && task.result === "Needs attention" && "needs-attention",
              )}
            >
              <span className="claw-task-icon" aria-hidden="true">
                {done && task.result === "Saved" ? <Check size={15} /> : <FileText size={15} />}
              </span>
              <div>
                <strong>{task.name}</strong>
                <small>{done ? task.file : running ? activity : "Monthly invoice"}</small>
              </div>
              <span className="claw-task-status">
                {running && !paused && (
                  <span className="preview-tool__spinner" aria-hidden="true" />
                )}
                {status}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="claw-run-result">
        <Folder size={16} aria-hidden="true" />
        <div>
          <strong>{complete ? "Monthly folder ready" : "Saving to your monthly folder"}</strong>
          <span>Finance / Invoices / 2026-09</span>
        </div>
      </div>
      {complete && (
        <p className="claw-exception">
          Only follow-up: Design tools has not issued its invoice yet.
        </p>
      )}
      <div className="claw-history">
        <span>Previous run · Aug 28</span>
        <span>
          <Check size={12} aria-hidden="true" /> 4 invoices filed
        </span>
      </div>
    </section>
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
  return null
}
