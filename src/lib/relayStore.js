import { supabase, getCurrentUserId } from './db';

const LS_RUNS = 'vc__relay_runs';
const LS_STEPS = 'vc__relay_steps';

export function initTaskMd(goal, todo='') {
  const ts = new Date().toISOString();
  return `# Task Log

**Started:** ${ts}

## Goal
${goal}

## TODO (Initial)
${todo || '-'}

---
`;
}
export function appendTaskMd(md, chunk) {
  return (md || '') + "\n" + chunk + "\n---\n";
}

export async function createRelayRun({ goal, todo }) {
  if (!supabase) return createLocal({ goal, todo });
  const user_id = getCurrentUserId();
  const task_md = initTaskMd(goal, todo);
  const { data, error } = await supabase
    .from('relay_runs')
    .insert([{ user_id, goal, todo, status: 'running', task_md }])
    .select()
    .single();
  if (error) return createLocal({ goal, todo });
  return data;
}
export async function updateRelayRun(run_id, patch) {
  if (!supabase) return updateLocal(run_id, patch);
  const { error } = await supabase
    .from('relay_runs')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', run_id);
  if (error) return updateLocal(run_id, patch);
  return true;
}
export async function updateRelayRunTaskMd(run_id, newMd) {
  if (!supabase) return updateLocal(run_id, { task_md: newMd });
  const { error } = await supabase
    .from('relay_runs')
    .update({ task_md: newMd, updated_at: new Date().toISOString() })
    .eq('id', run_id);
  if (error) return updateLocal(run_id, { task_md: newMd });
  return true;
}
export async function addRelayStep({ run_id, agent_id, role, input, output, checklist, status='ok' }) {
  if (!supabase) return addLocal({ run_id, agent_id, role, input, output, checklist, status });
  const { error } = await supabase
    .from('relay_steps')
    .insert([{ run_id, agent_id, role, input, output, checklist, status }]);
  if (error) return addLocal({ run_id, agent_id, role, input, output, checklist, status });
  return true;
}
export async function listRelay(run_id) {
  if (!supabase) return listLocal(run_id);
  const { data: run } = await supabase.from('relay_runs').select('*').eq('id', run_id).single();
  const { data: steps } = await supabase
    .from('relay_steps').select('*').eq('run_id', run_id).order('created_at', { ascending: true });
  return { run, steps };
}

// Local fallback
function getLS(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function setLS(key, v) { localStorage.setItem(key, JSON.stringify(v)); }
function createLocal({ goal, todo }) {
  const runs = getLS(LS_RUNS);
  const run = { id: crypto.randomUUID(), user_id: 'local', goal, todo, status: 'running', task_md: initTaskMd(goal, todo), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  runs.unshift(run); setLS(LS_RUNS, runs); return run;
}
function updateLocal(id, patch) {
  const runs = getLS(LS_RUNS); const i = runs.findIndex(r => r.id === id);
  if (i >= 0) { runs[i] = { ...runs[i], ...patch, updated_at: new Date().toISOString() }; setLS(LS_RUNS, runs); }
  return true;
}
function addLocal(step) {
  const steps = getLS(LS_STEPS);
  steps.push({ ...step, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  setLS(LS_STEPS, steps); return true;
}
function listLocal(run_id) {
  const runs = getLS(LS_RUNS);
  const steps = getLS(LS_STEPS).filter(s => s.run_id === run_id).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  return { run: runs.find(r => r.id === run_id) || null, steps };
}
