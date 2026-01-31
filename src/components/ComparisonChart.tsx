import { useMemo } from 'react'
import useSWR from 'swr'
import { fetchJson } from '../lib/api'
import { ETF_HINTS } from '../lib/etfInfo'
import type { EtfHistoryResponse, RangeId } from '../lib/types'
import { cn } from '../lib/ui'
import { MultiSeriesChart, type SeriesInput } from './MultiSeriesChart'

const PALETTE = ['#0d9488', '#0ea5e9', '#f97316', '#7c3aed', '#dc2626', '#15803d', '#0891b2', '#a16207']

type Props = {
	range: RangeId
	symbols: string[]
	selected: string[]
	onSelectedChange: (next: string[]) => void
}

export function ComparisonChart({ range, symbols, selected, onSelectedChange }: Props) {
	const key = selected.length ? ['compare', range, selected.join(',')] : null
	const comparison = useSWR<SeriesInput[]>(
		key,
		async () => {
			const results = await Promise.all(
				selected.map(async (symbol, idx) => {
					const data = await fetchJson<EtfHistoryResponse>(
						`/api/etfs/history?symbol=${encodeURIComponent(symbol)}&range=${range}`,
					)
					return {
						id: symbol,
						name: symbol,
						color: PALETTE[idx % PALETTE.length] ?? '#0d9488',
						points: data.points,
					} satisfies SeriesInput
				}),
			)
			return results
		},
		{ revalidateOnFocus: false },
	)

	const legend = useMemo(() => {
		return (comparison.data ?? []).map((s) => ({ id: s.id, color: s.color }))
	}, [comparison.data])

	return (
		<div>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-semibold tracking-tight">Comparison (normalized)</h2>
					<p className="mt-0.5 text-xs text-[color:var(--muted)]">All series start at 100 for quick relative performance.</p>
				</div>
				<div className="hidden flex-wrap items-center gap-2 sm:flex">
					{legend.map((l) => (
						<span key={l.id} className="inline-flex items-center gap-2 text-xs text-[color:var(--muted)]">
							<span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
							{l.id}
						</span>
					))}
				</div>
			</div>

			<div className="mb-3 flex flex-wrap gap-2">
				{symbols.map((symbol) => {
					const active = selected.includes(symbol)
					const hint = ETF_HINTS[symbol]
					return (
						<button
							key={symbol}
							type="button"
							title={hint}
							onClick={() => {
								if (active) onSelectedChange(selected.filter((s) => s !== symbol))
								else onSelectedChange([...selected, symbol].slice(0, 5))
							}}
							className={cn(
								'rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
								active
									? 'border-[color:var(--accent)]/40 bg-white text-[color:var(--ink)]'
									: 'border-[color:var(--panel-border)] bg-white/45 text-[color:var(--muted)] hover:bg-white',
							)}
						>
							{symbol}
						</button>
					)
				})}
			</div>

			<MultiSeriesChart
				series={comparison.data ?? []}
				loading={comparison.isLoading}
				emptyMessage={comparison.error ? String(comparison.error) : undefined}
			/>

			<p className="mt-3 text-xs text-[color:var(--muted)]">
				Tip: pick up to 5 symbols to keep the chart readable.
			</p>
		</div>
	)
}
