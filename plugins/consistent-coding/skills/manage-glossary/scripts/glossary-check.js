#!/usr/bin/env node
// Checks code against a project's glossary (the manage-glossary skill). Needs Node
// and git; no other dependencies.
//
// Usage:
//   node glossary-check.js --diff [<base>]     added lines and new file names since <base>
//   node glossary-check.js --paths <glob>...   whole files matching the globs
//   node glossary-check.js --integrity         the glossary itself
//
// Options:
//   --glossary <dir>  glossary directory. Default: the first of documentation/, docs/
//                     or doc/ that has conventions/glossary/INDEX.md
//   --json            machine-readable output
//   --strict          exit 1 when there are candidates (or, with --integrity, problems)
//
// Without <base>, --diff uses the merge base of HEAD and the default branch
// (origin/HEAD, then main, then master). Uncommitted and untracked files are included;
// .gitignore is respected. --diff and --paths also report the integrity check.
//
// Results are candidates, not verdicts: the agent judges each one in context.
// --diff also lists mentions: names new in the diff (absent at <base>) that use a word
// belonging to a group, so the agent can check each holds what its name says.
//
// Exits 0 (informational), 1 with --strict when anything is reported,
// 2 when the glossary can't be read, git fails, or the arguments are wrong.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SCHEMA_VERSION = 1;
const DEFAULT_GLOSSARY_DIRS = ['documentation', 'docs', 'doc'].map((d) => `${d}/conventions/glossary`);
// Prose and lockfiles aren't code: prose may rightly use business names, and lockfiles aren't named by the team.
const SKIPPED_EXTENSIONS = new Set(['.md', '.mdx', '.markdown', '.txt', '.rst', '.adoc', '.lock']);
const SKIPPED_NAMES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'npm-shrinkwrap.json']);
const REASON_WIDTH = 60;

class UsageError extends Error {}

class FrontmatterError extends Error {
  constructor(line, message) {
    super(message);
    this.line = line;
  }
}

// ---------------------------------------------------------------------------
// Frontmatter: a limited YAML subset (see references/schema.md)
// ---------------------------------------------------------------------------

const KEY = '[A-Za-z_][A-Za-z0-9_-]*';

