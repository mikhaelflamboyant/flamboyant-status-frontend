import jsPDF from 'jspdf'
import {
  COLORS, PAGE, FONTS, FAROL_CONFIG, PHASE_LABELS,
  formatDate, formatCurrency, getPersonName, getPersonArea
} from './pdfStyles'

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

export class PDFRenderer {
  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    this.y = PAGE.marginTop
    this.pageIndex = 0
    this.pageNumberPositions = []
    this.headerDrawn = false
    this.logoImageData = null
    this._noFooterPages = new Set()
  }

  get spaceLeft() {
    return PAGE.contentBottom - this.y
  }

  needsSpace(height) {
    return this.y + height > PAGE.contentBottom
  }

  addPage() {
    this._drawFooter()
    this.doc.addPage()
    this.pageIndex++
    this.y = PAGE.marginTop
    this._drawHeader()
  }

  ensureSpace(height) {
    if (this.needsSpace(height)) {
      this.addPage()
    }
  }

  async startDocument() {
    this.pageIndex = 0
    this.logoImageData = await this._loadImage(`${window.location.origin}/logo_fundo_vermelho.png`)
    this._drawHeader()
    this.headerDrawn = true
  }

  finishDocument() {
    this._drawFooter()
    this._fillPageNumbers()
  }

  save(filename) {
    this.finishDocument()
    this.doc.save(filename)
  }

  _drawHeader() {
    const doc = this.doc
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth

    if (this.logoImageData) {
      doc.addImage(this.logoImageData, 'PNG', 0, 0, PAGE.width, 34)
    } else {
      doc.setFillColor(...hexToRgb(COLORS.brand))
      doc.rect(0, 0, PAGE.width, 22, 'F')
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...hexToRgb(COLORS.brandLight))
      doc.text('FLAMBOYANT', x + 4, 14)
    }

    this.y = 38
    doc.setDrawColor(...hexToRgb(COLORS.borderLight))
    doc.setLineWidth(0.3)
    doc.line(x, this.y, x + w, this.y)

    this.y += 1
    doc.setFontSize(FONTS.tiny)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...hexToRgb(COLORS.textLight))
    doc.text('Tecnologia da Informação', x, this.y + 3)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, x + w, this.y + 3, { align: 'right' })

    this.y += 10
  }

  _drawFooter() {
    if (this._noFooterPages.has(this.pageIndex)) return

    const doc = this.doc
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const fy = PAGE.height - 14

    doc.setDrawColor(...hexToRgb(COLORS.borderLight))
    doc.setLineWidth(0.3)
    doc.line(x, fy, x + w, fy)

    doc.setFontSize(FONTS.tiny)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...hexToRgb(COLORS.textLight))
    doc.text('Grupo Flamboyant · Tecnologia da Informação', x, fy + 4)
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, x + w, fy + 4, { align: 'right' })

    this.pageNumberPositions.push({ pageIndex: this.pageIndex, y: fy + 8 })
  }

  _fillPageNumbers() {
    const total = this.pageIndex + 1
    for (const pos of this.pageNumberPositions) {
      this.doc.setPage(pos.pageIndex + 1)
      this.doc.setFontSize(FONTS.tiny)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(...hexToRgb(COLORS.textLight))
      this.doc.text(`Página ${pos.pageIndex + 1} de ${total}`, PAGE.width / 2, pos.y, { align: 'center' })
    }
  }

  _setFont(size, style = 'normal', color = COLORS.text) {
    this.doc.setFontSize(size)
    this.doc.setFont('helvetica', style)
    this.doc.setTextColor(...hexToRgb(color))
  }

  _roundedRect(x, y, w, h, r, fillColor, strokeColor) {
    if (fillColor) this.doc.setFillColor(...hexToRgb(fillColor))
    if (strokeColor) {
      this.doc.setDrawColor(...hexToRgb(strokeColor))
      this.doc.setLineWidth(0.4)
    }
    const mode = fillColor && strokeColor ? 'FD' : fillColor ? 'F' : 'S'
    this.doc.roundedRect(x, y, w, h, r, r, mode)
  }

  _lines(text, maxWidth, fontSize) {
    this.doc.setFontSize(fontSize)
    return this.doc.splitTextToSize(text || '', maxWidth)
  }

  _textH(text, maxWidth, fontSize) {
    return this._lines(text, maxWidth, fontSize).length * (fontSize * 0.4)
  }

  _writeLines(text, x, maxWidth, fontSize, style = 'normal', color = COLORS.text) {
    this._setFont(fontSize, style, color)
    const lines = this._lines(text, maxWidth, fontSize)
    const lh = fontSize * 0.4
    for (const line of lines) {
      this.doc.text(line, x, this.y)
      this.y += lh
    }
    return lines.length * lh
  }

  _divider() {
    const x = PAGE.marginLeft
    this.doc.setDrawColor(...hexToRgb(COLORS.borderLight))
    this.doc.setLineWidth(0.3)
    this.doc.line(x, this.y, x + PAGE.contentWidth, this.y)
    this.y += 6
  }

  _loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        c.getContext('2d').drawImage(img, 0, 0)
        resolve(c.toDataURL('image/png'))
      }
      img.onerror = () => resolve(null)
      img.src = src
    })
  }

  drawProjectHeader(project) {
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const farol = FAROL_CONFIG[project.traffic_light] || FAROL_CONFIG.VERDE

    this.y += 3
    this._setFont(FONTS.title, 'bold', COLORS.text)
    const titleLines = this._lines(project.title, w - 40, FONTS.title)
    for (const line of titleLines) {
      this.doc.text(line, x, this.y)
      this.y += FONTS.title * 0.45
    }
    this.y += 3

    const parts = [
      project.area,
      project.business_unit,
      project.execution_type === 'INTERNA' ? 'Interna' : 'Fornecedor externo',
      `Prioridade ${project.priority || 3}`,
    ].filter(Boolean)

    this._setFont(FONTS.small, 'normal', COLORS.textMuted)
    this.doc.text(parts.join(' · '), x, this.y)

    const farolLabel = farol.label
    const farolTextW = this.doc.getTextWidth(farolLabel)
    const farolX = x + w - farolTextW - 6
    this.doc.setFillColor(...hexToRgb(farol.color))
    this.doc.circle(farolX, this.y - 1.2, 1.8, 'F')
    this._setFont(FONTS.small, 'bold', farol.color)
    this.doc.text(farolLabel, farolX + 4, this.y)
    this.y += 8
  }

  drawDescription(text) {
    if (!text) return
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const inner = w - 10

    const textH = this._textH(text, inner, FONTS.body)
    const blockH = textH + 14
    this.ensureSpace(blockH)

    this._roundedRect(x, this.y, w, blockH, 3, COLORS.bgLight, COLORS.borderLight)

    this.y += 5
    this._setFont(FONTS.label, 'bold', COLORS.textLight)
    this.doc.text('DESCRIÇÃO', x + 5, this.y)
    this.y += 5

    this._writeLines(text, x + 5, inner, FONTS.body, 'normal', COLORS.textMuted)
    this.y += 8
  }

  drawInfoGrid(project) {
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const halfW = (w - 5) / 2
    const pad = 5
    const rx = x + halfW + 5

    const solicitantes = project.requesters?.filter(r => r.type === 'SOLICITANTE') || []
    const responsaveis = project.requesters?.filter(r => r.type === 'RESPONSAVEL') || []

    const personH = (list) => {
      if (list.length === 0) return 16
      let h = 8
      for (const r of list) {
        h += 5
        if (getPersonArea(r)) h += 4
        h += 1
      }
      return Math.max(16, h)
    }

    const solH = personH(solicitantes)
    const respH = personH(responsaveis)
    const row1H = Math.max(solH, respH)

    this.ensureSpace(row1H + 25)

    this._roundedRect(x, this.y, halfW, row1H, 3, COLORS.bgLight, COLORS.borderLight)
    this._roundedRect(rx, this.y, halfW, row1H, 3, COLORS.bgLight, COLORS.borderLight)

    let cy = this.y + pad
    this._setFont(FONTS.label, 'bold', COLORS.textLight)
    this.doc.text('SOLICITANTE(S)', x + pad, cy)
    cy += 5
    if (solicitantes.length > 0) {
      for (const r of solicitantes) {
        this._setFont(FONTS.body, 'bold', COLORS.text)
        this.doc.text(getPersonName(r), x + pad, cy)
        cy += 4
        const area = getPersonArea(r)
        if (area) {
          this._setFont(FONTS.tiny, 'normal', COLORS.textMuted)
          this.doc.text(area, x + pad, cy)
          cy += 4
        }
        cy += 1
      }
    } else {
      this._setFont(FONTS.body, 'normal', COLORS.textMuted)
      this.doc.text('—', x + pad, cy)
    }

    cy = this.y + pad
    this._setFont(FONTS.label, 'bold', COLORS.textLight)
    this.doc.text('RESPONSÁVEL(IS)', rx + pad, cy)
    cy += 5
    if (responsaveis.length > 0) {
      for (const r of responsaveis) {
        this._setFont(FONTS.body, 'bold', COLORS.text)
        this.doc.text(getPersonName(r), rx + pad, cy)
        cy += 4
        const area = getPersonArea(r)
        if (area) {
          this._setFont(FONTS.tiny, 'normal', COLORS.textMuted)
          this.doc.text(area, rx + pad, cy)
          cy += 4
        }
        cy += 1
      }
    } else {
      this._setFont(FONTS.body, 'normal', COLORS.textMuted)
      this.doc.text('—', rx + pad, cy)
    }

    this.y += row1H + 4

    const row2H = 16
    this._roundedRect(x, this.y, halfW, row2H, 3, COLORS.bgLight, COLORS.borderLight)
    this._roundedRect(rx, this.y, halfW, row2H, 3, COLORS.bgLight, COLORS.borderLight)

    cy = this.y + pad
    this._setFont(FONTS.label, 'bold', COLORS.textLight)
    this.doc.text('GO-LIVE', x + pad, cy)
    this._setFont(FONTS.body, 'bold', COLORS.text)
    this.doc.text(formatDate(project.go_live), x + pad, cy + 6)

    this._setFont(FONTS.label, 'bold', COLORS.textLight)
    this.doc.text('FASE ATUAL', rx + pad, cy)
    this._setFont(FONTS.body, 'bold', COLORS.text)
    this.doc.text(PHASE_LABELS[project.current_phase] || project.current_phase || '—', rx + pad, cy + 6)

    this.y += row2H + 6
  }

  drawCosts(project) {
    if (!project.costs || project.costs.length === 0) return
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const blockH = 12 + project.costs.length * 7

    this.ensureSpace(blockH)
    this._roundedRect(x, this.y, w, blockH, 3, COLORS.bgLight, COLORS.borderLight)

    let cy = this.y + 5
    this._setFont(FONTS.label, 'bold', COLORS.textLight)
    this.doc.text('CUSTOS', x + 5, cy)
    cy += 6

    for (const cost of project.costs) {
      this._setFont(FONTS.body, 'bold', COLORS.text)
      this.doc.text(cost.name, x + 5, cy)

      this._setFont(FONTS.tiny, 'normal', COLORS.textMuted)
      this.doc.text(`Plan: R$ ${formatCurrency(cost.budget_planned)}`, x + 75, cy)

      if (cost.budget_actual != null) {
        const over = Number(cost.budget_actual) > Number(cost.budget_planned)
        this._setFont(FONTS.tiny, 'bold', over ? COLORS.red : COLORS.green)
        this.doc.text(`Real: R$ ${formatCurrency(cost.budget_actual)}`, x + 125, cy)
      }
      cy += 6
    }
    this.y += blockH + 6
  }

  drawProgressBar(project) {
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const pct = project.completion_pct || 0
    const farol = FAROL_CONFIG[project.traffic_light] || FAROL_CONFIG.VERDE

    this.ensureSpace(14)

    this._setFont(FONTS.small, 'normal', COLORS.textMuted)
    this.doc.text('Conclusão', x, this.y)
    this._setFont(FONTS.small, 'bold', COLORS.text)
    this.doc.text(`${pct}%`, x + w, this.y, { align: 'right' })
    this.y += 4

    this.doc.setFillColor(...hexToRgb(COLORS.borderLight))
    this.doc.roundedRect(x, this.y, w, 3, 1.5, 1.5, 'F')

    const fillW = Math.max(4, (pct / 100) * w)
    this.doc.setFillColor(...hexToRgb(farol.color))
    this.doc.roundedRect(x, this.y, fillW, 3, 1.5, 1.5, 'F')

    this.y += 6
  }

  drawStatusReports(statusUpdates) {
    if (!statusUpdates || statusUpdates.length === 0) return

    this.ensureSpace(12)
    this._setFont(FONTS.section, 'bold', COLORS.text)
    this.doc.text('Status reports', PAGE.marginLeft, this.y)
    this.y += 7

    for (const update of statusUpdates) {
      this._drawStatusCard(update)
    }
  }

  _drawStatusCard(update) {
    const x = PAGE.marginLeft
    const w = PAGE.contentWidth
    const pad = 6
    const innerW = w - pad * 2

    const meta = `${formatDate(update.created_at)} · ${update.author?.name || 'Sem autor'}`
    const highlights = (update.highlights || '').split('\n').filter(l => l.trim())
    const nextSteps = (update.next_steps || '').split('\n').filter(l => l.trim())
    const risks = update.risks || []

    const blocks = []

    const descLines = this._lines(update.description || '', innerW, FONTS.body)
    blocks.push({
      type: 'meta_desc',
      meta,
      descLines,
      height: 8 + 5 + descLines.length * (FONTS.body * 0.4) + 5,
    })

    const maxItems = Math.max(highlights.length, nextSteps.length)
    if (maxItems > 0) {
      const itemW = (innerW - 6) / 2 - 9
      let gridH = 7
      for (let i = 0; i < maxItems; i++) {
        const hlH = highlights[i] ? this._textH(highlights[i], itemW, FONTS.body) + 3 : 0
        const nsH = nextSteps[i] ? this._textH(nextSteps[i], itemW, FONTS.body) + 3 : 0
        gridH += Math.max(hlH, nsH, FONTS.body * 0.4 + 3)
      }
      blocks.push({ type: 'grid_full', highlights, nextSteps, height: gridH })
    }

    if (risks.length > 0) {
      blocks.push({ type: 'risk_header', height: 8 })
      for (const risk of risks) {
        const tH = this._textH(risk.title, innerW - 14, FONTS.body)
        const dH = this._textH(risk.description, innerW - 14, FONTS.tiny)
        const mH = this._textH('Mitigação: ' + risk.mitigation, innerW - 14, FONTS.tiny)
        blocks.push({ type: 'risk_item', risk, height: tH + dH + mH + 10 })
      }
    }

    const closeCard = (cardStartY) => {
      const cardH = this.y - cardStartY + 4
      this.doc.setDrawColor(...hexToRgb(COLORS.border))
      this.doc.setLineWidth(0.4)
      this.doc.roundedRect(x, cardStartY, w, cardH, 3, 3, 'S')
      this.y += 4
    }

    let cardOpen = false
    let cardStartY = 0
    let continuation = false

    for (let bi = 0; bi < blocks.length; bi++) {
      const block = blocks[bi]
      const extra = cardOpen ? 0 : 8
      const needed = block.height + extra

      const minSpace = block.type === 'grid_full' ? 20 : needed + 6
      if (this.needsSpace(minSpace)) {
        if (cardOpen) closeCard(cardStartY)
        this.addPage()
        continuation = true
        cardOpen = false
      }

      if (!cardOpen) {
        if (continuation) {
          this.doc.setFillColor(...hexToRgb(COLORS.contBg))
          const contText = `continuação — ${meta}`
          this._setFont(FONTS.tiny, 'bold', COLORS.contText)
          const contW = this.doc.getTextWidth(contText) + 8
          this.doc.roundedRect(x, this.y, contW, 5.5, 1.5, 1.5, 'F')
          this.doc.text(contText, x + 4, this.y + 4)
          this.y += 8
        }
        cardStartY = this.y
        this.y += 3
        cardOpen = true
        this._gridCardStartY = cardStartY
      }

      if (block.type === 'meta_desc') this._renderMetaDesc(block, x, pad, innerW)
      else if (block.type === 'grid_full') this._renderGrid(block.highlights, block.nextSteps, 0, 0, true, x, pad, innerW, meta, closeCard, () => { cardStartY = this.y; this.y += 3; cardOpen = true })
      else if (block.type === 'risk_header') this._renderRiskHeader(x, pad, innerW)
      else if (block.type === 'risk_item') this._renderRiskItem(block, x, pad, innerW)
    }

    if (cardOpen) closeCard(cardStartY)
    this.y += 4
  }

  _renderMetaDesc(block, x, pad, innerW) {
    this.y += 2
    this._setFont(FONTS.small, 'normal', COLORS.textLight)
    this.doc.text(block.meta, x + pad, this.y)
    this.y += 7

    this._setFont(FONTS.label, 'bold', COLORS.textMuted)
    this.doc.text('STATUS GERAL', x + pad, this.y)
    this.y += 4

    const lh = FONTS.body * 0.4
    this._setFont(FONTS.body, 'normal', COLORS.text)
    for (const line of block.descLines) {
      this.doc.text(line, x + pad, this.y)
      this.y += lh
    }
    this.y += 4
  }

  _renderGrid(hl, ns, hlStart, nsStart, isFirst, x, pad, innerW, meta, closeCard, openCard) {
    const halfW = (innerW - 6) / 2
    const leftX = x + pad
    const rightX = x + pad + halfW + 6
    const itemW = halfW - 9

    const drawHeaders = (isCont) => {
      this._setFont(FONTS.label, 'bold', COLORS.textMuted)
      this.doc.text(isCont ? 'DESTAQUES DO PERÍODO (cont.)' : 'DESTAQUES DO PERÍODO', leftX, this.y)
      this.doc.text(isCont ? 'PRÓXIMOS PASSOS (cont.)' : 'PRÓXIMOS PASSOS', rightX, this.y)
      this.y += 5
    }

    drawHeaders(!isFirst)

    const maxItems = Math.max(hl.length, ns.length)

    for (let i = 0; i < maxItems; i++) {
      const hlText = hl[i] || ''
      const nsText = ns[i] || ''

      const hlH = hlText ? this._textH(hlText, itemW, FONTS.body) + 3 : 0
      const nsH = nsText ? this._textH(nsText, itemW, FONTS.body) + 3 : 0
      const rowH = Math.max(hlH, nsH, FONTS.body * 0.4 + 3)

      if (this.needsSpace(rowH + 6)) {
        this.y += 2
        if (this._gridCardStartY > 0) closeCard(this._gridCardStartY)
        this.addPage()

        this.doc.setFillColor(...hexToRgb(COLORS.contBg))
        const contText = `continuação — ${meta}`
        this._setFont(FONTS.tiny, 'bold', COLORS.contText)
        const contW = this.doc.getTextWidth(contText) + 8
        this.doc.roundedRect(x, this.y, contW, 5.5, 1.5, 1.5, 'F')
        this.doc.text(contText, x + 4, this.y + 4)
        this.y += 8

        openCard()
        this._gridCardStartY = this.y - 3

        drawHeaders(true)
      }

      const rowStartY = this.y
      let leftY = rowStartY
      let rightY = rowStartY

      if (hlText) leftY = this._numberedItem(leftX, rowStartY, hlStart + i + 1, hlText, itemW)
      if (nsText) rightY = this._numberedItem(rightX, rowStartY, nsStart + i + 1, nsText, itemW)

      this.y = Math.max(leftY, rightY)
    }

    this.y += 3
  }

  _numberedItem(colX, itemY, num, text, maxW) {
    this.doc.setFillColor(...hexToRgb(COLORS.badge))
    this.doc.roundedRect(colX, itemY - 3.2, 5.5, 4.5, 1.2, 1.2, 'F')
    this._setFont(FONTS.tiny, 'bold', '#ffffff')
    this.doc.text(String(num), colX + 2.75, itemY, { align: 'center' })

    this._setFont(FONTS.body, 'normal', COLORS.text)
    const lines = this._lines(text, maxW, FONTS.body)
    const lh = FONTS.body * 0.4
    let ty = itemY
    for (const line of lines) {
      this.doc.text(line, colX + 8, ty)
      ty += lh
    }
    return ty + 3
  }

  _renderRiskHeader(x, pad, innerW) {
    this.doc.setDrawColor(...hexToRgb(COLORS.borderLight))
    this.doc.setLineWidth(0.2)
    this.doc.line(x + pad, this.y, x + pad + innerW, this.y)
    this.y += 4

    this._setFont(FONTS.label, 'bold', COLORS.textMuted)
    this.doc.text('RISCOS', x + pad, this.y)
    this.y += 5
  }

  _renderRiskItem(block, x, pad, innerW) {
    const risk = block.risk
    const riskX = x + pad
    const riskW = innerW
    const textX = riskX + 8
    const textW = riskW - 12

    this._roundedRect(riskX, this.y - 1, riskW, block.height, 2.5, COLORS.redBg, null)

    this.doc.setFillColor(...hexToRgb(COLORS.red))
    this.doc.circle(riskX + 4, this.y + 2, 1.2, 'F')

    this._setFont(FONTS.body, 'bold', COLORS.text)
    const tLines = this._lines(risk.title, textW, FONTS.body)
    for (const line of tLines) {
      this.doc.text(line, textX, this.y + 2)
      this.y += FONTS.body * 0.4
    }
    this.y += 2

    this._setFont(FONTS.tiny, 'normal', COLORS.textMuted)
    const dLines = this._lines(risk.description, textW, FONTS.tiny)
    for (const line of dLines) {
      this.doc.text(line, textX, this.y)
      this.y += FONTS.tiny * 0.4
    }
    this.y += 2

    this._setFont(FONTS.tiny, 'bold', COLORS.redMit)
    const mLines = this._lines('Mitigação: ' + risk.mitigation, textW, FONTS.tiny)
    for (const line of mLines) {
      this.doc.text(line, textX, this.y)
      this.y += FONTS.tiny * 0.4
    }
    this.y += 4
  }

  async drawFullProject(project, statusUpdates) {
    this.drawProjectHeader(project)
    this.drawDescription(project.description)
    this.drawInfoGrid(project)
    this.drawCosts(project)
    this.drawProgressBar(project)
    this._divider()
    this.drawStatusReports(statusUpdates)
  }

  async drawSeparatorPage(unitName, imgPath) {
    if (this.headerDrawn) {
      if (!this._isSeparatorPage) this._drawFooter()
      this.doc.addPage()
      this.pageIndex++
      this._noFooterPages.add(this.pageIndex)
    }
    this._isSeparatorPage = true

    if (imgPath) {
      try {
        const img = await this._loadImage(imgPath)
        if (img) {
          this.doc.addImage(img, 'PNG', 0, 0, PAGE.width, PAGE.height)
          this.headerDrawn = true
          this.y = PAGE.marginTop
          return
        }
      } catch (e) {}
    }

    this.doc.setFillColor(...hexToRgb(COLORS.brand))
    this.doc.rect(0, 0, PAGE.width, PAGE.height, 'F')

    this.doc.setFontSize(32)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 255, 255)
    this.doc.text(unitName, PAGE.width / 2, PAGE.height / 2 - 5, { align: 'center' })

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(...hexToRgb(COLORS.brandMuted))
    this.doc.text('Status report · Grupo Flamboyant', PAGE.width / 2, PAGE.height / 2 + 10, { align: 'center' })

    this.headerDrawn = true
    this.y = PAGE.marginTop
  }

  async drawStaticPage(imgPath) {
    this._noFooterPages.add(this.pageIndex)
    try {
      const img = await this._loadImage(imgPath)
      if (img) this.doc.addImage(img, 'PNG', 0, 0, PAGE.width, PAGE.height)
    } catch (e) {}
  }

  startNewProject() {
    if (this.headerDrawn) {
      this._drawFooter()
      this.doc.addPage()
      this.pageIndex++
    }
    this.y = PAGE.marginTop
    this._drawHeader()
    this.headerDrawn = true
    this._isSeparatorPage = false
  }
}