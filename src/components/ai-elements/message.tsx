import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

// Minimal role/content primitives adapted from Vercel AI Elements Message, Apache-2.0 licensed.
// Copyright 2023 Vercel, Inc. Modified for this project.
// https://github.com/vercel/ai-elements/blob/main/packages/elements/src/message.tsx
export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: "user" | "assistant" | "system"
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "ai-message",
      from === "user" ? "ai-message--user" : "ai-message--assistant",
      className,
    )}
    {...props}
  />
)

export const MessageContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("ai-message__content", className)} {...props} />
)
