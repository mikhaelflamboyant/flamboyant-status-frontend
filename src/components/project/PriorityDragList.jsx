import { useState } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { ProjectCard } from './ProjectCard'

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" />
      <circle cx="15" cy="6" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="15" cy="18" r="1.6" />
    </svg>
  )
}

function Row({ project, index, page, dragging }) {
  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging } = useDraggable({ id: project.id })
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: project.id })

  const style = {
    position: 'relative',
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.9 : 1,
  }

  return (
    <div ref={dropRef}>
      {isOver && !isDragging && (
        <div className="h-0.5 bg-primary-600 rounded-full -mb-0.5 relative">
          <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-primary-600" />
        </div>
      )}
      <div ref={dragRef} style={style}>
        <div
          className={`absolute right-full top-0 h-full mr-2 flex items-center gap-1 transition-opacity ${
            dragging ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
          }`}
        >
          <span className={`text-xs font-medium tabular-nums ${isDragging ? 'text-primary-600' : 'text-gray-400'}`}>
            {index + 1}
          </span>
          <div
            {...listeners}
            {...attributes}
            title="Arrastar para reordenar"
            onClick={e => e.stopPropagation()}
            className={`w-5 h-7 flex items-center justify-center rounded select-none cursor-grab active:cursor-grabbing ${
              isDragging ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <GripIcon />
          </div>
        </div>
        <div className={isDragging ? 'rounded-xl ring-1 ring-primary-600 shadow-lg' : ''}>
          <ProjectCard project={project} page={page} />
        </div>
      </div>
    </div>
  )
}

export function PriorityDragList({ projects, page = 1, onOrderChange }) {
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const from = projects.findIndex(p => p.id === active.id)
    const to = projects.findIndex(p => p.id === over.id)
    if (from === -1 || to === -1) return

    const next = [...projects]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onOrderChange(next)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-col gap-2.5">
        {projects.map((p, i) => (
          <div key={p.id} className="group/row relative">
            <Row project={p} index={i} page={page} dragging={!!activeId} />
          </div>
        ))}
      </div>
    </DndContext>
  )
}

export function PriorityHint({ userName }) {
  return (
    <div className="flex items-center gap-2 mb-4 px-3.5 py-2.5 rounded-lg bg-primary-50 border border-primary-100">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary-800">
        <polyline points="8 6 12 2 16 6" /><line x1="12" y1="2" x2="12" y2="22" /><polyline points="8 18 12 22 16 18" />
      </svg>
      <p className="text-xs text-primary-800">
        Filtrado por <strong className="font-semibold">{userName}</strong>. Arraste os projetos pela alça para definir sua ordem de prioridade: ela vale apenas para a sua visualização.
      </p>
    </div>
  )
}