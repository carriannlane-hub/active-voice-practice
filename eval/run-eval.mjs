/*
  Runs eval/cases.json against one or more models with the shared grader prompt.
  Usage: node eval/run-eval.mjs claude-haiku-5-5 claude-opus-5-5
  Each case runs twice per model so flips between runs show up.
  Writes eval/results.json and prints a comparison.
*/
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { SENTENCES } from '../src/sentences.js';
import { SYSTEM_PROMPT, OUTPUT_SCHEMA, userMessage } from '../lib/grader-prompt.js';

const models = process.argv.slice(2);
if (models.length === 0) { console.error('Give at least one model id.'); process.exit(1); }
const RUNS = 2;
const CONCURRENCY = 4;

const cases = JSON.parse(fs.readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
const originals = Object.fromEntries(SENTENCES.map((s) => [s.id, s.original]));
const client = new Anthropic();

const grade = async (model, c) => {
  const t0 = Date.now();
  const res = await client.messages.create({
    model,
    max_tokens: 512,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage(originals[c.sentence], c.text) }]
  });
  const ms = Date.now() - t0;
  if (res.stop_reason === 'refusal') return { error: 'refusal', ms };
  const text = res.content.find((b) => b.type === 'text')?.text ?? '';
  try { return { ...JSON.parse(text), ms, usage: res.usage }; } catch { return { error: 'bad json', raw: text, ms }; }
};

/* SOFT_MEANING=1: a meaning flag on an active sentence is a pass with a note, not a fail.
   The app would show "That is active voice" plus a one-line check, never a red panel. */
const SOFT = process.env.SOFT_MEANING === '1';

/* Compare one model answer with the expectation. Returns a list of mismatch reasons. */
const judge = (c, r) => {
  const why = [];
  if (r.error) return [`error: ${r.error}`];
  const softNote = SOFT && r.voice === 'active' && r.issue === 'meaning_changed';
  const pass = r.voice === 'active' && (r.issue === 'none' || softNote);
  /* Under soft scoring, a case that only expected "meaning_changed" now expects pass with a note. */
  const expectPass = c.expect.pass || (SOFT && c.expect.issue && c.expect.issue.every((i) => i === 'meaning_changed'));
  const noteAcceptable = softNote && c.expect.issue && c.expect.issue.includes('meaning_changed');
  if (pass !== expectPass && !noteAcceptable) why.push(`expected ${expectPass ? 'pass' : 'fail'}, got ${pass ? 'pass' : 'fail'} (${r.issue})`);
  if (!c.expect.pass && c.expect.issue && !c.expect.issue.includes(r.issue)) why.push(`issue ${r.issue}, expected ${c.expect.issue.join('/')}`);
  if (c.expect.pass) {
    const want = c.expect.stronger;
    const got = r.stronger_verb ? r.stronger_verb.toLowerCase().trim() : null;
    if (want && !got) why.push(`missed stronger verb (${want})`);
    if (!want && got) why.push(`unwanted stronger verb (${got})`);
    if (want && got && got !== want) why.push(`stronger verb ${got}, expected ${want}`);
  }
  return why;
};

const pool = async (items, fn) => {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
};

const pick = (r) => (r.error ? { error: r.error } : { voice: r.voice, issue: r.issue, doer: r.doer, verb: r.verb, stronger: r.stronger_verb });

const results = {};
for (const model of models) {
  const jobs = [];
  for (const c of cases) for (let run = 0; run < RUNS; run++) jobs.push({ c, run });
  const answers = await pool(jobs, async ({ c, run }) => ({ id: c.id, run, answer: await grade(model, c) }));
  results[model] = {};
  for (const a of answers) (results[model][a.id] ||= [])[a.run] = a.answer;
  const lat = answers.map((a) => a.answer.ms).sort((x, y) => x - y);
  results[model]._latency = { median: lat[Math.floor(lat.length / 2)], p90: lat[Math.floor(lat.length * 0.9)], max: lat[lat.length - 1] };
  const inTok = answers.reduce((s, a) => s + (a.answer.usage?.input_tokens || 0) + (a.answer.usage?.cache_read_input_tokens || 0) + (a.answer.usage?.cache_creation_input_tokens || 0), 0);
  const outTok = answers.reduce((s, a) => s + (a.answer.usage?.output_tokens || 0), 0);
  results[model]._tokens = { calls: answers.length, input: inTok, output: outTok };
}
fs.writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify(results, null, 2));

/* ---- report ---- */
const short = (m) => m.replace('claude-', '');
console.log('\nLatency (ms):');
for (const m of models) console.log(`  ${short(m)}: median ${results[m]._latency.median}, p90 ${results[m]._latency.p90}, max ${results[m]._latency.max}`);
console.log('\nTokens per call (avg):');
for (const m of models) console.log(`  ${short(m)}: input ${Math.round(results[m]._tokens.input / results[m]._tokens.calls)}, output ${Math.round(results[m]._tokens.output / results[m]._tokens.calls)}`);

const summary = {};
for (const m of models) summary[m] = { misses: 0, flips: 0, debatable: 0, notesWanted: 0, notesSpurious: 0 };
const rows = [];
for (const c of cases) {
  const strict = c.strict !== false;
  const row = { id: c.id, text: c.text, expect: c.expect, strict, per: {} };
  let any = false;
  for (const m of models) {
    const runs = results[m][c.id];
    const whys = runs.map((r) => judge(c, r));
    const agree = JSON.stringify(pick(runs[0])) === JSON.stringify(pick(runs[1]));
    const miss = whys.some((w) => w.length > 0);
    if (!agree) summary[m].flips++;
    if (miss) { if (strict) summary[m].misses++; else summary[m].debatable++; }
    const noted = SOFT && runs.some((r) => r.voice === 'active' && r.issue === 'meaning_changed');
    if (noted) {
      if (c.expect.issue && c.expect.issue.includes('meaning_changed')) summary[m].notesWanted++;
      else summary[m].notesSpurious++;
    }
    row.per[m] = { runs: runs.map(pick), whys, agree, miss, noted };
    if (miss || !agree || noted) any = true;
  }
  if (any) rows.push(row);
}

const strictCount = cases.filter((c) => c.strict !== false).length;
console.log(`\nSummary (${strictCount} strict cases, ${cases.length - strictCount} debatable):`);
for (const m of models) console.log(`  ${short(m)}: ${summary[m].misses} misses, ${summary[m].debatable} debatable disagreements, ${summary[m].flips} flips between runs${SOFT ? `, meaning notes: ${summary[m].notesWanted} wanted, ${summary[m].notesSpurious} spurious` : ''}`);

console.log(`\nCases where any model missed or flipped${SOFT ? ' or raised a meaning note' : ''}:`);
for (const row of rows) {
  console.log(`\n[${row.id}${row.strict ? '' : ', debatable'}] ${row.text}`);
  console.log(`  expected: ${row.expect.pass ? 'pass' : 'fail ' + (row.expect.issue || []).join('/')}${row.expect.stronger ? ', stronger ' + row.expect.stronger : ''}`);
  for (const m of models) {
    const p = row.per[m];
    const tag = p.miss ? 'MISS' : (p.noted ? 'pass with meaning note' : 'ok') + (p.agree ? '' : ', but flipped');
    console.log(`  ${short(m)}: ${tag}`);
    p.runs.forEach((r, i) => console.log(`    run ${i + 1}: ${JSON.stringify(r)}${p.whys[i].length ? '  <- ' + p.whys[i].join('; ') : ''}`));
  }
}
