import { useNavigate } from 'react-router-dom'
import { Farol } from '../ui/Farol'
import { Badge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'

const PHASE_LABELS = {
  RECEBIDA: 'Recebida',
  ENTREVISTA_SOLICITANTE: 'Entrevista',
  LEVANTAMENTO_REQUISITOS: 'Levantamento de requisitos',
  ANALISE_SOLUCAO: 'Análise da solução',
  DESENVOLVIMENTO: 'Desenvolvimento',
  TESTES: 'Testes',
  VALIDACAO_SOLICITANTE: 'Validação com solicitante',
  ENTREGUE: 'Entregue',
}

const PRIORITY_CONFIG = {
  1: { label: 'Prioridade 1', variant: 'green' },
  2: { label: 'Prioridade 2', variant: 'green' },
  3: { label: 'Prioridade 3', variant: 'amber' },
  4: { label: 'Prioridade 4', variant: 'red' },
  5: { label: 'Prioridade 5', variant: 'red' },
}

const FAROL_COLOR = {
  VERDE: 'green',
  AMARELO: 'amber',
  VERMELHO: 'red',
}

export function ProjectCard({ project }) {
  const navigate = useNavigate()
  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG[3]
  const progressColor = FAROL_COLOR[project.traffic_light] || 'primary'
  const goLive = project.go_live
    ? new Date(project.go_live).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : 'Sem previsão'

  return (
    <div
      onClick={() => navigate(`/projetos/${project.id}`)}
      className="bg-white border border-gray-100 rounded-xl px-5 py-4 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Farol value={project.traffic_light} hideLabel />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                {project.title}
              </p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); window.open(`/projetos/${project.id}`, '_blank') }}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-gray-400 hover:text-primary-600"
                title="Abrir em nova aba"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-gray-400">{project.area}</span>
              <span className="text-gray-200">·</span>
              <Badge variant="gray">{PHASE_LABELS[project.current_phase]}</Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 min-w-110px">
          <ProgressBar value={project.completion_pct} color={progressColor} />
          <span className="text-xs text-gray-400">Go-live: {goLive}</span>
          {project.updated_at && (
            <span className="text-xs text-gray-300">
              Atualizado: {new Date(project.updated_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

      </div>
    </div>
  )
}