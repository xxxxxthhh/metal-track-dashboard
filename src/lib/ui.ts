export function cn(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ')
}

export function formatCurrency(value: number): string {
	if (!Number.isFinite(value)) return '—'
	return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function formatNumber(value: number): string {
	if (!Number.isFinite(value)) return '—'
	return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function formatPercent(value: number): string {
	if (!Number.isFinite(value)) return '—'
	const sign = value > 0 ? '+' : ''
	return `${sign}${value.toFixed(2)}%`
}
