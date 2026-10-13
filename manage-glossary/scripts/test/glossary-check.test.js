// Tests for glossary-check.js. Run from the skill directory:
//   node --test scripts/test/*.test.js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'glossary-check.js');
const {
  parseFrontmatter,
  FrontmatterError,
  splitWords,
  matchesTerm,
  globMatcher,
  stripStringsAndComments,
} = require(SCRIPT);

const GLOSSARY = 'documentation/conventions/glossary';

const INDEX = `---
schema: 1
reconciled_at: HEAD_PLACEHOLDER
---
# Glossary

## Watch list
- **order** means the purchase only.

## Term index
| Term | Belongs to |
|---|---|
| fulfilment | [Fulfilment](fulfilment.md) |
| job | [Fulfilment](fulfilment.md) (business name) |
| order | [Order](order.md), not service progress |

## Naming rules
- **Booleans:** \`is\`/\`has\` prefix.

## Open decisions
- None.
`;

const FULFILMENT = `---
schema: 1
group: Fulfilment
paths: [src/fulfilment/**]
code: [Fulfilment, fulfilments, activeFulfilments]
avoid:
  - term: job
    reason: "UI-only name (Job in the staff app); code has used Fulfilment since the 2024 rename"
  - term: order
    reserved_by: Order
    allow: [sortOrder, orderBy]
---
# Fulfilment
`;

const ORDER = `---
schema: 1
group: Order
paths: [src/order/**]
code: [Order, orderId]
avoid:
  - term: payment status
    reason: "use paymentState"
---
# Order
`;

const FULFILMENT_CODE = `export class Fulfilment {}
export const fulfilments = [];
export const activeFulfilments = [];
`;

const ORDER_CODE = `export class Order { orderId = 1; }
`;

function sh(cwd, cmd, ...args) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function write(root, file, content) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

// A committed repo with a valid glossary and clean code. `files` overrides or adds files before the commit.
function makeRepo(files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glossary-check-'));
  sh(root, 'git', 'init', '-q', '-b', 'main');
  sh(root, 'git', 'config', 'user.email', 'test@example.com');
  sh(root, 'git', 'config', 'user.name', 'Test');
  sh(root, 'git', 'config', 'commit.gpgsign', 'false');
  const all = {
    [`${GLOSSARY}/INDEX.md`]: INDEX,
    [`${GLOSSARY}/fulfilment.md`]: FULFILMENT,
    [`${GLOSSARY}/order.md`]: ORDER,
    'src/fulfilment/model.ts': FULFILMENT_CODE,
    'src/order/model.ts': ORDER_CODE,
    ...files,
  };
  for (const [file, content] of Object.entries(all)) if (content !== null) write(root, file, content);
  sh(root, 'git', 'add', '-A');
  sh(root, 'git', 'commit', '-q', '-m', 'initial');
  const head = sh(root, 'git', 'rev-parse', '--short', 'HEAD').trim();
  const indexPath = path.join(root, GLOSSARY, 'INDEX.md');
  if (fs.existsSync(indexPath) && fs.readFileSync(indexPath, 'utf8').includes('HEAD_PLACEHOLDER')) {
    fs.writeFileSync(indexPath, fs.readFileSync(indexPath, 'utf8').replace('HEAD_PLACEHOLDER', head));
    sh(root, 'git', 'commit', '-q', '-am', 'set reconciled_at');
  }
  return root;
}

