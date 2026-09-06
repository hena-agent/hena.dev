export type ProjectId = "chat" | "code" | "claw"

export type PreviewStep =
  | { kind: "message"; text: string }
  | { kind: "observation"; text: string }
  | { kind: "tool"; label: string; detail?: string; result?: string; duration: number }

export type PreviewStage = {
  label: string
  agent: string
  steps: readonly PreviewStep[]
}

export type PreviewProject = {
  id: ProjectId
  label: string
  name: string
  path: string
  sessions: readonly string[]
  title: string
  stages: readonly PreviewStage[]
}

const TEXT_CHARACTER_DURATION = 12

const graphemes = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
    return Array.from(segmenter.segment(text), ({ segment }) => segment)
  }
  return Array.from(text)
}

export const projects: readonly PreviewProject[] = [
  {
    id: "chat",
    label: "Chat",
    name: "Product strategy",
    path: "Personal project",
    sessions: ["Launch brief from interviews", "Pricing research", "Positioning alternatives"],
    title: "Turn these interview notes into a launch brief.",
    stages: [
      {
        label: "Research",
        agent: "Research agent",
        steps: [
          {
            kind: "message",
            text: "I am reading the interviews for the problem people repeat, rather than treating every feature request as its own requirement. That keeps the brief anchored in lived friction.",
          },
          {
            kind: "tool",
            label: "Search project notes",
            detail: "6 interviews · 18 excerpts",
            duration: 1900,
          },
          {
            kind: "tool",
            label: "Trace repeated problems",
            detail: "Context handoffs · setup work",
            duration: 1900,
          },
          {
            kind: "observation",
            text: "The recurring friction is rebuilding context between tools and conversations. People are not asking for more places to work; they are asking not to lose the thread.",
          },
        ],
      },
      {
        label: "Signals",
        agent: "Signals agent",
        steps: [
          {
            kind: "message",
            text: "The strongest signal is continuity: people want to pick up yesterday's work without another setup pass. I am testing that signal against team size and workflow so the audience stays specific.",
          },
          {
            kind: "tool",
            label: "Cluster interview themes",
            detail: "Context · decisions · follow-up",
            duration: 1900,
          },
          {
            kind: "tool",
            label: "Compare team patterns",
            detail: "Small teams · handoffs · momentum",
            duration: 1900,
          },
          {
            kind: "observation",
            text: "That gives the launch a clear audience: small teams moving from research into delivery. Continuity connects the insight to a daily behavior.",
          },
        ],
      },
      {
        label: "Brief",
        agent: "Brief agent",
        steps: [
          {
            kind: "message",
            text: "I will lead with one project holding its notes, decisions, and next questions together. The message should explain the change in working rhythm before it lists capabilities.",
          },
          {
            kind: "tool",
            label: "Draft launch brief",
            detail: "Audience · problem · message",
            duration: 1900,
          },
          {
            kind: "tool",
            label: "Check brief against signals",
            detail: "Promise · proof · next question",
            duration: 1900,
          },
          {
            kind: "observation",
            text: "The brief is ready: keep project knowledge together, give each project the right tools, and keep the user in control. It guides the launch without pretending the research answered everything.",
          },
        ],
      },
    ],
  },
  {
    id: "code",
    label: "Code",
    name: "Hena",
    path: "~/Development/hena",
    sessions: ["Add organization context", "Refactor auth middleware", "Fix desktop reconnect"],
    title: "Add organization context to every agent run.",
    stages: [
      {
        label: "Inspect",
        agent: "Code explorer",
        steps: [
          {
            kind: "message",
            text: "I am tracing a run from session creation through instruction assembly before changing the lookup. The important boundary is where organization context joins project context, not the final prompt string.",
          },
          {
            kind: "tool",
            label: "Read session lifecycle",
            detail: "session setup → instruction priority",
            duration: 2000,
          },
          {
            kind: "tool",
            label: "Inspect context lookup",
            detail: "organization → project → repository",
            duration: 2000,
          },
          {
            kind: "observation",
            text: "The project and organization are both available before instructions are composed. The change can stay local to context assembly and preserve the existing instruction priority.",
          },
        ],
      },
      {
        label: "Implement",
        agent: "Implementation agent",
        steps: [
          {
            kind: "message",
            text: "The organization guidance belongs first, with project guidance next and repository rules as the final override. I am keeping the lookup explicit so a missing organization remains a valid path.",
          },
          {
            kind: "tool",
            label: "Update context loader",
            detail: "Applying scoped context",
            result: "+42 / -8",
            duration: 1050,
          },
          {
            kind: "tool",
            label: "Add isolation tests",
            detail: "Covering scope boundaries",
            result: "+44 / -4",
            duration: 1050,
          },
          {
            kind: "observation",
            text: "Missing organizations still run normally, and switching scope cannot reuse another organization's context. The implementation is intentionally small: +86 / -12 across the change.",
          },
        ],
      },
      {
        label: "Verify",
        agent: "Test runner",
        steps: [
          {
            kind: "message",
            text: "The boundary cases are covered. I am running the meaningful regression cases now, then I will summarize what the diff changes and what it leaves alone.",
          },
          {
            kind: "tool",
            label: "bun test",
            detail: "37 tests running",
            result: "37 passed",
            duration: 2000,
          },
          {
            kind: "tool",
            label: "Check regression paths",
            detail: "context reuse · missing scope",
            result: "clean",
            duration: 2000,
          },
          {
            kind: "observation",
            text: "37 tests passed and the regression paths are clean. The organization context change is ready for review: +86 / -12, with the scope boundary now explicit.",
          },
        ],
      },
    ],
  },
  {
    id: "claw",
    label: "Claw",
    name: "Back office",
    path: "Automations",
    sessions: ["Weekly invoice collection", "Inbox cleanup", "Monthly reports"],
    title: "Every Friday, collect invoices, skip duplicates, and flag anything missing.",
    stages: [
      {
        label: "Collecting",
        agent: "Claw",
        steps: [
          {
            kind: "message",
            text: "Opening Hosting billing portal.",
          },
          {
            kind: "tool",
            label: "Hosting",
            detail: "Open billing portal",
            result: "Saved",
            duration: 3000,
          },
          {
            kind: "tool",
            label: "Analytics",
            detail: "Download September invoice",
            result: "Saved",
            duration: 3000,
          },
          {
            kind: "observation",
            text: "Hosting and Analytics invoices are ready to file.",
          },
        ],
      },
      {
        label: "Checking",
        agent: "Claw",
        steps: [
          {
            kind: "message",
            text: "Checking remaining invoice services.",
          },
          {
            kind: "tool",
            label: "Email service",
            detail: "Check monthly folder",
            result: "Already in monthly folder",
            duration: 3000,
          },
          {
            kind: "tool",
            label: "Design tools",
            detail: "Check invoice availability",
            result: "Invoice not issued",
            duration: 3000,
          },
          {
            kind: "observation",
            text: "Email is filed; Design tools needs attention.",
          },
        ],
      },
      {
        label: "Filing",
        agent: "Claw",
        steps: [
          {
            kind: "message",
            text: "Saving invoices and checking the monthly folder.",
          },
          {
            kind: "tool",
            label: "Save monthly folder",
            detail: "Save collected invoices",
            duration: 2000,
          },
          {
            kind: "tool",
            label: "Prepare review note",
            detail: "Check missing invoice",
            duration: 2000,
          },
          {
            kind: "observation",
            text: "Files saved and review note prepared.",
          },
        ],
      },
    ],
  },
]

