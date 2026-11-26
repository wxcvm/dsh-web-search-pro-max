/** Keyless official registry and bibliographic search APIs. */
import type { WebSearchSource } from '@deepseek-ai/dsh-web'
import { EngineError, type EngineDeps, type Engine } from '../engines.ts'
import { compileSince } from '../pipeline/compile.ts'
import { stripTags } from '../util.ts'
import { requestProvider, recordRequest, statusFailure } from './http.ts'
import type { ProviderAdapter } from './registry.ts'

const obj = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
const str = (v: unknown): string => typeof v === 'string' ? v.trim() : ''
const first = (v: unknown): string => Array.isArray(v) ? str(v[0]) : ''
const cap = (v: string): string => stripTags(v).replace(/\s+/g, ' ').trim().slice(0, 500)
const limit = (n: number): number => Math.max(1, Math.min(20, Math.floor(n)))
function npmUrl(query: string, count: number): string {
  return 'https://registry.npmjs.org/-/v1/search?' + new URLSearchParams({ text: query, size: String(limit(count)) })
}
function crossrefUrl(query: string, count: number): string {
  return 'https://api.crossref.org/works?' + new URLSearchParams({ 'query.bibliographic': query, rows: String(limit(count)), select: 'DOI,title,container-title,published,type' })
}
function npmSources(body: unknown): WebSearchSource[] | undefined {
  const rows = obj(body).objects
  if (!Array.isArray(rows)) return undefined
  return rows.flatMap(row => {
    const p = obj(obj(row).package), name = str(p.name)
    if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name)) return []
    const version = str(p.version), date = str(p.date)
    return [{ url: 'https://www.npmjs.com/package/' + name, title: name, snippet: cap([version && 'Version ' + version, str(p.description)].filter(Boolean).join(' — ')), ...date && Number.isFinite(Date.parse(date)) ? { publishedAt: date } : {} }]
  })
}
function crossrefSources(body: unknown): WebSearchSource[] | undefined {
  const rows = obj(obj(body).message).items
  if (!Array.isArray(rows)) return undefined
  return rows.flatMap(row => {
    const p = obj(row), doi = str(p.DOI), title = first(p.title)
    if (!/^10\.\d{4,9}\/\S+$/i.test(doi) || !title) return []
    const parts = obj(p.published)['date-parts']
    const date = Array.isArray(parts) && Array.isArray(parts[0]) ? parts[0] as unknown[] : []
    const publishedAt = date.length === 3 && date.every(n => typeof n === 'number' && Number.isInteger(n)) ? date.map((n,i) => String(n).padStart(i ? 2 : 4, '0')).join('-') : ''
    const url = 'https://doi.org/' + doi.split('/').map(encodeURIComponent).join('/')
    return [{ url, title: cap(title), snippet: cap([first(p['container-title']), str(p.type)].filter(Boolean).join(' — ')), ...publishedAt && Number.isFinite(Date.parse(publishedAt)) ? { publishedAt } : {} }]
  })
}
function make(id: string, label: string, profile: string, kind: string, url: (q: string, n: number) => string, parse: (body: unknown) => WebSearchSource[] | undefined): ProviderAdapter {
  return {
    descriptor: { id: 'builtin:' + id, aliases: [id], label, adapterVersion: '1', contractVersion: 1, operations: ['search'], taskProfiles: [profile], languages: ['*'], regions: ['global'], resultKinds: [kind], sourceFamily: id, requirements: [], supportedFilters: [], costModel: { kind: 'free', note: 'Public API, rate limited' }, costTier: 'anonymous', priority: 90, verification: { live: false, note: 'Official API contract; mock tests only' } },
    probeLocal: () => ({ available: true, installation: 'not_required', credential: 'not_required' }),
    create(deps: EngineDeps): Engine {
      return { id, label, available: () => true, async search(query, count, signal) {
        const res = await requestProvider(label, url(query, count), { deps, signal })
        if (!res.ok) throw statusFailure(label, res.status, res.headers)
        recordRequest(deps, id)
        const sources = parse(res.json)
        if (!sources) throw new EngineError(label + ' returned an invalid response', 'ENGINE_ERROR', true)
        if (!sources.length) throw new EngineError(label + ' returned no results', 'ENGINE_EMPTY', true)
        return { sources: sources.slice(0, limit(count)) }
      } }
    },
    compile: (task, now) => compileSince(task, id, now, {}),
  }
}
export const npmRegistryAdapter = make('npm', 'npm Registry', 'docs_code', 'code', npmUrl, npmSources)
export const crossrefAdapter = make('crossref', 'Crossref', 'academic', 'paper', crossrefUrl, crossrefSources)
