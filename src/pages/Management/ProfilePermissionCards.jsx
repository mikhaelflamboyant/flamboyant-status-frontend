import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight, ChevronDown, Clock,
  LayoutDashboard, FolderKanban, CalendarRange, ListChecks, BookOpen,
  ClipboardList, FileBarChart2,
} from 'lucide-react';
import { getPermissions, revokePermission } from '../../services/permissions.service';

const PROFILES = [
  {
    id: 'ESTAGIARIO',
    name: 'Estagiário de TI',
    seal: 'requer aprovação',
    subtitle: 'Mesmas permissões do Analista, porém tudo que cria ou edita nasce pendente.',
    notes: [
      <>Tudo que o estagiário cria ou edita entra como <b className="font-semibold text-gray-600">pendente</b> e só passa a valer depois que o gestor aprova.</>,
      <>As permissões de criação e edição valem apenas <b className="font-semibold text-gray-600">em projetos onde é responsável ou membro</b>.</>,
    ],
    groups: [
      { label: 'Painel', Icon: LayoutDashboard, items: [
        { key: 'panel.personal', name: 'Acessar Painel Pessoal' },
      ] },
      { label: 'Projetos', Icon: FolderKanban, items: [
        { key: 'projects.create',  name: 'Criar projeto', description: 'Um coordenador de TI é vinculado automaticamente.' },
        { key: 'projects.edit',    name: 'Editar projeto' },
        { key: 'projects.delete',  name: 'Excluir projeto' },
      ] },
      { label: 'Requisitos', Icon: ClipboardList, items: [
        { key: 'requirements.create', name: 'Criar requisito de projeto' },
        { key: 'requirements.edit',   name: 'Editar requisito de projeto' },
      ] },
      { label: 'Cronograma', Icon: CalendarRange, items: [
        { key: 'schedule.view',   name: 'Visualizar itens do cronograma' },
        { key: 'schedule.create', name: 'Criar item de cronograma' },
        { key: 'schedule.edit',   name: 'Editar item de cronograma' },
        { key: 'schedule.delete', name: 'Excluir item de cronograma' },
      ] },
      { label: 'Tarefas', Icon: ListChecks, items: [
        { key: 'tasks.view',     name: 'Visualizar tarefas' },
        { key: 'tasks.create',   name: 'Criar tarefa' },
        { key: 'tasks.edit',     name: 'Editar tarefa' },
        { key: 'tasks.complete', name: 'Concluir tarefa' },
      ] },
      { label: 'Status report', Icon: FileBarChart2, items: [
        { key: 'status_report.create', name: 'Criar status report' },
        { key: 'status_report.edit',   name: 'Editar status report' },
        { key: 'status_report.delete', name: 'Excluir status report' },
      ] },
    ],
  },
  {
    id: 'ANALISTA',
    name: 'Analista de TI',
    subtitle: 'O que este perfil cria já vale na hora, sem passar por aprovação.',
    groups: [
      { label: 'Painel', Icon: LayoutDashboard, items: [
        { key: 'panel.personal', name: 'Acessar Painel Pessoal' },
      ] },
      { label: 'Projetos', Icon: FolderKanban, items: [
        { key: 'projects.create',  name: 'Criar projeto' },
        { key: 'projects.edit',    name: 'Editar projeto',  description: 'Onde é responsável ou solicitante.' },
        { key: 'projects.delete',  name: 'Excluir projeto', description: 'Onde é responsável ou solicitante.' },
        { key: 'projects.backlog', name: 'Consultar Backlog de projetos' },
      ] },
      { label: 'Requisitos', Icon: ClipboardList, items: [
        { key: 'requirements.create', name: 'Criar requisito de projeto' },
        { key: 'requirements.edit',   name: 'Editar requisito de projeto' },
      ] },
      { label: 'Cronograma', Icon: CalendarRange, items: [
        { key: 'schedule.view',   name: 'Visualizar itens do cronograma' },
        { key: 'schedule.create', name: 'Criar item de cronograma' },
        { key: 'schedule.edit',   name: 'Editar item de cronograma' },
        { key: 'schedule.delete', name: 'Excluir item de cronograma' },
      ] },
      { label: 'Tarefas', Icon: ListChecks, items: [
        { key: 'tasks.view',     name: 'Visualizar tarefas' },
        { key: 'tasks.create',   name: 'Criar tarefa',  description: 'Em projetos onde é responsável ou membro.' },
        { key: 'tasks.edit',     name: 'Editar tarefa', description: 'Em projetos onde é responsável ou membro.' },
        { key: 'tasks.complete', name: 'Concluir tarefa' },
      ] },
      { label: 'Status report', Icon: FileBarChart2, items: [
        { key: 'status_report.create', name: 'Criar status report' },
        { key: 'status_report.edit',   name: 'Editar status report' },
        { key: 'status_report.delete', name: 'Excluir status report' },
      ] },
      { label: 'Documentação', Icon: BookOpen, items: [
        { key: 'docs.api', name: 'Acessar documentação da API' },
      ] },
    ],
  },
];

const stateKey = (profileId, permKey) => `${profileId}|${permKey}`;

