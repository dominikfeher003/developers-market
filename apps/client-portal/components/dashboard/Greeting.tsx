"use client"

import { useEffect, useState } from "react"
import { usePortalI18n } from "@/lib/i18n/context"

export function Greeting({ name }: { name: string }) {
  const { t } = usePortalI18n()
  const [text, setText] = useState(t.greeting.welcomeBack)

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setText(t.greeting.morning)
    else if (h < 18) setText(t.greeting.afternoon)
    else setText(t.greeting.evening)
  }, [t])

  return (
    <h2 className="text-xl font-bold text-foreground">
      {text}, {name}
    </h2>
  )
}
