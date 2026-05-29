import { useState } from 'react'
import { PDFRenderer } from '../../utils/pdfRenderer'
import { formatDate } from '../../utils/pdfStyles'

export function PDFExport({ project, statusUpdates }) {
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState([])
  const [generating, setGenerating] = useState(false)

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleOpen = () => {
    setSelected(statusUpdates.slice(0, 2).map(s => s.id))
    setShowModal(true)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const selectedUpdates = statusUpdates.filter(s => selected.includes(s.id))
      const renderer = new PDFRenderer()
      await renderer.startDocument()
      await renderer.drawFullProject(project, selectedUpdates)
      const slug = project.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)
      const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
      renderer.save(`status-report-${slug}-${date}.pdf`)
      setShowModal(false)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Gerar PDF
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-[440px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-900">Gerar PDF do projeto</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Selecione quais status reports incluir no documento.</p>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {statusUpdates.length} status report{statusUpdates.length !== 1 ? 's' : ''} disponíve{statusUpdates.length !== 1 ? 'is' : 'l'}
              </span>
              <button
                onClick={() => setSelected(
                  selected.length === statusUpdates.length ? [] : statusUpdates.map(s => s.id)
                )}
                className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
              >
                {selected.length === statusUpdates.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 mb-3">
              {statusUpdates.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum status report disponível.</p>
              ) : (
                statusUpdates.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSelect(s.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      selected.includes(s.id)
                        ? 'border-primary-300 bg-primary-50/40'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected.includes(s.id)
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300'
                    }`}>
                      {selected.includes(s.id) && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800">{formatDate(s.created_at)}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {s.reported_by_name || s.author?.name}
                        {s.description && ` · ${s.description.slice(0, 50)}${s.description.length > 50 ? '…' : ''}`}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {selected.length > 0 && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <p className="text-xs text-gray-500">
                  PDF incluirá informações do projeto + <span className="font-medium text-gray-700">{selected.length} status report{selected.length !== 1 ? 's' : ''}</span> + cronograma
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 text-xs text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={selected.length === 0 || generating}
                className="flex-1 text-xs bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-1.5"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {generating ? 'Gerando...' : `Gerar PDF (${selected.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}