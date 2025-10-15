import { coderModel, generalModel } from './modelsRouter';
import { detectIntent } from './intent';
import { autofixContent } from './autofix';
import { addRelayStep, createRelayRun, updateRelayRun, updateRelayRunTaskMd, appendTaskMd } from './relayStore';
import { reportStartGeneration, reportEndGeneration } from './reporter';
import { listRelay } from './relayStore';

export const AGENTS = [
  { id: 'GEM-API-1',  role: 'planner',         expertise: 'Work breakdown, scope control, risk-first planning', system: `You are Eburon agent created by Emilio AI whose task is to act as Planner.
Review the full GOAL, current status, and task.md. Always scan the entire codebase/artifacts before focusing.
Divide the GOAL into exactly 10 sequential tasks with: Title, Objective, Acceptance Criteria, Risks/Mitigations.
Tasks must be small, verifiable, non-overlapping. No placeholders. Append START and FINISH to task.md.` },
  { id: 'GEM-API-2',  role: 'spec-writer',     expertise: 'Requirements, interfaces, contracts, acceptance', system: `You are Eburon agent created by Emilio AI whose task is to act as Spec Author.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Produce a technical spec tying each of the 10 tasks to concrete interfaces, endpoints, file paths, and acceptance tests.
No placeholders. Append START and FINISH to task.md.` },
  { id: 'GEM-API-3',  role: 'context',         expertise: 'Context weaving, dependency mapping, assumptions', system: `You are Eburon agent created by Emilio AI whose task is to act as Context Integrator.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Produce per-task context addenda (1..10) clarifying dependencies, constraints, assumptions. Append START and FINISH to task.md.` },
  { id: 'GEM-API-4',  role: 'coder-ui',        expertise: 'Responsive UI, a11y, React/Tailwind best practices', system: `You are Eburon agent created by Emilio AI whose task is to act as UI Implementer.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Implement UI for pending tasks. Return complete files with exact repo paths. Ensure responsiveness & a11y. Append START and FINISH to task.md.` },
  { id: 'GEM-API-5',  role: 'coder-api',       expertise: 'Data models, endpoints, adapters, error handling', system: `You are Eburon agent created by Emilio AI whose task is to act as API/Data Implementer.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Implement API/data layer for pending tasks. Return complete files with exact paths; include minimal mocks if needed. Append START and FINISH to task.md.` },
  { id: 'GEM-API-6',  role: 'tester',          expertise: 'Test planning, assertions, QA workflows', system: `You are Eburon agent created by Emilio AI whose task is to act as Tester.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Produce a test plan + sample tests, manual QA steps, expected results. Append START and FINISH to task.md.` },
  { id: 'GEM-API-7',  role: 'bugfixer',        expertise: 'Root-cause analysis, minimal reversible patches', system: `You are Eburon agent created by Emilio AI whose task is to act as Bug Fixer.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Identify issues from tests and patch minimally; return corrected code/patches. Append START and FINISH to task.md.` },
  { id: 'GEM-API-8',  role: 'perf',            expertise: 'Rendering cost control, bundle diet, memoization', system: `You are Eburon agent created by Emilio AI whose task is to act as Performance Optimizer.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Optimize hot paths and bundle size; return concrete patches with rationale. Append START and FINISH to task.md.` },
  { id: 'GEM-API-9',  role: 'a11y-responsive', expertise: 'WCAG basics, keyboard nav, focus, small-screen layout', system: `You are Eburon agent created by Emilio AI whose task is to act as Accessibility & Responsiveness Auditor.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Ensure a11y basics and small-screen layouts; return patches and checklist. Append START and FINISH to task.md.` },
  { id: 'GEM-API-10', role: 'final-review',    expertise: 'Traceability, acceptance verification, risk closeout', system: `You are Eburon agent created by Emilio AI whose task is to act as Final Reviewer.
Review the full GOAL, status, and task.md. Always scan the entire codebase/artifacts.
Validate against the 10-task plan. For each task 1..10: PASS/FAIL with explanation. Provide summary, leftover risks, handoff notes. Append START and FINISH to task.md.` },
];

