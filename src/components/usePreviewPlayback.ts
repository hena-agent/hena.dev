import { useEffect, useRef, useState } from "react"
import { type PreviewProject, timelineDuration, timelinePosition } from "@/data/preview"

type Playback = {
  progress: number
  elapsed: number
  isPaused: boolean
  isComplete: boolean
  stageIndex: number
  stepIndex: number
  stepProgress: number
  reducedMotion: boolean
}

export function usePreviewPlayback(
  project: PreviewProject,
  hostRef: React.RefObject<HTMLElement | null>,
  active: boolean,
): Playback & { run: number; pause: () => void; resume: () => void; replay: () => void } {
  // Each mounted project panel owns its progress, even when another panel is selected.
  const [savedElapsed, setElapsed] = useState(timelineDuration(project))
  const [manualPaused, setManualPaused] = useState(false)
  const [run, setRun] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [motionPreferenceReady, setMotionPreferenceReady] = useState(false)
  const autoStarted = useRef(false)
  const elapsedRef = useRef(savedElapsed)
  const elapsed = reducedMotion ? timelineDuration(project) : savedElapsed
  const duration = timelineDuration(project)
  const position = timelinePosition(project, elapsed)
  const isComplete = elapsed >= duration
  const isPaused =
    manualPaused || !active || !isVisible || !documentVisible || reducedMotion || isComplete

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)
    update()
    setMotionPreferenceReady(true)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const node = hostRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.intersectionRatio >= 0.2),
      {
        threshold: 0.2,
      },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hostRef])

  useEffect(() => {
    if (
      active &&
      isVisible &&
      documentVisible &&
      !reducedMotion &&
      motionPreferenceReady &&
      !manualPaused &&
      isComplete &&
      !autoStarted.current
    ) {
      autoStarted.current = true
      elapsedRef.current = 0
      setElapsed(0)
      setRun((current) => current + 1)
    }
  }, [
    active,
    documentVisible,
    isComplete,
    isVisible,
    manualPaused,
    motionPreferenceReady,
    reducedMotion,
  ])

  // The ref keeps the RAF loop stable; run deliberately restarts it for replay.
  // biome-ignore lint/correctness/useExhaustiveDependencies: elapsed is maintained in a ref and run restarts replay.
  useEffect(() => {
    if (
      !active ||
      !isVisible ||
      !documentVisible ||
      !motionPreferenceReady ||
      reducedMotion ||
      manualPaused ||
      isComplete
    ) {
      return
    }
    let lastTime = performance.now()
    let currentElapsed = elapsedRef.current
    let frame = 0
    const tick = (now: number) => {
      const delta = now - lastTime
      lastTime = now
      currentElapsed = Math.min(duration, currentElapsed + delta)
      elapsedRef.current = currentElapsed
      setElapsed(currentElapsed)
      if (currentElapsed < duration) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [
    active,
    documentVisible,
    duration,
    isComplete,
    isVisible,
    manualPaused,
    motionPreferenceReady,
    reducedMotion,
    run,
  ])

  useEffect(() => {
    const handleVisibility = () => setDocumentVisible(document.visibilityState === "visible")
    handleVisibility()
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  const pause = () => {
    if (!reducedMotion && !isComplete) setManualPaused(true)
  }
  const resume = () => {
    if (!reducedMotion && !isComplete) setManualPaused(false)
  }
  const replay = () => {
    if (reducedMotion) return
    autoStarted.current = true
    elapsedRef.current = 0
    setElapsed(0)
    setManualPaused(false)
    setRun((current) => current + 1)
  }

  return {
    run,
    progress: position.progress,
    elapsed,
    isPaused,
    isComplete,
    stageIndex: position.stageIndex,
    stepIndex: position.stepIndex,
    stepProgress: position.stepProgress,
    reducedMotion,
    pause,
    resume,
    replay,
  }
}
