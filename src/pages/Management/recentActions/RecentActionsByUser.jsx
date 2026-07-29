import { getActionType } from './actionTypes'
import { groupActionsByUser, formatRelativeTime } from './formatActionTime'
import { ActionBadge, ActionSentence, ActionTransition, UserAvatar } from './ActionParts'

export default function RecentActionsByUser({ actions }) {
  const buckets = groupActionsByUser(actions)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {buckets.map(({ user, actions: userActions }) => (
        <div key={user.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
            <UserAvatar user={user} sizePx={30} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-800">{user.name}</div>
              <div className="text-xs text-gray-400">{user.role_label}</div>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              {userActions.length}
            </span>
          </div>

          {userActions.map(action => (
            <div key={action.id} className="flex gap-2.5 border-b border-gray-100 px-4 py-2.5 last:border-b-0">
              <ActionBadge actionType={action.action_type} sizePx={28} />
              <div className="min-w-0 flex-1">
                <ActionSentence action={action} />
                {getActionType(action.action_type).hasTransition && <ActionTransition action={action} />}
                <span className="mt-0.5 block text-xs text-gray-400">
                  {formatRelativeTime(action.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}