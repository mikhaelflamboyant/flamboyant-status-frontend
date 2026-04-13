import { useState, useEffect } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { apitokenService } from '../services/apitoken.service'
import { useAuth } from '../hooks/useAuth'

const BASE_URL = 'http://10.0.0.93:4000'

const CodeBlock = ({ code }) => (
  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{code}</pre>
  </div>
)

const Section = ({ title, children }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-6 mb-4">
    <h2 className="text-sm font-medium text-gray-900 mb-4">{title}</h2>
    {children}
  </div>
)

const EndpointRow = ({ method, path, description }) => {
  const colors = {
    GET: 'bg-teal-50 text-teal-800',
    POST: 'bg-blue-50 text-blue-800',
    DELETE: 'bg-red-50 text-red-600',
  }
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${colors[method]}`}>{method}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono text-gray-800">{path}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function ApiDocs() {
  const { user } = useAuth()
  const [tab, setTab] = useState('api')
  const [tokens, setTokens] = useState([])
  const [newTokenName, setNewTokenName] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tokenTab, setTokenTab] = useState('ativos')
  const [allTokens, setAllTokens] = useState([])
  const canSeeHistory = user?.area === 'Tecnologia da Informação' && ['ANALISTA_MASTER', 'GERENTE', 'COORDENADOR'].includes(user?.role)

  useEffect(() => {
    fetchTokens()
    if (canSeeHistory) fetchAllTokens()
    }, [])

    const fetchAllTokens = async () => {
        try {
        const res = await apitokenService.listAll()
        setAllTokens(res.data)
    } catch (err) {
        console.error(err)
    }
    }

  const fetchTokens = async () => {
    try {
      const res = await apitokenService.list()
      setTokens(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreate = async () => {
    if (!newTokenName) return
    setLoading(true)
    try {
      const res = await apitokenService.create(newTokenName)
      setNewToken(res.data.token)
      setNewTokenName('')
      fetchTokens()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (id) => {
    if (!confirm('Revogar este token? Esta ação não pode ser desfeita.')) return
    try {
      await apitokenService.revoke(id)
      fetchTokens()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-medium text-gray-900">API & Integrações</h1>
            <p className="text-xs text-gray-400 mt-0.5">Documentação e gerenciamento de tokens de acesso</p>
          </div>
        </div>

        <div className="flex gap-1 mb-5">
          <button
            onClick={() => setTab('api')}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === 'api' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            API & Tokens
          </button>
          {['ANALISTA_MASTER', 'ANALISTA_TESTADOR', 'GERENTE', 'COORDENADOR'].includes(user?.role) && (
            <button
              onClick={() => setTab('docs')}
              className={`text-xs px-4 py-2 rounded-lg font-medium transition-colors ${
                tab === 'docs' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              Documentação do sistema
            </button>
          )}
        </div>

        {tab === 'api' && (
          <>
            <Section title="Autenticação">
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                Todas as requisições à API pública precisam incluir um token de acesso no header <code className="bg-gray-100 px-1 rounded">Authorization</code>.
              </p>
              <CodeBlock code={`GET ${BASE_URL}/public/projects\nAuthorization: Bearer flb_seu_token_aqui`} />
            </Section>

            <Section title="Endpoints disponíveis">
              <EndpointRow method="GET" path="/public/projects" description="Lista todos os projetos ativos com status, tarefas e custos" />
              <EndpointRow method="GET" path="/public/projects/:id" description="Retorna detalhes completos de um projeto específico" />
              <EndpointRow method="GET" path="/public/projects/archived" description="Lista todos os projetos finalizados" />
            </Section>

            <Section title="Exemplo de resposta">
              <p className="text-xs text-gray-400 mb-3">GET /public/projects</p>
              <CodeBlock code={`[
  {
    "id": "uuid",
    "title": "Integração ERP — módulo financeiro",
    "area": "Controladoria",
    "traffic_light": "VERDE",
    "current_phase": "DESENVOLVIMENTO",
    "completion_pct": 60,
    "go_live": "2026-06-30T00:00:00.000Z",
    "requesters": [...],
    "costs": [...],
    "status_updates": [...],
    "tasks": [...]
  }
]`} />
            </Section>

            <Section title="Tokens de acesso">
  <div className="flex gap-1 mb-5">
    <button
      onClick={() => setTokenTab('ativos')}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
        tokenTab === 'ativos' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      Tokens ativos
    </button>
    {canSeeHistory && (
      <button
        onClick={() => setTokenTab('historico')}
        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
          tokenTab === 'historico' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        Histórico
      </button>
    )}
  </div>

  {tokenTab === 'ativos' && (
    <>
      <div className="mb-5">
        <p className="text-xs text-gray-500 mb-3">Gere um token para cada sistema ou pessoa que precisar acessar a API (ex: Power BI, scripts, etc.).</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome do token (ex: Power BI Denilton)"
            value={newTokenName}
            onChange={e => setNewTokenName(e.target.value)}
            className="flex-1 h-8 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-600"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !newTokenName}
            className="text-xs bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? 'Gerando...' : 'Gerar token'}
          </button>
        </div>
      </div>

      {newToken && (
        <div className="mb-5 p-4 bg-teal-50 border border-teal-100 rounded-xl">
          <p className="text-xs font-medium text-teal-800 mb-2">Token gerado — copie agora, ele não será exibido novamente!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-teal-900 bg-white px-3 py-2 rounded-lg border border-teal-200 break-all">{newToken}</code>
            <button
              onClick={() => handleCopy(newToken)}
              className="text-xs text-teal-700 border border-teal-300 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors shrink-0"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      {tokens.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">Nenhum token ativo.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 grid grid-cols-12 gap-4">
            <p className="col-span-4 text-xs font-medium text-gray-400">Nome</p>
            <p className="col-span-3 text-xs font-medium text-gray-400">Criado por</p>
            <p className="col-span-3 text-xs font-medium text-gray-400">Último uso</p>
            <p className="col-span-2 text-xs font-medium text-gray-400"></p>
          </div>
          {tokens.map((token, index) => (
            <div
              key={token.id}
              className={`px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors ${index !== tokens.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="col-span-4">
                <p className="text-xs font-medium text-gray-800">{token.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Criado em {new Date(token.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <p className="col-span-3 text-xs text-gray-600">{token.creator?.name}</p>
              <p className="col-span-3 text-xs text-gray-400">
                {token.last_used ? new Date(token.last_used).toLocaleDateString('pt-BR') : 'Nunca usado'}
              </p>
              <div className="col-span-2 flex justify-end">
                <button
                  onClick={() => handleRevoke(token.id)}
                  className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Revogar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )}

  {tokenTab === 'historico' && canSeeHistory && (
    <>
      {allTokens.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">Nenhum token registrado.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 grid grid-cols-12 gap-4">
            <p className="col-span-4 text-xs font-medium text-gray-400">Nome</p>
            <p className="col-span-3 text-xs font-medium text-gray-400">Criado por</p>
            <p className="col-span-3 text-xs font-medium text-gray-400">Data de criação</p>
            <p className="col-span-2 text-xs font-medium text-gray-400">Status</p>
          </div>
          {allTokens.map((token, index) => (
            <div
              key={token.id}
              className={`px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors ${index !== allTokens.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="col-span-4">
                <p className="text-xs font-medium text-gray-800">{token.name}</p>
              </div>
              <p className="col-span-3 text-xs text-gray-600">{token.creator?.name}</p>
              <p className="col-span-3 text-xs text-gray-400">{new Date(token.created_at).toLocaleDateString('pt-BR')}</p>
              <div className="col-span-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  token.active ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-600'
                }`}>
                  {token.active ? 'Ativo' : 'Revogado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )}
</Section>
          </>
        )}

        {tab === 'docs' && (
          <>
            <Section title="Visão geral do sistema">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">
                O <strong>Status Report</strong> é um sistema interno do Grupo Flamboyant desenvolvido pela equipe de Tecnologia da Informação para gerenciar e acompanhar projetos de TI. Ele centraliza informações sobre andamento, prazos, riscos e requisitos de cada projeto, permitindo que diferentes perfis da organização acompanhem o desenvolvimento de forma transparente.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                O sistema foi desenvolvido com backend em <strong>Node.js + Express + Prisma</strong>, banco de dados <strong>PostgreSQL</strong> hospedado internamente no servidor 10.0.0.93, e frontend em <strong>React + Vite + Tailwind CSS</strong>.
              </p>
            </Section>

            <Section title="Perfis de acesso">
              <div className="flex flex-col gap-3">
                {[
                  { role: 'Analista Master', color: 'bg-amber-50 text-amber-800', desc: 'Acesso total ao sistema. Vê todos os projetos de todas as áreas. Pode criar, editar e excluir qualquer projeto e tudo dentro deles. Gerencia usuários e tokens de API.' },
                  { role: 'Analista Testador', color: 'bg-orange-50 text-orange-800', desc: 'Acesso total ao sistema. Mesmas permissões do Analista Master. Perfil destinado a testes e validações do sistema.' },
                  { role: 'Superintendente', color: 'bg-violet-100 text-violet-800', desc: 'Vê projetos das áreas que coordena. Não acessa abas de API ou Usuários.' },
                  { role: 'Diretor', color: 'bg-purple-100 text-purple-800', desc: 'Vê projetos da sua área corporativa. Não acessa abas de API ou Usuários.' },
                  { role: 'Gerente', color: 'bg-primary-50 text-primary-800', desc: 'Gerentes de TI veem todos os projetos de todas as áreas e acessam as abas de Usuários e API. Gerentes de outras áreas veem apenas projetos da sua área.' },
                  { role: 'Coordenador', color: 'bg-blue-50 text-blue-800', desc: 'Coordenadores de TI veem todos os projetos de todas as áreas e acessam as abas de Usuários e API. Coordenadores de outras áreas veem apenas projetos da sua área.' },
                  { role: 'Supervisor', color: 'bg-teal-50 text-teal-800', desc: 'Vê projetos da sua área. Não acessa abas de API ou Usuários.' },
                  { role: 'Analista', color: 'bg-gray-100 text-gray-600', desc: 'Analistas de TI veem apenas projetos nos quais estão vinculados como solicitante, responsável ou outro envolvido. Analistas de outras áreas veem apenas projetos vinculados à sua área.' },
                ].map(p => (
                  <div key={p.role} className="flex items-start gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${p.color}`}>{p.role}</span>
                    <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Regras de projetos">
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Acesso geral', desc: 'Apenas usuários da área de Tecnologia da Informação podem criar, editar e excluir projetos e tudo dentro deles: tarefas, status reports, requisitos, farol, % de conclusão, fase, etc.' },
                  { label: 'Criar projeto', desc: 'Apenas usuários da área de Tecnologia da Informação podem criar projetos.' },
                  { label: 'Editar projeto', desc: 'Apenas solicitantes e responsáveis vinculados ao projeto podem editar. Analista Master e Analista Testador podem editar qualquer projeto.' },
                  { label: 'Excluir projeto', desc: 'Apenas solicitantes e responsáveis vinculados ao projeto podem excluir. Analista Master e Analista Testador podem excluir qualquer projeto.' },
                  { label: 'Abas API e Usuários', desc: 'Visíveis apenas para usuários da área de Tecnologia da Informação.' },
                  { label: 'Gestão de usuários', desc: 'Apenas Analista Master, Analista Testador, Gerente e Coordenador de TI podem visualizar, adicionar e excluir usuários.' },
                  { label: 'Farol automático', desc: 'Quando a data de go-live passa sem o projeto ser entregue, o farol muda automaticamente para vermelho.' },
                  { label: 'Arquivamento automático', desc: 'Projetos marcados como "Entregue" ou com 100% de conclusão são arquivados automaticamente.' },
                ].map(r => (
                  <div key={r.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-700 w-40 shrink-0">{r.label}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Notificações">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">O sistema gera notificações automáticas conforme o perfil do usuário:</p>
              <div className="flex flex-col gap-2">
                {[
                  { perfil: 'Analista', eventos: 'Vinculado a um projeto, projeto próximo do go-live, projeto atrasado, novo status report (apenas dos projetos vinculados).' },
                  { perfil: 'Gerente e Coordenador', eventos: 'Usuário pendente de aprovação, novo projeto na área, projeto próximo do go-live, projeto atrasado, novo status report (apenas da sua área).' },
                  { perfil: 'Analista Master, Analista Testador e Superintendente', eventos: 'Usuário pendente de aprovação, novo projeto criado, projeto próximo do go-live, projeto atrasado, novo status report (todas as áreas).' },
                ].map(n => (
                  <div key={n.perfil} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-700 w-48 shrink-0">{n.perfil}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{n.eventos}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Tarefas">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">As tarefas ficam dentro do detalhe de cada projeto e são visíveis apenas para usuários da Tecnologia da Informação.</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Criar e editar', desc: 'Apenas usuários de TI podem gerenciar tarefas. Analista Master, Analista Testador, Gerente e Coordenador de TI podem gerenciar tarefas de qualquer projeto. Analistas de TI só podem gerenciar tarefas de projetos vinculados.' },
                  { label: 'Concluir tarefa', desc: 'Apenas quem criou a tarefa pode marcá-la como concluída.' },
                  { label: 'Fase vinculada', desc: 'A fase da tarefa é definida automaticamente com base na fase atual do projeto no momento da criação.' },
                ].map(t => (
                  <div key={t.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-700 w-40 shrink-0">{t.label}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Requisitos de software">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">Os requisitos ficam dentro do detalhe de cada projeto e são visíveis apenas para usuários da Tecnologia da Informação.</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Criar e editar', desc: 'Apenas responsáveis do projeto e perfis privilegiados podem criar e editar requisitos.' },
                  { label: 'Histórico', desc: 'Cada edição gera um snapshot do conteúdo anterior com diff visual mostrando o que foi alterado.' },
                ].map(r => (
                  <div key={r.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-700 w-40 shrink-0">{r.label}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Integrações">
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Windows AD (LDAP)', desc: 'Login com conta corporativa do Windows AD (@grupoflamboyant.com.br). Usuários do grupo "projetos" no AD podem entrar diretamente na plataforma.' },
                  { label: 'FreshService', desc: 'Chamados aprovados no FreshService criam projetos automaticamente via webhook. A integração fica ativa após configuração no painel do FreshService.' },
                  { label: 'Azure AD (SSO)', desc: 'Login com conta Microsoft (@flamboyant.com.br). Configurado no Entra ID. Pendente de configuração de SSL/HTTPS no servidor para ativação completa.' },
                  { label: 'API pública', desc: 'Endpoints de leitura disponíveis para sistemas externos (Power BI, scripts, etc.) mediante token de acesso gerado nesta página.' },
                ].map(i => (
                  <div key={i.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-700 w-40 shrink-0">{i.label}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{i.desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Arquitetura técnica">
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Backend', desc: 'Node.js + Express + Prisma ORM. Roda na porta 4000. Autenticação via JWT com expiração de 7 dias.' },
                  { label: 'Frontend', desc: 'React + Vite + Tailwind CSS v4. Roda na porta 5173 em desenvolvimento.' },
                  { label: 'Banco de dados', desc: 'PostgreSQL interno hospedado no servidor 10.0.0.93. Gerenciado via Prisma Migrate.' },
                  { label: 'Repositórios', desc: 'Backend e frontend em repositórios separados no GitHub da organização Flamboyant.' },
                ].map(a => (
                  <div key={a.label} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-medium text-gray-700 w-40 shrink-0">{a.label}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

      </div>
    </div>
  )
}