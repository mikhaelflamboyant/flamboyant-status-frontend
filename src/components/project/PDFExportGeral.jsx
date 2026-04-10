import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import api from '../../services/api'

const PHASE_LABELS = {
  RECEBIDA: 'Recebida',
  ENTREVISTA_SOLICITANTE: 'Entrevista com o solicitante',
  LEVANTAMENTO_REQUISITOS: 'Levantamento de requisitos',
  ANALISE_SOLUCAO: 'Análise da solução',
  DESENVOLVIMENTO: 'Desenvolvimento',
  TESTES: 'Testes',
  VALIDACAO_SOLICITANTE: 'Validação com o solicitante',
  ENTREGUE: 'Entregue',
}

const FAROL_LABELS = {
  VERDE: 'No prazo',
  AMARELO: 'Atenção',
  VERMELHO: 'Atrasado',
}

const FAROL_COLORS = {
  VERDE: '#1D9E75',
  AMARELO: '#BA7517',
  VERMELHO: '#E24B4A',
}

const BUSINESS_UNITS = ['Corporativo', 'Shopping', 'Urbanismo', 'Agropecuária', 'Instituto', 'Sem unidade']

const s = {
  wrap: { width: '794px', padding: '48px', backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#111827' },
  header: { margin: '-48px -48px 0 -48px' },
  headerTitle: { color: '#ffffff', fontSize: '15px', fontWeight: '700', margin: '0 0 3px' },
  headerSub: { color: '#F1948A', fontSize: '12px', margin: 0 },
  headerDate: { color: '#F1948A', fontSize: '12px', margin: 0 },
  projectTitle: { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 12px', letterSpacing: '-0.3px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  infoCell: { background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: '10px', padding: '10px 14px' },
  infoLabel: { fontSize: '11px', color: '#9ca3af', margin: '0 0 3px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 },
  progressWrap: { marginBottom: '24px' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  progressLabel: { fontSize: '12px', color: '#9ca3af', fontWeight: '500' },
  progressPct: { fontSize: '12px', fontWeight: '700', color: '#374151' },
  progressBar: { height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  divider: { borderTop: '1.5px solid #e5e7eb', margin: '24px 0 20px' },
  sectionTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 14px' },
  statusCard: { border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', background: '#ffffff' },
  statusMeta: { fontSize: '11px', color: '#9ca3af', margin: '0 0 10px', fontWeight: '500' },
  statusSectionLabel: { fontSize: '11px', color: '#6b7280', margin: '0 0 3px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' },
  statusText: { fontSize: '13px', color: '#374151', margin: '0 0 12px', lineHeight: '1.6' },
  statusGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  riskWrap: { marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' },
  riskItem: { display: 'flex', gap: '8px', padding: '8px 10px', background: '#fef2f2', borderRadius: '8px', marginBottom: '6px', border: '1px solid #fee2e2' },
  riskDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#E24B4A', flexShrink: 0, marginTop: '4px' },
  riskTitle: { fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 2px' },
  riskDesc: { fontSize: '12px', color: '#6b7280', margin: '0 0 2px', lineHeight: '1.4' },
  riskMit: { fontSize: '12px', color: '#0F6E56', margin: 0, fontWeight: '500' },
  footer: { borderTop: '1.5px solid #e5e7eb', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', marginTop: '8px' },
  footerText: { fontSize: '11px', color: '#9ca3af', margin: 0, fontWeight: '500' },
}

function makeRedCanvas() {
  const c = document.createElement('canvas')
  c.width = 794
  c.height = 1123
  c.getContext('2d').fillStyle = '#7a1a1a'
  c.getContext('2d').fillRect(0, 0, 794, 1123)
  return c.toDataURL('image/png')
}

const SEPARATOR_IMAGES = {
  'Shopping': '/sep_shopping.png',
  'Instituto': '/sep_instituto.png',
  'Urbanismo': '/sep_urbanismo.png',
  'Agropecuária': '/sep_agropecuaria.png',
}

function SeparatorPage({ unit }) {
  const imgSrc = SEPARATOR_IMAGES[unit]

  if (imgSrc) {
    return (
      <div style={{ width: '794px', height: '1123px', overflow: 'hidden' }}>
        <img src={`${window.location.origin}${imgSrc}`} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    )
  }

  return (
    <div style={{ width: '794px', height: '1123px', backgroundColor: '#7a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" style={{ marginBottom: '24px' }}>
          <path d="M50 8 C50 8 62 30 62 30 L88 30 L68 50 L78 76 L50 60 L22 76 L32 50 L12 30 L38 30 Z" fill="#C0392B" stroke="#E74C3C" strokeWidth="1.5"/>
          <path d="M50 20 C50 20 60 38 60 38 L80 38 L64 52 L72 70 L50 58 L28 70 L36 52 L20 38 L40 38 Z" fill="#962d2d"/>
        </svg>
        <p style={{ color: '#ffffff', fontSize: '32px', fontWeight: '700', margin: '0 0 8px', letterSpacing: '-0.5px' }}>{unit}</p>
        <p style={{ color: '#F1948A', fontSize: '14px', margin: 0 }}>Status report · Grupo Flamboyant</p>
      </div>
    </div>
  )
}

function ProjectPage({ project }) {
  const goLive = new Date(project.go_live).toLocaleDateString('pt-BR')
  const solicitantes = project.requesters?.filter(r => r.type === 'SOLICITANTE') || []
  const responsaveis = project.requesters?.filter(r => r.type === 'RESPONSAVEL') || []
  const statusUpdates = project.status_updates || []

  return (
    <div style={s.wrap}>
      <div>
        <div style={{ margin: '-48px -48px 0 -48px', background: '#7a1a1a', overflow: 'hidden' }}>
          <img src={`${window.location.origin}/logo_fundo_vermelho.png`} crossOrigin="anonymous" style={{ width: '100%', display: 'block' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 20px', borderBottom: '1.5px solid #e5e7eb', marginBottom: '24px' }}>
          <p style={s.headerSub}>Tecnologia da Informação</p>
          <p style={s.headerDate}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <p style={s.projectTitle}>{project.title}</p>

      <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '13px', color: '#111827', margin: 0 }}>
          <span style={{ color: '#9ca3af', fontWeight: '500' }}>Área: </span>{project.area}
        </p>
        {project.business_unit && (
          <p style={{ fontSize: '12px', color: '#111827', margin: 0 }}>
            <span style={{ color: '#9ca3af', fontWeight: '500' }}>Unidade de negócio: </span>{project.business_unit}
          </p>
        )}
        <p style={{ fontSize: '12px', color: '#111827', margin: 0 }}>
          <span style={{ color: '#9ca3af', fontWeight: '500' }}>Tipo de execução: </span>
          {project.execution_type === 'INTERNA' ? 'Interna' : 'Fornecedor externo'}
        </p>
        <p style={{ fontSize: '12px', margin: 0 }}>
          <span style={{ color: '#9ca3af', fontWeight: '500' }}>Farol: </span>
          <span style={{ color: FAROL_COLORS[project.traffic_light], fontWeight: '600' }}>{FAROL_LABELS[project.traffic_light]}</span>
        </p>
      </div>

      {project.description && (
        <div style={{ marginBottom: '20px', padding: '12px 14px', background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: '10px' }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descrição</p>
          <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.6' }}>{project.description}</p>
        </div>
      )}

      <div style={s.infoGrid}>
        <div style={s.infoCell}>
          <p style={s.infoLabel}>Solicitante(s)</p>
          <p style={s.infoValue}>{solicitantes.length > 0 ? solicitantes.map(r => r.user.name).join(', ') : '—'}</p>
        </div>
        <div style={s.infoCell}>
          <p style={s.infoLabel}>Responsável(is)</p>
          <p style={s.infoValue}>{responsaveis.length > 0 ? responsaveis.map(r => r.user.name).join(', ') : '—'}</p>
        </div>
        <div style={s.infoCell}>
          <p style={s.infoLabel}>Go-live</p>
          <p style={s.infoValue}>{goLive}</p>
        </div>
        <div style={s.infoCell}>
          <p style={s.infoLabel}>Fase atual</p>
          <p style={s.infoValue}>{PHASE_LABELS[project.current_phase] || project.current_phase}</p>
        </div>
      </div>

      <div style={s.progressWrap}>
        <div style={s.progressHeader}>
          <span style={s.progressLabel}>Conclusão</span>
          <span style={s.progressPct}>{project.completion_pct}%</span>
        </div>
        <div style={s.progressBar}>
          <div style={{ height: '100%', width: `${project.completion_pct}%`, background: FAROL_COLORS[project.traffic_light], borderRadius: '4px' }} />
        </div>
      </div>

      {statusUpdates.length > 0 && (
        <>
          <div style={s.divider} />
          <p style={s.sectionTitle}>Status reports</p>
          {statusUpdates.slice(0, 2).map((update) => (
            <div key={update.id} style={s.statusCard}>
              <p style={s.statusMeta}>{new Date(update.created_at).toLocaleDateString('pt-BR')} · {update.author?.name}</p>
              <p style={s.statusSectionLabel}>Status geral</p>
              <p style={s.statusText}>{update.description}</p>
              <div style={s.statusGrid}>
                <div>
                  <p style={s.statusSectionLabel}>Destaques do período</p>
                  <p style={{ ...s.statusText, margin: 0 }}>{update.highlights}</p>
                </div>
                <div>
                  <p style={s.statusSectionLabel}>Próximos passos</p>
                  <p style={{ ...s.statusText, margin: 0 }}>{update.next_steps}</p>
                </div>
              </div>
              {update.risks?.length > 0 && (
                <div style={s.riskWrap}>
                  <p style={s.statusSectionLabel}>Riscos</p>
                  {update.risks.map(risk => (
                    <div key={risk.id} style={s.riskItem}>
                      <div style={s.riskDot} />
                      <div>
                        <p style={s.riskTitle}>{risk.title}</p>
                        <p style={s.riskDesc}>{risk.description}</p>
                        <p style={s.riskMit}>Mitigação: {risk.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <div style={s.footer}>
        <p style={s.footerText}>Grupo Flamboyant · Tecnologia da Informação</p>
        <p style={s.footerText}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  )
}

export function PDFExportGeral({ allProjects }) {
  const [showModal, setShowModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [generating, setGenerating] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [fullProjects, setFullProjects] = useState([])
  const pagesRef = useRef([])

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

  const handleOpen = async () => {
    setSelectedIds(allProjects.map(p => p.id))
    setShowModal(true)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      setLoadingProjects(true)
      const responses = await Promise.all(
        selectedIds.map(id => api.get(`/projects/${id}`))
      )
      const projects = responses.map(r => r.data)
      setFullProjects(projects)
      setLoadingProjects(false)

      await new Promise(resolve => setTimeout(resolve, 500))

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const unitKeys = Object.keys(projectsByUnit).filter(unit =>
        projectsByUnit[unit].some(p => selectedIds.includes(p.id))
      )

      // Página 1 — arte Flamboyant (usa a página em branco que o jsPDF cria)
      const pagina1Img = new Image()
      pagina1Img.src = '/pagina1.png'
      await new Promise(resolve => { pagina1Img.onload = resolve })
      const c1 = document.createElement('canvas')
      c1.width = pagina1Img.naturalWidth
      c1.height = pagina1Img.naturalHeight
      c1.getContext('2d').drawImage(pagina1Img, 0, 0)
      pdf.addImage(c1.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight)

      // Página 2 — arte com data dinâmica
      const pagina2Img = new Image()
      pagina2Img.src = '/pagina2.png'
      await new Promise(resolve => { pagina2Img.onload = resolve })
      const c2 = document.createElement('canvas')
      c2.width = pagina2Img.naturalWidth
      c2.height = pagina2Img.naturalHeight
      c2.getContext('2d').drawImage(pagina2Img, 0, 0)
      pdf.addPage()
      pdf.addImage(c2.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight)
      pdf.setFontSize(16)
      pdf.setTextColor(220, 180, 180)
      pdf.setFont('helvetica', 'normal')
      pdf.text(new Date().toLocaleDateString('pt-BR'), pageWidth / 2, pageHeight * 0.54, { align: 'center' })
      
      // Página 3 — vermelha simples por enquanto
      const pagina3Img = new Image()
      pagina3Img.src = '/pagina3.png'
      await new Promise(resolve => { pagina3Img.onload = resolve })
      const c3 = document.createElement('canvas')
      c3.width = pagina3Img.naturalWidth
      c3.height = pagina3Img.naturalHeight
      c3.getContext('2d').drawImage(pagina3Img, 0, 0)
      pdf.addPage()
      pdf.addImage(c3.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight)

      // Páginas por unidade de negócio
      for (let u = 0; u < unitKeys.length; u++) {
        const unit = unitKeys[u]
        const unitProjects = projectsByUnit[unit].filter(p => selectedIds.includes(p.id))

        const sepEl = pagesRef.current[`sep-${unit}`]
        if (sepEl) {
          pdf.addPage()
          const canvas = await html2canvas(sepEl, { scale: 2, backgroundColor: '#7a1a1a', logging: false })
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight)
        }

        for (let i = 0; i < unitProjects.length; i++) {
          const proj = projects.find(p => p.id === unitProjects[i].id)
          if (!proj) continue
          const el = pagesRef.current[`proj-${proj.id}`]
          if (!el) continue

          pdf.addPage()
          const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
          })
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = pageWidth
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          let position = 0

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft > 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }
        }
      }

      // Última página vermelha
      pdf.addPage()
      pdf.addImage(makeRedCanvas(), 'PNG', 0, 0, pageWidth, pageHeight)

      const filename = `status-report-geral-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
      pdf.save(filename)
      setShowModal(false)
    } catch (err) {
      console.error(err)
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
                {generating ? (loadingProjects ? 'Carregando...' : 'Gerando...') : `Gerar (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {Object.entries(projectsByUnit).map(([unit]) => (
          <div key={unit} ref={el => pagesRef.current[`sep-${unit}`] = el}>
            <SeparatorPage unit={unit} />
          </div>
        ))}
        {fullProjects.map(project => (
          <div key={project.id} ref={el => pagesRef.current[`proj-${project.id}`] = el}>
            <ProjectPage project={project} />
          </div>
        ))}
      </div>
    </>
  )
}