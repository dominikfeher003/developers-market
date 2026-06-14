import { Client, Rule, Alert } from "./types"

const DEFAULTS: Record<string, unknown> = {
  "clients.json": [],
  "rules.json": [],
  "alerts.json": [],
}

async function blobRead<T>(filename: string): Promise<T> {
  const { list } = await import("@vercel/blob")
  const { blobs } = await list({
    prefix: `admonitor/${filename}`,
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  })
  const blob = blobs[0]
  if (!blob) return (DEFAULTS[filename] ?? []) as T
  const res = await fetch(blob.url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) return (DEFAULTS[filename] ?? []) as T
  return (await res.json()) as T
}

async function fileRead<T>(filename: string): Promise<T> {
  const fs = await import("fs/promises")
  const path = await import("path")
  const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data")
  const filePath = path.join(DATA_DIR, filename)
  try {
    const content = await fs.readFile(filePath, "utf8")
    return JSON.parse(content) as T
  } catch {
    return (DEFAULTS[filename] ?? []) as T
  }
}

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN && !process.env.DATA_DIR
}

async function readJSON<T>(filename: string): Promise<T> {
  return useBlob() ? blobRead<T>(filename) : fileRead<T>(filename)
}

export async function readClients(): Promise<Client[]> {
  return readJSON<Client[]>("clients.json")
}

export async function readRules(): Promise<Rule[]> {
  return readJSON<Rule[]>("rules.json")
}

export async function readAlerts(): Promise<Alert[]> {
  return readJSON<Alert[]>("alerts.json")
}
