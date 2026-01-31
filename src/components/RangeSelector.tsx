import type { RangeId } from '../lib/types'
import { cn } from '../lib/ui'

const RANGES: RangeId[] = ['1D', '1W', '1M', '3M', '1Y', '5Y']

type Props = {
	value: RangeId
	onChange: (value: RangeId) => void
}

export function RangeSelector({ value, onChange }: Props) {
	return (
		<div className="inline-flex overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel)] shadow-sm backdrop-blur">
			{RANGES.map((r) => (
				<button
					key={r}
					type="button"
					onClick={() => onChange(r)}
					className={cn(
						'px-3 py-2 text-xs font-semibold tracking-wide text-[color:var(--muted)] transition',
						r === value ? 'bg-white text-[color:var(--ink)]' : 'hover:bg-white/70',
					)}
				>
					{r}
				</button>
			))}
		</div>
	)
}
