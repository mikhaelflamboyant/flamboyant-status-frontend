export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
}) {
  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-800 border-transparent font-medium',
    secondary: 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
    ghost:     'bg-transparent text-primary-600 border-transparent hover:bg-primary-50',
    danger:    'bg-red-500 text-white border-transparent hover:bg-red-600',
}

  const sizes = {
    sm: 'h-7 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-5 text-sm',
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}