import { LEVEL_OPTIONS } from '../../utils/pdfStyles'

export function LevelSelector({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {LEVEL_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
            value === opt.value
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-100 hover:bg-gray-50'
          }`}
        >
          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
            value === opt.value ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
          }`}>
            {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-900">{opt.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}