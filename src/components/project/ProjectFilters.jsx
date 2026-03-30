const AREAS = [
  'Todas as áreas', 'RH', 'Jurídica', 'Agropecuária', 'Construção',
  'Contabilidade', 'Controladoria', 'Processos', 'Depto. de Pessoas',
  'Comitê Executivo', 'Outros'
]

const PHASES = [
  { key: '', label: 'Todas as fases' },
  { key: 'RECEBIDA', label: 'Recebida' },
  { key: 'ENTREVISTA_SOLICITANTE', label: 'Entrevista' },
  { key: 'LEVANTAMENTO_REQUISITOS', label: 'Levantamento de requisitos' },
  { key: 'ANALISE_SOLUCAO', label: 'Análise da solução' },
  { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { key: 'TESTES', label: 'Testes' },
  { key: 'VALIDACAO_SOLICITANTE', label: 'Validação' },
  { key: 'ENTREGUE', label: 'Entregue' },
]

const selectCls = 'h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600 transition-colors cursor-pointer'

export function ProjectFilters({ filters, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="Buscar por nome ou área..."
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:border-primary-600 transition-colors min-w-[200px] placeholder:text-gray-300"
      />

      <select
        value={filters.traffic_light}
        onChange={e => onChange({ ...filters, traffic_light: e.target.value })}
        className={selectCls}
      >
        <option value="">Todos os faróis</option>
        <option value="VERDE">Verde</option>
        <option value="AMARELO">Amarelo</option>
        <option value="VERMELHO">Vermelho</option>
      </select>

      <select
        value={filters.phase}
        onChange={e => onChange({ ...filters, phase: e.target.value })}
        className={selectCls}
      >
        {PHASES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
      </select>

      <select
        value={filters.area}
        onChange={e => onChange({ ...filters, area: e.target.value })}
        className={selectCls}
      >
        {AREAS.map(a => <option key={a} value={a === 'Todas as áreas' ? '' : a}>{a}</option>)}
      </select>

      <select
        value={filters.priority}
        onChange={e => onChange({ ...filters, priority: e.target.value })}
        className={selectCls}
      >
        <option value="">Todas as prioridades</option>
        <option value="5">Prioridade 5</option>
        <option value="4">Prioridade 4</option>
        <option value="3">Prioridade 3</option>
        <option value="2">Prioridade 2</option>
        <option value="1">Prioridade 1</option>
      </select>
    </div>
  )
}