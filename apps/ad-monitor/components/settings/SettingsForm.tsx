"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, Play, StopCircle, CheckCircle2, XCircle, Send } from "lucide-react"

interface SettingsData {
  metaAdAccountId: string
  metaAccessToken: string
  notificationEmail: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPass: string
  imapHost: string
  imapPort: number
  slackWebhookUrl: string
  lastAgentRun: string | null
  agentEnabled: boolean
}

export function SettingsForm() {
  const [form, setForm] = useState<SettingsData>({
    metaAdAccountId: "", metaAccessToken: "", notificationEmail: "",
    smtpHost: "mail.privateemail.com", smtpPort: 465, smtpUser: "", smtpPass: "",
    imapHost: "mail.privateemail.com", imapPort: 993,
    slackWebhookUrl: "",
    lastAgentRun: null, agentEnabled: true,
  })
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testingImap, setTestingImap] = useState(false)
  const [imapResult, setImapResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testingPlaces, setTestingPlaces] = useState(false)
  const [placesResult, setPlacesResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [testingSlack, setTestingSlack] = useState(false)
  const [slackResult, setSlackResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [sendingReport, setSendingReport] = useState(false)
  const [reportResult, setReportResult] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [runLog, setRunLog] = useState<string[]>([])
  const [showRunLog, setShowRunLog] = useState(false)
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([])
  const toastCounter = useRef(0)

  useEffect(() => {
    fetch("/api/settings").then((r) => r.ok ? r.json() : {}).then((data: Partial<SettingsData>) => {
      setForm((prev) => {
        const safe = Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
        ) as Partial<SettingsData>
        return { ...prev, ...safe }
      })
    }).catch(() => {})
  }, [])

  function set(key: keyof SettingsData, value: string | number | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    await save()
    const res = await fetch("/api/campaigns?force=1")
    const data = res.ok ? await res.json() : { error: `Server error ${res.status}` }
    setTesting(false)
    if (data.error) {
      setTestResult({ ok: false, msg: data.error })
    } else {
      setTestResult({ ok: true, msg: `Connected — ${data.campaigns?.length ?? 0} campaigns found` })
    }
  }

  async function testImap() {
    setTestingImap(true)
    setImapResult(null)
    await save()
    const res = await fetch("/api/settings/test-imap", { method: "POST" })
    const data = res.ok ? await res.json() : { ok: false, msg: `Server error ${res.status}` }
    setTestingImap(false)
    setImapResult({ ok: data.ok, msg: data.msg })
  }

  async function testSlack() {
    setTestingSlack(true)
    setSlackResult(null)
    await save()
    const res = await fetch("/api/settings/test-slack", { method: "POST" })
    const data = res.ok ? await res.json() : { ok: false, msg: `Server error ${res.status}` }
    setTestingSlack(false)
    setSlackResult({ ok: data.ok, msg: data.msg })
  }

  async function sendTestReport() {
    setSendingReport(true)
    setReportResult(null)
    const res = await fetch("/api/report/send?preview=1", { method: "POST" })
    const data = res.ok ? await res.json() : { ok: false, error: `Server error ${res.status}` }
    setSendingReport(false)
    if (data.ok) {
      const r = data.results?.[0]
      setReportResult(r?.sent ? "Report sent to notification email" : `Failed: ${r?.error ?? "unknown"}`)
    } else {
      setReportResult(`Error: ${data.error ?? "unknown"}`)
    }
  }

  async function testPlaces() {
    setTestingPlaces(true)
    setPlacesResult(null)
    const res = await fetch("/api/outreach/places/test")
    const data = res.ok ? await res.json() : { ok: false, msg: `Server error ${res.status}` }
    setTestingPlaces(false)
    setPlacesResult({ ok: data.ok, msg: data.msg })
  }

  function showToast(msg: string, ok = true) {
    const id = ++toastCounter.current
    setToasts((prev) => [...prev, { id, msg, ok }].slice(-3))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }

  async function toggleAgent() {
    const next = !form.agentEnabled
    setForm((f) => ({ ...f, agentEnabled: next }))
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agentEnabled: next }),
    })
    showToast(next ? "Agent enabled" : "Agent disabled", next)
  }

  async function runAgent() {
    setRunning(true)
    setRunResult(null)
    setRunLog([])
    setShowRunLog(false)
    const res = await fetch("/api/agent/run", { method: "POST" })
    const data = res.ok ? await res.json() : { success: false, error: `Server error ${res.status}` }
    setRunning(false)
    setRunResult(data.success ? `Done — ${data.actionsCount} action(s) taken` : `Error: ${data.error ?? data.errors?.[0] ?? "Unknown error"}`)
    if (data.log?.length) { setRunLog(data.log); setShowRunLog(true) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Meta API Credentials</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Ad Account ID</Label>
            <Input value={form.metaAdAccountId ?? ""} onChange={(e) => set("metaAdAccountId", e.target.value)} placeholder="123456789" />
            <p className="text-xs text-zinc-400">Found at business.facebook.com → Ad Accounts (numbers only, no act_ prefix)</p>
          </div>
          <div className="space-y-1">
            <Label>Access Token</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                value={form.metaAccessToken ?? ""}
                onChange={(e) => set("metaAccessToken", e.target.value)}
                placeholder="EAAxxxxxxxxx..."
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-400">Generate at business.facebook.com → Settings → System Users with ads_read + ads_management permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={testConnection} disabled={testing} className="gap-1.5">
              {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Test Connection
            </Button>
            {testResult && (
              <div className="flex items-center gap-1.5 text-sm">
                {testResult.ok
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={testResult.ok ? "text-green-600" : "text-red-600"}>{testResult.msg}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Email Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Notification email</Label>
            <Input type="email" value={form.notificationEmail ?? ""} onChange={(e) => set("notificationEmail", e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SMTP Host</Label>
              <Input value={form.smtpHost ?? ""} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-1">
              <Label>SMTP Port</Label>
              <Input type="number" value={form.smtpPort ?? 587} onChange={(e) => set("smtpPort", parseInt(e.target.value) || 587)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SMTP Username</Label>
              <Input value={form.smtpUser ?? ""} onChange={(e) => set("smtpUser", e.target.value)} placeholder="you@gmail.com" />
            </div>
            <div className="space-y-1">
              <Label>SMTP Password / App Password</Label>
              <Input type="password" value={form.smtpPass ?? ""} onChange={(e) => set("smtpPass", e.target.value)} placeholder="Gmail app password" />
            </div>
          </div>
          <p className="text-xs text-zinc-400">For Gmail: myaccount.google.com → Security → 2-Step Verification → App Passwords</p>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
            <div className="space-y-1">
              <Label>IMAP Host</Label>
              <Input value={form.imapHost ?? ""} onChange={(e) => set("imapHost", e.target.value)} placeholder="mail.privateemail.com" />
            </div>
            <div className="space-y-1">
              <Label>IMAP Port</Label>
              <Input type="number" value={form.imapPort ?? 993} onChange={(e) => set("imapPort", parseInt(e.target.value) || 993)} />
            </div>
          </div>
          <p className="text-xs text-zinc-400">Uses the same username and password as SMTP. Used to fetch lead replies in the Outreach inbox.</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testImap} disabled={testingImap} className="gap-1.5">
              {testingImap && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Verify IMAP Connection
            </Button>
            {imapResult && (
              <div className="flex items-center gap-1.5 text-sm">
                {imapResult.ok
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={imapResult.ok ? "text-green-600" : "text-red-600"}>{imapResult.msg}</span>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={sendTestReport} disabled={sendingReport} className="gap-1.5 text-xs">
              {sendingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send test weekly report
            </Button>
            {reportResult && <span className="text-xs text-zinc-500">{reportResult}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Slack Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-500">
            Post an alert to a Slack channel whenever a rule fires.
          </p>
          <div className="space-y-1">
            <Label>Incoming Webhook URL</Label>
            <Input
              value={form.slackWebhookUrl ?? ""}
              onChange={(e) => set("slackWebhookUrl", e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-zinc-400">Create a webhook at api.slack.com → Your Apps → Incoming Webhooks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testSlack} disabled={testingSlack || !form.slackWebhookUrl} className="gap-1.5">
              {testingSlack && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Send Test Message
            </Button>
            {slackResult && (
              <div className="flex items-center gap-1.5 text-sm">
                {slackResult.ok
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={slackResult.ok ? "text-green-600" : "text-red-600"}>{slackResult.msg}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Ads</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-500">
            Infrastructure is ready. Add credentials to enable Google Ads campaign management.
          </p>
          <div className="space-y-2 p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
            <p className="font-medium text-zinc-700">How to acquire a Developer Token:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Sign in at ads.google.com → create a Manager Account</li>
              <li>Go to <strong>Tools → API Center</strong> → apply for Developer Token</li>
              <li>In Google Cloud Console → APIs &amp; Services → enable <em>Google Ads API</em></li>
              <li>Create OAuth 2.0 credentials → add redirect URI: developers.google.com/oauthplayground</li>
              <li>Use OAuth Playground to generate per-client refresh tokens</li>
              <li>Set <code>GOOGLE_ADS_DEVELOPER_TOKEN</code>, <code>GOOGLE_ADS_CLIENT_ID</code>, <code>GOOGLE_ADS_CLIENT_SECRET</code> in Vercel env vars</li>
            </ol>
          </div>
          <p className="text-xs text-zinc-400">Per-client Customer ID and refresh tokens are set in the Clients section below.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Google Places API</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-500">
            Used by the <strong>Find on Maps</strong> tab in Outreach to search for businesses via Google Maps.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-md bg-zinc-50 border border-zinc-200">
            <code className="text-xs text-zinc-600 flex-1">GOOGLE_PLACES_API_KEY</code>
            <span className="text-xs text-zinc-400">set in Vercel environment variables</span>
          </div>
          <p className="text-xs text-zinc-400">
            Get a key at Google Cloud Console → APIs &amp; Services → Enable <em>Places API (New)</em> → Credentials.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testPlaces} disabled={testingPlaces} className="gap-1.5">
              {testingPlaces && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Test Places API
            </Button>
            {placesResult && (
              <div className="flex items-center gap-1.5 text-sm">
                {placesResult.ok
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={placesResult.ok ? "text-green-600" : "text-red-600"}>{placesResult.msg}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Agent</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {form.lastAgentRun && (
            <p className="text-sm text-zinc-500">Last run: {new Date(form.lastAgentRun).toLocaleString()}</p>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button onClick={runAgent} disabled={running || !form.agentEnabled} className="gap-1.5">
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run Agent Now
              </Button>
              <Button
                variant="outline"
                onClick={toggleAgent}
                className={`gap-1.5 ${form.agentEnabled ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
              >
                <StopCircle className="h-4 w-4" />
                {form.agentEnabled ? "Stop Agent" : "Enable Agent"}
              </Button>
              {runResult && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-zinc-600">{runResult}</span>
                  {runLog.length > 0 && (
                    <button
                      onClick={() => setShowRunLog((s) => !s)}
                      className="text-xs text-indigo-500 hover:text-indigo-700"
                    >
                      {showRunLog ? "hide log" : "show log"}
                    </button>
                  )}
                </div>
              )}
            </div>
            {showRunLog && runLog.length > 0 && (
              <pre className="text-xs bg-zinc-950 text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap rounded-md p-3 max-h-64 overflow-y-auto">
                {runLog.join("\n")}
              </pre>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            To schedule daily runs on Windows, run this in PowerShell as Administrator:
          </p>
          <pre className="text-xs bg-zinc-50 border rounded p-3 overflow-x-auto whitespace-pre-wrap">{`$action = New-ScheduledTaskAction -Execute "curl.exe" \`
  -Argument "-X POST http://localhost:3000/api/agent/run -H 'Authorization: Bearer change-this-to-a-long-random-secret'"
$trigger = New-ScheduledTaskTrigger -Daily -At 6AM
Register-ScheduledTask -TaskName "AdMonitorAgent" -Action $action -Trigger $trigger`}</pre>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
      </div>

      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${t.ok ? "bg-zinc-900" : "bg-red-600"}`}
            >
              {t.ok
                ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                : <StopCircle className="h-4 w-4 shrink-0" />}
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