function run(root, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: root, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

function runJson(root, ...args) {
  const r = run(root, ...args, '--json');
  assert.equal(r.code, 0, r.stderr);
  return JSON.parse(r.stdout);
}

const ids = (result) => result.candidates.map((c) => c.identifier).sort();

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

test('splitWords handles each case style', () => {
  assert.deepEqual(splitWords('activeJobs'), ['active', 'jobs']);
  assert.deepEqual(splitWords('JobCard'), ['job', 'card']);
  assert.deepEqual(splitWords('active_jobs'), ['active', 'jobs']);
  assert.deepEqual(splitWords('active-jobs'), ['active', 'jobs']);
  assert.deepEqual(splitWords('ACTIVE_JOBS'), ['active', 'jobs']);
  assert.deepEqual(splitWords('HTTPJobQueue'), ['http', 'job', 'queue']);
  assert.deepEqual(splitWords('jobs2024'), ['jobs', '2024']);
});

test('matchesTerm matches plurals and multi-word terms', () => {
  const m = (id, term) => matchesTerm(splitWords(id), splitWords(term));
  assert.ok(m('activeJobs', 'job'));
  assert.ok(m('job', 'job'));
  assert.ok(m('entities', 'entity'));
  assert.ok(m('boxes', 'box'));
  assert.ok(m('paymentStatus', 'payment status'));
  assert.ok(m('PAYMENT_STATUSES', 'payment status'));
  assert.ok(!m('jobber', 'job'));
  assert.ok(!m('ordered', 'order'));
  assert.ok(!m('statusOfPayment', 'payment status'));
  assert.ok(!m('payment', 'payment status'));
});

test('globMatcher supports *, ** and ?', () => {
  const g = (glob, file) => globMatcher(glob)(file);
  assert.ok(g('src/fulfilment/**', 'src/fulfilment/a/b.ts'));
  assert.ok(!g('src/fulfilment/**', 'src/fulfilments/a.ts'));
  assert.ok(g('src/*.ts', 'src/a.ts'));
  assert.ok(!g('src/*.ts', 'src/a/b.ts'));
  assert.ok(g('**/*.ts', 'a.ts'));
  assert.ok(g('**/*.ts', 'src/deep/a.ts'));
  assert.ok(g('src/**/test/*.ts', 'src/test/a.ts'));
  assert.ok(g('src/**/test/*.ts', 'src/x/y/test/a.ts'));
  assert.ok(g('src/?.ts', 'src/a.ts'));
  assert.ok(!g('src/?.ts', 'src/ab.ts'));
  assert.ok(g('src/billing', 'src/billing/invoice.ts'));
  assert.ok(g('src/billing/', 'src/billing/invoice.ts'));
  assert.ok(g('./src/*.ts', 'src/a.ts'));
  assert.ok(g('src/a.b+c.ts', 'src/a.b+c.ts'));
  assert.ok(!g('src/a.b.ts', 'src/aXb.ts'));
});

test('stripStringsAndComments blanks strings and comments but keeps lines', () => {
  const src = [
    'const a = "job"; // job',
    "const b = 'job';",
    'const c = `job',
    'job`;',
    '/* job',
    '   job */ const d = 1;',
    '# job',
    'x = 1  # job',
    '-- job',
    'this.#jobCount = 1; color: #job;',
    '--job-color: red; i--;',
  ].join('\n');
  const out = stripStringsAndComments(src).split('\n');
  assert.equal(out.length, 11);
  for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8]) assert.ok(!/job/.test(out[i]), `line ${i + 1}: ${out[i]}`);
  assert.match(out[5], /const d = 1;/);
  assert.match(out[9], /#jobCount/);
  assert.match(out[9], /#job;/);
  assert.match(out[10], /--job-color/);
});

test('parseFrontmatter reads the subset', () => {
  const { data, lines } = parseFrontmatter(FULFILMENT);
  assert.equal(data.schema, '1');
  assert.equal(data.group, 'Fulfilment');
  assert.deepEqual(data.paths, ['src/fulfilment/**']);
  assert.equal(data.avoid.length, 2);
  assert.equal(data.avoid[0].reason, 'UI-only name (Job in the staff app); code has used Fulfilment since the 2024 rename');
  assert.deepEqual(data.avoid[1].allow, ['sortOrder', 'orderBy']);
  assert.equal(lines.avoid, 6);
  assert.equal(lines['avoid[1]'], 9);
});

test('parseFrontmatter handles quoting, escapes, comments and empty lists', () => {
  const { data } = parseFrontmatter([
    '---',
    '# a comment',
    '',
    'a: "say \\"hi\\" \\\\ there: # ok"',
    'b: ["x, y", z]',
    'c: []',
    '---',
  ].join('\n'));
  assert.equal(data.a, 'say "hi" \\ there: # ok');
  assert.deepEqual(data.b, ['x, y', 'z']);
  assert.deepEqual(data.c, []);
});

test('parseFrontmatter rejects anything outside the subset, with a line number', () => {
  const cases = [
    ['a: b\n  nested: c', 3, /indentation/],
    ['list:\n  - plain', 3, /flow list/],
    ['a: x: y', 2, /": "/],
    ['a: x # note', 2, /inline comments/],
    ['a: &anchor x', 2, /double-quoted/],
    ['a: |', 2, /double-quoted/],
    ["a: 'single'", 2, /double-quoted/],
    ['a: "unterminated', 2, /closing quote/],
    ['a: "bad \\n escape"', 2, /escapes/],
    ['a: [x, [y]]', 2, /nested lists/],
    ['a: [x', 2, /closing "\]"/],
    ['a: 1\na: 2', 3, /twice/],
    ['avoid:\n  - term: x\n      reason: "y"', 4, /lined up/],
    ['avoid:\n  - term: x\n    nested:', 4, /needs a value/],
  ];
  for (const [body, line, message] of cases) {
    assert.throws(() => parseFrontmatter(`---\n${body}\n---\n`), (err) => {
      assert.ok(err instanceof FrontmatterError, body);
      assert.equal(err.line, line, body);
      assert.match(err.message, message, body);
      return true;
    });
  }
  assert.throws(() => parseFrontmatter('# no frontmatter'), /start with/);
  assert.throws(() => parseFrontmatter('---\na: b\n'), /closing/);
});

// ---------------------------------------------------------------------------
// --diff and --paths
// ---------------------------------------------------------------------------

test('lost variants are flagged anywhere, reserved terms only inside the group paths', () => {
  const root = makeRepo();
  write(root, 'src/fulfilment/list.ts', 'const activeOrders = [];\nconst jobs = [];\n');
  write(root, 'src/reports/summary.ts', 'const activeOrders = [];\nconst jobCount = 0;\n');
  const result = runJson(root, '--diff', 'HEAD');

  const byFile = (f) => result.candidates.filter((c) => c.file === f).map((c) => `${c.identifier}:${c.kind}`).sort();
  assert.deepEqual(byFile('src/fulfilment/list.ts'), ['activeOrders:reserved', 'jobs:avoid']);
  assert.deepEqual(byFile('src/reports/summary.ts'), ['jobCount:avoid']);
});

test('allow lists and the owning group\'s code identifiers are skipped', () => {
  const root = makeRepo();
  write(root, 'src/fulfilment/sort.ts', 'const sortOrder = 1;\nlet orderBy;\nconst o = new Order();\nconst x = orderId;\nconst order = 1;\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(ids(result), ['order']);
});

test('multi-word terms are matched across words', () => {
  const root = makeRepo();
  write(root, 'src/billing/pay.ts', 'const paymentStatus = 1;\nconst PAYMENT_STATUSES = [];\nconst payment = 2;\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(ids(result), ['PAYMENT_STATUSES', 'paymentStatus']);
});

test('strings and comments are skipped', () => {
  const root = makeRepo();
  write(root, 'src/web/labels.ts', 'const label = "Job"; // job title\nconst title = t(\'jobs.heading\');\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(result.candidates, []);
});

test('--diff includes committed, uncommitted and untracked changes, and new file names', () => {
  const root = makeRepo();
  const base = sh(root, 'git', 'rev-parse', 'HEAD').trim();

  write(root, 'src/committed.ts', 'const committedJob = 1;\n');
  sh(root, 'git', 'add', '-A');
  sh(root, 'git', 'commit', '-q', '-m', 'feature');

  fs.appendFileSync(path.join(root, 'src/order/model.ts'), 'const stagedJob = 1;\n');
  sh(root, 'git', 'add', '-A');
  fs.appendFileSync(path.join(root, 'src/order/model.ts'), 'const unstagedJob = 1;\n');
  write(root, 'src/web/JobCard.tsx', 'export const card = 1;\n');

  const result = runJson(root, '--diff', base);
  const found = result.candidates.map((c) => `${c.file}:${c.line ?? 'name'}:${c.identifier}`).sort();
  assert.deepEqual(found, [
    'src/committed.ts:1:committedJob',
    'src/order/model.ts:2:stagedJob',
    'src/order/model.ts:3:unstagedJob',
    'src/web/JobCard.tsx:name:JobCard',
  ]);
  assert.equal(result.filesChecked, 3);
});

test('--diff only checks added lines, and ignores the glossary, prose and .gitignored files', () => {
  const root = makeRepo({ 'src/old.ts': 'const oldJob = 1;\n', '.gitignore': 'build/\n' });
  fs.appendFileSync(path.join(root, 'src/old.ts'), 'const fine = 2;\n');
  write(root, 'build/out.js', 'const builtJob = 1;\n');
  write(root, 'notes/jobs.md', 'Jobs are great.\n');
  fs.appendFileSync(path.join(root, GLOSSARY, 'order.md'), 'job\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(result.candidates, []);
});

test('--diff without a base uses the merge base with main', () => {
  const root = makeRepo();
  sh(root, 'git', 'checkout', '-q', '-b', 'feature');
  write(root, 'src/feature.ts', 'const featureJob = 1;\n');
  sh(root, 'git', 'add', '-A');
  sh(root, 'git', 'commit', '-q', '-m', 'feature');
  const result = runJson(root, '--diff');
  assert.deepEqual(ids(result), ['featureJob']);
  assert.equal(result.base, sh(root, 'git', 'rev-parse', 'main').trim());
});

test('--paths checks whole files matching the globs', () => {
  const root = makeRepo({
    'src/fulfilment/old.ts': 'const activeOrders = 1;\n',
    'src/reports/old.ts': 'const jobs = 1;\n',
  });
  const result = runJson(root, '--paths', 'src/fulfilment/**');
  assert.deepEqual(ids(result), ['activeOrders']);
  const all = runJson(root, '--paths', 'src/**');
  assert.deepEqual(ids(all), ['activeOrders', 'jobs']);
});

test('text output lists candidates and the integrity line', () => {
  const root = makeRepo();
  write(root, 'src/fulfilment/ActiveList.tsx', 'const activeOrders = [];\n');
  write(root, 'src/web/JobCard.tsx', 'export const card = 1;\n');
  const r = run(root, '--diff', 'HEAD');
  assert.equal(r.code, 0);
  assert.match(r.stdout, /src\/fulfilment\/ActiveList\.tsx:1 +activeOrders +"order" is reserved by Order \(inside Fulfilment paths\)/);
  assert.match(r.stdout, /src\/web\/JobCard\.tsx \(new file\) +JobCard +"job" is an Avoid term in Fulfilment: UI-only name/);
  assert.match(r.stdout, /2 candidates and 0 mentions in 2 changed files\. These are candidates, not verdicts/);
  assert.match(r.stdout, /Integrity: OK/);
});

// ---------------------------------------------------------------------------
// Mentions
// ---------------------------------------------------------------------------

test('mentions are new names in the diff that use a group\'s word, anywhere', () => {
  const root = makeRepo();
  write(root, 'src/reports/weekly.ts', 'export const recentOrders = repo.listCompleted();\nconst crewFulfilmentMap = {};\n');
  write(root, 'src/web/OrderSummary.tsx', 'export const summary = 1;\n');
  const result = runJson(root, '--diff', 'HEAD');
  const found = result.mentions.map((m) => `${m.file}:${m.line ?? 'name'}:${m.identifier}:${m.groups.map((g) => g.group).join('+')}`).sort();
  assert.deepEqual(found, [
    'src/reports/weekly.ts:1:recentOrders:Order',
    'src/reports/weekly.ts:2:crewFulfilmentMap:Fulfilment',
    'src/web/OrderSummary.tsx:name:OrderSummary:Order',
  ]);
});

test('mentions skip names that existed at the base, lines outside the diff, candidates, code and allow entries', () => {
  const root = makeRepo({ 'src/reports/old.ts': 'export const legacyOrderTotal = 1;\nexport const oldOrders = [];\n' });
  fs.appendFileSync(path.join(root, 'src/reports/old.ts'), 'export const again = legacyOrderTotal;\n');
  write(root, 'src/fulfilment/list.ts', 'const activeOrders = [];\nconst sortOrder = 1;\nconst x = orderId;\nconst jobs = [];\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(result.mentions, []);
  assert.deepEqual(ids(result), ['activeOrders', 'jobs']);
});

test('mentions list each identifier once per file, with every group it points to', () => {
  const root = makeRepo();
  write(root, 'src/reports/link.ts', 'const orderFulfilmentLinks = [];\nuse(orderFulfilmentLinks);\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.equal(result.mentions.length, 1);
  assert.equal(result.mentions[0].line, 1);
  assert.deepEqual(result.mentions[0].groups.map((g) => g.group).sort(), ['Fulfilment', 'Order']);
  const text = run(root, '--diff', 'HEAD').stdout;
  assert.match(text, /Mentions: new names/);
  assert.match(text, /src\/reports\/link\.ts:1 +orderFulfilmentLinks +(Fulfilment \("fulfilment"\), Order \("order"\)|Order \("order"\), Fulfilment \("fulfilment"\))/);
  assert.match(text, /0 candidates and 1 mention in 1 changed files/);
});

test('only_in limits a lost variant to its paths, and the group\'s own code is never flagged', () => {
  const people = `---
schema: 1
group: People
code: [Customers, customerId]
avoid:
  - term: customer
    reason: "frontend says patient"
    only_in: [src/web/**]
  - term: patient
    reason: "backend says customer"
    only_in: [src/server/**]
---
# People
`;
  const index = INDEX.replace('| job |', '| customer | [People](people.md) |\n| patient | [People](people.md) |\n| job |');
  const root = makeRepo({
    [`${GLOSSARY}/INDEX.md`]: index,
    [`${GLOSSARY}/people.md`]: people,
    'src/server/db.ts': 'export const Customers = {};\nexport const customerId = 1;\n',
    'src/web/existing.ts': 'export const placeholder = 1;\n',
  });
  write(root, 'src/web/list.tsx', 'const customerList = [];\nconst patientList = [];\nconst x = row.customerId;\n');
  write(root, 'src/server/stats.ts', 'const patientCount = 1;\nconst customerCount = 2;\nCustomers.find();\n');
  write(root, 'src/shared/both.ts', 'const customerThing = 1;\nconst patientThing = 2;\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(result.candidates.map((c) => `${c.file}:${c.identifier}`).sort(), [
    'src/server/stats.ts:patientCount',
    'src/web/list.tsx:customerList',
  ]);
  assert.deepEqual(result.integrity.problems, []);
});

test('--integrity reports only_in globs that match nothing, and only_in on a reserved term', () => {
  const root = makeRepo({
    [`${GLOSSARY}/order.md`]: ORDER.replace('    reason: "use paymentState"', '    reason: "use paymentState"\n    only_in: [src/nowhere/**]'),
    [`${GLOSSARY}/fulfilment.md`]: FULFILMENT.replace('    reserved_by: Order', '    reserved_by: Order\n    only_in: [src/**]'),
  });
  const { problems, warnings } = runJson(root, '--integrity').integrity;
  assert.ok(problems.some((p) => /only_in glob `src\/nowhere\/\*\*`/.test(p.message)));
  assert.ok(warnings.some((w) => /both reserved_by and only_in/.test(w.message)));
});

test('a match inside a longer indexed term isn\'t flagged', () => {
  const index = INDEX.replace('| order |', '| order line item | [Order](order.md) |\n| order |');
  const root = makeRepo({ [`${GLOSSARY}/INDEX.md`]: index });
  write(root, 'src/fulfilment/lines.ts', 'const orderLineItems = [];\nconst activeOrders = [];\nconst orderLineCount = 1;\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(ids(result), ['activeOrders', 'orderLineCount']);
});

test('family groups: term index anchors, multi-word group names, and vocabulary from the index only', () => {
  const index = INDEX
    .replace('| fulfilment | [Fulfilment](fulfilment.md) |', '| fulfilment | [Service delivery](fulfilment.md#fulfilment) |\n| visit | [Service delivery](fulfilment.md#visit) |')
    .replace('| job | [Fulfilment](fulfilment.md) (business name) |', '| job | [Service delivery](fulfilment.md#fulfilment) (business name) |');
  const root = makeRepo({
    [`${GLOSSARY}/INDEX.md`]: index,
    [`${GLOSSARY}/fulfilment.md`]: FULFILMENT.replace('group: Fulfilment', 'group: Service delivery').replace('activeFulfilments]', 'activeFulfilments, Visit]'),
    'src/fulfilment/model.ts': `${FULFILMENT_CODE}export class Visit {}\n`,
  });
  const integrity = runJson(root, '--integrity').integrity;
  assert.deepEqual(integrity.problems, []);

  write(root, 'src/reports/crew.ts', 'const missedVisits = [];\nconst serviceDeliveryReport = {};\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(result.mentions.map((m) => `${m.identifier}:${m.groups[0].group}:${m.groups[0].term}`), ['missedVisits:Service delivery:visit']);
});

test('--paths doesn\'t list mentions', () => {
  const root = makeRepo({ 'src/reports/old.ts': 'export const recentOrders = [];\n' });
  const result = runJson(root, '--paths', 'src/**');
  assert.deepEqual(result.mentions, []);
});

// ---------------------------------------------------------------------------
// Frontmatter errors and schema versions
// ---------------------------------------------------------------------------

test('a group file outside the subset is reported with its line and skipped; others still checked', () => {
  const root = makeRepo({ [`${GLOSSARY}/order.md`]: '---\nschema: 1\ngroup: Order\ncode: [Order\n---\n' });
  write(root, 'src/fulfilment/list.ts', 'const jobs = [];\n');
  const result = runJson(root, '--diff', 'HEAD');
  assert.deepEqual(ids(result), ['jobs']);
  const problem = result.integrity.problems.find((p) => p.check === 'frontmatter');
  assert.equal(problem.file, `${GLOSSARY}/order.md`);
  assert.equal(problem.line, 4);
});

test('newer and older schema versions produce warnings, and the script still checks', () => {
  const newer = makeRepo({ [`${GLOSSARY}/fulfilment.md`]: FULFILMENT.replace('schema: 1', 'schema: 2\nfuture_field: x') });
  write(newer, 'src/fulfilment/list.ts', 'const jobs = [];\n');
  const n = runJson(newer, '--diff', 'HEAD');
  assert.deepEqual(ids(n), ['jobs']);
  assert.ok(n.integrity.warnings.some((w) => /newer than this script/.test(w.message)));

  const older = makeRepo({ [`${GLOSSARY}/fulfilment.md`]: FULFILMENT.replace('schema: 1', 'schema: 0') });
  const o = runJson(older, '--integrity');
  assert.ok(o.integrity.warnings.some((w) => /Run Update to migrate/.test(w.message)));
});

test('missing keys produce warnings, not crashes', () => {
  const root = makeRepo({
    [`${GLOSSARY}/order.md`]: '---\nschema: 1\ngroup: Order\ncode: [Order]\navoid:\n  - reason: "no term"\n  - term: booking\n---\n',
  });
  const result = runJson(root, '--integrity');
  const messages = result.integrity.warnings.map((w) => w.message);
  assert.ok(messages.some((m) => /no "term"/.test(m)));
  assert.ok(messages.some((m) => /"booking" has no reason/.test(m)));
});

// ---------------------------------------------------------------------------
// --integrity
// ---------------------------------------------------------------------------

test('--integrity passes on a valid glossary', () => {
  const root = makeRepo();
  const r = run(root, '--integrity');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^Integrity: OK \(2 group files, 5 code identifiers\)$/m);
  assert.doesNotMatch(r.stdout, /Warnings/);
});

test('--integrity reports code identifiers that no longer exist', () => {
  const root = makeRepo({ 'src/fulfilment/model.ts': 'export class Fulfilment {}\nexport const fulfilments = [];\n' });
  const result = runJson(root, '--integrity');
  const problems = result.integrity.problems.filter((p) => p.check === 'code');
  assert.equal(problems.length, 1);
  assert.match(problems[0].message, /`activeFulfilments`/);
  assert.equal(problems[0].line, 5);
});

test('--integrity reports reserved_by naming a missing group', () => {
  const root = makeRepo({ [`${GLOSSARY}/fulfilment.md`]: FULFILMENT.replace('reserved_by: Order', 'reserved_by: Orders') });
  const result = runJson(root, '--integrity');
  assert.ok(result.integrity.problems.some((p) => p.check === 'reserved_by' && /"Orders"/.test(p.message)));
});

test('--integrity reports paths globs that match no files', () => {
  const root = makeRepo({ [`${GLOSSARY}/order.md`]: ORDER.replace('src/order/**', 'src/orders/**') });
  const result = runJson(root, '--integrity');
  assert.ok(result.integrity.problems.some((p) => p.check === 'paths' && /src\/orders\/\*\*/.test(p.message)));
});

test('--integrity reports a term index that doesn\'t match the group files', () => {
  const index = INDEX
    .replace('| order | [Order](order.md), not service progress |\n', '')
    .replace('[Fulfilment](fulfilment.md) (business name)', '[Fulfillment](fulfilment.md) (business name)')
    + '';
  const root = makeRepo({
    [`${GLOSSARY}/INDEX.md`]: index.replace('| fulfilment |', '| visit | [Visit](visit.md) |\n| fulfilment |'),
  });
  const messages = runJson(root, '--integrity').integrity.problems.filter((p) => p.check === 'term-index').map((p) => p.message);
  assert.ok(messages.some((m) => /order\.md \(Order\) isn't in the term index/.test(m)), messages.join('\n'));
  assert.ok(messages.some((m) => /as "Fulfillment", but its group is "Fulfilment"/.test(m)), messages.join('\n'));
  assert.ok(messages.some((m) => /visit\.md, which isn't a group file/.test(m)), messages.join('\n'));
});

test('--integrity warns when reconciled_at isn\'t in the history', () => {
  const root = makeRepo({ [`${GLOSSARY}/INDEX.md`]: INDEX.replace('HEAD_PLACEHOLDER', 'deadbee') });
  const result = runJson(root, '--integrity');
  assert.ok(result.integrity.warnings.some((w) => /reconciled_at deadbee/.test(w.message)));
});

// ---------------------------------------------------------------------------
// Exit codes
// ---------------------------------------------------------------------------

test('exit codes with and without --strict', () => {
  const root = makeRepo();
  assert.equal(run(root, '--diff', 'HEAD', '--strict').code, 0);
  write(root, 'src/web/jobs.ts', 'const jobs = [];\n');
  assert.equal(run(root, '--diff', 'HEAD').code, 0);
  assert.equal(run(root, '--diff', 'HEAD', '--strict').code, 1);

  assert.equal(run(root, '--integrity', '--strict').code, 0);
  const broken = makeRepo({ [`${GLOSSARY}/order.md`]: ORDER.replace('src/order/**', 'src/nope/**') });
  assert.equal(run(broken, '--integrity').code, 0);
  assert.equal(run(broken, '--integrity', '--strict').code, 1);
});

test('exit 2 when the glossary can\'t be read or the arguments are wrong', () => {
  const root = makeRepo({ [`${GLOSSARY}/INDEX.md`]: null, [`${GLOSSARY}/fulfilment.md`]: null, [`${GLOSSARY}/order.md`]: null });
  const missing = run(root, '--integrity');
  assert.equal(missing.code, 2);
  assert.match(missing.stderr, /No glossary found/);

  const ok = makeRepo();
  assert.equal(run(ok, '--diff', 'not-a-commit').code, 2);
  assert.equal(run(ok).code, 2);
  assert.equal(run(ok, '--diff', '--integrity').code, 2);
});

test('--glossary points at a non-default location', () => {
  const root = makeRepo({
    [`${GLOSSARY}/INDEX.md`]: null,
    [`${GLOSSARY}/fulfilment.md`]: null,
    [`${GLOSSARY}/order.md`]: null,
    'handbook/terms/INDEX.md': INDEX,
    'handbook/terms/fulfilment.md': FULFILMENT,
    'handbook/terms/order.md': ORDER,
  });
  write(root, 'src/web/list.ts', 'const jobs = [];\n');
  const result = runJson(root, '--diff', 'HEAD', '--glossary', 'handbook/terms');
  assert.equal(result.glossary, 'handbook/terms');
  assert.deepEqual(ids(result), ['jobs']);
});
