"use client"

import { useEffect, useState } from "react"

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export function Greeting({ name }: { name: string }) {
  const [text, setText] = useState("Welcome back")

  useEffect(() => {
    setText(getGreeting())
  }, [])

  return (
    <h2 className="text-xl font-bold text-foreground">
      {text}, {name}
    </h2>
  )
}
