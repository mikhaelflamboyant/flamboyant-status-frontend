import { getActionType } from './actionTypes'
import { groupActionsByDay, formatRelativeTime } from './formatActionTime'
import { ActionBadge, ActionSentence, ActionTransition } from './ActionParts'

export default function RecentActionsTimeline({ actions }) {
  const dayBuckets = groupActionsByDay(actions)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      {dayBuckets.map(({ dayLabel, actions: dayActions }) => (
        <div key={dayLabel} className="border-b border-gray-100 last:border-b-0">
          <div className="flex items-center gap-2.5 border-b border-gray-100 bg-white px-4 py-2.5">
            <span className="text-xs font-bold text-gray-700">{dayLabel}</span>
            <span className="text-xs text-gray-400">
              {dayActions.length} {dayActions.length === 1 ? 'ação' : 'ações'}
            </span>
          </div>

          {dayActions.map(action => (
            <div key={action.id} className="flex gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50 transition-colors">
              <ActionBadge actionType={action.action_type} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2.5">
                  <div className="flex-1"><ActionSentence action={action} /></div>
                  <span className="shrink-0 text-xs whitespace-nowrap text-gray-400">
                    {formatRelativeTime(action.created_at)}
                  </span>
                </div>
                {getActionType(action.action_type).hasTransition && <ActionTransition action={action} />}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}