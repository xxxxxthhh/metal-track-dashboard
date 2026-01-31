import { cn } from '../lib/ui'

type Props = {
	title: string
	hint?: string
	price: string
	badge?: string
	badgeTone?: 'neutral' | 'up' | 'down'
	meta?: string
	active?: boolean
	onClick?: () => void
}

export function PriceCard({ title, hint, price, badge, badgeTone, meta, active, onClick }: Props) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'group relative w-full overflow-hidden rounded-2xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] p-4 text-left shadow-sm backdrop-blur transition',
				'hover:-translate-y-[1px] hover:bg-white',
				active ? 'ring-2 ring-[color:var(--accent)]/40' : '',
			)}
		>
			<div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[color:var(--accent-2)]/10 blur-2xl transition group-hover:bg-[color:var(--accent)]/12" />
			<div className="flex items-start justify-between gap-3">
				<div>
					<div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[color:var(--muted)]">
						<span>{title}</span>
						{hint ? (
							<span className="group/hint relative inline-flex items-center">
								<span
									className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color:var(--panel-border)] bg-white/60 text-[10px] font-bold leading-none text-[color:var(--muted)]"
									aria-label={hint}
								>
									i
								</span>
								<span className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-[color:var(--panel-border)] bg-white/95 px-3 py-2 text-xs font-medium text-[color:var(--ink)] shadow-lg opacity-0 transition group-hover/hint:opacity-100">
									{hint}
								</span>
							</span>
						) : null}
					</div>
					<div className="mt-2 text-lg font-semibold tracking-tight">{price}</div>
				</div>
				{badge ? (
					<div
						className={cn(
							'rounded-full px-2 py-1 text-xs font-semibold',
							badgeTone === 'up'
								? 'bg-[color:var(--success)]/10 text-[color:var(--success)]'
								: badgeTone === 'down'
									? 'bg-[color:var(--danger)]/10 text-[color:var(--danger)]'
									: 'border border-[color:var(--panel-border)] bg-white/55 font-mono text-[color:var(--muted)]',
						)}
					>
						{badge}
					</div>
				) : null}
			</div>
			{meta ? <div className="mt-3 text-xs text-[color:var(--muted)]">{meta}</div> : null}
		</button>
	)
}
