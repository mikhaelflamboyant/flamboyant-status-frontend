import { useNavigate, useLocation } from 'react-router-dom'
import { Farol } from '../ui/Farol'
import { Badge, AreaBadge, ComplexityBadge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { LEVEL_CONFIG } from '../../utils/pdfStyles'

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

const FAROL_COLOR = {
  VERDE: 'green',
  AMARELO: 'amber',
  VERMELHO: 'red',
}

export function ProjectCard({ project, page = 1 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const progressColor = FAROL_COLOR[project.traffic_light] || 'primary'
  const goLive = project.go_live
    ? new Date(project.go_live).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    : 'Sem previsão'

  const lastStatusAt = project.status_updates?.[0]?.created_at
  const daysSinceStatus = lastStatusAt
    ? Math.floor((new Date() - new Date(lastStatusAt)) / (1000 * 60 * 60 * 24))
    : null

  const noStatusDays = daysSinceStatus !== null && daysSinceStatus >= 7 ? daysSinceStatus : null

  return (
    <div
      onClick={() => navigate(`/projetos/${project.id}`, { state: { from: location.pathname + location.search, page } })}
      className="bg-white border border-gray-100 rounded-xl px-5 py-4 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Farol value={project.traffic_light} hideLabel />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
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
              {noStatusDays !== null && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  noStatusDays >= 14
                    ? 'bg-danger-50 text-danger-600'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Sem status há {noStatusDays}d
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <AreaBadge area={project.area} />
              {project.business_unit && <Badge variant="violet">{project.business_unit}</Badge>}
              <Badge variant="gray">
                {project.execution_type === 'INTERNA' ? 'Interna' : 'Fornecedor externo'}
              </Badge>
              {project.level && (
                <span
                  style={{ background: LEVEL_CONFIG[project.level]?.bg, color: LEVEL_CONFIG[project.level]?.text }}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                >
                  {LEVEL_CONFIG[project.level]?.label}
                </span>
              )}
              <ComplexityBadge value={project.complexity} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 min-w-110px">
          <ProgressBar value={project.completion_pct} color={progressColor} />
          <span className="text-xs text-gray-400">Go-live: {goLive}</span>
          {lastStatusAt && (
            <span className={`text-xs ${noStatusDays !== null ? (noStatusDays >= 14 ? 'text-danger-400' : 'text-amber-400') : 'text-gray-300'}`}>
              Atualizado: {new Date(lastStatusAt).toLocaleDateString('pt-BR')}
            </span>
          )}
          {!lastStatusAt && project.updated_at && (
            <span className="text-xs text-gray-300">
              Atualizado: {new Date(project.updated_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

      </div>
    </div>
  )
}