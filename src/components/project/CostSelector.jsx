import { useState } from 'react'

const formatCurrency = (value) => {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  const amount = parseInt(numbers, 10)
  return (amount / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const parseCurrency = (value) => {
  return value.replace(/\./g, '').replace(',', '.')
}

const TrashIcon = ({ color = '#E24B4A' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

export function CostSelector({ costs = [], onChange }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', budget_planned: '', budget_actual: '' })

  const inputCls = 'h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700'

  const handleConfirm = () => {
    if (!form.name || !form.budget_planned) return
    onChange([...costs, {
      name: form.name,
      budget_planned: parseCurrency(form.budget_planned),
      budget_actual: form.budget_actual ? parseCurrency(form.budget_actual) : '',
    }])
    setForm({ name: '', budget_planned: '', budget_actual: '' })
    setShowForm(false)
  }

  const handleRemove = (index) => {
    onChange(costs.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">

      {costs.length > 0 && (
        <div className="flex flex-col gap-2">
          {costs.map((c, index) => (
            <div
              key={index}
              className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <div className="flex items-center gap-4 flex-1 flex-wrap">
                <span className="text-sm font-medium text-gray-800 w-32 shrink-0">{c.name}</span>
                <div className="w-px h-3 bg-gray-200 shrink-0" />
                <span className="text-xs text-gray-500">
                  Planejado: <span className="font-medium text-gray-800">
                    R$ {Number(c.budget_planned).toLocaleString('pt-BR')}
                  </span>
                </span>
                {c.budget_actual && (
                  <>
                    <div className="w-px h-3 bg-gray-200 shrink-0" />
                    <span className="text-xs text-gray-500">
                      Realizado: <span className={`font-medium ${Number(c.budget_actual) > Number(c.budget_planned) ? 'text-red-500' : 'text-teal-600'}`}>
                        R$ {Number(c.budget_actual).toLocaleString('pt-BR')}
                      </span>
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="hover:opacity-70 transition-opacity shrink-0 ml-2"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Nome do custo <span className="text-red-400">*</span></p>
              <input
                type="text"
                placeholder="Ex: Licença, Consultoria..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Valor planejado (R$) <span className="text-red-400">*</span></p>
              <input
                type="text"
                placeholder="0,00"
                value={form.budget_planned}
                onChange={e => setForm(f => ({ ...f, budget_planned: formatCurrency(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">Valor realizado (R$)</p>
              <input
                type="text"
                placeholder="0,00"
                value={form.budget_actual}
                onChange={e => setForm(f => ({ ...f, budget_actual: formatCurrency(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ name: '', budget_planned: '', budget_actual: '' }) }}
              className="h-9 w-9 flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        {showForm ? (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!form.name || !form.budget_planned}
            style={{ minWidth: '180px' }}
            className="h-9 px-4 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors"
          >
            Confirmar custo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{ minWidth: '180px' }}
            className="h-9 px-4 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            + Adicionar custo
          </button>
        )}
      </div>

    </div>
  )
}