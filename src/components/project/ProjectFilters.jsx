import { useState, useEffect, useMemo } from 'react'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

const AREAS = [
  'Administração Pessoal',
  'Agropecuária',
  'Arquitetura',
  'Comercial',
  'Conservação',
  'Contabilidade',
  'Controladoria',
  'Engenharia',
  'Financeiro',
  'Incorporação',
  'Instituto',
  'Inovação',
  'Jurídico',
  'Legalização',
  'Manutenção',
  'Marketing Coorporativo',
  'Marketing Institucional',
  'Marketing Urbanismo',
  'Pessoas e Cultura',
  'Planejamento Financeiro',
  'Processos',
  'Projetos Executivos',
  'Relacionamento',
  'Segurança',
  'Suprimentos',
  'Tecnologia da Informação',
  'Vendas',
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

export function ProjectFilters({ filters, onChange, hidePhase }) {
  const { user } = useAuth()
  const [users, setUsers] = useState([])

  const canSeeAllAreas = ['SUPERINTENDENTE', 'ANALISTA_MASTER'].includes(user?.role)
  const isManagerLevel = ['GERENTE', 'COORDENADOR'].includes(user?.role)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const area = canSeeAllAreas
          ? (filters.area || '')
          : user?.area
        const params = area ? `?area=${encodeURIComponent(area)}` : ''
        const response = await api.get(`/users${params}`)
        const sorted = response.data.sort((a, b) => a.name.localeCompare(b.name))
        setUsers(sorted)
      } catch (err) {
        console.error(err)
      }
    }

    if (canSeeAllAreas || isManagerLevel) {
      fetchUsers()
    }
  }, [filters.area, user])

  const showUserFilter = canSeeAllAreas || isManagerLevel

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="Buscar por nome ou área..."
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        className="h-8 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:border-primary-600 transition-colors min-w-200px placeholder:text-gray-300"
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

      {!hidePhase && (
        <select
          value={filters.phase}
          onChange={e => onChange({ ...filters, phase: e.target.value })}
          className={selectCls}
        >
          {PHASES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      )}

      <select
        value={filters.area}
        onChange={e => onChange({ ...filters, area: e.target.value })}
        className={selectCls}
      >
        <option value="">Todas as áreas</option>
        {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
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

      {showUserFilter && (
        <select
          value={filters.user_id}
          onChange={e => onChange({ ...filters, user_id: e.target.value })}
          className={selectCls}
        >
          <option value="">Todos os usuários</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
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
    </div>
  )
}