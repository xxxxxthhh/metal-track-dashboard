import { OPTICAL_CABLE_SNAPSHOT, type OpticalLayer, type OpticalStock } from '../data/opticalCableSnapshot'
import { buildApiUrl } from '../lib/api'
import { cn } from '../lib/ui'

const LAYER_ORDER: OpticalLayer[] = ['光纤光缆龙头', '高速铜缆/连接器', '光模块']

const LAYER_VIEW: Record<OpticalLayer, { title: string; focus: string; watch: string; risk: string }> = {
	光纤光缆龙头: {
		title: '第一层：光纤光缆龙头（订单确定性）',
		focus: 'AI 数据中心互联和算力网络建设拉动干线/城域传输需求，订单确定性强。',
		watch: '看中标节奏和产能利用率，不只看价格上涨。',
		risk: '若资本开支节奏转弱，高估值个股回撤会更快。',
	},
	'高速铜缆/连接器': {
		title: '第二层：高速铜缆/连接器（弹性最大）',
		focus: '机柜内短距互连强调低功耗和成本效率，铜缆与连接器仍在吃增量。',
		watch: '看核心客户验证、量产爬坡与毛利率同步改善。',
		risk: '主题拥挤度高，交易波动显著高于龙头大盘股。',
	},
	光模块: {
		title: '第三层：光模块（景气确认）',
		focus: '800G 兑现后，市场聚焦 1.6T 导入节奏，龙头仍是业绩锚。',
		watch: '看海外云厂商 CapEx 指引与 1.6T 出货窗口。',
		risk: '前期涨幅大，估值消化压力会在财报窗口集中体现。',
	},
}

const CNY = new Intl.NumberFormat('zh-CN', {
	style: 'currency',
	currency: 'CNY',
	maximumFractionDigits: 2,
})

function formatPct(value: number): string {
	const sign = value > 0 ? '+' : ''
	return `${sign}${value.toFixed(2)}%`
}

function formatYi(value: number): string {
	return `${(value / 100_000_000).toFixed(1)} 亿`
}

function colorBySign(value: number): string {
	if (value > 0) return 'text-[color:var(--success)]'
	if (value < 0) return 'text-[color:var(--danger)]'
	return 'text-[color:var(--muted)]'
}

function median(values: number[]): number {
	if (values.length === 0) return 0
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
	return sorted[mid]
}

function computeLayerStats(items: OpticalStock[]) {
	const totalCap = items.reduce((sum, item) => sum + item.marketCap, 0)
	const avgChange = items.reduce((sum, item) => sum + item.changePct, 0) / items.length
	const avgYtd = items.reduce((sum, item) => sum + item.returnYtd, 0) / items.length
	const advancers = items.filter((item) => item.changePct > 0).length
	return { totalCap, avgChange, avgYtd, advancers, count: items.length }
}

const APP_BASE = import.meta.env.BASE_URL