function Toggle({ checked, pending, failed, onChange, label }) {
  return (
    <label className="relative mt-0.5 inline-block h-[19px] w-8 shrink-0 cursor-pointer" title={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      <span className={`absolute inset-0 rounded-full transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-primary-100 ${
        failed ? 'bg-red-500' : pending ? 'bg-amber-500' : checked ? 'bg-primary-600' : 'bg-gray-300'
      }`} />
      <span className={`pointer-events-none absolute top-0.5 left-0.5 h-[15px] w-[15px] rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[13px]' : ''}`} />
    </label>
  );
}

function PermissionRow({ item, checked, pending, failed, onChange, isLast }) {
  return (
    <div className={`flex items-start gap-3.5 py-2.5 ${isLast ? 'pb-3.5' : 'border-b border-gray-100'}`}>
      <div className="min-w-0 flex-1">
        <div className={`text-[13px] leading-snug font-medium ${checked ? 'text-gray-700' : 'text-gray-400'}`}>
          {item.name}
          {!checked && (
            <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-px align-[1px] text-[9.5px] font-semibold tracking-wide text-gray-400 uppercase">
              revogada
            </span>
          )}
        </div>
        {item.description && (
          <div className={`mt-0.5 text-[11px] leading-snug ${checked ? 'text-gray-400' : 'text-gray-300'}`}>
            {item.description}
          </div>
        )}
      </div>
      <Toggle checked={checked} pending={pending} failed={failed} onChange={onChange} label={item.name} />
    </div>
  );
}

function ProfileCard({ profile, state, pend, fail, onToggle }) {
  const [open, setOpen] = useState(true);
  const Chevron = open ? ChevronDown : ChevronRight;

  const [active, total] = useMemo(() => {
    let on = 0, n = 0;
    for (const g of profile.groups) for (const it of g.items) { n++; if (state[stateKey(profile.id, it.key)]) on++; }
    return [on, n];
  }, [profile, state]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex w-full items-center gap-3 px-4.5 py-4 text-left transition-colors ${open ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}>
        <Chevron className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{profile.name}</span>
            {profile.seal && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                <Clock className="h-2.5 w-2.5" />
                {profile.seal}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[11.5px] leading-snug text-gray-500">{profile.subtitle}</span>
        </span>
        <span className="shrink-0 text-[11px] whitespace-nowrap text-gray-400">
          <b className="font-semibold text-primary-700">{active}</b> de {total} ativas
        </span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {profile.groups.map((g, gi) => (
            <div key={g.label} className={`px-4.5 pt-3.5 pb-1 ${gi > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="mb-0.5 flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wide text-gray-400 uppercase">
                <g.Icon className="h-3 w-3 shrink-0" />
                {g.label}
              </div>
              {g.items.map((it, i) => {
                const id = stateKey(profile.id, it.key);
                return (
                  <PermissionRow key={it.key} item={it}
                    checked={!!state[id]} pending={pend.has(id)} failed={fail.has(id)}
                    isLast={i === g.items.length - 1}
                    onChange={(v) => onToggle(profile.id, it.key, v)} />
                );
              })}
            </div>
          ))}

          {profile.notes?.length > 0 && (
            <div className="flex items-start gap-2.5 border-t border-gray-100 bg-gray-50 px-4.5 py-3 text-[11px] leading-relaxed text-gray-500">
              <Clock className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
              <div className="space-y-1">
                {profile.notes.map((n, i) => <p key={i}>{n}</p>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePermissionCards() {
  const [state, setState] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pend, setPend] = useState(new Set());
  const [fail, setFail] = useState(new Set());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getPermissions();
        if (cancelled) return;
        const s = {};
        for (const p of PROFILES) {
          for (const g of p.groups) {
            for (const it of g.items) {
              const id = stateKey(p.id, it.key);
              const row = res.data.find(r => r.role === p.id && r.permission === it.key);
              s[id] = row ? row.enabled : true;
            }
          }
        }
        setState(s);
      } catch {
        if (!cancelled) setLoadError('Não foi possível carregar as permissões.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const mark = (setFn, id, on) => setFn((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });

  const onToggle = useCallback(async (profileId, permKey, next) => {
    const id = stateKey(profileId, permKey);
    const prev = !!state[id];
    setState((s) => ({ ...s, [id]: next }));
    mark(setPend, id, true);
    try {
      await revokePermission({ role: profileId, permission: permKey, enabled: next });
    } catch (e) {
      setState((s) => ({ ...s, [id]: prev }));
      mark(setFail, id, true);
      setTimeout(() => mark(setFail, id, false), 650);
      setToast(e?.response?.data?.error ?? 'Não foi possível salvar. Alteração revertida.');
      setTimeout(() => setToast(null), 2600);
    } finally {
      mark(setPend, id, false);
    }
  }, [state]);

  if (loading) {
    return <p className="text-xs text-gray-400 text-center py-8">Carregando permissões...</p>;
  }

  if (loadError) {
    return <p className="text-xs text-red-400 text-center py-8">{loadError}</p>;
  }

  return (
    <div className="space-y-3.5">
      {PROFILES.map((p) => (
        <ProfileCard key={p.id} profile={p} state={state} pend={pend} fail={fail} onToggle={onToggle} />
      ))}

      <p className="text-[11px] leading-relaxed text-gray-400">
        Não é possível conceder aqui permissões que o perfil não possui — a lista reflete o que já está definido para o perfil.
      </p>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-700 px-4 py-2.5 text-xs text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}