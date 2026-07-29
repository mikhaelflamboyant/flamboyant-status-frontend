import { useCallback, useEffect, useState } from 'react'
import { LayoutList, Table2, UsersRound, ChevronLeft, ChevronRight, Activity, Loader2 } from 'lucide-react'
import { managementService } from '../../../services/management.service'
import RecentActionsFilters from './RecentActionsFilters'
import RecentActionsTimeline from './RecentActionsTimeline'
import RecentActionsTable from './RecentActionsTable'
import RecentActionsByUser from './RecentActionsByUser'

const PAGE_SIZE = 20

const LAYOUT_OPTIONS = [
  { value: 'timeline', label: 'Linha do tempo', Icon: LayoutList },
  { value: 'table',    label: 'Tabela',         Icon: Table2 },
  { value: 'byUser',   label: 'Por usuário',    Icon: UsersRound },
]

const INITIAL_FILTERS = { user_id: null, project_id: null, action_type: null, period: 'last7' }

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export default function RecentActionsTab() {
  const [layout, setLayout] = useState('timeline')
  const [filters, setFilters] = useState(INITIAL_FILTERS)

  const [actions, setActions] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filterOptions, setFilterOptions] = useState({ users: [], projects: [] })

  useEffect(() => {
    let mounted = true
    managementService.getRecentActionFilters()
      .then(res => { if (mounted) setFilterOptions(res.data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    managementService.getRecentActions({ ...filters, page, page_size: PAGE_SIZE })
      .then(res => {
        if (!mounted) return
        setActions(res.data.actions)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages || 1)
      })
      .catch(err => {
        if (mounted) setError(err.response?.data?.error || 'Não foi possível carregar as últimas ações.')
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [filters, page])

  const handleFilterChange = useCallback((changed) => {
    setPage(1)
    setFilters(prev => ({ ...prev, ...changed }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setPage(1)
    setFilters(prev => ({ ...INITIAL_FILTERS, period: prev.period }))
  }, [])

  const distinctUsers = new Set(actions.map(a => a.user.id)).size

  return (
    <div>
      <div className="mb-4 inline-flex gap-1">
        {LAYOUT_OPTIONS.map(({ value, label, Icon }) => (
          <button key={value} type="button" onClick={() => setLayout(value)}
            className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-medium transition-colors border ${
              layout === value ? 'bg-primary-600 text-white border-primary-600'
                               : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}>
            <Icon size={14} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <RecentActionsFilters
        users={filterOptions.users}
        projects={filterOptions.projects}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {error && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2.5 rounded-xl border border-gray-100 bg-white py-14 text-xs text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          Carregando ações...
        </div>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white px-6 py-14 text-center">
          <Activity size={40} className="mb-3 text-gray-300" strokeWidth={1.6} />
          <h3 className="mb-1 text-sm font-medium text-gray-500">Nenhuma ação registrada no período</h3>
          <p className="text-xs text-gray-400">Ajuste os filtros ou amplie o intervalo de tempo.</p>
        </div>
      ) : (
        <>
          {layout === 'timeline' && <RecentActionsTimeline actions={actions} />}
          {layout === 'table' && <RecentActionsTable actions={actions} />}
          {layout === 'byUser' && <RecentActionsByUser actions={actions} />}

          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span className="text-xs text-gray-400">
              {`Mostrando ${(page - 1) * PAGE_SIZE + 1} a ${(page - 1) * PAGE_SIZE + actions.length} de ${total}`}
              {layout === 'byUser' && ` · ${distinctUsers} ${distinctUsers === 1 ? 'pessoa' : 'pessoas'} nesta página`}
            </span>

            {totalPages > 1 && (
              <div className="inline-flex items-center gap-1">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white">
                  <ChevronLeft size={14} />
                </button>

                {getPageNumbers(page, totalPages).map((item, index) =>
                  item === '...' ? (
                    <span key={`gap-${index}`} className="px-1 text-xs text-gray-300">...</span>
                  ) : (
                    <button key={item} type="button" onClick={() => setPage(item)}
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors ${
                        item === page
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}>
                      {item}
                    </button>
                  )
                )}

                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}