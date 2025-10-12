// apps/web/src/lib/query.ts
export type Filters = {
  page?: number;
  page_size?: number;
  order?: string;
  q?: string;
  status?: string[];          // multi-seleção
  entidade?: string;          // filtro por entidade
  mine?: boolean;             // esteira individual
  assigned?: '0' | '1';       // '0' = não atribuídos, '1' = atribuídos
};

export function buildCasesQuery(
  f: Filters,
  opts?: { role?: string; scope?: 'global' | 'mine' | 'other' }
) {
  const p = new URLSearchParams();
  const set = (k: string, v: string | number | boolean | undefined | null) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return;
    p.set(k, String(v));
  };

  // paginação/ordenação
  set('page', f.page ?? 1);
  set('page_size', f.page_size ?? 50);
  set('order', f.order ?? 'financiamentos_desc');

  // busca digitada
  if (f.q && f.q.trim()) set('q', f.q.trim());

  // status (CSV)
  if (Array.isArray(f.status) && f.status.length > 0) {
    set('status', f.status.join(','));
  }

  // entidade
  if (f.entidade) set('entidade', f.entidade);

  // mine/assigned conforme necessidade
  if (f.mine) set('mine', 'true');
  if (f.assigned) set('assigned', f.assigned);

  return p;
}
