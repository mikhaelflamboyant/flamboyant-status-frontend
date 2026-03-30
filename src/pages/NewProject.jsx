import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Input } from '../components/ui/Input'
import { projectsService } from '../services/projects.service'

const AREAS = [
  'RH', 'Jurídica', 'Agropecuária', 'Construção',
  'Contabilidade', 'Controladoria', 'Processos',
  'Depto. de Pessoas', 'Comitê Executivo', 'Outros'
]

export default function NewProject() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    area: '',
    requester_name: '',
    execution_type: 'INTERNA',
    priority: null,
    description: '',
    go_live: '',
    budget_planned: '',
    budget_actual: '',
  })

  const [hasBudget, setHasBudget] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.area || !form.requester_name || !form.description || !form.go_live || !form.priority) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)
    try {
      const data = {
        ...form,
        priority: parseInt(form.priority),
        budget_planned: hasBudget && form.budget_planned ? parseFloat(form.budget_planned) : null,
        budget_actual: hasBudget && form.budget_actual ? parseFloat(form.budget_actual) : null,
      }
      const response = await projectsService.create(data)
      navigate(`/projetos/${response.data.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar projeto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const selectCls = 'h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-6">

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/projetos')}
            className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
          >
            ← Projetos
          </button>
          <span className="text-xs text-gray-300">/</span>
          <span className="text-xs text-gray-500">Novo projeto</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <h1 className="text-base font-medium text-gray-900 mb-6">Novo projeto</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Identificação</p>
              <div className="flex flex-col gap-3">

                <Input
                  label="Título do projeto"
                  placeholder="Ex: Integração ERP — módulo financeiro"
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Área solicitante <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.area}
                      onChange={e => handleChange('area', e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="">Selecionar área</option>
                      {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <Input
                    label="Nome do solicitante"
                    placeholder="Ex: Carlos Mendes"
                    value={form.requester_name}
                    onChange={e => handleChange('requester_name', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-500">
                      Tipo de execução <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.execution_type}
                      onChange={e => handleChange('execution_type', e.target.value)}
                      className={selectCls}
                    >
                      <option value="INTERNA">Interna (equipe + n8n)</option>
                      <option value="FORNECEDOR_EXTERNO">Fornecedor externo</option>
                    </select>
                  </div>

                  <Input
                    label="Go-live (prazo de entrega)"
                    type="date"
                    value={form.go_live}
                    onChange={e => handleChange('go_live', e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Prioridade <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(p => {
                      const isSelected = form.priority === p
                      const colors = {
                        1: isSelected ? '#27500A' : '',
                        2: isSelected ? '#27500A' : '',
                        3: isSelected ? '#633806' : '',
                        4: isSelected ? '#791F1F' : '',
                        5: isSelected ? '#791F1F' : '',
                      }
                      const bgs = {
                        1: isSelected ? '#EAF3DE' : '',
                        2: isSelected ? '#EAF3DE' : '',
                        3: isSelected ? '#FAEEDA' : '',
                        4: isSelected ? '#FCEBEB' : '',
                        5: isSelected ? '#FCEBEB' : '',
                      }
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleChange('priority', form.priority === p ? null : p)}
                          style={isSelected ? { backgroundColor: bgs[p], color: colors[p], borderColor: colors[p] } : {}}
                          className="flex-1 py-2 text-sm rounded-lg border border-gray-200 text-gray-500 hover:border-primary-400 transition-colors"
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">1 = menor prioridade · 5 = maior prioridade</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Descrição <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={4}
                    placeholder="Descreva o contexto, escopo e objetivos do projeto..."
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none transition-colors placeholder:text-gray-300"
                    required
                  />
                </div>

              </div>
            </div>

            <div className="border-t border-gray-50 pt-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Orçamento</p>

              <label className="flex items-center gap-2.5 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={hasBudget}
                  onChange={e => setHasBudget(e.target.checked)}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-sm text-gray-600">Este projeto envolve custo com fornecedor externo</span>
              </label>

              {hasBudget && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Valor planejado (R$)"
                    type="number"
                    placeholder="0,00"
                    value={form.budget_planned}
                    onChange={e => handleChange('budget_planned', e.target.value)}
                  />
                  <Input
                    label="Valor realizado (R$)"
                    type="number"
                    placeholder="0,00"
                    value={form.budget_actual}
                    onChange={e => handleChange('budget_actual', e.target.value)}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
              <button
                type="button"
                onClick={() => navigate('/projetos')}
                className="text-xs text-gray-400 hover:text-gray-600 px-4 py-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="text-xs bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? 'Criando...' : 'Criar projeto'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}