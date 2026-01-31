import { useEffect, useMemo, useRef } from 'react'
import {
	createChart,
	LineSeries,
	type IChartApi,
	type ISeriesApi,
	type LineData,
	type UTCTimestamp,
} from 'lightweight-charts'
import { cn } from '../lib/ui'

type Point = { time: number; value: number }

type Props = {
	points: Point[]
	loading?: boolean
	emptyMessage?: string
	accent: string
}

export function LineChart({ points, loading, emptyMessage, accent }: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const chartRef = useRef<IChartApi | null>(null)
	const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

	const data = useMemo((): LineData[] => {
		return points.map((p) => ({ time: p.time as UTCTimestamp, value: p.value }))
	}, [points])

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
			crosshair: {
				vertLine: { color: 'rgba(13, 148, 136, 0.3)' },
				horzLine: { color: 'rgba(13, 148, 136, 0.3)' },
			},
		})

		const series = chart.addSeries(LineSeries, {
			color: accent,
			lineWidth: 2,
		})

		chartRef.current = chart
		seriesRef.current = series

		const ro = new ResizeObserver(() => {
			const rect = el.getBoundingClientRect()
			chart.applyOptions({ width: Math.floor(rect.width) })
		})
		ro.observe(el)

		return () => {
			ro.disconnect()
			chart.remove()
			chartRef.current = null
			seriesRef.current = null
		}
	}, [accent])

	useEffect(() => {
		if (!seriesRef.current || !chartRef.current) return
		seriesRef.current.setData(data)
		chartRef.current.timeScale().fitContent()
	}, [data])

	const empty = !loading && data.length === 0

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
					<div
						className={cn(
							'max-w-sm rounded-xl border border-dashed border-[color:var(--panel-border)] bg-white/55 px-4 py-3 text-center text-xs text-[color:var(--muted)]',
						)}
					>
						{emptyMessage ?? 'No data available.'}
					</div>
				</div>
			) : null}
		</div>
	)
}
