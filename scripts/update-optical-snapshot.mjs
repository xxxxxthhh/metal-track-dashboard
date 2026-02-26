#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const STOCKS = [
	{
		code: '601869',
		exchange: 'SH',
		secid: '1.601869',
		name: '长飞光纤',
		layer: '光纤光缆龙头',
		role: '光纤预制棒+光纤光缆，干线升级核心受益',
		thesis: '空芯光纤与预制棒一体化带来议价能力，确定性来自国内外算力干线建设。',
		risk: '估值高位，若运营商资本开支节奏放缓，回撤弹性也会更大。',
	},
	{
		code: '600487',
		exchange: 'SH',
		secid: '1.600487',
		name: '亨通光电',
		layer: '光纤光缆龙头',
		role: '光纤光缆+海缆双主业',
		thesis: '陆缆+海缆两条线，订单结构更均衡，业绩兑现路径相对清晰。',
		risk: '海缆项目交付与回款周期长，阶段性业绩波动不可忽视。',
	},
	{
		code: '600522',
		exchange: 'SH',
		secid: '1.600522',
		name: '中天科技',
		layer: '光纤光缆龙头',
		role: '光纤+海缆+射频电缆',
		thesis: '产品矩阵覆盖通信与电力，受益 AI 基建与海上新能源共振。',
		risk: '多业务并行导致资源分配复杂，景气切换时市场估值锚可能漂移。',
	},
	{
		code: '600498',
		exchange: 'SH',
		secid: '1.600498',
		name: '烽火通信',
		layer: '光纤光缆龙头',
		role: '光通信设备+光纤光缆',
		thesis: '设备端+线缆端协同，受益国内算力网络与政企专网建设。',
		risk: '高换手伴随高波动，短期交易拥挤后容易出现回吐。',
	},
	{
		code: '002130',
		exchange: 'SZ',
		secid: '0.002130',
		name: '沃尔核材',
		layer: '高速铜缆/连接器',
		role: 'DAC 铜缆，子公司布局 400G/800G 高速线',
		thesis: '高频高速线材放量时受益明显，处于从传统线缆向 AI 互连升级阶段。',
		risk: '终端客户验证周期与良率爬坡决定业绩兑现速度。',
	},
	{
		code: '300563',
		exchange: 'SZ',
		secid: '0.300563',
		name: '神宇股份',
		layer: '高速铜缆/连接器',
		role: 'DAC 数据线，小盘高弹性',
		thesis: '小市值叠加主题属性，景气阶段具备高弹性。',
		risk: '业绩体量小、估值高，对订单扰动高度敏感。',
	},
	{
		code: '300913',
		exchange: 'SZ',
		secid: '0.300913',
		name: '兆龙互连',
		layer: '高速铜缆/连接器',
		role: 'DAC/AEC 高速线缆，数据中心互连',
		thesis: '受益机柜内短距高速互连需求上升，产品结构贴近 AI 服务器升级。',
		risk: '行业竞争者增多时，毛利率与估值存在双压风险。',
	},
	{
		code: '688629',
		exchange: 'SH',
		secid: '1.688629',
		name: '华丰科技',
		layer: '高速铜缆/连接器',
		role: '高速背板连接器，国产替代',
		thesis: '连接器国产化主线明确，若切入高端平台，弹性较强。',
		risk: '当前估值和换手都偏高，情绪反转时波动幅度大。',
	},
	{
		code: '600577',
		exchange: 'SH',
		secid: '1.600577',
		name: '精达股份',
		layer: '高速铜缆/连接器',
		role: '镀银高速铜线上游',
		thesis: '上游材料属性使其具备“订单放大器”特征。',
		risk: '原材料价格波动与下游议价会影响利润弹性。',
	},
	{
		code: '300548',
		exchange: 'SZ',
		secid: '0.300548',
		name: '博创科技',
		layer: '高速铜缆/连接器',
		role: '800G 有源铜缆+光模块双线',
		thesis: '“铜+光”双布局，能在技术路线切换时降低单边风险。',
		risk: '高估值需要持续高增长验证，业绩低于预期时杀估值压力大。',
	},
	{
		code: '688800',
		exchange: 'SH',
		secid: '1.688800',
		name: '瑞可达',
		layer: '高速铜缆/连接器',
		role: '连接器并拓展 AI 数据中心',
		thesis: '汽车连接器能力向数据中心复用，平台化潜力较强。',
		risk: '跨行业扩张带来客户导入不确定性。',
	},
	{
		code: '002475',
		exchange: 'SZ',
		secid: '0.002475',
		name: '立讯精密',
		layer: '高速铜缆/连接器',
		role: '铜连接大厂，规模优势显著',
		thesis: '平台型龙头在份额与制造能力上具备长期壁垒。',
		risk: '体量大意味着弹性相对小，主题行情中相对收益可能落后。',
	},
	{
		code: '688668',
		exchange: 'SH',
		secid: '1.688668',
		name: '鼎通科技',
		layer: '高速铜缆/连接器',
		role: '高速铜缆连接器',
		thesis: '高端连接器需求抬升时，订单和估值均有放大效应。',
		risk: '技术迭代快，产品验证失败会影响中短期增速。',
	},
	{
		code: '605277',
		exchange: 'SH',
		secid: '1.605277',
		name: '新亚电子',
		layer: '高速铜缆/连接器',
		role: '通信线缆及数据线材',
		thesis: '基础线材供应商向高速产品升级，受益于下游规格提升。',
		risk: '若高端品类占比提升不及预期，估值修复空间受限。',
	},
	{
		code: '300308',
		exchange: 'SZ',
		secid: '0.300308',
		name: '中际旭创',
		layer: '光模块',
		role: '800G/1.6T 光模块核心供应',
		thesis: '高端光模块份额高，景气延续时仍是核心资产。',
		risk: '前期涨幅大后对业绩指引更敏感，估值压缩风险需跟踪。',
	},
	{
		code: '300502',
		exchange: 'SZ',
		secid: '0.300502',
		name: '新易盛',
		layer: '光模块',
		role: '高速光模块龙头',
		thesis: '订单能见度高，1.6T 放量预期强化中长期成长逻辑。',
		risk: '海外客户资本开支若低于预期，将影响估值扩张节奏。',
	},
	{
		code: '300394',
		exchange: 'SZ',
		secid: '0.300394',
		name: '天孚通信',
		layer: '光模块',
		role: '光器件平台，受益 1.6T 升级',
		thesis: '平台化器件能力与客户结构优势，受益代际升级周期。',
		risk: '高估值+高预期组合下，短期波动可能显著放大。',
	},
]

