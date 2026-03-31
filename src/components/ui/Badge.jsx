const VARIANTS = {
  gray:    'bg-gray-100 text-gray-600',
  purple:  'bg-primary-50 text-primary-800',
  violet:  'bg-violet-100 text-violet-800',
  green:   'bg-teal-50 text-teal-800',
  amber:   'bg-amber-50 text-amber-800',
  red:     'bg-danger-50 text-danger-600',
}

export function Badge({ children, variant = 'gray' }) {
  return (
    <span className={`badge ${VARIANTS[variant] || VARIANTS.gray}`}>
      {children}
    </span>
  )
}