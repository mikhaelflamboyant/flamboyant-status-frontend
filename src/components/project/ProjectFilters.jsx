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
  'Marketing Corporativo',
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
  { key: 'SUPORTE', label: 'Suporte pós go-live' },
  { key: 'ENTREGUE', label: 'Entregue' },
]

const FAROL_OPTIONS = [
  { key: 'VERDE', label: 'Verde', dot: '#1D9E75' },
  { key: 'AMARELO', label: 'Amarelo', dot: '#EF9F27' },
  { key: 'VERMELHO', label: 'Vermelho', dot: '#E24B4A' },
]

const LEVEL_OPTIONS = [
  { key: 'A', label: 'A - Estratégico' },
  { key: 'B', label: 'B - Performance (ROI)' },
  { key: 'C', label: 'C - Compliance' },
  { key: 'D', label: 'D - Inovação e transformação digital' },
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
        className={`h-8 px-3 text-xs border rounded-lg outline-none transition-colors cursor-pointer flex items-center gap-1.5 ${
          hasSelection
            ? 'border-primary-400 text-primary-700 bg-primary-50'
            : 'border-gray-200 text-gray-600 bg-white'
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
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '6px', minWidth: '180px', maxHeight: '260px',
          overflowY: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
        }}>
          {options.map(opt => (
            <label
              key={opt.key}
              onClick={() => toggle(opt.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selected.includes(opt.key) ? '#534AB7' : '#ffffff',
                border: selected.includes(opt.key) ? '1px solid #534AB7' : '1px solid #d1d5db',
              }}>
                {selected.includes(opt.key) && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              {renderOption ? renderOption(opt) : <span style={{ fontSize: '12px', color: '#374151' }}>{opt.label}</span>}
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => onChange([])}
                style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
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
        const response = await api.get('/users')
        setUsers(response.data
          .filter(u => u.area === 'Tecnologia da Informação' || ['ANALISTA_MASTER', 'ANALISTA_TESTADOR'].includes(u.role))
          .sort((a, b) => a.name.localeCompare(b.name)))
      } catch (err) { console.error(err) }
    }
    if (canSeeAllAreas || isManagerLevel) fetchUsers()
  }, [user])

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
    filters.levels?.length > 0 ||
    filters.responsible_ids?.length > 0 ||
    filters.requester_ids?.length > 0 ||
    filters.filtro
  )

  const clearAll = () => onChange({
    ...filters,
    traffic_light: [],
    phases: [],
    areas: [],
    levels: [],
    responsible_ids: [],
    requester_ids: [],
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#374151' }}>{opt.label}</span>
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
        label="Nível"
        options={LEVEL_OPTIONS}
        selected={filters.levels || []}
        onChange={val => onChange({ ...filters, levels: val })}
      />

      {showUserFilter && (
        <>
          <MultiDropdown
            label="Responsável"
            options={users.map(u => ({ key: u.id, label: u.name }))}
            selected={filters.responsible_ids || []}
            onChange={val => onChange({ ...filters, responsible_ids: val })}
          />

          <MultiDropdown
            label="Solicitante"
            options={requesters.map(u => ({ key: u.id, label: u.name }))}
            selected={filters.requester_ids || []}
            onChange={val => onChange({ ...filters, requester_ids: val })}
          />
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