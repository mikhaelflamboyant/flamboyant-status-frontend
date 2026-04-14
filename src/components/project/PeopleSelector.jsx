import { useState, useMemo } from 'react'

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

const TrashIcon = ({ color = '#E24B4A' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

function PeopleRow({ users, selected, excluded = [], onAdd, onRemoveRow, canRemoveRow }) {
  const [area, setArea] = useState('')
  const [userId, setUserId] = useState('')
  const [manualName, setManualName] = useState('')

  const filteredUsers = useMemo(() => {
    if (!area) return []
    return users.filter(u =>
      u.area === area &&
      !selected.find(s => s.user_id === u.id) &&
      !excluded.find(e => e.user_id === u.id)
    )
  }, [area, users, selected, excluded])

  const noUsersFound = area && filteredUsers.length === 0

  const handleAreaChange = (e) => {
    setArea(e.target.value)
    setUserId('')
    setManualName('')
  }

  const handleUserChange = (e) => {
    const id = e.target.value
    if (!id) return
    const user = users.find(u => u.id === id)
    if (user) {
      onAdd({ user_id: user.id, name: user.name, area: user.area })
    }
  }

  const handleManualAdd = () => {
    if (!manualName.trim()) return
    onAdd({ user_id: `manual_${Date.now()}`, name: manualName.trim(), area })
    setManualName('')
    setArea('')
  }

  const selectCls = 'h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Área</p>
          <select value={area} onChange={handleAreaChange} className={selectCls}>
            <option value="">Selecionar área</option>
            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">Nome</p>
          {noUsersFound ? (
            <input
              type="text"
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
              placeholder="Digite o nome manualmente"
              className={selectCls}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <select
                value={userId}
                onChange={handleUserChange}
                disabled={!area}
                className={selectCls}
                style={!area ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                {!area && <option value="">Selecione a área primeiro</option>}
                {area && filteredUsers.length > 0 && (
                  <>
                    <option value="">Selecione o nome</option>
                    {filteredUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </>
                )}
              </select>
              {area && (
                <input
                  type="text"
                  value={manualName}
                  onChange={e => setManualName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                  placeholder="Ou digite um nome manualmente"
                  className={selectCls}
                />
              )}
            </div>
          )}
        </div>
        {canRemoveRow && (
          <button
            type="button"
            onClick={onRemoveRow}
            className="h-9 w-9 flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
          >
            <TrashIcon />
          </button>
        )}
      </div>
      {noUsersFound && (
        <p className="text-xs text-amber-600">
          Nenhum usuário encontrado nesta área. Digite o nome manualmente e clique em adicionar.
        </p>
      )}
    </div>
  )
}

export function PeopleSelector({ label, required = false, users = [], selected = [], onChange, buttonLabel, allowEmptyStart = false, excluded = [] }) {
  const [rows, setRows] = useState(allowEmptyStart ? [] : [Date.now()])

  const handleAdd = (person) => {
    onChange([...selected, person])
    setRows(prev => prev.slice(0, -1))
  }

  const handleRemoveSelected = (userId) => {
    const next = selected.filter(s => s.user_id !== userId)
    onChange(next)
    if (next.length === 0 && !allowEmptyStart) {
      setRows([Date.now()])
    }
  }

  const handleAddRow = () => {
    setRows(prev => [...prev, Date.now()])
  }

  const handleRemoveRow = (rowId) => {
    setRows(prev => prev.filter(r => r !== rowId))
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-gray-500">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          {selected.map(s => (
            <div
              key={s.user_id}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <div className="flex items-center gap-0 w-full">
                <span className="text-xs text-gray-400 w-32 shrink-0">{s.area}</span>
                <div className="w-px h-3 bg-gray-200 shrink-0" />
                <span className="text-sm font-medium text-gray-800 ml-3">{s.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSelected(s.user_id)}
                className="hover:opacity-70 transition-opacity shrink-0 ml-2"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.map((rowId) => (
        <PeopleRow
          key={rowId}
          users={users}
          selected={selected}
          excluded={excluded}
          onAdd={handleAdd}
          onRemoveRow={() => handleRemoveRow(rowId)}
          canRemoveRow={allowEmptyStart || rows.length > 1 || selected.length > 0}
        />
      ))}

      <div className="flex justify-end">
        <button
            type="button"
            onClick={() => {
              // salva nome manual pendente antes de adicionar nova linha
              const pendingRow = rows[rows.length - 1]
              if (pendingRow) {
                const input = document.querySelector(`input[placeholder="Digite o nome manualmente"]`)
                if (input?.value?.trim()) {
                  const areaSelect = input.closest('.flex')?.querySelector('select')
                  const areaValue = areaSelect?.value
                  if (areaValue) {
                    onChange([...selected, { user_id: `manual_${Date.now()}`, name: input.value.trim(), area: areaValue }])
                  }
                }
              }
              handleAddRow()
            }}
            style={{ minWidth: '180px' }}
            className="h-9 px-4 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-colors text-center"
        >
            {buttonLabel}
        </button>
      </div>
    </div>
  )
}