const FIELDS = ['f12', 'f14', 'f2', 'f3', 'f4', 'f5', 'f6', 'f8', 'f9', 'f20', 'f21', 'f23', 'f24', 'f25', 'f26', 'f115', 'f124']
const SOURCE_NOTE = 'Eastmoney push2 quote API'

const quoteUrl = `https://push2.eastmoney.com/api/qt/ulist.np/get?fields=${FIELDS.join(',')}&secids=${STOCKS.map((item) => item.secid).join(',')}`

function toNumber(raw) {
	if (raw == null || raw === '-') return null
	const value = Number(raw)
	return Number.isFinite(value) ? value : null
}

function toDiv100(raw) {
	const value = toNumber(raw)
	if (value == null) return 0
	return Math.round(value) / 100
}

function toFixedNumber(raw, digits = 2) {
	const value = toNumber(raw)
	if (value == null) return 0
	const multiplier = 10 ** digits
	return Math.round(value * multiplier) / multiplier
}

function renderTypeScript(items, generatedAt, quoteEpochSeconds) {
	const stocksLiteral = JSON.stringify(items, null, '\t')
	return `export type OpticalLayer = '光纤光缆龙头' | '高速铜缆/连接器' | '光模块'

export type OpticalStock = {
\tticker: string
\tname: string
\texchange: 'SH' | 'SZ'
\tlayer: OpticalLayer
\trole: string
\tprice: number
\tchange: number
\tchangePct: number
\treturn60d: number
\treturnYtd: number
\tturnoverRate: number
\tpeTtm: number
\tpb: number
\tmarketCap: number
\tamount: number
\tthesis: string
\trisk: string
}

export const OPTICAL_CABLE_SNAPSHOT = {
\tgeneratedAt: '${generatedAt}',
\tquoteEpochSeconds: ${quoteEpochSeconds},
\tcurrency: 'CNY',
\tdataSource: '${SOURCE_NOTE}',
\tnote:
\t\t'基于你给出的标的池做静态快照；华丰科技代码按交易所实际代码修正为 688629（原列表中的 688100 为威胜信息）。',
\tstocks: ${stocksLiteral} as OpticalStock[],
} as const
`
}

async function main() {
	const response = await fetch(quoteUrl, {
		redirect: 'follow',
		headers: {
			'User-Agent': 'Mozilla/5.0',
			Accept: 'application/json,text/plain,*/*',
		},
	})
	if (!response.ok) {
		throw new Error(`行情请求失败: ${response.status} ${response.statusText}`)
	}
	const payload = await response.json()
	const rows = payload?.data?.diff
	if (!Array.isArray(rows)) {
		throw new Error('行情响应格式异常：缺少 data.diff')
	}

	const byCode = new Map(rows.map((row) => [String(row.f12), row]))
	const items = STOCKS.map((stock) => {
		const row = byCode.get(stock.code)
		if (!row) {
			throw new Error(`缺少标的行情: ${stock.code}`)
		}

		return {
			ticker: stock.code,
			name: stock.name,
			exchange: stock.exchange,
			layer: stock.layer,
			role: stock.role,
			price: toDiv100(row.f2),
			change: toDiv100(row.f4),
			changePct: toDiv100(row.f3),
			return60d: toDiv100(row.f24),
			returnYtd: toDiv100(row.f25),
			turnoverRate: toDiv100(row.f8),
			peTtm: toDiv100(row.f115),
			pb: toDiv100(row.f23),
			marketCap: toFixedNumber(row.f20, 2),
			amount: toFixedNumber(row.f6, 2),
			thesis: stock.thesis,
			risk: stock.risk,
		}
	})

	const quoteEpochSeconds = Math.max(
		...items.map((_, index) => toNumber(byCode.get(STOCKS[index].code)?.f124) ?? 0),
	)
	const generatedAt = new Date().toISOString()

	const __dirname = path.dirname(fileURLToPath(import.meta.url))
	const outputFile = path.resolve(__dirname, '../src/data/opticalCableSnapshot.ts')
	await writeFile(outputFile, renderTypeScript(items, generatedAt, quoteEpochSeconds), 'utf8')
	console.log(`Updated ${outputFile}`)
	console.log(`Snapshot time: ${new Date(quoteEpochSeconds * 1000).toISOString()}`)
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error)
	process.exitCode = 1
})
