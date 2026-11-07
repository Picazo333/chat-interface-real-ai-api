'use client'

import { useRef, useState } from 'react'
import { ChatPanel } from '@/components/chat'
import type { ChatMessageType, ChatStatus, TokenUsageType } from '@/components/chat'

const SUGGESTIONS = [
  'Summarize the key ideas of React Server Components',
  'Write a haiku about TypeScript',
  'Explain token limits in simple terms',
  'Show me how this demo simulates an error',
]

const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4))

function mockReply(prompt: string) {
  return `This is a simulated response for UI preview purposes.\n\nYou asked: "${prompt}"\n\nIn your app, replace the demo controller with your existing chat hook and pass messages, status, and usage into <ChatPanel />.`
}

// Placeholder state controller used only to preview the components.
// Swap this for the existing chat state/hook in the host application.
export function ChatDemo() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<TokenUsageType>({ input: 0, output: 0 })
  const lastPrompt = useRef<string | null>(null)

  function respond(prompt: string) {
    setStatus('loading')
    setError(null)
    window.setTimeout(() => {
      if (/error/i.test(prompt)) {
        setStatus('error')
        setError('The model could not complete this request. Please try again.')
        return
      }
      co¶»§q«^