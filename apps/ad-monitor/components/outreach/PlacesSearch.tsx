"use client"

import { useState, useRef } from "react"
import { Search, Loader2, Globe, Phone, Star, Plus, Check, ExternalLink, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { LANGUAGES } from "@/lib/languages"

interface PlaceResult {
  id: string
  name: string
  address: string
  rating: number | null
  ratingCount: number | null
  website: string
  phone: string
}

interface AddForm {
  firstName: string
  lastName: string
  email: string
  language: string
}

const EMPTY_ADD: AddForm = { firstName: "", lastName: "", email: "", language: "English" }

export function PlacesSearch() {
  const [what, setWhat] = useState("")
  const [where, setWhere] = useState("")
  const [places, setPlaces] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<AddForm>(EMPTY_ADD)
  const [addSaving, setAddSaving] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const whatRef = useRef<HTMLInputElement>(null)

  async function search() {
    if (!what.trim()) { whatRef.current?.focus(); return }
    setLoading(true)
    setError(null)
    setPlaces([])
    const query = where.trim() ? `${what.trim()} in ${where.trim()}` : what.trim()
    try {
      const res = await fetch("/api/outreach/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (res.status === 500 && data.error?.includes("not configured")) {
        setNotConfigured(true)
        return
      }
      if (data.error) { setError(data.error); return }
      setPlaces(data.places ?? [])
      if ((data.places ?? []).length === 0) setError("No results found. Try a different search.")
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function openAdd(place: PlaceResult) {
    setAddingId(place.id)
    setAddForm(EMPTY_ADD)
  }

  async function confirmAdd(place: PlaceResult) {
    setAddSaving(true)
    try {
      const res = await fetch("/api/outreach/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: addForm.firstName.trim() || place.name,
          lastName: addForm.lastName.trim(),
          email: addForm.email.trim(),
          title: "",
          company: place.name,
          website: place.website,
          country: "",
          language: addForm.language,
        }),
      })
      const data = await res.json()
      if (data.client || data.added !== undefined) {
        setAddedIds(prev => new Set([...prev, place.id]))
        setAddingId(null)
      } else {
        setError(data.error ?? "Failed to add")
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setAddSaving(false)
    }
  }

  if (notConfigured) {
    return (
      <div className="max-w-xl space-y-4">
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-5 space-y-3">
          <p className="font-medium text-amber-800">Google Places API key required</p>
          <p className="text-sm text-amber-700">
            This feature uses the Google Places API to search for businesses. You need a free API key from Google Cloud.
          </p>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Go to Google Cloud Console → Enable <strong>Places API (New)</strong></li>
            <li>Create an API key under Credentials</li>
            <li>Add <code className="bg-amber-100 px-1 rounded">GOOGLE_PLACES_API_KEY=your_key</code> to your Vercel environment variables</li>
            <li>Redeploy</li>
          </ol>
          <p className="text-xs text-amber-600">Free tier includes $200/month credit — roughly 6,000 searches.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Search form */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            ref={whatRef}
            value={what}
            onChange={e => setWhat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Business type (e.g. dentists, car dealerships)"
          />
        </div>
        <div className="flex-1 min-w-36">
          <Input
            value={where}
            onChange={e => setWhere(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="City or area (e.g. Chicago)"
          />
        </div>
        <Button onClick={search} disabled={loading || !what.trim()} className="gap-1.5 shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      <p className="text-xs text-zinc-400 -mt-4">
        Results come from Google Maps. Email addresses are not available — add them when importing to pipeline.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Results */}
      {places.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">{places.length} result{places.length !== 1 ? "s" : ""}</p>
          {places.map(place => {
            const isAdded = addedIds.has(place.id)
            const isAdding = addingId === place.id

            return (
              <div key={place.id} className="border rounded-lg bg-white overflow-hidden">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{place.name}</p>
                      {place.rating && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {place.rating.toFixed(1)}
                          {place.ratingCount && <span className="text-zinc-400">({place.ratingCount.toLocaleString()})</span>}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />{place.address}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-0.5">
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500"
                          onClick={e => e.stopPropagation()}
                        >
                          <Globe className="h-3 w-3" />
                          {new URL(place.website).hostname.replace(/^www\./, "")}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {place.phone && (
                        <span className="flex items-center gap-1 text-xs text-zinc-400">
                          <Phone className="h-3 w-3" />{place.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="h-3.5 w-3.5" /> Added
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant={isAdding ? "default" : "outline"}
                        className="gap-1 h-7 text-xs"
                        onClick={() => isAdding ? setAddingId(null) : openAdd(place)}
                      >
                        <Plus className="h-3 w-3" />
                        {isAdding ? "Cancel" : "Add to pipeline"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Inline add form */}
                {isAdding && (
                  <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 space-y-3">
                    <p className="text-xs text-zinc-500">
                      Adding <strong>{place.name}</strong> to pipeline. Optionally add a contact person and email.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">First name</Label>
                        <Input
                          value={addForm.firstName}
                          onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))}
                          placeholder="Contact first name"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Last name</Label>
                        <Input
                          value={addForm.lastName}
                          onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last name"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email <span className="text-zinc-400">(optional — can be added later)</span></Label>
                      <Input
                        type="email"
                        value={addForm.email}
                        onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="contact@company.com"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email language</Label>
                      <select
                        value={addForm.language}
                        onChange={e => setAddForm(f => ({ ...f, language: e.target.value }))}
                        className="w-full text-xs border border-zinc-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                      >
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => confirmAdd(place)}
                        disabled={addSaving}
                      >
                        {addSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        {addSaving ? "Adding…" : "Add to pipeline"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state before first search */}
      {!loading && places.length === 0 && !error && (
        <div className="text-center py-16 text-zinc-400 border-2 border-dashed rounded-lg">
          <Search className="h-7 w-7 mx-auto mb-2 text-zinc-300" />
          <p className="text-sm text-zinc-500">Search for businesses to add to your pipeline</p>
          <p className="text-xs mt-1">Try: <span className="italic">auto repair shops</span> in <span className="italic">Austin, TX</span></p>
        </div>
      )}
    </div>
  )
}
