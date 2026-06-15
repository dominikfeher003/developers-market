"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isToolUIPart, isTextUIPart } from "ai"
import { Send, Search, Mail, Loader2, MapPin, Phone, Globe, Star, X } from "lucide-react"

type Place = {
  id: string
  name: string
  address: string
  rating: number | null
  website: string
  phone: string
}

type EmailDraft = {
  subject: string
  body: string
}

function PlaceCard({
  place,
  onWriteEmail,
}: {
  place: Place
  onWriteEmail: (place: Place) => void
}) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-100 leading-tight">{place.name}</p>
        {place.rating && (
          <span className="flex items-center gap-0.5 text-xs text-amber-400 shrink-0">
            <Star className="h-3 w-3 fill-amber-400" />
            {place.rating}
          </span>
        )}
      </div>
      {place.address && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-400">
          <MapPin className="h-3 w-3 shrink-0" />
          {place.address}
        </p>
      )}
      {place.phone && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Phone className="h-3 w-3 shrink-0" />
          {place.phone}
        </p>
      )}
      {place.website && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
          <Globe className="h-3 w-3 shrink-0" />
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:text-indigo-400 transition-colors"
          >
            {place.website.replace(/^https?:\/\//, "")}
          </a>
        </p>
      )}
      <button
        onClick={() => onWriteEmail(place)}
        className="mt-1 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 rounded-md py-1.5 transition-colors"
      >
        <Mail className="h-3 w-3" />
        Write email
      </button>
    </div>
  )
}

function EmailPreviewCard({
  draft,
  businessName,
  website,
}: {
  draft: EmailDraft
  businessName: string
  website?: string
}) {
  const [to, setTo] = useState("")
  const [toName, setToName] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [body, setBody] = useState(draft.body)
  const [subject, setSubject] = useState(draft.subject)
  const [editing, setEditing] = useState(false)

  async function handleSend() {
    if (!to.trim()) { setError("Enter recipient email"); return }
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, toName, company: businessName, subject, body, website }),
      })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) setSent(true)
      else setError(data.error ?? "Failed to send")
    } catch {
      setError("Network error")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-sm text-green-400">
        Email sent to {to}
      </div>
    )
  }

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Draft</p>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-zinc-500">Subject</p>
        {editing ? (
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1 text-xs text-zinc-100 outline-none focus:border-indigo-500"
          />
        ) : (
          <p className="text-xs font-medium text-zinc-100">{subject}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-zinc-500">Body</p>
        {editing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
          />
        ) : (
          <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{body}</p>
        )}
      </div>

      <div className="border-t border-zinc-700 pt-2.5 space-y-2">
        <p className="text-[11px] text-zinc-500">Send to</p>
        <div className="flex gap-2">
          <input
            value={toName}
            onChange={(e) => setToName(e.target.value)}
            placeholder="Contact name (optional)"
            className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
          />
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com"
            type="email"
            className="flex-1 bg-zinc-900 border border-zinc-600 rounded px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-indigo-500 placeholder:text-zinc-600"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-md py-2 transition-colors"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {sending ? "Sending..." : "Send Email"}
        </button>
      </div>
    </div>
  )
}

const STARTERS = [
  "Find roofing companies in Miami, FL",
  "Find restaurants in Chicago with low ratings",
  "Search for dental clinics in Toronto",
  "Find e-commerce stores in London",
]

export function OutreachChat() {
  const [input, setInput] = useState("")
  const [writeEmailTarget, setWriteEmailTarget] = useState<Place | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/outreach/chat" }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleWriteEmail(place: Place) {
    setWriteEmailTarget(null)
    const prompt = `Write a cold email for ${place.name}${place.website ? ` (website: ${place.website})` : ""}`
    sendMessage({ text: prompt })
  }

  function handleStarter(text: string) {
    sendMessage({ text })
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Search className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">Outreach Assistant</p>
          <p className="text-xs text-zinc-500">Powered by Google Places + Claude AI</p>
        </div>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.700)_transparent]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center space-y-1">
              <p className="text-zinc-300 font-medium">Find businesses. Write emails. Send them.</p>
              <p className="text-zinc-500 text-sm">Describe who you want to reach and where.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStarter(s)}
                  className="text-left text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div className={`max-w-[85%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              {message.parts.map((part, i) => {
                if (isTextUIPart(part) && part.text) {
                  return (
                    <div
                      key={i}
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                      }`}
                    >
                      {part.text}
                    </div>
                  )
                }

                if (isToolUIPart(part)) {
                  const toolName = "type" in part ? (part.type as string).replace("tool-", "") : ""

                  if (part.state === "input-available" || (part.state as string) === "partial-call") {
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 rounded-lg px-3 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {toolName === "searchPlaces" ? "Searching Google Places..." : "Drafting email..."}
                      </div>
                    )
                  }

                  if (part.state === "output-available") {
                    if (toolName === "searchPlaces") {
                      const output = (part as { output: { places?: Place[]; error?: string } }).output
                      if (output.error) {
                        return (
                          <div key={i} className="text-xs text-red-400 bg-zinc-900 rounded-lg px-3 py-2">
                            {output.error}
                          </div>
                        )
                      }
                      const places = output.places ?? []
                      return (
                        <div key={i} className="w-full space-y-2">
                          <p className="text-xs text-zinc-500">{places.length} businesses found</p>
                          <div className="grid gap-2">
                            {places.map((place) => (
                              <PlaceCard key={place.id} place={place} onWriteEmail={handleWriteEmail} />
                            ))}
                          </div>
                        </div>
                      )
                    }

                    if (toolName === "generateEmail") {
                      const output = (part as { output: EmailDraft | { error: string }; input: { businessName: string; website?: string } }).output
                      if ("error" in output) {
                        return (
                          <div key={i} className="text-xs text-red-400 bg-zinc-900 rounded-lg px-3 py-2">
                            {(output as { error: string }).error}
                          </div>
                        )
                      }
                      const input = (part as { input: { businessName: string; website?: string } }).input
                      return (
                        <EmailPreviewCard
                          key={i}
                          draft={output as EmailDraft}
                          businessName={input.businessName}
                          website={input.website}
                        />
                      )
                    }
                  }
                }

                return null
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find roofing companies in Miami..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-50 transition-colors [field-sizing:content] max-h-32"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-colors"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-zinc-700 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
