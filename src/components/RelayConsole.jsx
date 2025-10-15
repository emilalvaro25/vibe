import { useEffect, useState } from 'react';
import { runRelay, AGENTS } from '../lib/relay';
import { listRelay } from '../lib/relayStore';

export default function RelayConsole() {
  const [goal, setGoal] = useState('CREATE cOFFEE SHOP APP, FULL APPS');
  const [todo, setTodo] = useState('');
  const [runId, setRunId] = useState('');
  const [steps, setSteps] = useState([]);
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!goal.trim()) return; setBusy(true);
    try { const id = await runRelay({ goal: goal.trim(), todo }); setRunId(id); await refresh(id); }
    catch (e) { alert('Relay failed: ' + (e?.message || e)); }
    finally { setBusy(false); }
  };
  const refresh = async (id = runId) => {
    if (!id) return; const data = await listRelay(id); setRun(data.run); setSteps(data.steps || []);
  };
  useEffect(() => { if (!runId) return; const t = setInterval(() => refresh(), 1500); return () => clearInterval(t); }, [runId]);

  const downloadTaskMd = (r) => {
    if (!r?.task_md) return; const blob = new Blob([r.task_md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'task.md'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="sprinkle-bg">
        <div className="sprinkles-1"></div>
      </div>
      <div className="container">
        <div className="relay">
          <div className="rc-head"><h3>Relay Orchestrator</h3><button onClick={() => refresh()} disabled={!runId || busy}>Refresh</button></div>
          <div className="grid2">
            <div className="card">
              <label>Goal<textarea rows={4} value={goal} onChange={e => setGoal(e.target.value)} placeholder="What are we building?" /></label>
              <label>TODO<textarea rows={4} value={todo} onChange={e => setTodo(e.target.value)} placeholder="Ordered steps / constraints" /></label>
              <button onClick={start} disabled={busy || !goal.trim()}>{busy ? 'Running…' : 'Start Relay (10 agents)'}</button>
              {run && <div className="run-status">Run: {run.id.slice(0,8)} — {run.status}</div>}
            </div>
            <div className="card">
              <div className="agents">{AGENTS.map(a => <div key={a.id} className="agent">{a.id}<span className="role">{a.role}</span></div>)}</div>
            </div>
          </div>

          <div className="task-md">
            <div className="row">
              <h4>task.md</h4><div className="grow" /><button onClick={() => downloadTaskMd(run)} disabled={!run}>Download task.md</button>
            </div>
            <pre className="md-pre">{run?.task_md || '—'}</pre>
          </div>

          <div className="steps">
            {steps.map(s => (
              <details key={s.id} open>
                <summary><b>{s.agent_id}</b> · {s.role} · <em>{new Date(s.created_at).toLocaleString()}</em></summary>
                <div className="payload">
                  <div className="col"><div className="label">Checklist</div><ul>{(s.checklist || []).map((c,i)=><li key={i}>{c.pass?'✅':'❌'} {c.name}</li>)}</ul></div>
                  <div className="col wide"><div className="label">Output</div><pre>{s.output}</pre></div>
                </div>
              </details>
            ))}
            {steps.length === 0 && <div className="muted">No steps yet. Start a run.</div>}
          </div>
        </div>
      </div>
    </>
  );
}