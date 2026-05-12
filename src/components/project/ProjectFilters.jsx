import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const AREAS = [
  'Administração Pessoal',
  'Administrativo Urbanismo',
  'Agropecuária',
  'Almoxarifado',
  'Apoio',
  'Arquitetura',
  'Assuntos Regulatórios',
  'Atendimento',
  'Brigada',
  'Comercial',
  'Compras',
  'Conservação',
  'Contabilidade',
  'Controladoria',
  'Engenharia',
  'Estacionamento',
  'Experiência Urbanismo',
  'Family Office',
  'Financeiro',
  'Helicenter',
  'In Concert',
  'Incorporação',
  'Inovação',
  'Instituto Flamboyant',
  'Jurídico',
  'Legalização',
  'Manutenção',
  'Marketing Coorporativo',
  'Marketing Institucional',
  'Marketing Urbanismo',
  'Operações',
  'Pessoas e Cultura',
  'Planejamento e Projetos',
  'Planejamento Financeiro',
  'Planejamento Financeiro e Administrativo',
  'Planejamento Financeiro Urbanismo',
  'Processos',
  'Produtos e Projetos Urbanismo',
  'Produtos Urbanismo',
  'Projetos Executivos',
  'Projetos Urbanismo',
  'Recebimento Fiscal',
  'Relacionamento',
  'Resíduos',
  'Secretaria',
  'Segurança',
  'Suprimentos',
  'Tecnologia da Informação',
  'Vendas',
]

