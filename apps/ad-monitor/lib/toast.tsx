"use client"

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info"
interface Toast { id: number; msg: string; type: ToastType }

interface ToastCtx {
  addToast: (msg: string, type?: ToastType) => void
}

const Ctx = createContext<ToastCtx>({ addToast: () => {} })

export function useToast() { return useContext(Ctx) }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const addToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++counter.current
    setToasts((prev) => [...prev.slice(-4), { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  const ICON = { success: CheckCircle2, error: XCircle, info: Info }
  const COLORS = {
    success: "border-l-emerald-500 bg-card",
    error: "border-l-red-500 bg-card",
    info: "border-l-indigo-500 bg-card",
  }
  const ICON_COLOR = {
    success: "text-emerald-500", error: "text-red-500", info: "text-indigo-500",
  }

  return (
    <Ctx.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICON[t.type]
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-lg border border-border border-l-4 shadow-lg pointer-events-auto animate-in slide-in-from-right-4 fade-in-0 duration-200",
                COLORS[t.type]
              )}
            >
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", ICON_COLOR[t.type])} />
              <p className="text-sm text-foreground flex-1 leading-snug">{t.msg}</p>
              <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
