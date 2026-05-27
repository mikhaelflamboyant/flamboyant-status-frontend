const BASE = 'text-xs px-2.5 py-1 rounded-full font-medium'

const VARIANTS = {
  gray:   `${BASE} bg-gray-100 text-gray-600`,
  purple: `${BASE} bg-primary-50 text-primary-800`,
  violet: `${BASE} bg-violet-100 text-violet-800`,
  green:  `${BASE} bg-teal-50 text-teal-800`,
  amber:  `${BASE} bg-amber-50 text-amber-800`,
  red:    `${BASE} bg-danger-50 text-danger-600`,
}

const AREA_COLORS = {
  'Tecnologia da Informação': `${BASE} bg-blue-50 text-blue-700`,
  'Controladoria':            `${BASE} bg-indigo-100 text-indigo-700`,
  'Pessoas e Cultura':        `${BASE} bg-pink-50 text-pink-700`,
  'Marketing Coorporativo':   `${BASE} bg-orange-100 text-orange-700`,
  'Jurídico':                 `${BASE} bg-sky-50 text-sky-700`,
  'Engenharia':               `${BASE} bg-yellow-100 text-yellow-800`,
  'Relacionamento':           `${BASE} bg-violet-100 text-violet-700`,
  'Segurança':                `${BASE} bg-slate-100 text-slate-600`,
  'Contabilidade':            `${BASE} bg-teal-50 text-teal-700`,
  'Family Office':            `${BASE} bg-yellow-50 text-yellow-800`,
  'Agropecuária':             `${BASE} bg-lime-100 text-lime-700`,
  'Incorporação':             `${BASE} bg-purple-50 text-purple-700`,
}

const COMPLEXITY_COLORS = {
  'Alta':  `${BASE} bg-red-100 text-red-600`,
  'Média': `${BASE} bg-amber-100 text-amber-600`,
  'Baixa': `${BASE} bg-emerald-100 text-emerald-700`,
}

export function Badge({ children, variant = 'gray' }) {
  return (
    <span className={VARIANTS[variant] || VARIANTS.gray}>
      {children}
    </span>
  )
}

export function AreaBadge({ area }) {
  if (!area) return null
  return (
    <span className={AREA_COLORS[area] || `${BASE} bg-gray-100 text-gray-600`}>
      {area}
    </span>
  )
}

export function ComplexityBadge({ value }) {
  if (!value) return null
  return (
    <span className={COMPLEXITY_COLORS[value] || `${BASE} bg-gray-100 text-gray-600`}>
      Complexidade: {value}
    </span>
  )
}