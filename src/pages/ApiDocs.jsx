import { useState, useEffect } from 'react'
import { Navbar } from '../components/layout/Navbar'
import { apitokenService } from '../services/apitoken.service'
import { useAuth } from '../hooks/useAuth'

const BASE_URL = 'https://sua-api.flamboyant.com.br'

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
  const [tokens, setTokens] = useState([])
  const [newTokenName, setNewTokenName] = useState('')
  const [newToken, setNewToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchTokens()
  }, [])

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
            <p className="text-xs text-gray-400 text-center py-8">Nenhum token gerado ainda.</p>
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
        </Section>

      </div>
    </div>
  )
}