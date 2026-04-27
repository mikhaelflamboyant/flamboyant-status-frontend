export const COLORS = {
  brand: '#7a1a1a',
  brandLight: '#f5c4b3',
  brandMuted: '#f1948a',
  brandDark: '#962d2d',
  text: '#111827',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  bg: '#ffffff',
  bgLight: '#f9fafb',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  green: '#1D9E75',
  greenBg: '#E1F5EE',
  greenText: '#085041',
  amber: '#EF9F27',
  amberBg: '#FAEEDA',
  amberText: '#854F0B',
  red: '#E24B4A',
  redBg: '#FEF2F2',
  redText: '#A32D2D',
  redMit: '#0F6E56',
  badge: '#A32D2D',
  purpleBg: '#EEEDFE',
  purpleText: '#3C3489',
  contBg: '#E6F1FB',
  contText: '#185FA5',
}

export const FAROL_CONFIG = {
  VERDE: { label: 'No prazo', color: COLORS.green, bg: COLORS.greenBg, text: COLORS.greenText },
  AMARELO: { label: 'Atenção', color: COLORS.amber, bg: COLORS.amberBg, text: COLORS.amberText },
  VERMELHO: { label: 'Atrasado', color: COLORS.red, bg: COLORS.redBg, text: COLORS.redText },
}

export const PHASE_LABELS = {
  RECEBIDA: 'Recebida',
  ENTREVISTA_SOLICITANTE: 'Entrevista com o solicitante',
  LEVANTAMENTO_REQUISITOS: 'Levantamento de requisitos',
  ANALISE_SOLUCAO: 'Análise da solução',
  DESENVOLVIMENTO: 'Desenvolvimento',
  TESTES: 'Testes',
  VALIDACAO_SOLICITANTE: 'Validação com o solicitante',
  ENTREGUE: 'Entregue',
  SUPORTE: 'Suporte pós go-live',
}

export const SEPARATOR_IMAGES = {
  'Shopping': '/shopping_nova_pdf.png',
  'Instituto': '/instituto_pdf.png',
  'Urbanismo': '/urbanismo_pdf.png',
  'Agropecuária': '/agropecuaria_pdf.png',
}

export const FONTS = {
  title: 16,
  subtitle: 13,
  section: 12,
  body: 10,
  small: 9,
  tiny: 8,
  label: 8,
}

export const PAGE = {
  width: 210,
  height: 297,
  marginLeft: 16,
  marginRight: 16,
  marginTop: 12,
  marginBottom: 18,
  get contentWidth() { return this.width - this.marginLeft - this.marginRight },
  get contentBottom() { return this.height - this.marginBottom },
}

export const LEVEL_CONFIG = {
  A: { label: 'A — Estratégico', bg: '#EEEDFE', text: '#26215C' },
  B: { label: 'B — Performance (ROI)', bg: '#E6F1FB', text: '#042C53' },
  C: { label: 'C — Compliance', bg: '#FAEEDA', text: '#412402' },
  D: { label: 'D — Inovação e transformação digital', bg: '#E1F5EE', text: '#04342C' },
}

export const LEVEL_OPTIONS = [
  { value: 'A', label: 'A — Estratégico', description: 'Projetos que contribuem diretamente para os objetivos estratégicos do Grupo Flamboyant.' },
  { value: 'B', label: 'B — Performance (ROI)', description: 'Projetos com maior potencial de geração de valor, economia de custos ou aumento de receita.' },
  { value: 'C', label: 'C — Compliance', description: 'Conformidade com exigências legais e regulatórias, considerando riscos de não execução.' },
  { value: 'D', label: 'D — Inovação e transformação digital', description: 'Iniciativas que promovem inovação, automação e modernização tecnológica.' },
]

export const BUSINESS_UNITS = ['Corporativo', 'Shopping', 'Urbanismo', 'Agropecuária', 'Instituto', 'Sem unidade']

export function formatDate(date) {
  if (!date) return 'Sem previsão'
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function getPersonName(r) {
  return r?.user?.name || r?.manual_name || '—'
}

export function getPersonArea(r) {
  return r?.user?.area || r?.manual_area || ''
}