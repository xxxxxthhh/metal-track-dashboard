import { useEffect, useMemo, useRef } from 'react'
import {
	createChart,
	LineSeries,
	type IChartApi,
	type ISeriesApi,
	type LineData,
	type UTCTimestamp,
} from 'lightweight-charts'

type Point = { time: number; value: number }

export type SeriesInput = {
	id: string
	name: string
	color: string
	points: Point[]
}

type Props = {
	series: SeriesInput[]
	loading?: boolean
	emptyMessage?: string
}

export function MultiSeriesChart({ series, loading, emptyMessage }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const chartRef = useRef<IChartApi | null>(null)
	const seriesMapRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())

	const normalized = useMemo(() => {
		return series
			.map((s) => {
				const first = s.points[0]?.value
				if (!Number.isFinite(first) || first === 0) return { ...s, data: [] as LineData[] }
				const data = s.points.map((p) => ({
					time: p.time as UTCTimestamp,
					value: (p.value / first) * 100,
				}))
				return { ...s, data }
			})
			.filter((s) => s.data.length > 0)
	}, [series])

	useEffect(() => {
		const el = containerRef.current
		if (!el) return

		const chart = createChart(el, {
			height: 260,
			layout: {
				background: { color: 'transparent' },
				textColor: 'rgba(19, 22, 34, 0.72)',
				fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui",
			},
			grid: {
				vertLines: { color: 'rgba(19, 22, 34, 0.08)' },
				horzLines: { color: 'rgba(19, 22, 34, 0.08)' },
			},
			rightPriceScale: {
				borderColor: 'rgba(19, 22, 34, 0.1)',
			},
			timeScale: {
				borderColor: 'rgba(19, 22, 34, 0.1)',
				timeVisible: true,
			},
		})

		chartRef.current = chart

		const ro = new ResizeObserver(() => {
			const rect = el.getBoundingClientRect()
			chart.applyOptions({ width: Math.floor(rect.width) })
		})
		ro.observe(el)

		return () => {
			ro.disconnect()
			chart.remove()
			chartRef.current = null
			seriesMapRef.current.clear()
		}
	}, [])

	useEffect(() => {
		const chart = chartRef.current
		if (!chart) return

		const desiredIds = new Set(normalized.map((s) => s.id))
		for (const [id, s] of seriesMapRef.current.entries()) {
			if (!desiredIds.has(id)) {
				chart.removeSeries(s)
				seriesMapRef.current.delete(id)
			}
		}

		for (const s of normalized) {
			let seriesApi = seriesMapRef.current.get(s.id)
			if (!seriesApi) {
				seriesApi = chart.addSeries(LineSeries, {
					color: s.color,
					lineWidth: 2,
					priceLineVisible: false,
					lastValueVisible: false,
				})
				seriesMapRef.current.set(s.id, seriesApi)
			}
			seriesApi.setData(s.data)
		}

		chart.timeScale().fitContent()
	}, [normalized])

	const empty = !loading && normalized.length === 0

	return (
		<div className="relative">
			<div ref={containerRef} className="h-[260px] w-full" />
			{loading ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="rounded-full border border-[color:var(--panel-border)] bg-white/70 px-3 py-2 text-xs text-[color:var(--muted)] shadow-sm">
						Loading...
					</div>
				</div>
			) : null}
			{empty ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="max-w-sm rounded-xl border border-dashed border-[color:var(--panel-border)] bg-white/55 px-4 py-3 text-center text-xs text-[color:var(--muted)]">
						{emptyMessage ?? 'Select symbols to compare.'}
					</div>
				</div>
			) : null}
		</div>
	)
}
