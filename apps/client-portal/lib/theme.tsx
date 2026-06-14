"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolved] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = (localStorage.getItem("portal-theme") as Theme) || "system"
    setThemeState(stored)
    apply(stored)
  }, [])

  function apply(t: Theme) {
    const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
    setResolved(dark ? "dark" : "light")
  }

  function setTheme(t: Theme) {
    localStorage.setItem("portal-theme", t)
    setThemeState(t)
    apply(t)
  }

  // sync system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => { if (theme === "system") apply("system") }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
