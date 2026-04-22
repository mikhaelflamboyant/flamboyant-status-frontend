import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { projectsService } from '../services/projects.service'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'

const AREAS = [
  'Administração Pessoal','Agropecuária','Arquitetura','Comercial','Conservação',
  'Contabilidade','Controladoria','Engenharia','Financeiro','Incorporação','Instituto',
  'Inovação','Jurídico','Legalização','Manutenção','Marketing Coorporativo',
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
  const [approvingId, setApprovingId] = useState(null)
  const [form, setForm] = useState({
    area: '', business_unit: '', priority: 3, go_live: '',
    go_live_undefined: false, responsible_id: '', execution_type: 'INTERNA',
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
    if (!form.area || !form.business_unit || !form.priority) {
      alert('Preencha área, unidade de negócio e prioridade.')
      return
    }
    setSaving(true)
    try {
      await projectsService.approveFreshservice(id, form)
      setApprovingId(null)
      setForm({ area: '', business_unit: '', priority: 3, go_live: '', go_live_undefined: false, responsible_id: '', execution_type: 'INTERNA' })
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
                        onClick={() => setApprovingId(req.id)}
                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-800 transition-colors font-medium"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
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
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Área <span className="text-red-400">*</span></p>
                      <select value={form.area} onChange={e => setForm(f => ({...f, area: e.target.value}))} className={selectCls}>
                        <option value="">Selecionar</option>
                        {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
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
                      <p className="text-xs text-gray-400 mb-1">Prioridade <span className="text-red-400">*</span></p>
                      <select value={form.priority} onChange={e => setForm(f => ({...f, priority: parseInt(e.target.value)}))} className={selectCls}>
                        {[1,2,3,4,5].map(p => <option key={p} value={p}>Prioridade {p}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Go-live</p>
                      {!form.go_live_undefined && (
                        <input type="date" value={form.go_live} onChange={e => setForm(f => ({...f, go_live: e.target.value}))} className={selectCls} />
                      )}
                      <label className="flex items-center gap-2 mt-1 cursor-pointer">
                        <input type="checkbox" checked={form.go_live_undefined} onChange={e => setForm(f => ({...f, go_live_undefined: e.target.checked, go_live: ''}))} className="w-3 h-3 accent-primary-600" />
                        <span className="text-xs text-gray-400">Sem previsão</span>
                      </label>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Responsável</p>
                      <select value={form.responsible_id} onChange={e => setForm(f => ({...f, responsible_id: e.target.value}))} className={selectCls}>
                        <option value="">Selecionar</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.area}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={saving}
                      className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50 font-medium"
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