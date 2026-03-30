export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-gray-500 mb-0.5 block">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`h-9 w-full px-3 text-sm border rounded-lg outline-none bg-white transition-colors
          focus:border-primary-600 focus:ring-2 focus:ring-primary-600/10
          disabled:bg-gray-50 disabled:cursor-not-allowed placeholder:text-gray-300
          ${error ? 'border-red-400' : 'border-gray-200'}
        `}
      />
      {hint && !error && <span className="text-xs text-gray-400">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}