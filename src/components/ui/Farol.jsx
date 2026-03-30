const CONFIG = {
  VERDE: {
    dot:   'bg-teal-400',
    text:  'text-teal-600',
    label: 'No prazo',
    bg:    'bg-teal-50',
  },
  AMARELO: {
    dot:   'bg-amber-400',
    text:  'text-amber-600',
    label: 'Atenção',
    bg:    'bg-amber-50',
  },
  VERMELHO: {
    dot:   'bg-danger-400',
    text:  'text-danger-600',
    label: 'Atrasado',
    bg:    'bg-danger-50',
  },
}

export function Farol({ value, hideLabel = false, size = 'md' }) {
  const config = CONFIG[value] || CONFIG.VERDE

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'

  if (hideLabel) {
    return <div className={`${dotSize} rounded-full ${config.dot} flex-shrink-0 mt-0.5`} />
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full ${config.bg}`}>
      <div className={`${dotSize} rounded-full ${config.dot} flex-shrink-0`} />
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </div>
  )
}