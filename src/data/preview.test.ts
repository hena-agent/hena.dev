/// <reference types="bun" />
import { describe, expect, test } from "bun:test"
import {
  projects,
  responseDuration,
  stageDuration,
  streamedText,
  timelineDuration,
  timelinePosition,
} from "@/data/preview"

describe("preview timelines", () => {
  test("uses three meaningful cycles and a 12ms grapheme cadence", () => {
    expect(responseDuration("hello")).toBe(60)
    expect(responseDuration("A👩‍💻B")).toBe(36)
    for (const project of projects) {
      expect(project.stages).toHaveLength(3)
      for (const stage of project.stages) {
        expect(stage.steps[0].kind).toBe("message")
        expect(stage.steps.some((step) => step.kind === "tool")).toBe(true)
        expect(stage.steps.at(-1)?.kind).toBe("observation")
      }
      expect(timelineDuration(project)).toBeGreaterThanOrEqual(18000)
      expect(timelineDuration(project)).toBeLessThanOrEqual(30000)
    }
  })

  test("derives every stage from its discriminated steps", () => {
    for (const project of projects) {
      expect(timelineDuration(project)).toBe(
        project.stages.reduce((total, stage) => total + stageDuration(stage), 0),
      )
    }
  })

  test("maps elapsed time to the active step and clamps boundaries", () => {
    const project = projects.find((item) => item.id === "code")
    if (!project) throw new Error("Code project fixture is missing")
    const firstStepEnd = stageDuration(project.stages[0])
    expect(timelinePosition(project, -10).stageIndex).toBe(0)
    expect(timelinePosition(project, firstStepEnd).stageIndex).toBe(1)
    expect(timelinePosition(project, firstStepEnd).stepIndex).toBe(0)
    expect(timelinePosition(project, 99999).progress).toBe(1)
    expect(timelinePosition(project, 99999).stepProgress).toBe(1)
  })

  test("streams grapheme clusters without splitting a combined character", () => {
    const text = "A👩‍💻B"
    expect(streamedText(text, 0)).toBe("")
    expect(streamedText(text, -1)).toBe("")
    expect(streamedText(text, 0.5)).toBe("A👩‍💻")
    expect(streamedText("xe\u0301y", 0.5)).toBe("xe\u0301")
    expect(streamedText(text, 1)).toBe(text)
  })
})
