import { cn } from '@/lib/utils'
import { ChatHeader } from './chat-header'
import { ChatInput } from './chat-input'
import { EmptyState } from './chat-states'
import { MessageList } from './message-list'
import type { ChatMessage, ChatStatus, TokenUsage } from './types'

export type ChatPanelProps = {
  title?: string
  model: string
  messages: ChatMessage[]
  usage: TokenUsage
  status: ChatStatus
  error?: string | null
  suggestions?: string[]
  onSend: (content: string) => void
  onClear: () => void
  onRetry?: () => void
  className?: string
}

export function ChatPanel({
  title,
  model,
  messages,
  usage,
  status,
  error,
  suggestions,
  onSend,
  onClear,
  onRetry,
  className,
}: ChatPanelProps) {
  const isLoading = status === 'loading'
  const isEmpty = messages.length === 0 && !isLoading && !error

  return (
    <section
      aria-label="Chat"
      className={cn('flex h-dvh min-h-0 flex-col bg-background text-foreground', className)}
    >
      <ChatHeader
        title={title}
        model={model}
        usage={usage}
        isLoading={isLoading}
        canClear={messages.length > 0 && !isLoading}
        onClear={onClear}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {isEmpty ? (
          <EmptyState suggestions={suggestions} onSelectSuggestion={onSend} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            error={status === 'error' ? error : ¶»§q«^