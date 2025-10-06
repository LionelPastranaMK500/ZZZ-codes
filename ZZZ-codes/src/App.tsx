import { useEffect, useMemo, useState } from 'react'

type CodeItem = { code: string; rewards: string[] }
type Payload = { active: CodeItem[]; inactive: CodeItem[] }

declare global {
  interface Window { api: { getCodes: () => Promise<Payload> } }
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setOk(true); setTimeout(() => setOk(false), 1000)
      }}
      className="inline-flex items-center gap-2 rounded-md border border-orange-300/80 bg-orange-100/70
                 px-3 py-1.5 text-xs text-orange-900 hover:bg-orange-200 active:scale-[.98]
                 transition shadow-sm"
      title="Copiar código"
    >
      {ok ? '¡Copiado!' : 'Copiar'}
    </button>
  )
}

/* ====== Traducción local simple ====== */
const DICT: Record<string, string> = {
  'Polychrome': 'Policromo',
  'Official Investigator Log': 'Registro de Investigador Oficial',
  'Senior Investigator Log': 'Registro de Investigador Senior',
  'W-Engine Power Supply': 'Suministro de energía de W-Engine',
  'W-Engine Energy Module': 'Módulo de energía de W-Engine',
  'Crystallized Plating Agent': 'Agente de recubrimiento cristalizado',
  'Bangboo Algorithm Module': 'Módulo de algoritmo Bangboo',
  'Bangboo System Widget': 'Widget del sistema Bangboo',
  'Ether Plating Agent': 'Agente de recubrimiento de Éter',
  'Ether Battery': 'Batería de Éter',
  'Denny': 'Denny',
  'Dennies': 'Dennies',
}

function translateReward(line: string): string {
  let out = line
  // normaliza “×” y “x”
  out = out.replace(/×/g, 'x')
  // reemplazos por diccionario (palabra completa o fragmento)
  for (const [en, es] of Object.entries(DICT)) {
    out = out.replaceAll(en, es)
  }
  // comas con espacios raros
  out = out.replace(/,\s*,/g, ', ')
  return out
}

function Rewards({ rewards, translate }: { rewards: string[]; translate: boolean }) {
  const list = translate ? rewards.map(translateReward) : rewards
  return (
    <ul className="text-xs text-amber-900/90 leading-5 list-disc pl-5">
      {list?.map((r,i)=><li key={i}>{r}</li>)}
    </ul>
  )
}

type TabKey = 'active'|'inactive'

export default function App() {
  const [data, setData] = useState<Payload>({ active: [], inactive: [] })
  const [tab, setTab] = useState<TabKey>('active')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  // auto-refresh + highlight + notificación
  const [lastActiveCodes, setLastActiveCodes] = useState<string[]>([])
  const [flash, setFlash] = useState<Set<string>>(new Set())

  // toggle de traducción
  const [translate, setTranslate] = useState<boolean>(false)

  // carga inicial + permiso de notificaciones
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const res = await window.api.getCodes()
        setData(res)
        setLastActiveCodes(res.active.map(c => c.code))
      } catch (e:any) {
        setError(e?.message ?? 'Error al obtener códigos')
      } finally {
        setLoading(false)
      }
    })()

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // polling cada 60s
  useEffect(() => {
    const tick = async () => {
      try {
        const res = await window.api.getCodes()
        // detectar nuevos activos
        const prev = new Set(lastActiveCodes)
        const now = res.active.map(c => c.code)
        const nuevos = now.filter(c => !prev.has(c))

        if (nuevos.length) {
          // highlight 5s
          setFlash(new Set(nuevos))
          setTimeout(() => setFlash(new Set()), 5000)

          // notificación nativa
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Nuevos códigos activos', {
              body: nuevos.slice(0, 4).join(', ') + (nuevos.length > 4 ? '…' : '')
            })
          }
        }

        setLastActiveCodes(now)
        setData(res)
      } catch (_) { /* silenciar */ }
    }

    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [lastActiveCodes])

  const filtered = useMemo(() => {
    const norm = (s:string)=>s.toLowerCase()
    const filt = (arr:CodeItem[]) =>
      q ? arr.filter(c => norm(c.code).includes(norm(q)) || c.rewards?.some(r=>norm(r).includes(norm(q)))) : arr
    return { active: filt(data.active), inactive: filt(data.inactive) }
  }, [data, q])

  if (loading) return <div className="p-6 text-amber-900">Cargando códigos…</div>
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>

  const current = tab === 'active' ? filtered.active : filtered.inactive

  return (
    <div className="min-h-screen p-0 text-slate-900 bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-orange-700">
          Zenless — Códigos
        </h1>
        <p className="text-sm text-orange-800/70 mt-1">
          Activos e Inactivos (paleta cálida / veraniega)
        </p>
      </header>

      {/* Tabs + search + translate */}
      <div className="px-6 mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <nav className="inline-flex rounded-xl border border-orange-300 bg-white/80 backdrop-blur p-1 shadow-sm">
            {([
              { key:'active', label:`Activos (${filtered.active.length})` },
              { key:'inactive', label:`Inactivos (${filtered.inactive.length})` },
            ] as {key:TabKey,label:string}[]).map(t => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={()=>setTab(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition
                    ${active
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-orange-700 hover:bg-orange-100'}`}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-orange-800/80">
              <input
                type="checkbox"
                className="h-4 w-4 accent-orange-500"
                checked={translate}
                onChange={(e)=>setTranslate(e.target.checked)}
              />
              Traducir recompensas
            </label>

            <div className="relative">
              <input
                value={q}
                onChange={e=>setQ(e.target.value)}
                placeholder="Buscar código o recompensa…"
                className="w-72 rounded-lg bg-white/80 border border-orange-300 px-3 py-2 text-sm
                           outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 mt-5">
        <div className="overflow-hidden rounded-xl border border-orange-300 bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-orange-100 to-amber-100">
              <tr className="text-orange-800 uppercase text-xs">
                <th className="text-left py-2.5 px-3">Código</th>
                <th className="text-left py-2.5 px-3">Recompensas</th>
                <th className="text-right py-2.5 px-3">{tab==='active' ? 'Acciones' : 'Estado'}</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t [&>tr]:border-orange-200">
              {current.map((c) => (
                <tr
                  key={c.code}
                  className={`hover:bg-orange-50/70 transition
                    ${flash.has(c.code) && tab==='active' ? 'animate-pulse bg-amber-100/70 ring-2 ring-amber-300' : ''}`}
                >
                  <td className="py-3 px-3 align-top">
                    <span className="font-mono text-base text-orange-900">{c.code}</span>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <Rewards rewards={c.rewards} translate={translate} />
                  </td>
                  <td className="py-3 px-3 align-top text-right">
                    {tab==='active'
                      ? <CopyButton text={c.code} />
                      : (
                        <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100/70
                                         px-2 py-0.5 text-[10px] uppercase tracking-wide text-rose-700">
                          Inactivo
                        </span>
                        )
                    }
                  </td>
                </tr>
              ))}
              {current.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 px-3 text-center text-orange-800/70">
                    {tab==='active' ? 'No hay códigos activos.' : 'No hay códigos inactivos.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-orange-800/70">
          {tab==='active'
            ? 'Consejo: copia un código con el botón “Copiar”.'
            : 'Los inactivos se muestran solo de referencia.'}
        </p>
      </div>
    </div>
  )
}
