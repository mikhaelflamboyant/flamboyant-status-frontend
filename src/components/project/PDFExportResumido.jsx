import { useState } from 'react'
import jsPDF from 'jspdf'
import {
  COLORS, FAROL_CONFIG, BUSINESS_UNITS,
  formatCurrency, getPersonName
} from '../../utils/pdfStyles'
import api from '../../services/api'

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function formatMonthYear(date) {
  if (!date) return 'Sem previsão'
  const d = new Date(date)
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return `${months[d.getUTCMonth()]}/ ${d.getUTCFullYear()}`
}

function getStatusLabel(project) {
  const phase = project.current_phase
  if (phase === 'ENTREGUE' || phase === 'SUPORTE') return { label: 'Concluído', color: COLORS.green }
  const farol = FAROL_CONFIG[project.traffic_light] || FAROL_CONFIG.VERDE
  return { label: farol.label, color: farol.color }
}

function getTotalBudget(costs, field) {
  if (!costs || costs.length === 0) return null
  const total = costs.reduce((acc, c) => acc + (Number(c[field]) || 0), 0)
  return total > 0 ? total : null
}

export function PDFExportResumido({ allProjects }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [generating, setGenerating] = useState(false)
  const [goLiveProjects, setGoLiveProjects] = useState([])

  const toggleProject = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const selectAll = () => setSelectedIds([...allProjects, ...goLiveProjects].map(p => p.id))
  const deselectAll = () => setSelectedIds([])

  const allCombinedProjects = [...allProjects, ...goLiveProjects].filter(
    (p, index, self) => self.findIndex(x => x.id === p.id) === index
  )

  const projectsByUnit = BUSINESS_UNITS.reduce((acc, unit) => {
    const list = allCombinedProjects.filter(p =>
      unit === 'Sem unidade' ? !p.business_unit : p.business_unit === unit
    )
    if (list.length > 0) acc[unit] = list
    return acc
  }, {})

  const handleOpen = async () => {
    try {
      const [goLiveRes, archivedRes] = await Promise.all([
        api.get('/projects/go-live'),
        api.get('/projects/archived'),
      ])
      const extra = [...goLiveRes.data, ...archivedRes.data]
      setGoLiveProjects(extra)
      const allIds = [...allProjects, ...extra].map(p => p.id)
      setSelectedIds(allIds)
    } catch {
      setSelectedIds(allProjects.map(p => p.id))
    }
    setShowModal(true)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const responses = await Promise.all(
        selectedIds.map(id => api.get(`/projects/${id}`))
      )
      const fullProjects = responses.map(r => r.data)

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const W = 297
      const H = 210
      const mL = 10
      const mR = 10
      const cW = W - mL - mR
      let pageIndex = 0

      const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        .replace(/^./, s => s.toUpperCase())

      const getCols = () => [
        { label: 'Projeto',           w: 65 },
        { label: 'Solicitante(s)',         w: 42 },
        { label: 'Início',             w: 28 },
        { label: 'Término previsto',   w: 32 },
        { label: 'Progresso',          w: 31 },
        { label: 'Vlr. planejado',     w: 28 },
        { label: 'Vlr. realizado',     w: 28 },
        { label: 'Status',             w: 23 },
      ]

      const drawHeader = () => {
        doc.setFillColor(...hexToRgb('#A32D2D'))
        doc.rect(0, 0, W, 18, 'F')
        doc.setFontSize(15)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text('Portfólio de Projetos', mL, 12)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`Status – ${currentMonth}`, W - mR, 12, { align: 'right' })
      }

      const drawLegend = (y) => {
        const items = [
          { label: 'No prazo',  color: '#3B6D11' },
          { label: 'Atenção',   color: '#BA7517' },
          { label: 'Atrasado',  color: '#A32D2D' },
          { label: 'Concluído', color: '#0F6E56' },
        ]
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...hexToRgb('#6b7280'))
        doc.text('LEGENDA:', mL, y)
        let lx = mL + 22
        for (const item of items) {
          doc.setFillColor(...hexToRgb(item.color))
          doc.roundedRect(lx, y - 3.2, 4.5, 4.5, 1, 1, 'F')
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...hexToRgb('#374151'))
          doc.text(item.label, lx + 6, y)
          lx += doc.getTextWidth(item.label) + 14
        }
        return y + 6
      }

      const drawTableHeader = (y) => {
        const cols = getCols()
        doc.setFillColor(...hexToRgb('#A32D2D'))
        doc.rect(mL, y, cW, 8, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        let cx = mL + 2
        for (const col of cols) {
          doc.text(col.label.toUpperCase(), cx, y + 5.5)
          cx += col.w
        }
        return y + 8
      }

      const drawRow = (project, y, isOdd) => {
        const cols = getCols()
        const solicitantes = project.requesters?.filter(r => r.type === 'SOLICITANTE') || []
        const gestores = solicitantes.map(r => getPersonName(r)).join(', ')
        const status = getStatusLabel(project)
        const planned = getTotalBudget(project.costs, 'budget_planned')
        const actual = getTotalBudget(project.costs, 'budget_actual')
        const pct = project.completion_pct || 0

        const gestorLines = doc.splitTextToSize(gestores || '—', cols[1].w - 4)
        const titleLines = doc.splitTextToSize(project.title || '', cols[0].w - 6)
        const rowLines = Math.max(titleLines.length, gestorLines.length)
        const rowH = Math.max(12, rowLines * 4.8 + 6)

        if (isOdd) {
          doc.setFillColor(249, 250, 251)
          doc.rect(mL, y, cW, rowH, 'F')
        }

        doc.setDrawColor(...hexToRgb('#e5e7eb'))
        doc.setLineWidth(0.2)
        doc.line(mL, y + rowH, mL + cW, y + rowH)

        let cx = mL + 2
        const ty = y + 4.5

        // Projeto
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...hexToRgb('#111827'))
        for (let i = 0; i < titleLines.length; i++) {
          doc.text(titleLines[i], cx, ty + i * 4.2)
        }
        cx += cols[0].w

        // Gestor
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...hexToRgb('#6b7280'))
        doc.setFontSize(8.5)
        for (let i = 0; i < gestorLines.length; i++) {
          doc.text(gestorLines[i], cx, ty + i * 4.2)
        }
        cx += cols[1].w

        // Início
        doc.setFontSize(8.5)
        doc.setTextColor(...hexToRgb('#374151'))
        doc.text(formatMonthYear(project.start_date), cx, ty)
        cx += cols[2].w

        // Término
        doc.text(formatMonthYear(project.go_live), cx, ty)
        cx += cols[3].w

        // Progresso — barra
        const barW = cols[4].w - 16
        const barX = cx
        const barY = ty - 2.5
        doc.setFillColor(...hexToRgb('#e5e7eb'))
        doc.roundedRect(barX, barY, barW, 3.5, 1, 1, 'F')
        doc.setFillColor(...hexToRgb(status.color))
        doc.roundedRect(barX, barY, Math.max(2, (pct / 100) * barW), 3.5, 1, 1, 'F')
        doc.setFontSize(7.5)
        doc.setTextColor(...hexToRgb('#6b7280'))
        doc.text(`${pct}%`, barX + barW + 2, ty)
        cx += cols[4].w

        // Vlr. planejado
        doc.setFontSize(8.5)
        doc.setTextColor(...hexToRgb('#374151'))
        doc.text(planned != null ? `R$ ${formatCurrency(planned)}` : '—', cx, ty)
        cx += cols[5].w

        // Vlr. realizado
        doc.text(actual != null ? `R$ ${formatCurrency(actual)}` : '—', cx, ty)
        cx += cols[6].w

        // Badge status
        const badgeW = cols[7].w - 2
        doc.setFillColor(...hexToRgb(status.color))
        doc.roundedRect(cx, ty - 3.5, badgeW, 6, 1.5, 1.5, 'F')
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(status.label, cx + badgeW / 2, ty + 0.5, { align: 'center' })

        return rowH
      }

      const drawFooter = () => {
        const fy = H - 9
        doc.setDrawColor(...hexToRgb('#e5e7eb'))
        doc.setLineWidth(0.2)
        doc.line(mL, fy, W - mR, fy)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...hexToRgb('#9ca3af'))
        doc.text('Grupo Flamboyant · Tecnologia da Informação', mL, fy + 5)
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, W - mR, fy + 5, { align: 'right' })
      }

      // --- GERAÇÃO ---
      let isFirstPage = true

      const unitKeys = Object.keys(projectsByUnit).filter(unit =>
        projectsByUnit[unit].some(p => selectedIds.includes(p.id))
      )

      for (const unit of unitKeys) {
        const unitProjects = projectsByUnit[unit]
          .filter(p => selectedIds.includes(p.id))
          .map(p => fullProjects.find(fp => fp.id === p.id) || p)

        if (!isFirstPage) {
          doc.addPage()
          pageIndex++
        }
        isFirstPage = false

        drawHeader()

        let y = 22
        y = drawLegend(y)
        y += 3

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...hexToRgb('#A32D2D'))
        doc.text(unit, mL, y)
        y += 7

        y = drawTableHeader(y)

        let rowIndex = 0
        for (const project of unitProjects) {
          const cols = getCols()
          const solicitantes = project.requesters?.filter(r => r.type === 'SOLICITANTE') || []
          const gestores = solicitantes.map(r => getPersonName(r)).join(', ')
          const gestorLines = doc.splitTextToSize(gestores || '—', cols[1].w - 4)
          const titleLines = doc.splitTextToSize(project.title || '', cols[0].w - 6)
          const rowH = Math.max(12, Math.max(titleLines.length, gestorLines.length) * 4.8 + 6)

          if (y + rowH > H - 16) {
            drawFooter()
            doc.addPage()
            pageIndex++
            drawHeader()
            y = 22
            y = drawTableHeader(y)
          }

          const rH = drawRow(project, y, rowIndex % 2 === 1)
          y += rH
          rowIndex++
        }

        drawFooter()
      }

      const filename = `status-report-resumido-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
      doc.save(filename)
      setShowModal(false)
    } catch (err) {
      console.error('Erro ao gerar PDF resumido:', err)
    } finally {
      setGenerating(false)
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
        Gerar PDF Resumido
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-96 max-h-[80vh] flex flex-col">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Gerar PDF Resumido</h3>
            <p className="text-xs text-gray-400 mb-3">Selecione os projetos a incluir:</p>

            <div className="flex gap-2 mb-3">
              <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 px-3 py-1 rounded-lg transition-colors">
                Selecionar todos
              </button>
              <button onClick={deselectAll} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1 rounded-lg transition-colors">
                Desmarcar todos
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1 mb-4">
              {Object.entries(projectsByUnit).map(([unit, projects]) => (
                <div key={unit}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{unit}</p>
                  <div className="flex flex-col gap-1.5">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProject(p.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                          selectedIds.includes(p.id) ? 'border-primary-300 bg-primary-50/40' : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selectedIds.includes(p.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
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
              <button onClick={() => setShowModal(false)} className="flex-1 text-xs text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={selectedIds.length === 0 || generating}
                className="flex-1 text-xs bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors font-medium"
              >
                {generating ? 'Gerando...' : `Gerar (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}