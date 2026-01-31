import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { ComparisonChart } from './components/ComparisonChart'
import { LineChart } from './components/LineChart'
import { PriceCard } from './components/PriceCard'
import { RangeSelector } from './components/RangeSelector'
import { fetchJson } from './lib/api'
import { ETF_HINTS } from './lib/etfInfo'
import type { EtfHistoryResponse, EtfQuotesResponse, HistoricalPoint, MetalId, MetalsSpotResponse, RangeId } from './lib/types'
import { cn, formatCurrency, formatNumber, formatPercent } from './lib/ui'

const ETF_SYMBOLS = ['COPX', 'GLD', 'SLV', 'PPLT', 'PALL', 'CPER', 'DBB', 'REMX', 'LIT'] as const
const METALS = ['gold', 'silver', 'platinum', 'palladium'] as const

type MetalWindowId = '1H' | '6H' | '24H'

const METAL_WINDOWS: MetalWindowId[] = ['1H', '6H', '24H']
const METAL_WINDOW_SECONDS: Record<MetalWindowId, number> = {
	'1H': 60 * 60,
	'6H': 6 * 60 * 60,
	'24H': 24 * 60 * 60,
}

const METAL_SERIES_STORAGE_KEY = 'metals:session-series:v1'
const MAX_METAL_POINTS_PER_SERIES = 10_000
const METAL_SERIES_RETENTION_SECONDS = 8 * 24 * 60 * 60

function emptyMetalSeries(): Record<MetalId, HistoricalPoint[]> {
	return { gold: [], silver: [], platinum: [], palladium: [] }
}

function loadMetalSeriesFromStorage(): Record<MetalId, HistoricalPoint[]> {
	if (typeof window === 'undefined') return emptyMetalSeries()
	try {
		const raw = window.localStorage.getItem(METAL_SERIES_STORAGE_KEY)
		if (!raw) return emptyMetalSeries()
		const parsed = JSON.parse(raw) as unknown
		if (typeof parsed !== 'object' || parsed === null) return emptyMetalSeries()
		const record = parsed as Record<string, unknown>

		const out = emptyMetalSeries()
		for (const metal of METALS) {
			const v = record[metal]
			if (!Array.isArray(v)) continue
			const points: HistoricalPoint[] = []
			for (const item of v) {
				if (typeof item !== 'object' || item === null) continue
				const r = item as Record<string, unknown>
				const time = Number(r.time)
				const value = Number(r.value)
				if (!Number.isFinite(time) || !Number.isFinite(value)) continue
				points.push({ time, value })
			}
			points.sort((a, b) => a.time - b.time)
			out[metal] = points.slice(-MAX_METAL_POINTS_PER_SERIES)
		}

		return out
	} catch {
		return emptyMetalSeries()
	}
}

type AssetId = (typeof ETF_SYMBOLS)[number] | (typeof METALS)[number]