const PHASES = [
  { key: 'RECEBIDA', label: 'Recebida' },
  { key: 'ENTREVISTA_SOLICITANTE', label: 'Entrevista' },
  { key: 'LEVANTAMENTO_REQUISITOS', label: 'Levantamento de requisitos' },
  { key: 'ANALISE_SOLUCAO', label: 'Análise da solução' },
  { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { key: 'TESTES', label: 'Testes' },
  { key: 'VALIDACAO_SOLICITANTE', label: 'Validação' },
  { key: 'ENTREGUE', label: 'Entregue' },
  { key: 'SUPORTE', label: 'Suporte pós go-live' },
]

const FAROL_OPTIONS = [
  { key: 'VERDE', label: 'Verde', dot: '#1D9E75' },
  { key: 'AMARELO', label: 'Amarelo', dot: '#EF9F27' },
  { key: 'VERMELHO', label: 'Vermelho', dot: '#E24B4A' },
]

const PRIORITY_OPTIONS = [
  { key: '5', label: 'Prioridade 5' },
  { key: '4', label: 'Prioridade 4' },
  { key: '3', label: 'Prioridade 3' },
  { key: '2', label: 'Prioridade 2' },
  { key: '1', label: 'Prioridade 1' },
]

function MultiDropdown({ label, options, selected, onChange, renderOption }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (key) => {
    if (selected.includes(key)) onChange(selected.filter(k => k !== key))
    else onChange([...selected, key])
  }

  const hasSelection = selected.length > 0
  const btnLabel = hasSelection ? `${label} (${selected.length})` : label

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`h-8 px-3 text-xs border rounded-lg bg-white outline-none transition-colors cursor-pointer flex items-center gap-1.5 ${
          hasSelection
            ? 'border-primary-400 text-primary-700 bg-primary-50'
            : 'border-gray-200 text-gray-600'
        }`}
      >
        {btnLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '36px', left: 0, zIndex: 50,
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '6px', minWidth: '180px', maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          {options.map(opt => (
            <label
              key={opt.key}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                selected.includes(opt.key) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
              }`}>
                {selected.includes(opt.key) && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              {renderOption ? renderOption(opt) : <span className="text-xs text-gray-700">{opt.label}</span>}
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                Limpar seleção
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const selectCls = 'h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 outline-none focus:border-primary-600 transition-colors cursor-pointer'

export function ProjectFilters({ filters, onChange, hidePhase }) {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [requesters, setRequesters] = useState([])

  const canSeeAllAreas = ['SUPERINTENDENTE', 'ANALISTA_MASTER'].includes(user?.role)
  const isManagerLevel = ['GERENTE', 'COORDENADOR'].includes(user?.role)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const area = canSeeAllAreas ? (filters.areas?.[0] || '') : user?.area
        const params = area ? `?area=${encodeURIComponent(area)}` : ''
        const response = await api.get(`/users${params}`)
        setUsers(response.data.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (err) { console.error(err) }
    }
    if (canSeeAllAreas || isManagerLevel) fetchUsers()
  }, [filters.areas, user])

  useEffect(() => {
    const fetchRequesters = async () => {
      try {
        const response = await api.get('/projects')
        const allRequesters = response.data.flatMap(p =>
          p.requesters?.filter(r => r.type === 'SOLICITANTE' && r.user_id) || []
        )
        const unique = Array.from(
          new Map(allRequesters.map(r => [r.user_id, { id: r.user_id, name: r.user?.name || r.manual_name }])).values()
        ).sort((a, b) => a.name.localeCompare(b.name))
        setRequesters(unique)
      } catch (err) { console.error(err) }
    }
    fetchRequesters()
  }, [])

  const hasAnyFilter = (
    filters.traffic_light?.length > 0 ||
    filters.phases?.length > 0 ||
    filters.areas?.length > 0 ||
    filters.priorities?.length > 0 ||
    filters.responsible_id ||
    filters.requester_id ||
    filters.filtro
  )

  const clearAll = () => onChange({
    ...filters,
    traffic_light: [],
    phases: [],
    areas: [],
    priorities: [],
    responsible_id: '',
    requester_id: '',
    filtro: '',
  })

  const showUserFilter = canSeeAllAreas || isManagerLevel

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="Buscar por nome ou área..."
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:border-primary-600 transition-colors placeholder:text-gray-300"
        style={{ minWidth: '200px' }}
      />

      <MultiDropdown
        label="Farol"
        options={FAROL_OPTIONS}
        selected={filters.traffic_light || []}
        onChange={val => onChange({ ...filters, traffic_light: val })}
        renderOption={opt => (
          <div className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, display: 'inline-block', flexShrink: 0 }} />
            <span className="text-xs text-gray-700">{opt.label}</span>
          </div>
        )}
      />

      {!hidePhase && (
        <MultiDropdown
          label="Fase"
          options={PHASES}
          selected={filters.phases || []}
          onChange={val => onChange({ ...filters, phases: val })}
        />
      )}

      <MultiDropdown
        label="Área"
        options={AREAS.map(a => ({ key: a, label: a }))}
        selected={filters.areas || []}
        onChange={val => onChange({ ...filters, areas: val })}
      />

      <MultiDropdown
        label="Prioridade"
        options={PRIORITY_OPTIONS}
        selected={filters.priorities || []}
        onChange={val => onChange({ ...filters, priorities: val })}
      />

      {showUserFilter && (
        <>
          <select
            value={filters.responsible_id || ''}
            onChange={e => onChange({ ...filters, responsible_id: e.target.value })}
            className={selectCls}
          >
            <option value="">Todos os responsáveis</option>
            {users
              .filter(u => u.area === 'Tecnologia da Informação' || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(u.role))
              .map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <select
            value={filters.requester_id || ''}
            onChange={e => onChange({ ...filters, requester_id: e.target.value })}
            className={selectCls}
          >
            <option value="">Todos os solicitantes</option>
            {requesters.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </>
      )}

      <select
        value={filters.filtro || ''}
        onChange={e => onChange({ ...filters, filtro: e.target.value })}
        className={selectCls}
      >
        <option value="">Filtros especiais</option>
        <option value="sem_status">Sem status recente</option>
        <option value="sem_golive">Sem go-live definido</option>
      </select>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={clearAll}
          className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}