export default function OpticalCablePage() {
	const stocks = OPTICAL_CABLE_SNAPSHOT.stocks
	const quoteTime = new Date(OPTICAL_CABLE_SNAPSHOT.quoteEpochSeconds * 1000)
	const generatedAt = new Date(OPTICAL_CABLE_SNAPSHOT.generatedAt)

	const overall = {
		totalCap: stocks.reduce((sum, item) => sum + item.marketCap, 0),
		totalAmount: stocks.reduce((sum, item) => sum + item.amount, 0),
		avgChange: stocks.reduce((sum, item) => sum + item.changePct, 0) / stocks.length,
		advancers: stocks.filter((item) => item.changePct > 0).length,
		medianPe: median(stocks.filter((item) => item.peTtm > 0).map((item) => item.peTtm)),
	}

	const layerRows = LAYER_ORDER.map((layer) => {
		const items = stocks.filter((stock) => stock.layer === layer).sort((a, b) => b.changePct - a.changePct)
		return {
			layer,
			items,
			stats: computeLayerStats(items),
		}
	})

	return (
		<div className="min-h-dvh text-[color:var(--ink)]">
			<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
				<header className="mb-6 flex flex-col gap-4 rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-5 shadow-sm backdrop-blur sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--panel-border)] bg-white/70 px-3 py-1 text-xs text-[color:var(--muted)]">
							<span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
							<span>光缆板块静态研究页</span>
							<span className="font-mono">{quoteTime.toLocaleString('zh-CN')}</span>
						</div>
						<h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">光纤光缆 / 高速铜缆 / 光模块：当前行情深度页</h1>
						<p className="mt-2 max-w-3xl text-sm text-[color:var(--muted)]">
							围绕你提供的 17 只核心标的，按“确定性（光纤）-弹性（铜缆）-景气确认（光模块）”三层框架做静态快照。
						</p>
					</div>
						<div className="flex flex-wrap items-center gap-2">
							<a
								href={APP_BASE}
								className="rounded-lg border border-[color:var(--panel-border)] bg-white/75 px-3 py-2 text-sm shadow-sm transition hover:-translate-y-[1px] hover:bg-white"
							>
								返回主看板
							</a>
							<a
								href={buildApiUrl('/api/status')}
								target="_blank"
								rel="noreferrer"
								className="rounded-lg border border-[color:var(--panel-border)] bg-white/75 px-3 py-2 text-sm shadow-sm transition hover:-translate-y-[1px] hover:bg-white"
						>
							API 状态
						</a>
					</div>
				</header>

				<section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
					<div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm">
						<p className="text-xs text-[color:var(--muted)]">组合总市值</p>
						<p className="mt-1 text-xl font-semibold">{formatYi(overall.totalCap)}</p>
					</div>
					<div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm">
						<p className="text-xs text-[color:var(--muted)]">组合成交额</p>
						<p className="mt-1 text-xl font-semibold">{formatYi(overall.totalAmount)}</p>
					</div>
					<div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm">
						<p className="text-xs text-[color:var(--muted)]">组合平均涨跌</p>
						<p className={cn('mt-1 text-xl font-semibold', colorBySign(overall.avgChange))}>{formatPct(overall.avgChange)}</p>
					</div>
					<div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm">
						<p className="text-xs text-[color:var(--muted)]">上涨家数</p>
						<p className="mt-1 text-xl font-semibold">
							{overall.advancers} / {stocks.length}
						</p>
					</div>
					<div className="rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm">
						<p className="text-xs text-[color:var(--muted)]">PE(TTM) 中位数</p>
						<p className="mt-1 text-xl font-semibold">{overall.medianPe.toFixed(2)}</p>
					</div>
				</section>

				<section className="mt-6 rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm backdrop-blur lg:mt-8">
					<h2 className="text-base font-semibold tracking-tight">当前节奏判断</h2>
					<div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
						{layerRows.map(({ layer }) => {
							const view = LAYER_VIEW[layer]
							return (
								<article key={layer} className="rounded-xl border border-[color:var(--panel-border)] bg-white/70 p-3">
									<p className="text-sm font-semibold">{view.title}</p>
									<p className="mt-1 text-xs text-[color:var(--muted)]">{view.focus}</p>
									<p className="mt-2 text-xs text-[color:var(--muted)]">跟踪点：{view.watch}</p>
									<p className="mt-1 text-xs text-[color:var(--muted)]">风险点：{view.risk}</p>
								</article>
							)
						})}
					</div>
				</section>

				{layerRows.map(({ layer, items, stats }) => {
					const strongest = [...items].sort((a, b) => b.changePct - a.changePct)[0]
					return (
						<section
							key={layer}
							className="mt-6 rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 shadow-sm backdrop-blur lg:mt-8"
						>
							<div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h2 className="text-base font-semibold tracking-tight">{LAYER_VIEW[layer].title}</h2>
									<p className="mt-0.5 text-xs text-[color:var(--muted)]">
										板块市值 {formatYi(stats.totalCap)} · 平均涨跌 {formatPct(stats.avgChange)} · 上涨家数 {stats.advancers}/{stats.count} · 平均年初至今 {formatPct(stats.avgYtd)}
									</p>
								</div>
								<div className="rounded-full bg-white/65 px-2 py-1 text-xs text-[color:var(--muted)]">
									最强个股：{strongest.name}（{strongest.ticker}）{formatPct(strongest.changePct)}
								</div>
							</div>

							<div className="overflow-x-auto">
								<table className="w-full min-w-[980px] border-separate border-spacing-0 text-sm">
									<thead>
										<tr className="text-left text-xs uppercase tracking-wide text-[color:var(--muted)]">
											<th className="px-3 py-2">公司</th>
											<th className="px-3 py-2">定位</th>
											<th className="px-3 py-2">现价</th>
											<th className="px-3 py-2">今日</th>
											<th className="px-3 py-2">60日</th>
											<th className="px-3 py-2">YTD</th>
											<th className="px-3 py-2">换手率</th>
											<th className="px-3 py-2">PE(TTM)</th>
											<th className="px-3 py-2">PB</th>
											<th className="px-3 py-2">总市值</th>
											<th className="px-3 py-2">成交额</th>
											<th className="px-3 py-2">观点</th>
										</tr>
									</thead>
									<tbody>
										{items.map((item) => (
											<tr key={item.ticker} className="border-t border-[color:var(--panel-border)]">
												<td className="px-3 py-3 align-top">
													<p className="font-semibold">
														{item.name}{' '}
														<span className="font-mono text-xs text-[color:var(--muted)]">
															({item.exchange}.{item.ticker})
														</span>
													</p>
												</td>
												<td className="max-w-[220px] px-3 py-3 text-xs text-[color:var(--muted)]">{item.role}</td>
												<td className="px-3 py-3 font-mono">{CNY.format(item.price)}</td>
												<td className={cn('px-3 py-3 font-mono', colorBySign(item.changePct))}>{formatPct(item.changePct)}</td>
												<td className={cn('px-3 py-3 font-mono', colorBySign(item.return60d))}>{formatPct(item.return60d)}</td>
												<td className={cn('px-3 py-3 font-mono', colorBySign(item.returnYtd))}>{formatPct(item.returnYtd)}</td>
												<td className="px-3 py-3 font-mono">{formatPct(item.turnoverRate)}</td>
												<td className="px-3 py-3 font-mono">{item.peTtm.toFixed(2)}</td>
												<td className="px-3 py-3 font-mono">{item.pb.toFixed(2)}</td>
												<td className="px-3 py-3 font-mono">{formatYi(item.marketCap)}</td>
												<td className="px-3 py-3 font-mono">{formatYi(item.amount)}</td>
												<td className="max-w-[300px] px-3 py-3 text-xs text-[color:var(--muted)]">
													<p className="leading-5">逻辑：{item.thesis}</p>
													<p className="mt-1 leading-5">风险：{item.risk}</p>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</section>
					)
				})}

				<footer className="mt-8 rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 text-xs text-[color:var(--muted)] shadow-sm">
					<p>
						快照时间：{quoteTime.toLocaleString('zh-CN')}（生成于 {generatedAt.toLocaleString('zh-CN')}） · 数据源：
						{OPTICAL_CABLE_SNAPSHOT.dataSource}
					</p>
					<p className="mt-1">说明：{OPTICAL_CABLE_SNAPSHOT.note}</p>
					<p className="mt-1">免责声明：仅用于策略研究与看板展示，不构成任何投资建议。</p>
				</footer>
			</div>
		</div>
	)
}
