import { createFileRoute } from '@tanstack/react-router'

const CAIXA_API = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena'

type CaixaDraw = {
  numero: number
  dataApuracao: string
  listaDezenas: string[]
  dezenasSorteadasOrdemSorteio: string[] | null
  acumulado: boolean
  localSorteio: string | null
  nomeMunicipioUFSorteio: string | null
  valorArrecadado: number | null
  valorAcumuladoConcurso_0_5: number | null
  valorAcumuladoProximoConcurso: number | null
  valorEstimadoProximoConcurso: number | null
  dataProximoConcurso: string | null
  numeroConcursoProximo: number | null
  listaRateioPremio: Array<{ faixa: number; descricaoFaixa: string; numeroDeGanhadores: number; valorPremio: number }> | null
}

/** dd/MM/yyyy -> yyyy-MM-dd */
function toISO(date: string | null): string | null {
  if (!date) return null
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

async function fetchDraw(concurso?: number): Promise<CaixaDraw | null> {
  const url = concurso ? `${CAIXA_API}/${concurso}` : CAIXA_API
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as CaixaDraw
    if (!json || typeof json.numero !== 'number' || !Array.isArray(json.listaDezenas)) return null
    return json
  } catch {
    return null
  }
}

function toRow(d: CaixaDraw) {
  const dezenas = d.listaDezenas.map((n) => Number(n)).filter((n) => n >= 1 && n <= 60)
  if (dezenas.length !== 6) return null
  const dataISO = toISO(d.dataApuracao)
  if (!dataISO) return null
  const sena = (d.listaRateioPremio ?? []).find((r) => r.faixa === 1)
  return {
    concurso: d.numero,
    data_apuracao: dataISO,
    dezenas: dezenas.sort((a, b) => a - b),
    dezenas_ordem_sorteio: (d.dezenasSorteadasOrdemSorteio ?? []).map((n) => Number(n)),
    acumulou: Boolean(d.acumulado),
    local_sorteio: d.localSorteio ?? null,
    municipio_uf: d.nomeMunicipioUFSorteio ?? null,
    valor_arrecadado: d.valorArrecadado ?? null,
    valor_acumulado: d.valorAcumuladoProximoConcurso ?? d.valorAcumuladoConcurso_0_5 ?? null,
    valor_estimado_proximo: d.valorEstimadoProximoConcurso ?? null,
    data_proximo_concurso: toISO(d.dataProximoConcurso),
    proximo_concurso: d.numeroConcursoProximo ?? null,
    rateio: d.listaRateioPremio ?? null,
    ganhadores_sena: sena?.numeroDeGanhadores ?? null,
    premio_sena: sena?.valorPremio ?? null,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Sincroniza os resultados oficiais da Mega-Sena (Caixa).
 * body: { latest?: boolean, from?: number, to?: number, backfill?: boolean, batch?: number }
 */
export const Route = createFileRoute('/api/public/sync-megasena')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const supabase = supabaseAdmin as any

        try {
          const body = (await request.json().catch(() => ({}))) as any
          let latest = await fetchDraw()
          if (!latest) {
            return Response.json({ success: false, error: 'Fonte oficial indisponível' }, { status: 502 })
          }

          const rows: any[] = []
          const latestRow = toRow(latest)
          if (latestRow) rows.push(latestRow)

          // O endpoint "último concurso" da CAIXA fica em cache e às vezes atrasa.
          // Sondamos os próximos números para pegar sorteios já publicados.
          for (let n = latest.numero + 1; n <= latest.numero + 8; n++) {
            const next = await fetchDraw(n)
            if (!next || next.numero !== n) break
            const nextRow = toRow(next)
            if (nextRow) rows.push(nextRow)
            latest = next
          }


          let from: number | null = null
          let to: number | null = null

          if (typeof body.from === 'number' && typeof body.to === 'number') {
            from = Math.max(1, body.from)
            to = Math.min(latest.numero, body.to)
          } else if (body.backfill) {
            const { data: existing } = await supabase
              .from('mega_sena_results')
              .select('concurso')
              .order('concurso', { ascending: false })
              .limit(1)
            const batch = Math.min(Number(body.batch) || 150, 400)
            const { count } = await supabase
              .from('mega_sena_results')
              .select('concurso', { count: 'exact', head: true })
            const have = count ?? 0
            if (have < latest.numero) {
              // procura o menor intervalo ainda faltante, do mais recente para trás
              const has = new Set<number>()
              for (let page = 0; page < 20; page++) {
                const { data: present } = await supabase
                  .from('mega_sena_results')
                  .select('concurso')
                  .order('concurso', { ascending: false })
                  .range(page * 1000, page * 1000 + 999)
                const list = (present ?? []) as any[]
                list.forEach((r) => has.add(r.concurso))
                if (list.length < 1000) break
              }
              const missing: number[] = []
              for (let n = latest.numero; n >= 1 && missing.length < batch; n--) {
                if (!has.has(n)) missing.push(n)
              }
              if (missing.length) {
                from = Math.min(...missing)
                to = Math.max(...missing)
              }
              // busca apenas os que faltam
              const chunkSize = 12
              for (let i = 0; i < missing.length; i += chunkSize) {
                const chunk = missing.slice(i, i + chunkSize)
                const results = await Promise.all(chunk.map((n) => fetchDraw(n)))
                for (const d of results) {
                  if (!d) continue
                  const row = toRow(d)
                  if (row) rows.push(row)
                }
              }
              from = null
              to = null
            }
            void existing
          }

          if (from !== null && to !== null) {
            const nums: number[] = []
            for (let n = to; n >= from; n--) nums.push(n)
            const chunkSize = 12
            for (let i = 0; i < nums.length; i += chunkSize) {
              const chunk = nums.slice(i, i + chunkSize)
              const results = await Promise.all(chunk.map((n) => fetchDraw(n)))
              for (const d of results) {
                if (!d) continue
                const row = toRow(d)
                if (row) rows.push(row)
              }
            }
          }

          // remove duplicatas por concurso (o último concurso pode aparecer duas vezes)
          const unique = Array.from(new Map(rows.map((r) => [r.concurso, r])).values())

          let synced = 0
          const chunk = 200
          for (let i = 0; i < unique.length; i += chunk) {
            const slice = unique.slice(i, i + chunk)
            const { error } = await supabase
              .from('mega_sena_results')
              .upsert(slice, { onConflict: 'concurso' })
            if (error) throw error
            synced += slice.length
          }

          const { count: total } = await supabase
            .from('mega_sena_results')
            .select('concurso', { count: 'exact', head: true })

          return Response.json({
            success: true,
            synced,
            total: total ?? 0,
            ultimoConcurso: latest.numero,
            completo: (total ?? 0) >= latest.numero,
          })
        } catch (error: any) {
          console.error('[SYNC-MEGA] erro:', error)
          return Response.json({ success: false, error: String(error?.message ?? error) }, { status: 500 })
        }
      },
    },
  },
})