// Returns { data, lines }. `lines` maps each top-level key, and each list item as
// "key[index]", to its 1-based line number in the file.
function parseFrontmatter(text) {
  const all = text.replace(/^﻿/, '').split(/\r?\n/);
  if (all[0].trimEnd() !== '---') {
    throw new FrontmatterError(1, 'the file must start with a "---" line');
  }
  let end = -1;
  for (let i = 1; i < all.length; i++) {
    if (all[i].trimEnd() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) throw new FrontmatterError(1, 'the frontmatter has no closing "---" line');

  const data = {};
  const lines = {};
  let list = null; // the block list being read: { key, items, keyIndent, current }

  for (let i = 1; i < end; i++) {
    const lineNo = i + 1;
    const line = all[i].replace(/\s+$/, '');
    if (line.trim() === '' || /^\s*#/.test(line)) continue;
    if (/^\s*\t/.test(line)) throw new FrontmatterError(lineNo, 'indent with spaces, not tabs');

    if (!/^\s/.test(line)) {
      list = null;
      const m = line.match(new RegExp(`^(${KEY}):(?: (.*))?$`));
      if (!m) throw new FrontmatterError(lineNo, 'expected "key: value"');
      const [, key, raw = ''] = m;
      if (key in data) throw new FrontmatterError(lineNo, `"${key}" appears twice`);
      lines[key] = lineNo;
      if (raw.trim() === '') {
        data[key] = [];
        list = { key, items: data[key], keyIndent: null, current: null };
      } else {
        data[key] = parseValue(raw.trim(), lineNo);
      }
      continue;
    }

    if (!list) {
      throw new FrontmatterError(lineNo, 'unexpected indentation (only block lists of mappings, like avoid, can be indented)');
    }

    const item = line.match(new RegExp(`^( +)- (${KEY}):(?: (.*))?$`));
    if (item) {
      const keyIndent = item[1].length + 2;
      if (list.keyIndent !== null && keyIndent !== list.keyIndent) {
        throw new FrontmatterError(lineNo, `items in "${list.key}" must all be indented the same`);
      }
      list.keyIndent = keyIndent;
      list.current = {};
      lines[`${list.key}[${list.items.length}]`] = lineNo;
      list.items.push(list.current);
      setItemKey(list.current, item[2], item[3], lineNo);
      continue;
    }

    if (/^ +-( |$)/.test(line)) {
      throw new FrontmatterError(lineNo, 'block lists of plain values aren\'t supported; use a flow list like [a, b]');
    }

    const cont = line.match(new RegExp(`^( +)(${KEY}):(?: (.*))?$`));
    if (cont && list.current && cont[1].length === list.keyIndent) {
      setItemKey(list.current, cont[2], cont[3], lineNo);
      continue;
    }
    throw new FrontmatterError(lineNo, 'expected an item key lined up under the first key of its item');
  }

  return { data, lines };
}

function setItemKey(item, key, raw = '', lineNo) {
  if (key in item) throw new FrontmatterError(lineNo, `"${key}" appears twice in one item`);
  if (raw.trim() === '') throw new FrontmatterError(lineNo, `"${key}" needs a value; nested values aren't supported in list items`);
  item[key] = parseValue(raw.trim(), lineNo);
}

function parseValue(raw, lineNo) {
  if (raw.startsWith('"')) {
    const { value, end } = readQuoted(raw, 0, lineNo);
    if (raw.slice(end).trim() !== '') throw new FrontmatterError(lineNo, 'unexpected text after the closing quote');
    return value;
  }
  if (raw.startsWith('[')) return parseFlowList(raw, lineNo);
  return parsePlain(raw, lineNo);
}

function parsePlain(raw, lineNo) {
  if (/^[{'&*!|>%@`#]/.test(raw) || /^[-?:]( |$)/.test(raw)) {
    throw new FrontmatterError(lineNo, `values starting with "${raw[0]}" must be double-quoted`);
  }
  if (raw.includes(': ')) throw new FrontmatterError(lineNo, 'values containing ": " must be double-quoted');
  if (raw.includes(' #')) {
    throw new FrontmatterError(lineNo, 'inline comments aren\'t supported; values containing " #" must be double-quoted');
  }
  return raw;
}

function readQuoted(s, start, lineNo) {
  let value = '';
  for (let i = start + 1; i < s.length; i++) {
    const c = s[i];
    if (c === '"') return { value, end: i + 1 };
    if (c === '\\') {
      const next = s[i + 1];
      if (next !== '"' && next !== '\\') {
        throw new FrontmatterError(lineNo, 'the only escapes allowed in quoted strings are \\" and \\\\');
      }
      value += next;
      i++;
    } else {
      value += c;
    }
  }
  throw new FrontmatterError(lineNo, 'quoted string has no closing quote');
}

function parseFlowList(s, lineNo) {
  const items = [];
  let i = 1;
  const skipSpaces = () => {
    while (s[i] === ' ') i++;
  };
  skipSpaces();
  if (s[i] === ']') {
    i++;
  } else {
    for (;;) {
      skipSpaces();
      if (s[i] === '"') {
        const { value, end } = readQuoted(s, i, lineNo);
        items.push(value);
        i = end;
      } else {
        let j = i;
        while (j < s.length && s[j] !== ',' && s[j] !== ']') j++;
        const raw = s.slice(i, j).trim();
        if (raw === '') throw new FrontmatterError(lineNo, 'empty item in a flow list');
        if (raw.includes('[')) throw new FrontmatterError(lineNo, 'nested lists aren\'t supported');
        items.push(parsePlain(raw, lineNo));
        i = j;
      }
      skipSpaces();
      if (s[i] === ',') {
        i++;
        continue;
      }
      if (s[i] === ']') {
        i++;
        break;
      }
      throw new FrontmatterError(lineNo, 'flow list has no closing "]"');
    }
  }
  if (s.slice(i).trim() !== '') throw new FrontmatterError(lineNo, 'unexpected text after the closing "]"');
  return items;
}

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

function toList(value) {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
  return typeof value === 'string' ? [value] : [];
}

function loadGlossary(root, glossaryRel) {
  const dir = path.join(root, glossaryRel);
  const indexRel = `${glossaryRel}/INDEX.md`;
  if (!fs.existsSync(path.join(dir, 'INDEX.md'))) {
    throw new UsageError(`No glossary found: ${indexRel} doesn't exist.`);
  }

  const glossary = {
    dir: glossaryRel,
    index: { file: indexRel, text: fs.readFileSync(path.join(dir, 'INDEX.md'), 'utf8'), data: null, lines: {} },
    groups: [],
    unreadable: new Set(),
    problems: [],
    warnings: [],
  };

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  for (const name of files) {
    const rel = `${glossaryRel}/${name}`;
    const text = name === 'INDEX.md' ? glossary.index.text : fs.readFileSync(path.join(dir, name), 'utf8');
    let parsed;
    try {
      parsed = parseFrontmatter(text);
    } catch (err) {
      if (!(err instanceof FrontmatterError)) throw err;
      glossary.problems.push({ check: 'frontmatter', file: rel, line: err.line, message: `${err.message}. File skipped.` });
      glossary.unreadable.add(name);
      continue;
    }
    checkSchemaVersion(parsed, rel, glossary);
    if (name === 'INDEX.md') {
      glossary.index.data = parsed.data;
      glossary.index.lines = parsed.lines;
    } else {
      glossary.groups.push(readGroup(parsed, rel, name, glossary));
    }
  }
  return glossary;
}

function checkSchemaVersion({ data, lines }, rel, glossary) {
  if (data.schema === undefined) {
    glossary.warnings.push({ file: rel, line: null, message: 'no schema version; assuming 1' });
    return;
  }
  const version = Number(data.schema);
  if (!Number.isInteger(version)) {
    glossary.warnings.push({ file: rel, line: lines.schema, message: `schema "${data.schema}" isn't a number` });
  } else if (version > SCHEMA_VERSION) {
    glossary.warnings.push({
      file: rel,
      line: lines.schema,
      message: `schema ${version} is newer than this script understands (${SCHEMA_VERSION}). The skill may be out of date; only the fields it knows were checked.`,
    });
  } else if (version < SCHEMA_VERSION) {
    glossary.warnings.push({
      file: rel,
      line: lines.schema,
      message: `schema ${version} is older than ${SCHEMA_VERSION}. Run Update to migrate it.`,
    });
  }
}

function readGroup({ data, lines }, rel, name, glossary) {
  const group = {
    file: rel,
    name: typeof data.group === 'string' ? data.group : '',
    fileName: name,
    paths: toList(data.paths),
    code: toList(data.code),
    avoid: [],
    lines,
  };
  if (!group.name) glossary.warnings.push({ file: rel, line: null, message: 'no "group" name' });

  if (data.avoid !== undefined && !Array.isArray(data.avoid)) {
    glossary.warnings.push({ file: rel, line: lines.avoid, message: '"avoid" should be a block list; ignored' });
    return group;
  }
  (data.avoid || []).forEach((item, i) => {
    const line = lines[`avoid[${i}]`] ?? lines.avoid;
    if (typeof item !== 'object' || typeof item.term !== 'string' || item.term.trim() === '') {
      glossary.warnings.push({ file: rel, line, message: 'avoid item has no "term"; ignored' });
      return;
    }
    const entry = {
      term: item.term,
      reason: typeof item.reason === 'string' ? item.reason : '',
      reservedBy: typeof item.reserved_by === 'string' ? item.reserved_by : '',
      allow: toList(item.allow),
      onlyIn: toList(item.only_in),
      line,
    };
    if (!entry.reservedBy && !entry.reason) {
      glossary.warnings.push({ file: rel, line, message: `avoid "${entry.term}" has no reason` });
    }
    group.avoid.push(entry);
  });
  return group;
}

function buildRules(glossary) {
  const byName = new Map(glossary.groups.filter((g) => g.name).map((g) => [g.name, g]));
  const indexTerms = readTermIndex(glossary.index.text).rows.map((row) => splitWords(cleanTerm(row.term))).filter((w) => w.length);
  const rules = [];
  for (const group of glossary.groups) {
    for (const entry of group.avoid) {
      // A group's own recorded names are never flagged by its own entries.
      const allow = new Set([...entry.allow, ...group.code]);
      const words = splitWords(entry.term);
      if (words.length === 0) continue;
      const rule = {
        kind: entry.reservedBy ? 'reserved' : 'avoid',
        term: entry.term,
        words,
        // Longer indexed terms containing this one name other concepts ("customer protocol" isn't "customer").
        longerTerms: indexTerms.filter((t) => t.length > words.length && matchStarts(t, words).length > 0),
        group: group.name || group.fileName,
        groupFile: group.file,
        reason: entry.reason,
        reservedBy: entry.reservedBy,
        allow,
        appliesTo: () => true,
      };
      if (entry.reservedBy) {
        // Naming the owning concept by its own identifiers (orderId inside Service delivery) is correct.
        const owner = byName.get(entry.reservedBy);
        if (owner) owner.code.forEach((id) => allow.add(id));
        const matchers = group.paths.map(globMatcher);
        rule.appliesTo = (file) => matchers.some((m) => m(file));
      } else if (entry.onlyIn.length) {
        const matchers = entry.onlyIn.map(globMatcher);
        rule.appliesTo = (file) => matchers.some((m) => m(file));
      }
      rules.push(rule);
    }
  }
  return rules;
}

function cleanTerm(term) {
  return term.replace(/\([^)]*\)/g, '').replace(/`/g, '').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Globs: *, ** and ?
// ---------------------------------------------------------------------------

function globToRegExp(glob) {
  let g = glob.trim().replace(/^\.\//, '');
  if (g.endsWith('/')) g += '**';
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') {
      const atSegmentStart = i === 0 || g[i - 1] === '/';
      const after = g[i + 2];
      if (atSegmentStart && after === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else if (atSegmentStart && after === undefined) {
        re += '.*';
        i += 1;
      } else {
        re += '[^/]*';
        i += 1;
      }
    } else if (c === '*') {
      re += '[^/]*';
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

// A pattern with no wildcards also matches everything under it, so "src/billing" works like "src/billing/**".
function globMatcher(glob) {
  const re = globToRegExp(glob);
  const plain = /[*?]/.test(glob) ? null : glob.trim().replace(/^\.\//, '').replace(/\/$/, '');
  return (file) => re.test(file) || (plain !== null && file.startsWith(`${plain}/`));
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

const IDENTIFIER = /[A-Za-z_$][A-Za-z0-9_$]*(?:-[A-Za-z0-9_$]+)*/g;

// activeJobs -> [active, jobs]; HTTPServer -> [http, server]; ACTIVE_ORDERS -> [active, orders]
function splitWords(identifier) {
  return identifier
    .split(/[^A-Za-z0-9]+/)
    .flatMap((part) => part.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z]+|\d+/g) || [])
    .map((w) => w.toLowerCase());
}

function pluralsOf(word) {
  const forms = new Set([word, `${word}s`, `${word}es`]);
  if (/[^aeiou]y$/.test(word)) forms.add(`${word.slice(0, -1)}ies`);
  return forms;
}

// Start positions where the term's words appear consecutively in the identifier's words.
// Only the last word may be plural, so "payment status" matches paymentStatuses.
function matchStarts(words, termWords) {
  const last = pluralsOf(termWords[termWords.length - 1]);
  const starts = [];
  for (let i = 0; i + termWords.length <= words.length; i++) {
    let ok = true;
    for (let j = 0; j < termWords.length; j++) {
      const w = words[i + j];
      if (j === termWords.length - 1 ? !last.has(w) : w !== termWords[j]) {
        ok = false;
        break;
      }
    }
    if (ok) starts.push(i);
  }
  return starts;
}

function matchesTerm(words, termWords) {
  return matchStarts(words, termWords).length > 0;
}

// True when the rule's term appears in the identifier other than as part of a longer indexed term:
// with "customer protocol" indexed, "customer" matches customerList but not customerProtocolIds.
function matchesRule(words, rule) {
  const longer = rule.longerTerms.flatMap((t) => matchStarts(words, t).map((s) => [s, s + t.length]));
  return matchStarts(words, rule.words).some((i) => !longer.some(([s, e]) => s <= i && i + rule.words.length <= e));
}

// Best effort: blanks out string literals and comments, keeping newlines so line numbers hold.
// Handles "...", '...', `...`, //, /* */, # and -- comments.
function stripStringsAndComments(text) {
  const out = text.split('');
  const n = text.length;
  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' ';
  };
  const lineEnd = (from) => {
    const e = text.indexOf('\n', from);
    return e === -1 ? n : e;
  };
  const isSpace = (c) => c === ' ' || c === '\t' || c === '\r' || c === '\n';
  let lineIsBlankSoFar = true;
  let i = 0;

  while (i < n) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '\n') {
      lineIsBlankSoFar = true;
      i++;
      continue;
    }

    let stop = -1;
    if (c === '/' && next === '*') {
      const e = text.indexOf('*/', i + 2);
      stop = e === -1 ? n : e + 2;
    } else if (c === '/' && next === '/') {
      stop = lineEnd(i);
    } else if (c === '#' && (lineIsBlankSoFar || (isSpace(text[i - 1]) && (next === undefined || isSpace(next))))) {
      // "# comment" or a # that starts a line; not #private, #fff or #{...}
      stop = lineEnd(i);
    } else if (c === '-' && next === '-' && (i === 0 || isSpace(text[i - 1])) && (text[i + 2] === undefined || isSpace(text[i + 2]))) {
      // "-- comment"; not --custom-property or x--
      stop = lineEnd(i);
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && text[j] !== c) {
        if (text[j] === '\\') j++;
        else if (text[j] === '\n' && c !== '`') break; // unterminated: stop at the end of the line
        j++;
      }
      stop = j < n && text[j] === c ? j + 1 : j;
    }

    if (stop !== -1) {
      blank(i, stop);
      i = stop;
      lineIsBlankSoFar = false;
      continue;
    }
    if (!isSpace(c)) lineIsBlankSoFar = false;
    i++;
  }
  return out.join('');
}

function isSkippedFile(file) {
  const base = path.posix.basename(file);
  return SKIPPED_NAMES.has(base) || SKIPPED_EXTENSIONS.has(path.posix.extname(base).toLowerCase());
}

function isBinary(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}

// Returns the identifiers in scope in one file, as { line, identifier }; line is null for the
// file name. `lines` is a Set of 1-based line numbers to read, or null for every line.
function scanFile(root, file, { lines, newName }) {
  const found = [];
  if (newName) {
    const stem = path.posix.basename(file).replace(/\.[^.]+$/, '');
    for (const identifier of stem.match(IDENTIFIER) || []) found.push({ line: null, identifier });
  }

  let buffer;
  try {
    buffer = fs.readFileSync(path.join(root, file));
  } catch {
    return found; // deleted or unreadable
  }
  if (isBinary(buffer)) return found;

  stripStringsAndComments(buffer.toString('utf8')).split('\n').forEach((text, index) => {
    const line = index + 1;
    if (lines && !lines.has(line)) return;
    for (const identifier of text.match(IDENTIFIER) || []) found.push({ line, identifier });
  });
  return found;
}

function findCandidates(file, occurrences, rules) {
  const applicable = rules.filter((r) => r.appliesTo(file));
  const candidates = [];
  const seen = new Set();
  for (const { line, identifier } of occurrences) {
    const words = splitWords(identifier);
    for (const rule of applicable) {
      if (rule.allow.has(identifier) || !matchesRule(words, rule)) continue;
      const key = `${line}|${identifier}|${rule.term}|${rule.group}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        file,
        line,
        newFile: line === null,
        identifier,
        term: rule.term,
        kind: rule.kind,
        group: rule.group,
        groupFile: rule.groupFile,
        reservedBy: rule.reservedBy || null,
        reason: rule.reason || null,
      });
    }
  }
  return candidates;
}

// Each group's words: every term the term index links to it. The group's own name is a label
// for a family ("Service delivery"), not a word used in code, so it isn't included.
function buildVocabulary(glossary) {
  const vocabulary = [];
  const rows = readTermIndex(glossary.index.text).rows;
  for (const group of glossary.groups) {
    const terms = new Set();
    for (const row of rows) {
      if (!row.links.some((l) => path.posix.basename(l.target) === group.fileName)) continue;
      const term = cleanTerm(row.term);
      if (term) terms.add(term);
    }
    for (const term of terms) {
      const words = splitWords(term);
      if (words.length) vocabulary.push({ group: group.name || group.fileName, term, words });
    }
  }
  return vocabulary;
}

// Identifiers in the diff that use a group's word and aren't already a candidate, a recorded
// code identifier or an allow entry. One per identifier per file, at its first line.
function findMentions(file, occurrences, candidates, vocabulary, known) {
  const flagged = new Set(candidates.map((c) => c.identifier));
  const byIdentifier = new Map();
  for (const { line, identifier } of occurrences) {
    if (flagged.has(identifier) || known.has(identifier) || byIdentifier.has(identifier)) continue;
    const words = splitWords(identifier);
    const groups = [];
    for (const v of vocabulary) {
      if (matchesTerm(words, v.words) && !groups.some((g) => g.group === v.group)) groups.push({ group: v.group, term: v.term });
    }
    if (groups.length) byIdentifier.set(identifier, { file, line, newFile: line === null, identifier, groups });
  }
  return [...byIdentifier.values()];
}

// ---------------------------------------------------------------------------
// Git
// ---------------------------------------------------------------------------

function git(root, args) {
  return execFileSync('git', ['-c', 'core.quotePath=false', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitOk(root, args) {
  try {
    git(root, args);
    return true;
  } catch {
    return false;
  }
}

function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    throw new UsageError('Not inside a git repository.');
  }
}

function listFiles(root) {
  return git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
    .split('\0')
    .filter(Boolean);
}

function defaultBase(root) {
  let branch = '';
  try {
    branch = git(root, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']).trim();
  } catch {
    branch = ['main', 'master'].find((b) => gitOk(root, ['rev-parse', '--verify', '--quiet', `${b}^{commit}`])) || '';
  }
  if (!branch) {
    throw new UsageError("Couldn't find the default branch (no origin/HEAD, main or master). Pass a base: --diff <base>");
  }
  try {
    return git(root, ['merge-base', 'HEAD', branch]).trim();
  } catch {
    throw new UsageError(`Couldn't find the merge base of HEAD and ${branch}. Pass a base: --diff <base>`);
  }
}

function unquotePath(p) {
  if (!p.startsWith('"')) return p;
  return p.slice(1, -1).replace(/\\(.)/g, '$1');
}

// Returns Map<file, { lines: Set<number>, newName: boolean }> for the working tree against `base`.
function changedFiles(root, base) {
  const changes = new Map();
  const entry = (file) => {
    if (!changes.has(file)) changes.set(file, { lines: new Set(), newName: false });
    return changes.get(file);
  };

  const diff = git(root, ['diff', '--no-color', '--no-ext-diff', '--unified=0', '-M', base, '--']);
  let current = null;
  let inHeader = false;
  let isNew = false;
  let lineNo = 0;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      current = null;
      inHeader = true;
      isNew = false;
      continue;
    }
    if (inHeader) {
      if (line.startsWith('new file mode')) isNew = true;
      else if (line.startsWith('rename to ')) {
        current = entry(unquotePath(line.slice('rename to '.length)));
        current.newName = true;
      } else if (line.startsWith('+++ ')) {
        const target = unquotePath(line.slice(4).replace(/\t$/, ''));
        current = target === '/dev/null' ? null : entry(target.replace(/^b\//, ''));
        if (current && isNew) current.newName = true;
      } else if (line.startsWith('@@')) {
        inHeader = false;
      }
    }
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      inHeader = false;
      lineNo = Number(hunk[1]);
      continue;
    }
    if (!inHeader && current && line.startsWith('+')) current.lines.add(lineNo++);
  }

  for (const file of git(root, ['ls-files', '-z', '--others', '--exclude-standard']).split('\0').filter(Boolean)) {
    changes.set(file, { lines: null, newName: true });
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Integrity
// ---------------------------------------------------------------------------

function checkIntegrity(root, glossary, allFiles) {
  const problems = [...glossary.problems];
  const warnings = [...glossary.warnings];
  const byName = new Map();

  for (const group of glossary.groups) {
    if (!group.name) continue;
    if (byName.has(group.name)) {
      problems.push({ check: 'groups', file: group.file, line: group.lines.group, message: `group "${group.name}" is also defined in ${byName.get(group.name).file}` });
    } else {
      byName.set(group.name, group);
    }
  }

  // reserved_by names an existing group
  for (const group of glossary.groups) {
    for (const entry of group.avoid) {
      if (!entry.reservedBy) continue;
      if (!byName.has(entry.reservedBy)) {
        problems.push({ check: 'reserved_by', file: group.file, line: entry.line, message: `"${entry.term}" is reserved_by "${entry.reservedBy}", but no group file has group: ${entry.reservedBy}` });
      }
      if (group.paths.length === 0) {
        warnings.push({ file: group.file, line: entry.line, message: `"${entry.term}" is reserved, but ${group.name || group.fileName} has no paths, so the script never flags it` });
      }
    }
  }

  // every code identifier still exists outside the glossary
  const identifiers = [...new Set(glossary.groups.flatMap((g) => g.code))];
  const found = findIdentifiers(root, identifiers, glossary.dir);
  for (const group of glossary.groups) {
    for (const id of group.code) {
      if (!found.has(id)) {
        problems.push({ check: 'code', file: group.file, line: group.lines.code, message: `code identifier \`${id}\` isn't found in the codebase` });
      }
    }
  }

  // every paths glob matches files
  for (const group of glossary.groups) {
    for (const glob of group.paths) {
      const match = globMatcher(glob);
      if (!allFiles.some(match)) {
        problems.push({ check: 'paths', file: group.file, line: group.lines.paths, message: `paths glob \`${glob}\` matches no files` });
      }
    }
    for (const entry of group.avoid) {
      if (entry.onlyIn.length && entry.reservedBy) {
        warnings.push({ file: group.file, line: entry.line, message: `"${entry.term}" has both reserved_by and only_in; only_in is ignored for reserved terms` });
        continue;
      }
      for (const glob of entry.onlyIn) {
        if (!allFiles.some(globMatcher(glob))) {
          problems.push({ check: 'paths', file: group.file, line: entry.line, message: `only_in glob \`${glob}\` for "${entry.term}" matches no files` });
        }
      }
    }
  }

  checkTermIndex(glossary, byName, problems);

  // reconciled_at is a commit in this repo
  const index = glossary.index;
  if (index.data) {
    const sha = index.data.reconciled_at;
    if (typeof sha !== 'string' || sha === '') {
      warnings.push({ file: index.file, line: null, message: 'no reconciled_at; Update will compare the whole scope' });
    } else if (!gitOk(root, ['cat-file', '-e', `${sha}^{commit}`])) {
      warnings.push({ file: index.file, line: index.lines.reconciled_at, message: `reconciled_at ${sha} isn't in this repo's history; Update will compare the whole scope` });
    }
  }

  return { problems, warnings, groups: glossary.groups.length, identifiers: identifiers.length };
}

// Which of `identifiers` appear as whole words outside the glossary: in the working tree
// (including untracked files), or at commit `rev` if given.
function findIdentifiers(root, identifiers, glossaryDir, rev = null) {
  const found = new Set();
  for (let i = 0; i < identifiers.length; i += 200) {
    const chunk = identifiers.slice(i, i + 200);
    const args = ['grep', ...(rev ? [] : ['--untracked']), '-I', '-w', '-o', '-h', '-F'];
    chunk.forEach((id) => args.push('-e', id));
    if (rev) args.push(rev);
    args.push('--', '.', `:(exclude)${glossaryDir}`);
    let out = '';
    try {
      out = git(root, args);
    } catch (err) {
      if (err.status !== 1) throw err; // 1 means no matches
    }
    out.split('\n').forEach((m) => found.add(m.trim()));
  }
  return found;
}

// Rows of the "## Term index" table: { term, line, links: [{ label, target }] }.
function readTermIndex(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s+Term index\s*$/i.test(l));
  if (start === -1) return { found: false, rows: [] };

  const rows = [];
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const row = lines[i].trim();
    if (!row.startsWith('|') || /^\|[\s:|-]+\|$/.test(row)) continue;
    const cells = row.slice(1, row.endsWith('|') ? -1 : undefined).split('|').map((c) => c.trim());
    if (cells.length < 2 || /^term$/i.test(cells[0])) continue;
    const links = [...cells[1].matchAll(/\[([^\]]+)\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map(([, label, target]) => ({ label, target }));
    rows.push({ term: cells[0], line: i + 1, links });
  }
  return { found: true, rows };
}

function checkTermIndex(glossary, byName, problems) {
  const { file, text } = glossary.index;
  const { found, rows } = readTermIndex(text);
  if (!found) {
    problems.push({ check: 'term-index', file, line: null, message: 'no "## Term index" section' });
    return;
  }

  const linked = new Set();
  for (const row of rows) {
    for (const { label, target } of row.links) {
      const name = path.posix.basename(target);
      linked.add(name);
      if (glossary.unreadable.has(name)) continue;
      const group = glossary.groups.find((g) => g.fileName === name);
      if (!group) {
        problems.push({ check: 'term-index', file, line: row.line, message: `"${row.term}" links to ${target}, which isn't a group file` });
      } else if (group.name && group.name !== label) {
        problems.push({ check: 'term-index', file, line: row.line, message: `"${row.term}" links to ${target} as "${label}", but its group is "${group.name}"` });
      }
    }
  }

  for (const group of glossary.groups) {
    if (!linked.has(group.fileName)) {
      problems.push({ check: 'term-index', file, line: null, message: `${group.fileName} (${group.name || 'no group name'}) isn't in the term index` });
    }
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = { mode: null, base: null, globs: [], glossary: null, json: false, strict: false };
  const setMode = (mode) => {
    if (opts.mode) throw new UsageError('Use only one of --diff, --paths and --integrity.');
    opts.mode = mode;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--diff') {
      setMode('diff');
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) opts.base = argv[++i];
    } else if (arg === '--paths') {
      setMode('paths');
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) opts.globs.push(argv[++i]);
      if (opts.globs.length === 0) throw new UsageError('--paths needs at least one glob.');
    } else if (arg === '--integrity') {
      setMode('integrity');
    } else if (arg === '--glossary') {
      opts.glossary = argv[++i];
      if (!opts.glossary) throw new UsageError('--glossary needs a directory.');
    } else if (arg === '--json') {
      opts.json = true;
    } else if (arg === '--strict') {
      opts.strict = true;
    } else {
      throw new UsageError(`Unknown argument "${arg}".`);
    }
  }
  if (!opts.mode) throw new UsageError('Pass one of --diff [<base>], --paths <glob>... or --integrity.');
  return opts;
}

function resolveGlossaryDir(root, arg) {
  if (arg) return path.relative(root, path.resolve(process.cwd(), arg)).split(path.sep).join('/');
  const found = DEFAULT_GLOSSARY_DIRS.find((d) => fs.existsSync(path.join(root, d, 'INDEX.md')));
  if (!found) {
    throw new UsageError(`No glossary found in ${DEFAULT_GLOSSARY_DIRS.join(', ')}. Pass --glossary <dir>.`);
  }
  return found;
}

function run(argv) {
  const opts = parseArgs(argv);
  const root = repoRoot();
  const glossaryDir = resolveGlossaryDir(root, opts.glossary);
  const glossary = loadGlossary(root, glossaryDir);
  const allFiles = listFiles(root);
  const integrity = checkIntegrity(root, glossary, allFiles);
  const result = { mode: opts.mode, glossary: glossaryDir, base: null, filesChecked: 0, candidates: [], mentions: [], integrity };
  if (opts.mode === 'integrity') return { opts, result };

  let targets;
  if (opts.mode === 'diff') {
    const base = opts.base || defaultBase(root);
    if (!gitOk(root, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`])) {
      throw new UsageError(`"${base}" isn't a commit in this repository.`);
    }
    result.base = base;
    targets = changedFiles(root, base);
  } else {
    const matchers = opts.globs.map(globMatcher);
    targets = new Map(allFiles.filter((f) => matchers.some((m) => m(f))).map((f) => [f, { lines: null, newName: false }]));
  }

  const rules = buildRules(glossary);
  const vocabulary = buildVocabulary(glossary);
  // Recorded names are already decided, so they're never mentions.
  const known = new Set(glossary.groups.flatMap((g) => [...g.code, ...g.avoid.flatMap((a) => a.allow)]));
  let mentions = [];
  for (const [file, change] of [...targets].sort(([a], [b]) => a.localeCompare(b))) {
    if (file.startsWith(`${glossaryDir}/`) || isSkippedFile(file)) continue;
    result.filesChecked++;
    const occurrences = scanFile(root, file, change);
    const candidates = findCandidates(file, occurrences, rules);
    result.candidates.push(...candidates);
    if (opts.mode === 'diff') mentions.push(...findMentions(file, occurrences, candidates, vocabulary, known));
  }

  // A mention is a new name: drop identifiers that already existed at the base.
  if (mentions.length) {
    const existing = findIdentifiers(root, [...new Set(mentions.map((m) => m.identifier))], glossaryDir, result.base);
    mentions = mentions.filter((m) => !existing.has(m.identifier));
  }
  result.mentions = mentions;
  return { opts, result };
}

function describe(c) {
  if (c.kind === 'reserved') return `"${c.term}" is reserved by ${c.reservedBy} (inside ${c.group} paths)`;
  const base = `"${c.term}" is an Avoid term in ${c.group}`;
  if (!c.reason) return base;
  const reason = c.reason.length > REASON_WIDTH ? `${c.reason.slice(0, REASON_WIDTH).trimEnd()}…` : c.reason;
  return `${base}: ${reason}`;
}

function location(file, line) {
  return line ? `${file}:${line}` : file;
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function table(rows, out) {
  const w0 = Math.max(0, ...rows.map((r) => r[0].length));
  const w1 = Math.max(0, ...rows.map((r) => r[1].length));
  rows.forEach((r) => out.push(`${r[0].padEnd(w0)}   ${r[1].padEnd(w1)}   ${r[2]}`));
}

function formatText({ mode, filesChecked, candidates, mentions, integrity }) {
  const out = [];
  const where = (x) => (x.newFile ? `${x.file} (new file)` : `${x.file}:${x.line}`);
  if (mode !== 'integrity') {
    table(candidates.map((c) => [where(c), c.identifier, describe(c)]), out);
    if (candidates.length) out.push('');
    if (mentions.length) {
      out.push('Mentions: new names using a group\'s word. Check each holds what its name says.');
      table(mentions.map((m) => [where(m), m.identifier, m.groups.map((g) => `${g.group} ("${g.term}")`).join(', ')]), out);
      out.push('');
    }
    const scope = mode === 'diff' ? 'changed files' : 'files';
    const counts = mode === 'diff'
      ? `${plural(candidates.length, 'candidate')} and ${plural(mentions.length, 'mention')}`
      : plural(candidates.length, 'candidate');
    const note = candidates.length + mentions.length ? ' These are candidates, not verdicts: review each one.' : '';
    out.push(`${counts} in ${filesChecked} ${scope}.${note}`);
  }

  const { problems, warnings } = integrity;
  if (problems.length === 0) {
    out.push(`Integrity: OK (${integrity.groups} group files, ${integrity.identifiers} code identifiers)`);
  } else {
    out.push(`Integrity: ${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}`);
    problems.forEach((p) => out.push(`  ${location(p.file, p.line)}  ${p.message}`));
  }
  if (warnings.length) {
    out.push('Warnings:');
    warnings.forEach((w) => out.push(`  ${location(w.file, w.line)}  ${w.message}`));
  }
  return out.join('\n');
}

function main(argv) {
  let opts;
  let result;
  try {
    ({ opts, result } = run(argv));
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(err.message);
      return 2;
    }
    console.error(`glossary-check failed: ${err.stderr ? String(err.stderr).trim() : err.message}`);
    return 2;
  }

  console.log(opts.json ? JSON.stringify(result, null, 2) : formatText(result));
  const reported = opts.mode === 'integrity' ? result.integrity.problems.length : result.candidates.length;
  return opts.strict && reported > 0 ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = { parseFrontmatter, FrontmatterError, splitWords, matchesTerm, globToRegExp, globMatcher, stripStringsAndComments };
