/// <reference types="bun" />
import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { projects } from "@/data/preview"
import { ProductPreview } from "./ProductPreview"

test("SSR renders the completed transcript with scoped state classes", () => {
  const html = renderToStaticMarkup(<ProductPreview />)
  expect(html).toContain('class="preview-activity is-paused"')
  expect(html).toContain("Research")
  expect(html).toContain("Read session lifecycle")
  expect(html).toContain("Weekly digest ready")
  expect(html).not.toContain("activity-pending")
})

test("SSR keeps prose in the transcript and scopes disclosures to tools", () => {
  const html = renderToStaticMarkup(<ProductPreview />)
  const readableHtml = html.replaceAll("&#x27;", "'")
  expect((html.match(/class="preview-tools"/g) ?? []).length).toBe(9)
  expect((html.match(/class="preview-tool(?: |")/g) ?? []).length).toBe(18)
  expect(html).not.toContain("preview-cycle")
  expect(html).not.toContain("preview-step-text__marker")
  expect(html).toContain("Research agent")
  expect(html).toContain("Implementation agent")
  expect(html).toContain("Test runner")
  expect(html).toContain("Browser agent")
  expect(html).toContain("2 tasks completed")

  for (const project of projects) {
    for (const stage of project.stages) {
      for (const step of stage.steps) {
        expect(readableHtml).toContain(step.kind === "tool" ? step.label : step.text)
      }
    }
  }
})
