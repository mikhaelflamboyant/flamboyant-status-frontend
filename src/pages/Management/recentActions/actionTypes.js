import {
  Plus, Trash2, Ban, FileBarChart2, ListChecks, ClipboardList,
  CalendarRange, GitCompareArrows, Percent, CheckCircle2,
} from 'lucide-react'

export const ACTION_TONES = {
  create:  { badge: 'bg-teal-50 text-teal-700',       value: 'bg-teal-50 text-teal-700' },
  edit:    { badge: 'bg-primary-50 text-primary-700', value: 'bg-primary-50 text-primary-700' },
  delete:  { badge: 'bg-red-50 text-red-700',         value: 'bg-red-50 text-red-700' },
  phase:   { badge: 'bg-amber-50 text-amber-700',     value: 'bg-teal-50 text-teal-700' },
  neutral: { badge: 'bg-gray-100 text-gray-500',      value: 'bg-primary-50 text-primary-700' },
}

export const ACTION_TYPES = {
  PROJECT_CREATED:          { label: 'Projeto criado',      sentence: 'criou o projeto',                           Icon: Plus,             tone: 'create' },
  PROJECT_EDITED:           { label: 'Projeto editado',     sentence: 'editou o projeto',                          Icon: FileBarChart2,    tone: 'edit' },
  PROJECT_DELETED:          { label: 'Projeto excluído',    sentence: 'excluiu o projeto',                         Icon: Trash2,           tone: 'delete' },
  PROJECT_CANCELLED:        { label: 'Projeto cancelado',   sentence: 'cancelou o projeto',                        Icon: Ban,              tone: 'delete' },
  PROJECT_PHASE_CHANGED:    { label: 'Fase alterada',       sentence: 'alterou a fase de',                         Icon: GitCompareArrows, tone: 'phase',   hasTransition: true },
  PROJECT_PROGRESS_CHANGED: { label: 'Percentual alterado', sentence: 'alterou a conclusão de',                    Icon: Percent,          tone: 'neutral', hasTransition: true },

  STATUS_CREATED: { label: 'Status report cadastrado', sentence: 'cadastrou um status report em', Icon: FileBarChart2, tone: 'create' },
  STATUS_UPDATED: { label: 'Status report editado',    sentence: 'editou um status report em',    Icon: FileBarChart2, tone: 'edit' },
  STATUS_DELETED: { label: 'Status report excluído',   sentence: 'excluiu um status report em',   Icon: FileBarChart2, tone: 'delete' },

  TASK_CREATED:   { label: 'Tarefa cadastrada', sentence: 'cadastrou uma tarefa em', Icon: ListChecks,   tone: 'create' },
  TASK_UPDATED:   { label: 'Tarefa editada',    sentence: 'editou uma tarefa em',    Icon: ListChecks,   tone: 'edit' },
  TASK_COMPLETED: { label: 'Tarefa concluída',  sentence: 'concluiu uma tarefa em',  Icon: CheckCircle2, tone: 'create' },
  TASK_DELETED:   { label: 'Tarefa excluída',   sentence: 'excluiu uma tarefa em',   Icon: ListChecks,   tone: 'delete' },

  REQUIREMENT_CREATED: { label: 'Requisitos cadastrados', sentence: 'cadastrou requisitos em', Icon: ClipboardList, tone: 'create' },
  REQUIREMENT_UPDATED: { label: 'Requisitos editados',    sentence: 'editou requisitos em',    Icon: ClipboardList, tone: 'edit' },

  SCOPE_CREATED: { label: 'Atividade de cronograma criada',  sentence: 'cadastrou uma atividade de cronograma em', Icon: CalendarRange, tone: 'create' },
  SCOPE_UPDATED: { label: 'Atividade de cronograma editada', sentence: 'editou uma atividade de cronograma em',    Icon: CalendarRange, tone: 'edit' },
}

export const ACTION_TYPE_KEYS = Object.keys(ACTION_TYPES)

export function getActionType(actionType) {
  return ACTION_TYPES[actionType] ?? {
    label: actionType,
    sentence: 'realizou uma ação em',
    Icon: ListChecks,
    tone: 'neutral',
  }
}

const PHASE_LABELS_SHORT = {
  RECEBIDA: 'Recebida', ENTREVISTA_SOLICITANTE: 'Entrevista', LEVANTAMENTO_REQUISITOS: 'Levantamento',
  ANALISE_SOLUCAO: 'Análise', DESENVOLVIMENTO: 'Desenvolvimento', TESTES: 'Testes',
  VALIDACAO_SOLICITANTE: 'Validação', ENTREGUE: 'Entregue', SUPORTE: 'Suporte', BACKLOG: 'Backlog', CANCELADO: 'Cancelado',
}

export function formatTransitionValue(value) {
  if (!value) return ''
  return PHASE_LABELS_SHORT[value] || value
}