export default function App() {
	const [selectedAsset, setSelectedAsset] = useState<AssetId>('GLD')
	const [range, setRange] = useState<RangeId>('1M')
	const [compareSymbols, setCompareSymbols] = useState<string[]>(['GLD', 'SLV', 'CPER'])
	const [metalWindow, setMetalWindow] = useState<MetalWindowId>('24H')
	const [metalSessionSeries, setMetalSessionSeries] = useState<Record<MetalId, HistoricalPoint[]>>(() =>
		loadMetalSeriesFromStorage(),
	)

  const metals = useSWR<MetalsSpotResponse>('/api/metals/spot', fetchJson, { refreshInterval: 60_000 })
  const etfs = useSWR<EtfQuotesResponse>('/api/etfs/quotes', fetchJson, { refreshInterval: 60_000 })

	const isEtf = useMemo(() => ETF_SYMBOLS.includes(selectedAsset as (typeof ETF_SYMBOLS)[number]), [selectedAsset])
	const isMetal = useMemo(() => METALS.includes(selectedAsset as (typeof METALS)[number]), [selectedAsset])
	const metalWindowSeconds = useMemo(() => METAL_WINDOW_SECONDS[metalWindow], [metalWindow])

	useEffect(() => {
		const id = String(selectedAsset)
		const valid = (ETF_SYMBOLS as readonly string[]).includes(id) || (METALS as readonly string[]).includes(id)
		if (!valid) setSelectedAsset('GLD')
	}, [selectedAsset])

	useEffect(() => {
		setCompareSymbols((prev) => prev.filter((s) => (ETF_SYMBOLS as readonly string[]).includes(s)))
	}, [])

	const historyKey = isEtf ? ['/api/etfs/history', selectedAsset, range] : null
	const history = useSWR<EtfHistoryResponse>(
		historyKey,
		async () => fetchJson(`/api/etfs/history?symbol=${encodeURIComponent(String(selectedAsset))}&range=${range}`),
		{ revalidateOnFocus: false },
	)

	useEffect(() => {
		const snapshot = metals.data?.metals
		if (!snapshot) return

		setMetalSessionSeries((prev) => {
			let next: Record<MetalId, HistoricalPoint[]> | null = null
			const nowSeconds = Math.floor(Date.now() / 1000)
			const minTime = nowSeconds - METAL_SERIES_RETENTION_SECONDS

			for (const metal of METALS) {
				const spot = snapshot[metal]
				if (!spot || !Number.isFinite(spot.price)) continue
				const timeSeconds = Math.floor((spot.timestamp || metals.data?.serverTime || Date.now()) / 1000)
				const point: HistoricalPoint = { time: timeSeconds, value: spot.price }

				const existing = prev[metal]
				const last = existing[existing.length - 1]
				let updated = existing
				if (!last || last.time < point.time) {
					updated = [...existing, point]
				} else if (last.time === point.time && last.value !== point.value) {
					updated = [...existing.slice(0, -1), point]
				}

				if (updated !== existing) {
					updated = updated.filter((p) => p.time >= minTime).slice(-MAX_METAL_POINTS_PER_SERIES)
					if (!next) next = { ...prev }
					next[metal] = updated
				}
			}

			return next ?? prev
		})
	}, [metals.data])

	useEffect(() => {
		if (typeof window === 'undefined') return
		try {
			window.localStorage.setItem(METAL_SERIES_STORAGE_KEY, JSON.stringify(metalSessionSeries))
		} catch {
			// ignore
		}
	}, [metalSessionSeries])

  const serverTime =
    etfs.data?.serverTime ?? metals.data?.serverTime ?? (etfs.isLoading || metals.isLoading ? undefined : Date.now())
  const stale = Boolean(etfs.data?._stale || metals.data?._stale)

	const cards = useMemo(() => {
		const items: Array<{
			id: AssetId
			label: string
			hint?: string
			priceText: string
			badgeText?: string
			badgeTone?: 'neutral' | 'up' | 'down'
			meta?: string
		}> = []

		for (const m of METALS) {
			const row = metals.data?.metals?.[m]
			if (!row) {
				items.push({
					id: m,
					label: m.toUpperCase(),
					priceText: '—',
				})
				continue
			}
			const updatedAt = new Date(row.timestamp).toLocaleTimeString()
			items.push({
				id: m,
				label: m.toUpperCase(),
				priceText: formatCurrency(row.price),
				badgeText: updatedAt,
				badgeTone: 'neutral',
				meta: `USD · ${metals.data?.source ?? 'spot'}`,
			})
		}

		for (const s of ETF_SYMBOLS) {
			const row = etfs.data?.quotes?.[s]
			if (!row) {
				items.push({ id: s, label: s, hint: ETF_HINTS[s], priceText: '—' })
				continue
			}
			const volumeText = row.volume == null ? 'Vol —' : `Vol ${formatNumber(row.volume)}`
			items.push({
				id: s,
				label: s,
				hint: ETF_HINTS[s],
				priceText: formatCurrency(row.price),
				badgeText: `${formatNumber(row.change)} (${formatPercent(row.changePercent)})`,
				badgeTone: row.change >= 0 ? 'up' : 'down',
				meta: `${volumeText} · Finnhub`,
			})
		}
    return items
	}, [etfs.data, metals.data])

	const metalChartPoints = useMemo((): HistoricalPoint[] => {
		if (!isMetal) return []
		const metal = selectedAsset as (typeof METALS)[number]
		const all = metalSessionSeries[metal]
		const cutoff = Math.floor(Date.now() / 1000) - metalWindowSeconds
		return all.filter((p) => p.time >= cutoff)
	}, [isMetal, metalSessionSeries, metalWindowSeconds, selectedAsset])

	const metalChartDisplayPoints = useMemo(() => {
		return metalChartPoints.length >= 2 ? metalChartPoints : []
	}, [metalChartPoints])

	const metalChartMeta = useMemo(() => {
		if (!isMetal) return null
		const last = metalChartPoints[metalChartPoints.length - 1]
		const lastText = last ? new Date(last.time * 1000).toLocaleTimeString() : undefined
		return {
			samples: metalChartPoints.length,
			lastText,
		}
	}, [isMetal, metalChartPoints])

  return (
    <div className="min-h-dvh text-[color:var(--ink)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-3 py-1 text-xs text-[color:var(--muted)] shadow-sm backdrop-blur">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  stale ? 'bg-[color:var(--danger)]' : 'bg-[color:var(--accent)]',
                )}
              />
              <span>{stale ? 'Stale' : 'Live (cached)'}</span>
              {serverTime ? <span className="font-mono">{new Date(serverTime).toLocaleTimeString()}</span> : null}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Metals & ETF Dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-[color:var(--muted)]">
              Spot metals + 10 metal-related ETFs, updated every 60 seconds via Cloudflare edge cache.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <RangeSelector value={range} onChange={setRange} />
            <a
              className="rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel)] px-3 py-2 text-sm shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white"
              href="/api/status"
              target="_blank"
              rel="noreferrer"
            >
              API status
            </a>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
				<PriceCard
					key={c.id}
					active={c.id === selectedAsset}
					title={c.label}
					hint={c.hint}
					price={c.priceText}
					badge={c.badgeText}
					badgeTone={c.badgeTone}
					meta={c.meta}
					onClick={() => setSelectedAsset(c.id)}
				/>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-2">
			<div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm backdrop-blur">
				<div className="mb-3 flex items-start justify-between gap-3">
					<div>
						<h2 className="text-base font-semibold tracking-tight">{selectedAsset} chart</h2>
						<p className="mt-0.5 text-xs text-[color:var(--muted)]">
							{isEtf ? `Historical via Twelve Data (${range})` : `Session trend from spot updates (last ${metalWindow})`}
						</p>
					</div>
					<div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
						{isMetal ? (
							<div className="inline-flex overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-white/55 shadow-sm">
								{METAL_WINDOWS.map((w) => (
									<button
										key={w}
										type="button"
										onClick={() => setMetalWindow(w)}
										className={cn(
											'px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[color:var(--muted)] transition',
											w === metalWindow ? 'bg-white text-[color:var(--ink)]' : 'hover:bg-white/70',
										)}
									>
										{w}
									</button>
								))}
							</div>
						) : null}
						{isEtf ? (
							<span className="rounded-full bg-white/60 px-2 py-1 text-xs text-[color:var(--muted)]">
								Interval: {history.data?.interval ?? '...'}
							</span>
						) : null}
						{isMetal && metalChartMeta ? (
							<span className="rounded-full bg-white/60 px-2 py-1 text-xs text-[color:var(--muted)]">
								Samples: {metalChartMeta.samples}
								{metalChartMeta.lastText ? ` · Last ${metalChartMeta.lastText}` : ''}
								 · ~60s refresh
							</span>
						) : null}
					</div>
				</div>

			{isEtf ? (
				<LineChart
					key={`${selectedAsset}-${range}`}
					points={history.data?.points ?? []}
					loading={history.isLoading}
					emptyMessage={history.error ? String(history.error) : undefined}
					accent="var(--accent)"
				/>
			) : (
				<LineChart
					key={`spot-${selectedAsset}-${range}`}
					points={metalChartDisplayPoints}
					loading={metals.isLoading && metalChartPoints.length === 0}
					emptyMessage={
						metalChartPoints.length >= 2
							? undefined
							: 'Collecting spot samples... keep this tab open for a minute.'
					}
					accent="var(--accent)"
				/>
			)}
		</div>

          <div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm backdrop-blur">
            <ComparisonChart
              range={range}
              symbols={[...ETF_SYMBOLS]}
              selected={compareSymbols}
              onSelectedChange={setCompareSymbols}
            />
          </div>
        </section>

        <footer className="mt-8 flex flex-col gap-1 text-xs text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Worker caches aggregated endpoints in KV to stay within free-tier write limits (2 writes / 5 minutes).
          </span>
          <span className="font-mono">/api/metals/spot · /api/etfs/quotes · /api/etfs/history</span>
        </footer>
      </div>
    </div>
  )
}
