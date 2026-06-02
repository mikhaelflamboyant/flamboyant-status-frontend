import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { projectsService } from '../services/projects.service'
import { useAuth } from '../hooks/useAuth'
import { PeopleSelector } from '../components/project/PeopleSelector'
import { LevelSelector } from '../components/project/LevelSelector'
import { CostSelector } from '../components/project/CostSelector'
import api from '../services/api'

const AREAS = [
  'Administração Pessoal','Agropecuária','Arquitetura','Comercial','Conservação',
  'Contabilidade','Controladoria','Engenharia','Financeiro','Incorporação','Instituto',
  'Inovação','Jurídico','Legalização','Manutenção','Marketing Corporativo',
  'Marketing Institucional','Marketing Urbanismo','Pessoas e Cultura','Planejamento Financeiro',
  'Processos','Projetos Executivos','Relacionamento','Segurança','Suprimentos',
  'Tecnologia da Informação','Vendas',
]

export default function FreshServiceRequests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [requesters, setRequesters] = useState([])
  const [approvingId, setApprovingId] = useState(null)
  const [members, setMembers] = useState([])
  const [costs, setCosts] = useState([])
  const [form, setForm] = useState({
    title: '', area: '', business_unit: '', level: '', go_live: '',
    go_live_undefined: false, start_date: '', start_date_undefined: false,
    execution_type: 'INTERNA', description: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchRequests = async () => {
    try {
      const res = await projectsService.getFreshserviceRequests()
      setRequests(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    api.get('/users').then(r => setUsers(r.data)).catch(() => {})
  }, [])

  const handleApprove = async (id) => {
    if (!form.title || !form.business_unit || !form.level) {
      alert('Preencha título, unidade de negócio e nível do projeto.')
      return
    }
    setSaving(true)
    try {
      await projectsService.approveFreshservice(id, {
        ...form,
        requester_ids: requesters.filter(r => !String(r.user_id).startsWith('manual_')).map(r => r.user_id),
        requester_names: requesters.filter(r => String(r.user_id).startsWith('manual_')).map(r => ({ name: r.name, area: r.area })),
        member_ids: members.filter(m => !String(m.user_id).startsWith('manual_')).map(m => m.user_id),
        member_names: members.filter(m => String(m.user_id).startsWith('manual_')).map(m => ({ name: m.name, area: m.area })),
        costs: costs.map(c => ({
          name: c.name,
          budget_planned: parseFloat(String(c.budget_planned).replace(',', '.')),
          budget_actual: c.budget_actual ? parseFloat(String(c.budget_actual).replace(',', '.')) : null,
        })),
      })
      setApprovingId(null)
      setRequesters([])
      setMembers([])
      setCosts([])
      setForm({ title: '', area: '', business_unit: '', level: '', go_live: '', go_live_undefined: false, start_date: '', start_date_undefined: false, execution_type: 'INTERNA', description: '' })
      fetchRequests()
    } catch (err) {
      alert('Erro ao aprovar.')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Tem certeza que deseja rejeitar e remover esta solicitação?')) return
    try {
      await projectsService.rejectFreshservice(id)
      fetchRequests()
    } catch (err) {
      alert('Erro ao rejeitar.')
    }
  }

  const selectCls = 'h-8 w-full px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 bg-white'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900">Solicitações FreshService</h1>
            <p className="text-xs text-gray-400 mt-0.5">Projetos criados via chamado aguardando aprovação para entrar na esteira</p>
          </div>
          <button onClick={() => navigate('/projetos')} className="text-xs text-primary-600 hover:text-primary-800">
            ← Projetos
          </button>
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-16">Carregando...</p>}

        {!loading && requests.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Nenhuma solicitação pendente.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      #{req.freshservice_ticket_id}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h2 className="text-sm font-medium text-gray-900">{req.title}</h2>
                  <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap line-clamp-3">{req.description}</p>
                  {req.requesters?.filter(r => r.type === 'SOLICITANTE').length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Solicitante: <span className="font-medium text-gray-600">
                        {req.requesters.filter(r => r.type === 'SOLICITANTE').map(r => r.user?.name || r.manual_name).join(', ')}
                      </span>
                    </p>
                  )}
                  {req.requester_name && !req.requesters?.length && (
                    <p className="text-xs text-gray-400 mt-2">
                      Solicitante: <span className="font-medium text-gray-600">{req.requester_name}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {approvingId !== req.id && (
                    <>
                      <button
                        onClick={() => {
                          setApprovingId(req.id)
                          setForm(f => ({
                            ...f,
                            title: req.title || '',
                            description: req.description || '',
                          }))
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                        style={{ background: '#0F6E56', color: '#fff' }}
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: '#A32D2D', color: '#fff' }}
                      >
                        Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {approvingId === req.id && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <p className="text-xs font-medium text-gray-600 mb-3">Preencha as informações para aprovar</p>
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">Título do projeto <span className="text-red-400">*</span></p>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({...f, title: e.target.value}))}
                      placeholder="Título do projeto"
                      className={selectCls}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Unidade de negócio <span className="text-red-400">*</span></p>
                      <select value={form.business_unit} onChange={e => setForm(f => ({...f, business_unit: e.target.value}))} className={selectCls}>
                        <option value="">Selecionar</option>
                        {['Corporativo','Shopping','Urbanismo','Agropecuária','Instituto'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Tipo de execução</p>
                      <select value={form.execution_type} onChange={e => setForm(f => ({...f, execution_type: e.target.value}))} className={selectCls}>
                        <option value="INTERNA">Interna</option>
                        <option value="FORNECEDOR_EXTERNO">Fornecedor externo</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nível do projeto <span className="text-red-400">*</span></p>
                      <select value={form.level} onChange={e => setForm(f => ({...f, level: e.target.value}))} className={selectCls}>
                        <option value="">Selecionar</option>
                        <option value="A">A - Estratégico</option>
                        <option value="B">B - Performance (ROI)</option>
                        <option value="C">C - Compliance</option>
                        <option value="D">D - Inovação e transformação digital</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Data de início</p>
                      {!form.start_date_undefined && (
                        <input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} className={selectCls} />
                      )}
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={form.start_date_undefined || false}
                          onChange={e => setForm(f => ({...f, start_date_undefined: e.target.checked, start_date: ''}))}
                          className="w-3 h-3 accent-primary-600" />
                        <span className="text-xs text-gray-400">Não definida</span>
                      </label>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Go-live</p>
                      {!form.go_live_undefined && (
                        <input type="date" value={form.go_live} onChange={e => setForm(f => ({...f, go_live: e.target.value}))} className={selectCls} />
                      )}
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={form.go_live_undefined}
                          onChange={e => setForm(f => ({...f, go_live_undefined: e.target.checked, go_live: ''}))}
                          className="w-3 h-3 accent-primary-600" />
                        <span className="text-xs text-gray-400">Sem previsão</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 mb-3">
                    <PeopleSelector
                      label="Solicitante(s)"
                      users={users}
                      selected={requesters}
                      onChange={setRequesters}
                      buttonLabel="+ Adicionar solicitante"
                      allowEmptyStart
                    />
                    <PeopleSelector
                      label="Outros envolvidos"
                      users={users}
                      selected={members}
                      onChange={setMembers}
                      buttonLabel="+ Adicionar envolvido"
                      allowEmptyStart
                      excluded={requesters}
                    />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Descrição do projeto</p>
                      <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({...f, description: e.target.value}))}
                        rows={2}
                        placeholder="Descreva o projeto..."
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600 resize-none bg-white"
                      />
                    </div>
                    {form.execution_type === 'FORNECEDOR_EXTERNO' && (
                      <CostSelector costs={costs} onChange={setCosts} />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={saving}
                      className="text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                      style={{ background: '#0F6E56', color: '#fff' }}
                    >
                      {saving ? 'Salvando...' : 'Confirmar aprovação'}
                    </button>
                    <button
                      onClick={() => setApprovingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}