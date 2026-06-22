import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Input } from '../components/ui/Input'
import { LevelSelector } from '../components/project/LevelSelector'
import { CostSelector } from '../components/project/CostSelector'
import { PeopleSelector } from '../components/project/PeopleSelector'
import { projectsService } from '../services/projects.service'
import api from '../services/api'

export default function EditProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = location.state?.from || '/projetos'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    execution_type: 'INTERNA',
    level: '',
    description: '',
    start_date: '',
    start_date_undefined: false,
    go_live: '',
    go_live_undefined: false,
    business_unit: '',
    requested_at: '',
  })
  const [requesters, setRequesters] = useState([])
  const [responsibles, setResponsibles] = useState([])
  const [members, setMembers] = useState([])
  const [costs, setCosts] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const [projectRes, usersRes] = await Promise.all([
          projectsService.getById(id),
          api.get('/users')
        ])
        const p = projectRes.data
        setUsers(usersRes.data)
        setForm({
          title: p.title || '',
          execution_type: p.execution_type || 'INTERNA',
          level: p.level || '',
          description: p.description || '',
          start_date: p.start_date ? p.start_date.split('T')[0] : '',
          start_date_undefined: !p.start_date,
          go_live: p.go_live ? p.go_live.split('T')[0] : '',
          go_live_undefined: !p.go_live,
          business_unit: p.business_unit || '',
          requested_at: p.requested_at ? p.requested_at.split('T')[0] : '',
        })
        setRequesters(p.requesters
          ?.filter(r => r.type === 'SOLICITANTE')
          .map(r => ({
            user_id: r.user_id || `manual_${r.id}`,
            name: r.user?.name || r.manual_name,
            area: r.user?.area || r.manual_area,
          })) || [])
        setResponsibles(p.requesters
          ?.filter(r => r.type === 'RESPONSAVEL')
          .map(r => ({
            user_id: r.user_id || `manual_${r.id}`,
            name: r.user?.name || r.manual_name,
            area: r.user?.area || r.manual_area,
          })) || [])
        setMembers(p.members?.map(m => ({
          user_id: m.user_id || `manual_${m.id}`,
          name: m.user?.name || m.manual_name,
          area: m.user?.area || m.manual_area,
        })) || [])
        setCosts(p.costs?.map(c => ({
          name: c.name,
          budget_planned: c.budget_planned != null
            ? Number(c.budget_planned).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '',
          budget_actual: c.budget_actual != null
            ? Number(c.budget_actual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '',
        })) || [])
      } catch (err) {
        setError('Erro ao carregar projeto.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || (!form.go_live && !form.go_live_undefined) || !form.level || !form.business_unit) {
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

    const area = requesters.map(r => r.area).join(', ')

    setSaving(true)
    try {
      await projectsService.update(id, {
        ...form,
        go_live: form.go_live_undefined ? null : form.go_live,
        requested_at: form.requested_at || null,
        area,
        level: form.level,
        requester_ids: requesters.filter(r => !String(r.user_id).startsWith('manual_')).map(r => r.user_id),
        requester_names: requesters.filter(r => String(r.user_id).startsWith('manual_')).map(r => ({ name: r.name, area: r.area })),
        responsible_ids: responsibles.filter(r => !String(r.user_id).startsWith('manual_')).map(r => r.user_id),
        responsible_names: responsibles.filter(r => String(r.user_id).startsWith('manual_')).map(r => ({ name: r.name, area: r.area })),
        member_ids: members.filter(m => !String(m.user_id).startsWith('manual_')).map(m => m.user_id),
        member_names: members.filter(m => String(m.user_id).startsWith('manual_')).map(m => ({ name: m.name, area: m.area })),
        owner_id: responsibles.find(r => !String(r.user_id).startsWith('manual_'))?.user_id || null,
        costs: costs.map(c => ({
          name: c.name,
          budget_planned: parseFloat(
            String(c.budget_planned)
              .replace(/\.(?=\d{3}([.,]|$))/g, '')
              .replace(',', '.')
          ),
          budget_actual: c.budget_actual
            ? parseFloat(
                String(c.budget_actual)
                  .replace(/\.(?=\d{3}([.,]|$))/g, '')
                  .replace(',', '.')
              )
            : null,
        })),
      })
      navigate(`/projetos/${id}`, { state: { from: backTo } })
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar projeto.')
    } finally {
      setSaving(false)
    }
  }

  const selectCls = 'h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700'

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Carregando projeto...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-base font-medium text-gray-900">Editar projeto</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projetos/${id}`, { state: { from: backTo } })}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              ← Voltar ao projeto
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="flex flex-col gap-3">
              <hr className="border-gray-100" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Identificação</p>

              <Input
                label="Título do projeto"
                placeholder="Ex: Integração ERP - módulo financeiro"
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
                excluded={[...members]}
              />

              <PeopleSelector
                label="Responsável"
                required
                users={users}
                selected={responsibles}
                onChange={setResponsibles}
                buttonLabel="+ Adicionar responsável"
                excluded={[...members]}
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

            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Descrição</p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Complexidade do projeto
                </label>
                <select
                  value={form.complexity}
                  onChange={e => handleChange('complexity', e.target.value)}
                  className={selectCls}
                >
                  <option value="">Selecionar complexidade</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>

              <div className="grid grid-cols-4 gap-3">
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
                  {!form.start_date_undefined && (
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={e => handleChange('start_date', e.target.value)}
                      className="h-9 w-full px-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-600 transition-colors bg-white text-gray-700"
                    />
                  )}
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.start_date_undefined || false}
                      onChange={e => {
                        handleChange('start_date_undefined', e.target.checked)
                        if (e.target.checked) handleChange('start_date', '')
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 accent-primary-600"
                    />
                    <span className="text-xs text-gray-400">Não definida</span>
                  </label>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Data de solicitação</label>
                  <input
                    type="date"
                    value={form.requested_at}
                    onChange={e => handleChange('requested_at', e.target.value)}
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
                <label className="text-xs font-medium text-gray-500">Nível do projeto <span className="text-red-400">*</span></label>
                <LevelSelector value={form.level} onChange={(v) => setForm(f => ({...f, level: v}))} />
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
                onClick={() => navigate(`/projetos/${id}`, { state: { from: backTo } })}
                style={{ minWidth: '120px' }}
                className="text-xs font-medium text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 py-2 rounded-lg transition-colors text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ minWidth: '120px' }}
                className="text-xs font-medium bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors text-center"
              >
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}