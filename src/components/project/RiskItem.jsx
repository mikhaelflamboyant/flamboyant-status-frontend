import { useState } from 'react'

export function RiskItem({ risk, canEdit, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: risk.title,
    description: risk.description,
    mitigation: risk.mitigation
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onUpdate(form)
    setEditing(false)
    setLoading(false)
  }

  if (editing) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2 bg-white">
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
        />
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
        />
        <textarea
          value={form.mitigation}
          onChange={e => setForm({ ...form, mitigation: e.target.value })}
          rows={2}
          className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-red-100 bg-red-50 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0 mt-1" />
          <p className="text-xs font-medium text-red-800">{risk.title}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-600">
              Editar
            </button>
            <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600">
              Excluir
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-red-700 mt-1 ml-4">{risk.description}</p>
      <div className="mt-2 ml-4 px-2 py-1.5 bg-teal-50 rounded-lg">
        <p className="text-xs text-teal-700"><span className="font-medium">Mitigação:</span> {risk.mitigation}</p>
      </div>
    </div>
  )
}