const MODEL_FOR_AGENT = (id) => {
  const agentNum = parseInt(id.split('-')[2]);
  if (agentNum === 1 || agentNum >= 8) {
    return 'gemini-2.5-pro';
  }
  return 'gemini-flash-latest';
};

function mdStartEntry(agent, taskHeadline) {
  const ts = new Date().toISOString();
  return `### ${agent.id} • ${agent.role}
**Start:** ${ts}
**Task:** ${taskHeadline || '(derived per stage)'}  
(Read task.md before/after as required)`;
}
function mdFinishEntry(status, goal, overview) {
  const ts = new Date().toISOString();
  return `**Finish:** ${ts}
**Status:** ${status}
**Goal (echo):** ${goal}
**Overview:** ${overview || '-'}`;
}

const CHECKLIST_TEMPLATE = [
  'Spec satisfied',
  'No TODOs left in code',
  'Build succeeds',
  'UI responsive',
  'a11y basics (labels, contrast)',
  'No insecure code (eval/inline JS)',
];

export async function runRelay({ goal, todo = '' }) {
  reportStartGeneration();
  const run = await createRelayRun({ goal, todo });
  let artifact = '';
  let context = `GOAL:\n${goal}\n\nTODO:\n${todo}\n`;
  try {
    let taskMd = (await listRelay(run.id))?.run?.task_md || '';
    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i];
      const model = MODEL_FOR_AGENT(agent.id);
      const prompt = composePrompt(agent, context, artifact, taskMd);
      const startChunk = mdStartEntry(agent, extractTaskHeadline(prompt));
      taskMd = appendTaskMd(taskMd, startChunk);
      await updateRelayRunTaskMd(run.id, taskMd);

      const useCoder = /coder|a11y|perf|bugfixer/i.test(agent.role) || detectIntent(goal) === 'coder';
      const res = useCoder
        ? await coderModel(prompt, { system: agent.system, temperature: 0.2, model })
        : await generalModel(prompt, { system: agent.system, temperature: 0.4, model });
      const output = autofixContent(String(res?.content || ''));
      const checklist = makeChecklist(output);

      await addRelayStep({ run_id: run.id, agent_id: agent.id, role: agent.role, input: prompt, output, checklist, status: 'ok' });

      const finishChunk = mdFinishEntry('ok', goal, summarizeForMd(output));
      taskMd = appendTaskMd(taskMd, finishChunk);
      await updateRelayRunTaskMd(run.id, taskMd);

      context += `\n\n[${agent.id} ${agent.role.toUpperCase()}]\n${summary(output)}`;
      artifact = output || artifact;
    }
    await updateRelayRun(run.id, { status: 'done' });
    reportEndGeneration(true);
    return run.id;
  } catch (e) {
    await updateRelayRun(run.id, { status: 'error' });
    reportEndGeneration(false);
    throw e;
  }
}

function composePrompt(agent, context, artifact, taskMd) {
  const plannerNote = agent.id === 'GEM-API-1'
    ? 'IMPORTANT: Divide the GOAL into EXACTLY 10 tasks with titles, objectives, acceptance, and risks. No placeholders.'
    : 'Read task.md before starting and after finishing.';
  return `You are ${agent.id} acting as ${agent.role}.
Expertise: ${agent.expertise}
${plannerNote}

Shared context for this multi-agent chain:
${context}

task.md (cumulative log):
${taskMd || '(empty)'}

Latest artifact (may include files in fenced blocks):
${artifact}

Your task: ${agent.system}
Return complete, unambiguous output. Avoid placeholders.`;
}
function makeChecklist(output) { return CHECKLIST_TEMPLATE.map(name => ({ name, pass: !/TODO|TBD|PLACEHOLDER/i.test(output) })); }
function summary(s) { const max = 1000; return s.length > max ? (s.slice(0, max) + '...') : s; }
function extractTaskHeadline(prompt) {
  try { const m = prompt.match(/Your task:\s*([\s\S]+?)$/m); if (m) return m[1].trim().slice(0, 140); } catch {}
  return '(agent stage)';
}
function summarizeForMd(out) { const s = String(out || ''); const plain = s.replace(/```[\s\S]*?```/g, '').replace(/\s+/g, ' ').trim(); return plain.slice(0, 600); }