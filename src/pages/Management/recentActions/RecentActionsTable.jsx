import { getActionType, formatTransitionValue } from './actionTypes'
import { formatRelativeTime } from './formatActionTime'
import { ActionBadge, UserAvatar } from './ActionParts'

export default function RecentActionsTable({ actions }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {['Usuário', 'Ação', 'Projeto', 'Quando'].map(col => (
                <th key={col} className="border-b border-gray-200 bg-gray-50 px-3.5 py-2.5 text-left text-xs font-medium tracking-wide text-gray-400 uppercase">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.map(action => {
              const { label, hasTransition } = getActionType(action.action_type)
              return (
                <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border-b border-gray-100 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={action.user} />
                      <span className="font-medium text-gray-800">{action.user.name}</span>
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-3.5 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <ActionBadge actionType={action.action_type} sizePx={26} />
                      <span className="text-gray-700">
                        {label}
                        {hasTransition && (
                          <span className="text-gray-400">
                            {' '}· {formatTransitionValue(action.previous_value)} → {formatTransitionValue(action.new_value)}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-gray-100 px-3.5 py-2.5">
                    <span className="font-medium text-primary-700">
                      {action.project_name || (action.project_id ? 'projeto sem nome' : 'projeto removido')}
                    </span>
                  </td>
                  <td className="border-b border-gray-100 px-3.5 py-2.5 text-xs whitespace-nowrap text-gray-400">
                    {formatRelativeTime(action.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}