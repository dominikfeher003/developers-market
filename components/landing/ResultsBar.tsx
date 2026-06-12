const stats = [
  { value: "$2.4M+", label: "Ad spend managed" },
  { value: "3.8x", label: "Average client ROAS" },
  { value: "24/7", label: "AI campaign monitoring" },
]

export function ResultsBar() {
  return (
    <section className="border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <p className="text-4xl font-extrabold text-white mb-1">{value}</p>
            <p className="text-sm text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