export const invoiceTasks = [
  {
    name: "Hosting",
    file: "hosting-sep.pdf",
    result: "Saved",
    stageIndex: 0,
    stepIndex: 1,
    activity: ["Opening billing portal", "Reading invoice", "Saving invoice"],
  },
  {
    name: "Analytics",
    file: "analytics-sep.pdf",
    result: "Saved",
    stageIndex: 0,
    stepIndex: 2,
    activity: ["Opening billing portal", "Downloading invoice", "Checking saved file"],
  },
  {
    name: "Email service",
    file: "Already in monthly folder",
    result: "Skipped",
    stageIndex: 1,
    stepIndex: 1,
    activity: ["Opening billing portal", "Reading monthly folder", "Checking duplicate"],
  },
  {
    name: "Design tools",
    file: "Invoice not issued",
    result: "Needs attention",
    stageIndex: 1,
    stepIndex: 2,
    activity: ["Opening billing portal", "Checking invoice status", "Saving review note"],
  },
] as const

export const stepDuration = (step: PreviewStep) =>
  step.kind === "tool" ? step.duration : responseDuration(step.text)

export const stageDuration = (stage: PreviewStage) =>
  stage.steps.reduce((total, step) => total + stepDuration(step), 0)

export const timelineDuration = (project: PreviewProject) =>
  project.stages.reduce((total, stage) => total + stageDuration(stage), 0)

export const responseDuration = (text: string) => graphemes(text).length * TEXT_CHARACTER_DURATION

export const timelinePosition = (project: PreviewProject, elapsed: number) => {
  const duration = timelineDuration(project)
  const bounded = Math.max(0, Math.min(elapsed, duration))
  let passed = 0

  for (let stageIndex = 0; stageIndex < project.stages.length; stageIndex += 1) {
    const stage = project.stages[stageIndex]
    for (let stepIndex = 0; stepIndex < stage.steps.length; stepIndex += 1) {
      const currentDuration = stepDuration(stage.steps[stepIndex])
      if (
        bounded < passed + currentDuration ||
        (stageIndex === project.stages.length - 1 && stepIndex === stage.steps.length - 1)
      ) {
        return {
          stageIndex,
          stepIndex,
          progress: duration === 0 ? 1 : bounded / duration,
          stepProgress:
            currentDuration === 0
              ? 1
              : Math.max(0, Math.min(1, (bounded - passed) / currentDuration)),
        }
      }
      passed += currentDuration
    }
  }

  const lastStageIndex = project.stages.length - 1
  return {
    stageIndex: lastStageIndex,
    stepIndex: project.stages[lastStageIndex].steps.length - 1,
    progress: 1,
    stepProgress: 1,
  }
}

export const streamedText = (text: string, progress: number) => {
  if (progress <= 0) return ""
  if (progress >= 1) return text
  const characters = graphemes(text)
  return characters.slice(0, Math.ceil(characters.length * progress)).join("")
}
