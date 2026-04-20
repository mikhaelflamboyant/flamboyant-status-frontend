import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Input } from '../components/ui/Input'
import { CostSelector } from '../components/project/CostSelector'
import { PeopleSelector } from '../components/project/PeopleSelector'
import { projectsService } from '../services/projects.service'
// import { MarkdownEditor } from '../components/ui/MarkdownEditor'
import api from '../services/api'

export default function NewProject() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    title: '',
    area: '',
    execution_type: 'INTERNA',
    priority: null,
    description: '',
    start_date: '',
    go_live: '',
    go_live_undefined: false,
    business_unit: '',
  })
  const [requesters, setRequesters] = useState([])
  const [responsibles, setResponsibles] = useState([])
  const [members, setMembers] = useState([])
  const [costs, setCosts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users')
        setUsers(response.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchUsers()
  }, [])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || (!form.go_live && !form.go_live_undefined) || !form.priority || !form.business_unit) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    if (requesters.length === 0) {
      setError('Adicione pelo menos um solicitante.')
      return
    }

    if (responsibles.length === 0) {
      setError('Adicione pelo menos um responsável.')
      return
    }

    if (form.execution_type === 'FORNECEDOR_EXTERNO' && costs.length === 0) {
      setError('Projetos com fornecedor externo precisam ter pelo menos um custo cadastrado.')
      return
    }

    const area = requesters.map(r => r.area).join(', ')

    setLoading(true)
    try {
      const data = {
        ...form,
        go_live: form.go_live_undefined ? null : form.go_live,
        area,
        priority: parseInt(form.priority),
        requester_ids: requesters.filter(r => !String(r.user_id).startsWith('manual_')).map(r => r.user_id),
        requester_names: requesters.filter(r => String(r.user_id).startsWith('manual_')).map(r => ({ name: r.name, area: r.area })),
        responsible_ids: responsibles.filter(r => !String(r.user_id).startsWith('manual_')).map(r => r.user_id),
        responsible_names: responsibles.filter(r => String(r.user_id).startsWith('manual_')).map(r => ({ name: r.name, area: r.area })),
        member_ids: members.filter(m => !String(m.user_id).startsWith('manual_')).map(m => m.user_id),
        member_names: members.filter(m => String(m.user_id).startsWith('manual_')).map(m => ({ name: m.name, area: m.area })),
        owner_id: responsibles.find(r => !String(r.user_id).startsWith('manual_'))?.user_id || null,
        costs,
      }
      const response = await projectsService.create(data)
      navigate(`/projetos/${response.data.id}`, { replace: true })
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

      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium text-gray-900">Novo projeto</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/projetos')}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              ← Projetos
            </button>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500">Novo projeto</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6">

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* IDENTIFICAÇÃO */}
            <div className="flex flex-col gap-3">
              <hr className="border-gray-100" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Identificação</p>

              <Input
                label="Título do projeto"
                placeholder="Ex: Integração ERP — módulo financeiro"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                required
              />

              <PeopleSelector
                label="Solicitante"
                required
                users={users}
                selected={requesters}
                onChange={setRequesters}
                buttonLabel="+ Adicionar solicitante"
                excluded={[...responsibles, ...members]}
              />

              <PeopleSelector
                label="Responsável"
                required
                users={users}
                selected={responsibles}
                onChange={setResponsibles}
                buttonLabel="+ Adicionar responsável"
                excluded={[...requesters, ...members]}
              />

              <PeopleSelector
                label="Outros envolvidos"
                users={users}
                selected={members}
                onChange={setMembers}
                buttonLabel="+ Adicionar envolvido"
                allowEmptyStart
                excluded={[...requesters, ...responsibles]}
              />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Unidade de negócio <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.business_unit}
                  onChange={e => handleChange('business_unit', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Selecionar unidade</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Urbanismo">Urbanismo</option>
                  <option value="Agropecuária">Agropecuária</option>
                  <option value="Instituto">Instituto</option>
                </select>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* DESCRIÇÃO */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Descrição</p>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Tipo de execução <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.execution_type}
                    onChange={e => handleChange('execution_type', e.target.value)}
                    className={selectCls}
                  >
                    <option value="INTERNA">Interna</option>
                    <option value="FORNECEDOR_EXTERNO">Fornecedor externo</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Data de início</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => handleChange('start_date', e.target.value)}
                    className="h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Go-live (prazo de entrega) {!form.go_live_undefined && <span className="text-red-400">*</span>}
                  </label>
                  {!form.go_live_undefined && (
                    <input
                      type="date"
                      value={form.go_live}
                      onChange={e => handleChange('go_live', e.target.value)}
                      className="h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700"
                    />
                  )}
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.go_live_undefined}
                      onChange={e => {
                        handleChange('go_live_undefined', e.target.checked)
                        if (e.target.checked) handleChange('go_live', '')
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 accent-primary-600"
                    />
                    <span className="text-xs text-gray-400">Sem previsão</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Prioridade <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(p => {
                    const isSelected = form.priority === p
                    const bgs = { 1: '#EAF3DE', 2: '#EAF3DE', 3: '#FAEEDA', 4: '#FCEBEB', 5: '#FCEBEB' }
                    const colors = { 1: '#27500A', 2: '#27500A', 3: '#633806', 4: '#791F1F', 5: '#791F1F' }
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

            <hr className="border-gray-100" />

            {/* CUSTOS FINANCEIROS */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Custos financeiros</p>
              <CostSelector costs={costs} onChange={setCosts} />
            </div>

            {error && (
              <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/projetos')}
                style={{ minWidth: '120px' }}
                className="text-xs font-medium text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 py-2 rounded-lg transition-colors text-center flex items-center justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ minWidth: '120px' }}
                className="text-xs font-medium bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors text-center flex items-center justify-center"
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