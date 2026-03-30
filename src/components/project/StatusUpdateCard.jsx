import { useState } from 'react'
import { RiskItem } from './RiskItem'

export function StatusUpdateCard({ update, onAddRisk, onUpdateRisk, onDeleteRisk, canEdit }) {
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [riskForm, setRiskForm] = useState({ title: '', description: '', mitigation: '' })
  const [loading, setLoading] = useState(false)

  const date = new Date(update.created_at).toLocaleDateString('pt-BR')

  const handleAddRisk = async () => {
    if (!riskForm.title || !riskForm.description || !riskForm.mitigation) return
    setLoading(true)
    await onAddRisk(update.id, riskForm)
    setRiskForm({ title: '', description: '', mitigation: '' })
    setShowRiskForm(false)
    setLoading(false)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">{date}</span>
        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
          {update.author?.name}
        </span>
      </div>

      {update.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400 mb-1 font-medium">Status geral</p>
          <p className="text-sm text-gray-700 leading-relaxed">{update.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Destaques do período</p>
          <p className="text-sm text-gray-700 leading-relaxed">{update.highlights}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Próximos passos</p>
          <p className="text-sm text-gray-700 leading-relaxed">{update.next_steps}</p>
        </div>
      </div>

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

      {canEdit && (
        <div className="pt-3 border-t border-gray-50">
          {!showRiskForm ? (
            <button
              onClick={() => setShowRiskForm(true)}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              + Adicionar risco
            </button>
          ) : (
            <div className="border border-gray-100 rounded-lg p-3 flex flex-col gap-2 bg-gray-50">
              <p className="text-xs font-medium text-gray-600">Novo risco</p>
              <input
                placeholder="Título do risco"
                value={riskForm.title}
                onChange={e => setRiskForm({ ...riskForm, title: e.target.value })}
                className="h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white"
              />
              <textarea
                placeholder="Descrição do problema ou risco"
                value={riskForm.description}
                onChange={e => setRiskForm({ ...riskForm, description: e.target.value })}
                rows={2}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
              />
              <textarea
                placeholder="Ação de mitigação"
                value={riskForm.mitigation}
                onChange={e => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                rows={2}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddRisk}
                  disabled={loading}
                  className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => setShowRiskForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                >
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