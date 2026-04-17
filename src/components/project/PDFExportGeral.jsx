import { useState } from 'react'
import { PDFRenderer } from '../../utils/pdfRenderer'
import { BUSINESS_UNITS } from '../../utils/pdfStyles'
import api from '../../services/api'

const SEPARATOR_IMAGES = {
  'Shopping': '/sep_shopping.png',
  'Instituto': '/sep_instituto.png',
  'Urbanismo': '/sep_urbanismo.png',
  'Agropecuária': '/sep_agropecuaria.png',
}

export function PDFExportGeral({ allProjects }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  const toggleProject = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedIds(allProjects.map(p => p.id))
  const deselectAll = () => setSelectedIds([])

  const projectsByUnit = BUSINESS_UNITS.reduce((acc, unit) => {
    const list = allProjects.filter(p =>
      unit === 'Sem unidade' ? !p.business_unit : p.business_unit === unit
    )
    if (list.length > 0) acc[unit] = list
    return acc
  }, {})

  const handleOpen = () => {
    setSelectedIds(allProjects.map(p => p.id))
    setShowModal(true)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // 1. Carregar dados completos dos projetos selecionados
      setLoadingProjects(true)
      const responses = await Promise.all(
        selectedIds.map(id => api.get(`/projects/${id}`))
      )
      const fullProjects = responses.map(r => r.data)
      setLoadingProjects(false)

      // 2. Criar renderer
      const renderer = new PDFRenderer()
      const origin = window.location.origin

      // 3. Páginas estáticas iniciais
      await renderer.drawStaticPage(`${origin}/pagina1.png`)

      renderer.doc.addPage()
      renderer.pageIndex++
      await renderer.drawStaticPage(`${origin}/pagina2.png`)
      // Sobrepor data na página 2
      renderer.doc.setFontSize(16)
      renderer.doc.setFont('helvetica', 'normal')
      renderer.doc.setTextColor(220, 180, 180)
      const pw = renderer.doc.internal.pageSize.getWidth()
      const ph = renderer.doc.internal.pageSize.getHeight()
      renderer.doc.text(
        new Date().toLocaleDateString('pt-BR'),
        pw / 2, ph * 0.54,
        { align: 'center' }
      )

      renderer.doc.addPage()
      renderer.pageIndex++
      await renderer.drawStaticPage(`${origin}/pagina3.png`)

      // 4. Para cada unidade de negócio com projetos selecionados
      const unitKeys = Object.keys(projectsByUnit).filter(unit =>
        projectsByUnit[unit].some(p => selectedIds.includes(p.id))
      )

      for (const unit of unitKeys) {
        const unitProjects = projectsByUnit[unit].filter(p =>
          selectedIds.includes(p.id)
        )

        // Página separadora da unidade
        const imgPath = SEPARATOR_IMAGES[unit]
          ? `${origin}${SEPARATOR_IMAGES[unit]}`
          : null
        await renderer.drawSeparatorPage(unit, imgPath)

        // Projetos da unidade
        for (const proj of unitProjects) {
          const fullProject = fullProjects.find(p => p.id === proj.id)
          if (!fullProject) continue

          const statusUpdates = fullProject.status_updates || []

          // Nova página para cada projeto
          renderer.startNewProject()
          renderer.drawFullProject(fullProject, statusUpdates)
        }
      }

      // 5. Página final (contra-capa)
      renderer._drawFooter()
      renderer.doc.addPage()
      renderer.pageIndex++
      await renderer.drawStaticPage(`${origin}/ultima_pagina.png`)

      // 6. Preencher números de página e salvar
      renderer._fillPageNumbers()
      const filename = `status-report-geral-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
      renderer.doc.save(filename)

      setShowModal(false)
    } catch (err) {
      console.error('Erro ao gerar PDF geral:', err)
    } finally {
      setGenerating(false)
      setLoadingProjects(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs font-medium px-4 h-8 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Gerar PDF Geral
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-96 max-h-[80vh] flex flex-col">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Gerar PDF Geral</h3>
            <p className="text-xs text-gray-400 mb-3">Selecione os projetos a incluir:</p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={selectAll}
                className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 px-3 py-1 rounded-lg transition-colors"
              >
                Selecionar todos
              </button>
              <button
                onClick={deselectAll}
                className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1 rounded-lg transition-colors"
              >
                Desmarcar todos
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1 mb-4">
              {Object.entries(projectsByUnit).map(([unit, projects]) => (
                <div key={unit}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {unit}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProject(p.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                          selectedIds.includes(p.id)
                            ? 'border-primary-300 bg-primary-50/40'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selectedIds.includes(p.id)
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedIds.includes(p.id) && (
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/>
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400 truncate">{p.area}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          p.traffic_light === 'VERDE' ? 'bg-teal-400' :
                          p.traffic_light === 'AMARELO' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 text-xs text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedIds.length === 0 || generating}
                className="flex-1 text-xs bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors font-medium"
              >
                {generating
                  ? (loadingProjects ? 'Carregando...' : 'Gerando...')
                  : `Gerar (${selectedIds.length})`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}