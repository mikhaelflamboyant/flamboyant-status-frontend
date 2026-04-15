import { useState } from 'react'
import { RiskItem } from './RiskItem'

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

export function StatusUpdateCard({ update, onAddRisk, onUpdateRisk, onDeleteRisk, onUpdateStatus, onDeleteStatus, canEdit }) {
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [riskForm, setRiskForm] = useState({ title: '', description: '', mitigation: '' })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    description: update.description || '',
    highlights: (update.highlights || '').split('\n').filter(l => l.trim()),
    next_steps: (update.next_steps || '').split('\n').filter(l => l.trim()),
  })
  const [editLoading, setEditLoading] = useState(false)

  const date = new Date(update.created_at).toLocaleDateString('pt-BR')

  const handleAddRisk = async () => {
    if (!riskForm.title || !riskForm.description || !riskForm.mitigation) return
    setLoading(true)
    try {
      await onAddRisk(update.id, riskForm)
      setRiskForm({ title: '', description: '', mitigation: '' })
      setShowRiskForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setEditLoading(true)
    try {
      await onUpdateStatus(update.id, {
        description: editForm.description,
        highlights: editForm.highlights.join('\n'),
        next_steps: editForm.next_steps.join('\n'),
      })
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este status report?')) return
    try {
      await onDeleteStatus(update.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">{date}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
            {update.author?.name}
          </span>
          {canEdit && !editing && (
            <>
              <button onClick={() => setEditing(true)} className="hover:opacity-70 transition-opacity" title="Editar">
                <EditIcon />
              </button>
              <button onClick={handleDelete} className="hover:opacity-70 transition-opacity" title="Excluir">
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Status geral</p>
            <textarea
              value={editForm.description}
              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Destaques do período</p>
              {editForm.highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input
                    value={item}
                    onChange={e => {
                      const arr = [...editForm.highlights]
                      arr[i] = e.target.value
                      setEditForm({ ...editForm, highlights: arr })
                    }}
                    className="flex-1 h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                  />
                  <button type="button" onClick={() => setEditForm({ ...editForm, highlights: editForm.highlights.filter((_, idx) => idx !== i) })}
                    className="hover:opacity-70 shrink-0">
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setEditForm({ ...editForm, highlights: [...editForm.highlights, ''] })}
                className="text-xs text-primary-600 hover:text-primary-800 mt-1">
                + Adicionar
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Próximos passos</p>
              {editForm.next_steps.map((item, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <input
                    value={item}
                    onChange={e => {
                      const arr = [...editForm.next_steps]
                      arr[i] = e.target.value
                      setEditForm({ ...editForm, next_steps: arr })
                    }}
                    className="flex-1 h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
                  />
                  <button type="button" onClick={() => setEditForm({ ...editForm, next_steps: editForm.next_steps.filter((_, idx) => idx !== i) })}
                    className="hover:opacity-70 shrink-0">
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setEditForm({ ...editForm, next_steps: [...editForm.next_steps, ''] })}
                className="text-xs text-primary-600 hover:text-primary-800 mt-1">
                + Adicionar
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} disabled={editLoading}
              className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50">
              {editLoading ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {update.description && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1 font-medium">Status geral</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{update.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">Destaques do período</p>
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {(update.highlights || '').split('\n').filter(l => l.trim()).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 list-none">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 inline-block" style={{minWidth: '6px'}} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5">Próximos passos</p>
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {(update.next_steps || '').split('\n').filter(l => l.trim()).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 list-none">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 inline-block" style={{minWidth: '6px'}} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {update.risks?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 mb-2">Problemas e riscos</p>
          <div className="flex flex-col gap-2">
            {update.risks.map(risk => (
              <RiskItem
                key={risk.id}
                risk={risk}
                canEdit={canEdit}
                onUpdate={(data) => onUpdateRisk(update.id, risk.id, data)}
                onDelete={() => onDeleteRisk(update.id, risk.id)}
              />
            ))}
          </div>
        </div>
      )}

      {canEdit && !editing && (
        <div className="pt-3 border-t border-gray-50">
          {!showRiskForm ? (
            <button onClick={() => setShowRiskForm(true)}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors">
              + Adicionar risco
            </button>
          ) : (
            <div className="border border-gray-100 rounded-lg p-3 flex flex-col gap-2 bg-gray-50">
              <p className="text-xs font-medium text-gray-600">Novo risco</p>
              <input placeholder="Título do risco" value={riskForm.title}
                onChange={e => setRiskForm({ ...riskForm, title: e.target.value })}
                className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
              />
              <textarea placeholder="Descrição do problema ou risco" value={riskForm.description}
                onChange={e => setRiskForm({ ...riskForm, description: e.target.value })}
                rows={2} className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
              />
              <textarea placeholder="Ação de mitigação" value={riskForm.mitigation}
                onChange={e => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                rows={2} className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
              />
              <div className="flex gap-2">
                <button onClick={handleAddRisk} disabled={loading}
                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50">
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button onClick={() => setShowRiskForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}