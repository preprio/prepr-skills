// Checks that each prompt in tests/routing.json makes headless Claude Code load the expected skill.
// Calls the model, so it is a manual release step, not part of CI.
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function firstSkill(streamJson) {
  for (const line of streamJson.split('\n')) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type !== 'assistant') continue;
    for (const c of e.message?.content ?? [])
      if (c.type === 'tool_use' && c.name === 'Skill') return String(c.input?.skill ?? '').replace(/^prepr:/, '');
  }
  return null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const cases = JSON.parse(readFileSync(join(root, 'tests/routing.json'), 'utf8'));
  const cwd = mkdtempSync(join(tmpdir(), 'prepr-routing-'));
  let failed = 0;
  for (const { prompt, skill } of cases) {
    // No MCP servers and no file or shell tools: only the routing decision is measured.
    const run = spawnSync('claude', ['-p', prompt, '--plugin-dir', root, '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
      '--disallowedTools', 'Bash,Edit,Write,WebFetch,WebSearch', '--max-turns', '3', '--output-format', 'stream-json', '--verbose'],
      { cwd, encoding: 'utf8', timeout: 180000 });
    const got = firstSkill(run.stdout ?? '');
    const ok = got === skill;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${skill.padEnd(15)} got ${String(got).padEnd(15)} ${prompt}`);
  }
  rmSync(cwd, { recursive: true, force: true });
  console.log(`\n${cases.length - failed}/${cases.length} routed correctly`);
  process.exit(failed ? 1 : 0);
}
