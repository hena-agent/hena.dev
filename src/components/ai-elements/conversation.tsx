import { ArrowDown } from "lucide-react"
import type { ComponentProps } from "react"
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom"
import { cn } from "@/lib/utils"

// Adapted from Vercel AI Elements Conversation, Apache-2.0 licensed.
// Copyright 2023 Vercel, Inc. Modified for this project.
// https://github.com/vercel/ai-elements/blob/main/packages/elements/src/conversation.tsx
export type ConversationProps = ComponentProps<typeof StickToBottom>

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn("ai-conversation", className)}
    initial="instant"
    resize="instant"
    role="log"
    aria-live="off"
    {...props}
  />
)

export const ConversationContent = ({
  className,
  ...props
}: ComponentProps<typeof StickToBottom.Content>) => (
  <StickToBottom.Content className={cn("ai-conversation__content", className)} {...props} />
)

export const ConversationScrollButton = ({ className, ...props }: ComponentProps<"button">) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()
  if (isAtBottom) return null
  return (
    <button
      type="button"
      className={cn("conversation-latest", className)}
      onClick={() => scrollToBottom()}
      aria-label="Jump to latest activity"
      {...props}
    >
      <ArrowDown size={12} aria-hidden="true" /> Latest
    </button>
  )
}
