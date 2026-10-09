import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKILLS } from './shared-map.mjs';
import { sync } from './sync-shared.mjs';

const MCP_URL = 'https://mcp.prepr.io';

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([a-z_]+):\s*(.*)$/);
    if (k) fm[k[1]] = k[2].trim();
  }
  return fm;
}

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return markdownFiles(p);
    return name.endsWith('.md') ? [p] : [];
  });
}

export function checkRepo(root) {
  const errors = [];
  const skillsDir = join(root, 'skills');
  const present = existsSync(skillsDir) ? readdirSync(skillsDir).filter((n) => statSync(join(skillsDir, n)).isDirectory()) : [];

  for (const s of SKILLS) if (!present.includes(s)) errors.push(`skills/${s}: missing`);
  for (const s of present) if (!SKILLS.includes(s)) errors.push(`skills/${s}: not one of the five launch skills`);

  for (const s of SKILLS.filter((x) => present.includes(x))) {
    const skillRoot = join(skillsDir, s);
    const skillMd = join(skillRoot, 'SKILL.md');
    if (!existsSync(skillMd)) { errors.push(`skills/${s}/SKILL.md: missing`); continue; }
    const fm = frontmatter(readFileSync(skillMd, 'utf8'));
    if (!fm) errors.push(`skills/${s}/SKILL.md: no frontmatter`);
    else {
      if (fm.name !== s) errors.push(`skills/${s}/SKILL.md: frontmatter name "${fm.name}" does not match folder`);
      if (!fm.description) errors.push(`skills/${s}/SKILL.md: frontmatter description missing`);
    }
    for (const file of markdownFiles(skillRoot)) {
      const rel = relative(root, file);
      for (const [, target] of readFileSync(file, 'utf8').matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(target)) continue;
        const path = resolve(dirname(file), target.split('#')[0]);
        if (!(path + sep).startsWith(skillRoot + sep)) errors.push(`${rel}: link ${target} escapes the skill folder`);
        else if (!existsSync(path)) errors.push(`${rel}: broken link ${target}`);
      }
    }
  }

  if (existsSync(join(root, 'shared'))) for (const p of sync(root, { check: true })) errors.push(`${p}: differs from shared/`);

  const version = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json'), 'utf8')).version;
  const prepr = JSON.parse(readFileSync(join(root, '.mcp.json'), 'utf8')).mcpServers?.prepr;
  if (prepr?.url !== MCP_URL) errors.push(`.mcp.json: url is "${prepr?.url}", expected "${MCP_URL}"`);
  if (prepr?.headers?.['X-Prepr-Client'] !== `prepr-skills/${version}`)
    errors.push(`.mcp.json: X-Prepr-Client is "${prepr?.headers?.['X-Prepr-Client']}", expected "prepr-skills/${version}"`);

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkRepo(process.cwd());
  for (const e of errors) console.error(e);
  process.exit(errors.length ? 1 : 0);
}
