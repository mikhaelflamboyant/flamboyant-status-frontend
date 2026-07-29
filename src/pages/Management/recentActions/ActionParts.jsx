import { ArrowRight } from 'lucide-react'
import { ACTION_TONES, getActionType, formatTransitionValue } from './actionTypes'
import { getUserInitials } from './formatActionTime'

export function UserAvatar({ user, sizePx = 26 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white bg-primary-600"
      style={{ width: sizePx, height: sizePx, fontSize: sizePx <= 26 ? 10.5 : 11.5 }}
      title={user.name}
    >
      {getUserInitials(user.name)}
    </span>
  )
}

export function ActionBadge({ actionType, sizePx = 32 }) {
  const { Icon, tone } = getActionType(actionType)
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg ${ACTION_TONES[tone].badge}`}
      style={{ width: sizePx, height: sizePx }}
    >
      <Icon size={sizePx >= 32 ? 16 : 14} />
    </span>
  )
}

export function ActionTransition({ action }) {
  const { tone } = getActionType(action.action_type)
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-500">
        {formatTransitionValue(action.previous_value)}
      </span>
      <ArrowRight size={12} className="shrink-0 text-gray-300" />
      <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${ACTION_TONES[tone].value}`}>
        {formatTransitionValue(action.new_value)}
      </span>
    </div>
  )
}

export function ActionSentence({ action }) {
  const { sentence } = getActionType(action.action_type)
  return (
    <span className="text-sm leading-snug text-gray-700">
      <span className="font-semibold text-gray-800">{action.user.name}</span>{' '}
      {sentence}{' '}
      <span className="font-medium text-primary-700">{action.project_name || 'projeto removido'}</span>
    </span>
  )
}