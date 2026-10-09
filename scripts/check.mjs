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
  const lines = m[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const k = lines[i].match(/^([a-z_]+):\s*(.*)$/);
    if (!k) continue;
    let value = k[2].trim();
    // Folded or literal block scalar: the value is the indented lines that follow.
    if (/^[>|][+-]?$/.test(value)) {
      const body = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) body.push(lines[++i].trim());
      value = body.join(' ');
    }
    fm[k[1]] = value;
  }
  return fm;
}

// GitHub-style heading anchors, ignoring fenced code blocks.
function anchors(text) {
  const seen = new Map();
  const out = new Set();
  let fenced = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const h = !fenced && line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!h) continue;
    const base = h[1].toLowerCase().replace(/[`*_]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  return out;
}

function links(text) {
  const inline = [...text.matchAll(/\]\(<?([^)\s>]+)>?(?:\s+"[^"]*")?\)/g)].map((m) => m[1]);
  const reference = [...text.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)].map((m) => m[1]);
  return [...inline, ...reference];
}

const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

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
    const fm = frontmatter(read(skillMd));
    if (!fm) errors.push(`skills/${s}/SKILL.md: no frontmatter`);
    else {
      if (fm.name !== s) errors.push(`skills/${s}/SKILL.md: frontmatter name "${fm.name}" does not match folder`);
      if (!fm.description) errors.push(`skills/${s}/SKILL.md: frontmatter description missing`);
    }
    for (const file of markdownFiles(skillRoot)) {
      const rel = relative(root, file);
      const text = read(file);
      for (const target of links(text)) {
        if (/^(https?:|mailto:)/.test(target)) continue;
        const [pathPart, anchor] = target.split('#');
        const path = pathPart ? resolve(dirname(file), pathPart) : file;
        if (!(path + sep).startsWith(skillRoot + sep)) { errors.push(`${rel}: link ${target} escapes the skill folder`); continue; }
        if (!existsSync(path)) { errors.push(`${rel}: broken link ${target}`); continue; }
        if (anchor && path.endsWith('.md') && !anchors(read(path)).has(anchor)) errors.push(`${rel}: broken anchor ${target}`);
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
