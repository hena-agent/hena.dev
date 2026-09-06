/// <reference types="bun" />
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { projects, timelinePosition } from "@/data/preview"
import { ClawAutomation, CodeChanges, ProductPreview } from "./ProductPreview"

test("SSR renders the completed transcript with scoped state classes", () => {
  const html = renderToStaticMarkup(<ProductPreview />)
  expect(html).toContain('class="preview-activity is-paused"')
  expect(html).toContain("Research")
  expect(html).toContain("Read session lifecycle")
  expect(html).toContain("2 saved · 1 skipped · 1 needs attention")
  expect(html).toContain("Next run")
  expect(html).not.toContain("activity-pending")
})

test("SSR keeps prose in the transcript and scopes disclosures to tools", () => {
  const html = renderToStaticMarkup(<ProductPreview />)
  const readableHtml = html.replaceAll("&#x27;", "'")
  expect((html.match(/class="preview-tools"/g) ?? []).length).toBe(6)
  expect((html.match(/class="preview-tool(?: |")/g) ?? []).length).toBe(12)
  expect(html).not.toContain("preview-cycle")
  expect(html).not.toContain("preview-step-text__marker")
  expect(html).toContain("Research agent")
  expect(html).toContain("Implementation agent")
  expect(html).toContain("Test runner")
  expect(html).toContain("2 tasks completed")

  for (const project of projects.filter((project) => project.id !== "claw")) {
    for (const stage of project.stages) {
      for (const step of stage.steps) {
        expect(readableHtml).toContain(step.kind === "tool" ? step.label : step.text)
      }
    }
  }
})

test("Code starts with an empty Changes panel and reveals the loader diff at its milestone", () => {
  const initial = renderToStaticMarkup(
    <CodeChanges stageIndex={0} stepIndex={1} complete={false} />,
  )
  expect(initial).toContain("Changes will appear here")
  expect(initial).not.toContain("context-loader.ts")
  expect(initial).not.toContain("37 passed")

  const loaderDone = renderToStaticMarkup(
    <CodeChanges stageIndex={1} stepIndex={2} complete={false} />,
  )
  expect(loaderDone).toContain("src/agents/context-loader.ts")
  expect(loaderDone).toContain("src/agents/run-context.ts")
  expect(loaderDone).toContain("Selected excerpts · 2 files")
  expect(loaderDone).toContain("+42 / -8")
  expect(loaderDone).not.toContain("tests/context-isolation.test.ts")
  expect(loaderDone).not.toContain("tests/context-loader.test.ts")
  expect(loaderDone).not.toContain("+86 / -12")
  expect(loaderDone).not.toContain("37 passed")
})

test("Code adds a collapsed isolation test file after implementation and reports verification only on completion", () => {
  const testsDone = renderToStaticMarkup(
    <CodeChanges stageIndex={1} stepIndex={3} complete={false} />,
  )
  expect(testsDone).toContain("tests/context-isolation.test.ts")
  expect(testsDone).toContain("tests/context-loader.test.ts")
  expect(testsDone).toContain("Selected excerpts · 4 files")
  expect(testsDone).toContain("+86 / -12")
  expect(testsDone).toContain('class="code-test-file"')
  expect((testsDone.match(/class="code-test-file"/g) ?? []).length).toBe(2)
  expect(testsDone).not.toContain('class="code-test-file" open')
  expect(testsDone).toContain("context.organization).toBeUndefined()")
  expect(testsDone).toContain("not.toEqual(otherContext)")
  expect(testsDone).not.toContain("scope boundaries · missing organization · context reuse")
  expect(testsDone).toContain("Verification pending")
  expect(testsDone).not.toContain("37 passed")

  const complete = renderToStaticMarkup(
    <CodeChanges stageIndex={2} stepIndex={3} complete={true} />,
  )
  expect(complete).toContain("Verified")
  expect(complete).toContain("37 passed")
})

test("Code view includes scoped accessible Session and Changes controls", () => {
  const html = renderToStaticMarkup(<ProductPreview />)
  expect(html).toContain('aria-label="Code session views"')
  expect(html).toMatch(/id="[^"]+-code-session-tab"/)
  expect(html).toMatch(/id="[^"]+-code-changes-tab"/)
  expect(html).toMatch(/aria-labelledby="[^"]+-code-session-tab"/)
  expect(html).toContain('tabindex="0"')
  expect(html).toContain('tabindex="-1"')
  expect(html).toContain('aria-label="Unified diff excerpt"')
})

test("Claw shows a saved routine before processing any invoices", () => {
  const html = renderToStaticMarkup(
    <ClawAutomation stageIndex={0} stepIndex={0} complete={false} paused={false} />,
  )
  expect(html).toContain("Every Friday · 09:00 KST")
  expect(html).toContain("Previous run · Aug 28")
  expect(html).toContain("0 / 4 checked")
  expect((html.match(/>Waiting</g) ?? []).length).toBe(3)
  expect(html).toContain("claw-task is-current")
  expect(html).toContain("preview-tool__spinner")
  expect(html).not.toContain("hosting-sep.pdf")
})

test("Claw only completes an invoice after its tool step and pauses its active row", () => {
  const html = renderToStaticMarkup(
    <ClawAutomation stageIndex={0} stepIndex={2} complete={false} paused={true} />,
  )
  expect(html).toContain("1 / 4 checked")
  expect(html).toContain("hosting-sep.pdf")
  expect(html).toContain(">Paused<")
  expect(html).not.toContain("analytics-sep.pdf")
  expect(html).not.toContain("preview-tool__spinner")
})

test("Claw distinguishes saved, skipped and missing invoices at completion", () => {
  const html = renderToStaticMarkup(
    <ClawAutomation stageIndex={2} stepIndex={3} complete={true} paused={true} />,
  )
  expect(html).toContain("4 / 4 checked")
  expect((html.match(/>Saved</g) ?? []).length).toBe(2)
  expect(html).toContain(">Skipped<")
  expect(html).toContain(">Needs attention<")
  expect(html).toContain("Finance / Invoices / 2026-09")
  expect(html).toContain("Friday admin, handled.")
  expect(html).toContain('class="claw-run-banner is-complete"')
  expect(html).toContain("Only follow-up: Design tools has not issued its invoice yet.")
  expect(html).not.toContain("claw-live-meter")
})

test("Claw changes visible activity immediately and saves its first invoice within four seconds", () => {
  const project = projects.find((project) => project.id === "claw")
  if (!project) throw new Error("Missing Claw fixture")
  const renderAt = (elapsed: number) =>
    renderToStaticMarkup(
      <ClawAutomation {...timelinePosition(project, elapsed)} complete={false} paused={false} />,
    )
  expect(renderAt(0)).toContain("claw-task is-current")
  expect(renderAt(2000)).not.toBe(renderAt(0))
  expect(renderAt(4000)).toContain("hosting-sep.pdf")
  expect(renderAt(4000)).toContain("1 / 4 checked")
  expect(renderAt(0)).not.toContain("hosting-sep.pdf")
})
