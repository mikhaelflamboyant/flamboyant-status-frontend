import { useEffect, useRef, useState } from 'react'
import { Users, FolderKanban, SlidersHorizontal, ChevronDown, Check } from 'lucide-react'
import { ACTION_TYPE_KEYS, ACTION_TYPES } from './actionTypes'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'last7', label: '7 dias' },
  { value: 'last30', label: '30 dias' },
]

function FilterDropdown({ Icon, placeholder, options, selectedValue, onSelect, allLabel }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)
  const isActive = selectedValue !== null
  const selected = options.find(o => o.value === selectedValue)

  useEffect(() => {
    if (!isOpen) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setIsOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setIsOpen(o => !o)}
        className={`inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
          isActive ? 'border-primary-200 bg-primary-50 text-primary-800'
                   : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
        }`}>
        <Icon size={14} className={`shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
        {selected?.label ?? placeholder}
        <ChevronDown size={12} className={`shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-9 left-0 z-20 max-h-72 min-w-[190px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
          <div className="flex flex-col gap-px">
            {[{ value: null, label: allLabel }, ...options].map(option => {
              const isSelected = option.value === selectedValue
              return (
                <button key={option.value ?? '__all'} type="button"
                  onClick={() => { onSelect(option.value); setIsOpen(false) }}
                  className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs leading-snug ${
                    isSelected ? 'bg-primary-50 font-semibold text-primary-800' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {option.label}
                  {isSelected && <Check size={14} className="ml-auto shrink-0 text-primary-600" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecentActionsFilters({ users, projects, filters, onFilterChange, onClearFilters }) {
  const hasActive = Boolean(filters.user_id || filters.project_id || filters.action_type)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <FilterDropdown Icon={Users} placeholder="Usuário" allLabel="Todos os usuários"
        options={users.map(u => ({ value: u.id, label: u.name }))}
        selectedValue={filters.user_id}
        onSelect={(user_id) => onFilterChange({ user_id })} />

      <FilterDropdown Icon={FolderKanban} placeholder="Projeto" allLabel="Todos os projetos"
        options={projects.map(p => ({ value: p.id, label: p.name }))}
        selectedValue={filters.project_id}
        onSelect={(project_id) => onFilterChange({ project_id })} />

      <FilterDropdown Icon={SlidersHorizontal} placeholder="Tipo de ação" allLabel="Todos os tipos"
        options={ACTION_TYPE_KEYS.map(k => ({ value: k, label: ACTION_TYPES[k].label }))}
        selectedValue={filters.action_type}
        onSelect={(action_type) => onFilterChange({ action_type })} />

      <div className="inline-flex h-8 gap-px rounded-lg border border-gray-200 bg-white p-0.5">
        {PERIOD_OPTIONS.map(option => (
          <button key={option.value} type="button"
            onClick={() => onFilterChange({ period: option.value })}
            className={`rounded-md px-2.5 text-xs font-medium transition-colors ${
              filters.period === option.value ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}>
            {option.label}
          </button>
        ))}
      </div>

      {hasActive && (
        <button type="button" onClick={onClearFilters}
          className="px-1 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600">
          Limpar filtros
        </button>
      )}
    </div>
  )
}