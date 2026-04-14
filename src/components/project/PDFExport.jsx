import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

function renderMultiline(text, style) {
  if (!text) return null
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
          <div style={{
            minWidth: '18px', height: '18px', background: '#7a1a1a', color: '#ffffff',
            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: '600', flexShrink: 0, marginTop: '1px'
          }}>{i + 1}</div>
          <span style={{ ...style, margin: 0, flex: 1, lineHeight: '1.5', paddingTop: '1px' }}>{line}</span>
        </div>
      ))}
    </div>
  )
}

export function PDFExport({ project, statusUpdates }) {
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState([])
  const [generating, setGenerating] = useState(false)
  const contentRef = useRef(null)

  const toggleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleOpen = () => {
    setSelected(statusUpdates.slice(0, 2).map(s => s.id))
    setShowModal(true)
  }

  const selectedUpdates = statusUpdates.filter(s => selected.includes(s.id))

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const element = contentRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

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

      const filename = `status-report-${project.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
      pdf.save(filename)
      setShowModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  const goLive = new Date(project.go_live).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  const solicitantes = project.requesters?.filter(r => r.type === 'SOLICITANTE') || []
  const responsaveis = project.requesters?.filter(r => r.type === 'RESPONSAVEL') || []

  const s = {
    wrap: { width: '794px', padding: '48px', backgroundColor: '#ffffff', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#111827' },
    header: { margin: '-48px -48px 0 -48px', marginBottom: '0' },
    headerImg: { width: '100%', display: 'block' },
    headerMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 20px', borderBottom: '1.5px solid #e5e7eb', marginBottom: '24px' },
    logoSub: { fontSize: '12px', color: '#9ca3af', margin: 0 },
    dateText: { fontSize: '12px', color: '#9ca3af', margin: 0 },
    projectTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 12px', letterSpacing: '-0.3px' },
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
    sectionTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 14px', letterSpacing: '-0.1px' },
    statusCard: { border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', background: '#ffffff' },
    statusMeta: { fontSize: '11px', color: '#9ca3af', margin: '0 0 10px', fontWeight: '500' },
    statusSectionLabel: { fontSize: '11px', color: '#6b7280', margin: '0 0 6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' },
    statusText: { fontSize: '13px', color: '#374151', margin: '0 0 4px', lineHeight: '1.6' },
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

  return (
    <>
      <button onClick={handleOpen} className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Gerar PDF
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-xl border border-gray-100 p-6 w-80 max-h-[80vh] flex flex-col">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Gerar PDF</h3>
            <p className="text-xs text-gray-400 mb-4">Selecione os status reports a incluir:</p>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 mb-4">
              {statusUpdates.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum status report disponível.</p>
              ) : (
                statusUpdates.map(s => (
                  <button key={s.id} onClick={() => toggleSelect(s.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${selected.includes(s.id) ? 'border-primary-300 bg-primary-50/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(s.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                      {selected.includes(s.id) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="1,5 4,8 9,2" stroke="white" strokeWidth="1.5"/></svg>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800">{new Date(s.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-400 truncate">{s.author?.name}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 text-xs text-gray-500 border border-gray-200 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleGenerate} disabled={selected.length === 0 || generating}
                className="flex-1 text-xs bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors font-medium">
                {generating ? 'Gerando...' : 'Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={contentRef} style={s.wrap}>
          <div style={s.header}>
            <img src={`${window.location.origin}/logo_fundo_vermelho.png`} crossOrigin="anonymous" style={s.headerImg} />
            <div style={s.headerMeta}>
              <p style={s.logoSub}>Tecnologia da Informação</p>
              <p style={s.dateText}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <p style={s.projectTitle}>{project.title}</p>
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
              <span style={{ color: '#9ca3af', fontWeight: '500' }}>Área: </span>{project.area}
            </p>
            {project.business_unit && (
              <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
                <span style={{ color: '#9ca3af', fontWeight: '500' }}>Unidade de negócio: </span>{project.business_unit}
              </p>
            )}
            <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
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
            <div style={s.infoCell}><p style={s.infoLabel}>Solicitante(s)</p><p style={s.infoValue}>{solicitantes.length > 0 ? solicitantes.map(r => r.user?.name || r.manual_name).join(', ') : '—'}</p></div>
            <div style={s.infoCell}><p style={s.infoLabel}>Responsável(is)</p><p style={s.infoValue}>{responsaveis.length > 0 ? responsaveis.map(r => r.user?.name || r.manual_name).join(', ') : '—'}</p></div>
            <div style={s.infoCell}><p style={s.infoLabel}>Go-live</p><p style={s.infoValue}>{goLive}</p></div>
            <div style={s.infoCell}><p style={s.infoLabel}>Fase atual</p><p style={s.infoValue}>{PHASE_LABELS[project.current_phase] || project.current_phase}</p></div>
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

          <div style={s.divider} />
          <p style={s.sectionTitle}>Status reports</p>

          {selectedUpdates.map((update) => (
            <div key={update.id} style={s.statusCard}>
              <p style={s.statusMeta}>{new Date(update.created_at).toLocaleDateString('pt-BR')} · {update.author?.name}</p>
              <p style={s.statusSectionLabel}>Status geral</p>
              <p style={{ ...s.statusText, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{update.description}</p>
              <div style={s.statusGrid}>
                <div>
                  <p style={s.statusSectionLabel}>Destaques do período</p>
                  {renderMultiline(update.highlights, { ...s.statusText, margin: '0 0 2px' })}
                </div>
                <div>
                  <p style={s.statusSectionLabel}>Próximos passos</p>
                  {renderMultiline(update.next_steps, { ...s.statusText, margin: '0 0 2px' })}
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

          <div style={s.footer}>
            <p style={s.footerText}>Grupo Flamboyant · Tecnologia da Informação</p>
            <p style={s.footerText}>Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </>
  )
}