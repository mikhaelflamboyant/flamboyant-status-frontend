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
  const goLive = new Date(project.go_live).toLocaleDateString('pt-BR')

  return (
    <div
      onClick={() => navigate(`/projetos/${project.id}`)}
      className="bg-white border border-gray-100 rounded-xl px-5 py-4 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Farol value={project.traffic_light} hideLabel />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {project.title}
            </p>
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
        </div>

      </div>
    </div>
  )
}