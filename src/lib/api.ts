export const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ''

export function buildApiUrl(path: string): string {
	return `${API_BASE}${path}`
}

export async function fetchJson<T>(path: string): Promise<T> {
	const res = await fetch(buildApiUrl(path), {
		headers: {
			Accept: 'application/json',
		},
	})
	if (!res.ok) {
		let detail: string | undefined
		try {
			const text = await res.text()
			if (text) {
				try {
					const parsed = JSON.parse(text) as unknown
					if (typeof parsed === 'object' && parsed !== null) {
						const record = parsed as Record<string, unknown>
						if (typeof record.error === 'string' && record.error.trim()) {
							detail = record.error.trim().slice(0, 400)
						} else {
							detail = text.slice(0, 400)
						}
					} else {
						detail = text.slice(0, 400)
					}
				} catch {
					detail = text.slice(0, 400)
				}
			}
		} catch {
			// ignore
		}
		throw new Error(`HTTP ${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`)
	}
	return (await res.json()) as T
}
