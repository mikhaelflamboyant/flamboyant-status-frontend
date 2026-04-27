const PHASES = [
  { key: 'RECEBIDA', label: 'Recebida' },
  { key: 'ENTREVISTA_SOLICITANTE', label: 'Entrevista' },
  { key: 'LEVANTAMENTO_REQUISITOS', label: 'Requisitos' },
  { key: 'ANALISE_SOLUCAO', label: 'Análise' },
  { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento' },
  { key: 'TESTES', label: 'Testes' },
  { key: 'VALIDACAO_SOLICITANTE', label: 'Validação' },
  { key: 'ENTREGUE', label: 'Entregue' },
  { key: 'SUPORTE', label: 'Suporte' },
]

export function PhaseStrip({ currentPhase }) {
  const currentIndex = PHASES.findIndex(p => p.key === currentPhase)

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-100">
      {PHASES.map((phase, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div
            key={phase.key}
            className={`
              flex-1 py-1.5 px-1 text-center text-xs border-r border-gray-100 last:border-r-0 transition-colors
              ${isCurrent ? 'bg-primary-600 text-white font-medium' : ''}
              ${isDone ? 'bg-teal-50 text-teal-700' : ''}
              ${!isDone && !isCurrent ? 'bg-gray-50 text-gray-400' : ''}
            `}
          >
            {phase.label}
          </div>
        )
      })}
    </div>
  )
}