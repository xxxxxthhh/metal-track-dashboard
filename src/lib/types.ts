export type MetalId = 'gold' | 'silver' | 'platinum' | 'palladium'

export type RangeId = '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'

export type MetalSpot = {
	symbol: MetalId
	price: number
	change: number
	changePercent: number
	currency: 'USD'
	timestamp: number
}

export type MetalsSpotResponse = {
	metals: Record<MetalId, MetalSpot>
	source: string
	serverTime: number
	_stale?: boolean
}

export type EtfQuote = {
	symbol: string
	price: number
	change: number
	changePercent: number
	volume: number | null
	timestamp: number
}

export type EtfQuotesResponse = {
	quotes: Record<string, EtfQuote>
	source: string
	serverTime: number
	_stale?: boolean
}

export type HistoricalPoint = { time: number; value: number }

export type EtfHistoryResponse = {
	symbol: string
	range: RangeId
	interval: string
	points: HistoricalPoint[]
	source: string
	serverTime: number
	_stale?: boolean
}
