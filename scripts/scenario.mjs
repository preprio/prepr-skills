// Runs one turn of a scenario from docs/scenarios.md in a project where the skills and Prepr MCP are set up,
// and prints the skill, every tool call (writes marked) and the reply.
// Usage: node scripts/scenario.mjs <project-dir> "<prompt>" [--resume <session-id>]
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const WRITE = /^mcp__prepr__(create|update|delete|move|publish|unpublish|patch|assign|unassign|add_comment|upload|change)/;

export function summarize(streamJson) {
  const calls = [];
  let session = null;
  let result = null;
  for (const line of streamJson.split('\n')) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.session_id) session = e.session_id;
    if (e.type === 'result') result = e.result;
    if (e.type !== 'assistant') continue;
    for (const c of e.message?.content ?? []) {
      if (c.type !== 'tool_use') continue;
      const input = JSON.stringify(c.input ?? {}).replace(/("confirmToken"\s*:\s*)"[^"]*"/g, '$1"<redacted>"').slice(0, 300);
      if (c.name === 'Skill') calls.push(`SKILL ${c.input?.skill}`);
      else if (c.name.startsWith('mcp__prepr__')) calls.push(`${WRITE.test(c.name) ? 'WRITE' : 'READ '} ${c.name} ${input}`);
      else calls.push(`TOOL  ${c.name}`);
    }
  }
  return { session, calls, result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [project, prompt, flag, id] = process.argv.slice(2);
  if (!project || !prompt) {
    console.error('Usage: node scripts/scenario.mjs <project-dir> "<prompt>" [--resume <session-id>]');
    process.exit(2);
  }
  const args = ['-p', prompt, '--allowedTools', 'mcp__prepr__*,Read,Glob,Grep,Skill', '--disallowedTools', 'Edit,Write,Bash',
    '--output-format', 'stream-json', '--verbose'];
  if (flag === '--resume' && id) args.push('--resume', id);
  const run = spawnSync('claude', args, { cwd: project, encoding: 'utf8', timeout: 900000 });
  const { session, calls, result } = summarize(run.stdout ?? '');
  console.log(`SESSION ${session}  (continue with --resume ${session})\n`);
  for (const c of calls) console.log(c);
  console.log(`\n${result ?? run.stderr}`);
}
