import { useNavigate } from 'react-router-dom'
import { Farol } from '../ui/Farol'
import { ProgressBar } from '../ui/ProgressBar'
import { projectsService } from '../../services/projects.service'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'

const PHASES = [
  { key: 'RECEBIDA', label: 'Recebida', color: 'bg-gray-300' },
  { key: 'ENTREVISTA_SOLICITANTE', label: 'Entrevista', color: 'bg-primary-200' },
  { key: 'LEVANTAMENTO_REQUISITOS', label: 'Levantamento', color: 'bg-primary-200' },
  { key: 'ANALISE_SOLUCAO', label: 'Análise', color: 'bg-primary-200' },
  { key: 'DESENVOLVIMENTO', label: 'Desenvolvimento', color: 'bg-primary-600' },
  { key: 'TESTES', label: 'Testes', color: 'bg-primary-200' },
  { key: 'VALIDACAO_SOLICITANTE', label: 'Validação', color: 'bg-primary-200' },
  { key: 'ENTREGUE', label: 'Entregue', color: 'bg-teal-400' },
]

const FAROL_COLOR = {
  VERDE: 'green',
  AMARELO: 'amber',
  VERMELHO: 'red',
}

function KanbanCard({ project, isDragging }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: project.id })
  const progressColor = FAROL_COLOR[project.traffic_light] || 'primary'
  const goLive = new Date(project.go_live).toLocaleDateString('pt-BR')

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 50,
  } : {}

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && navigate(`/projetos/${project.id}`)}
      className={`w-full bg-white border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging ? 'opacity-40' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
    >
      <p className="text-xs font-medium text-gray-900 leading-snug mb-1 line-clamp-2">
        {project.title}
      </p>
      <p className="text-xs text-gray-400 mb-2 truncate">{project.area}</p>
      <ProgressBar value={project.completion_pct} color={progressColor} />
      <div className="flex items-center justify-between mt-2">
        <Farol value={project.traffic_light} hideLabel />
        <span className="text-xs text-gray-400">{goLive}</span>
      </div>
    </div>
  )
}

function KanbanCardOverlay({ project }) {
  const progressColor = FAROL_COLOR[project.traffic_light] || 'primary'
  const goLive = new Date(project.go_live).toLocaleDateString('pt-BR')

  return (
    <div className="bg-white border border-primary-300 rounded-xl p-3 shadow-lg w-45 rotate-1 cursor-grabbing">
      <p className="text-xs font-medium text-gray-900 leading-snug mb-1 line-clamp-2">
        {project.title}
      </p>
      <p className="text-xs text-gray-400 mb-2 truncate">{project.area}</p>
      <ProgressBar value={project.completion_pct} color={progressColor} />
      <div className="flex items-center justify-between mt-2">
        <Farol value={project.traffic_light} hideLabel />
        <span className="text-xs text-gray-400">{goLive}</span>
      </div>
    </div>
  )
}

function KanbanColumn({ phase, projects, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: phase.key })

  return (
    <div className="w-45 min-w-45 shrink-0">
      <div className={`h-0.5 w-full rounded-full mb-3 ${phase.color}`} />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 truncate">{phase.label}</span>
        <span className="text-xs text-gray-300 bg-gray-50 rounded-full px-2 py-0.5 ml-1 shrink-0">
          {projects.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-16 rounded-xl transition-colors p-1 -m-1 ${
          isOver ? 'bg-primary-50' : ''
        }`}
      >
        {projects.length === 0 && !isOver ? (
          <div className="h-16 w-full border border-dashed border-gray-200 rounded-xl" />
        ) : (
          projects.map(project => (
            <KanbanCard
              key={project.id}
              project={project}
              isDragging={activeId === project.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function ProjectKanban({ projects, onProjectUpdate }) {
  const [overrides, setOverrides] = useState({})
  const items = projects.map(p => overrides[p.id] ? { ...p, current_phase: overrides[p.id] } : p)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeProject = items.find(p => p.id === activeId)

  const handleDragStart = ({ active }) => {
    setActiveId(active.id)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)

    if (!over) return

    const project = items.find(p => p.id === active.id)
    const newPhase = over.id

    if (!project || project.current_phase === newPhase) return

    setOverrides(prev => ({ ...prev, [active.id]: newPhase }))

    try {
      await projectsService.update(active.id, { current_phase: newPhase })
      if (onProjectUpdate) onProjectUpdate()
    } catch (err) {
      setOverrides(prev => {
        const next = { ...prev }
        delete next[active.id]
        return next
    })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PHASES.map(phase => (
          <KanbanColumn
            key={phase.key}
            phase={phase}
            projects={items.filter(p => p.current_phase === phase.key)}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject ? <KanbanCardOverlay project={activeProject} /> : null}
      </DragOverlay>
    </DndContext>
  )
}