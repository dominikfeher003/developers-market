"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Loader2, ChevronDown, ChevronUp, Menu, Moon, Sun } from "lucide-react"
import { useSidebar } from "@/lib/sidebar-context"

interface TopBarProps {
  title: string
  lastRun?: string | null
}

export function TopBar({ title, lastRun }: TopBarProps) {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [showLog, setShowLog] = useState(false)
  const [dark, setDark] = useState(false)
  const { setOpen } = useSidebar()

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("monitor-theme", next ? "dark" : "light")
  }

  async function handleRun() {
    setRunning(true)
    setResult(null)
    setLog([])
    setShowLog(false)
    try {
      const res = await fetch("/api/agent/run", { method: "POST" })
      const data = await res.json()
      setResult(data.success ? `Done — ${data.actionsCount} action(s) taken` : `Error: ${data.error ?? data.errors?.[0] ?? "Unknown error"}`)
      if (data.log?.length) { setLog(data.log); setShowLog(true) }
    } catch {
      setResult("Request failed")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b bg-background gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="md:hidden text-zinc-500 hover:text-foreground shrink-0"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {result && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-sm text-zinc-500">{result}</span>
              {log.length > 0 && (
                <button
                  onClick={() => setShowLog((s) => !s)}
                  className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5"
                >
                  {showLog ? <><ChevronUp className="h-3 w-3" />hide log</> : <><ChevronDown className="h-3 w-3" />show log</>}
                </button>
              )}
            </div>
          )}
          {lastRun && (
            <span className="hidden lg:inline text-xs text-zinc-400">
              Last run: {new Date(lastRun).toLocaleString()}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button size="sm" onClick={handleRun} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Run Agent</span>
          </Button>
        </div>
      </header>
      {showLog && log.length > 0 && (
        <div className="border-b bg-zinc-950 px-4 md:px-6 py-3 max-h-64 overflow-y-auto">
          <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
            {log.join("\n")}
          </pre>
        </div>
      )}
      {result && (
        <div className="sm:hidden border-b bg-muted px-4 py-2">
          <p className="text-xs text-zinc-500">{result}</p>
        </div>
      )}
    </div>
  )
}
