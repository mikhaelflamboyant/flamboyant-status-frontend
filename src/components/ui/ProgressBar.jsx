const COLORS = {
  primary: 'bg-primary-600',
  green:   'bg-teal-400',
  amber:   'bg-amber-400',
  red:     'bg-danger-400',
}

export function ProgressBar({ value = 0, color = 'primary', showLabel = true }) {
  const safeValue = Math.min(100, Math.max(0, value))

  const barColor = color === 'auto'
    ? safeValue >= 70
      ? COLORS.green
      : safeValue >= 40
        ? COLORS.amber
        : COLORS.red
    : COLORS[color] || COLORS.primary

  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 min-w-32px text-right tabular-nums">
          {safeValue}%
        </span>
      )}
    </div>
  )
}