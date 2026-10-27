/*
  Turns a session's results into the learner's own patterns.

  A pattern is a trap the learner fell into, named in plain words, with their
  own sentence as the example and the editing cue that gets them out of it.
  Nothing here is a score. Tries are never counted.

  Input: the results array the app records (one per sentence) and SENTENCES.
  Output: { found, tagsFor, checklist } where
    found     = up to `limit` patterns, most frequent first, each with examples
    tagsFor   = sentence id -> pattern names that sentence exercised
    checklist = editing cues ordered by the learner's patterns, generic cues after
*/

const EMPTY_VERBS = new Set(['made', 'provided', 'completed', 'given', 'gave', 'conducted', 'performed', 'was', 'were', 'is', 'are', 'been']);

export const PATTERNS = [
  {
    id: 'passive-first',
    name: 'Kept the passive at first',
    cue: 'Scan for was, were, is, are. Ask who did it, and put them first.'
  },
  {
    id: 'kept-noun',
    name: 'Kept the noun',
    cue: 'Look for -tion and -ment nouns after an empty verb such as made, provided, or completed. Turn them back into the verb.'
  },
  {
    id: 'empty-verb',
    name: 'The empty verb pulled you in',
    cue: 'Treat made, provided, completed, conducted, and performed as flags. The real verb is in the noun after them.'
  },
  {
    id: 'meaning',
    name: 'The meaning drifted',
    cue: 'When you edit for voice, re-read the original once. Keep the action it names.'
  },
  {
    id: 'no-doer',
    name: 'Left out who acts',
    cue: 'Name the person or group before the verb. If the document does not say, find out.'
  },
  {
    id: 'stopped-short',
    name: 'Stopped before the object',
    cue: 'Finish the sentence with what they acted on.'
  },
  {
    id: 'lost-verb',
    name: 'Named the doer, lost the action',
    cue: 'Put the doer first, then give them the verb from the original.'
  },
  {
    id: 'used-model',
    name: 'Took the model answer',
    cue: 'Next time, write your version before you look.'
  }
];

/* The generic cues, each marked with the patterns that replace it when hit. */
const GENERIC_CUES = [
  { text: 'Scan for was, were, is, are, be followed by a past-tense verb.', covers: ['passive-first'] },
  { text: 'Look for by right after it. The doer is hiding there, or missing.', covers: ['no-doer'] },
  { text: 'Watch for nouns ending in -tion or -ment. A verb is trapped inside.', covers: ['kept-noun', 'empty-verb'] },
  { text: 'Ask who does this? Start the sentence with them.', covers: ['lost-verb', 'meaning', 'stopped-short'] }
];

const quote = (s) => `“${s}”`;

/** Collect every pattern a single sentence result shows, with its example. */
const observe = (r, s) => {
  const hits = [];
  const add = (id, example) => hits.push({ id, example: { sentenceId: s.id, docType: s.docType, ...example } });
  const attempts = r.attempts || [];

  const passive = attempts.find((a) => a.reason === 'passive');
  if (passive) add('passive-first', { before: passive.text, after: r.rewrite, note: 'You fixed it by putting the doer first.' });

  const noun = attempts.find((a) => a.reason === 'noun');
  if (r.strongerVerb) {
    add('kept-noun', { before: r.rewrite, note: `Active, and ${quote(r.strongerVerb)} says it in one word.` });
  } else if (noun) {
    add('kept-noun', { before: noun.text, after: r.rewrite, note: `The noun ${quote(s.hiddenNoun || '')} still held the verb. You turned it back into ${quote(s.actionLabel)}.` });
  }

  const emptyTap = (r.actionTaps || []).find((w) => EMPTY_VERBS.has(w));
  if (emptyTap) add('empty-verb', { note: `You tapped ${quote(emptyTap)} before ${quote(s.action.join(' and '))}.` });

  if (r.meaningNote) add('meaning', { before: r.rewrite, note: s.meaningCheck });

  const doer = attempts.find((a) => a.reason === 'doer');
  if (doer) add('no-doer', { before: doer.text, after: r.rewrite });

  const short = attempts.find((a) => a.reason === 'incomplete' || a.reason === 'short');
  if (short) add('stopped-short', { before: short.text, after: r.rewrite });

  const lost = attempts.find((a) => a.reason === 'verb' || a.reason === 'order' || a.reason === 'fragment');
  if (lost) add('lost-verb', { before: lost.text, after: r.rewrite });

  if (r.usedModel) add('used-model', { note: `You used the model answer for the ${s.docType.toLowerCase()}.` });

  return hits;
};

export const findPatterns = (results, sentences, limit = 3) => {
  const byId = new Map();
  const tagsFor = {};
  for (const s of sentences) {
    const r = results.find((x) => x && x.id === s.id);
    if (!r) continue;
    const hits = observe(r, s);
    tagsFor[s.id] = [];
    for (const h of hits) {
      const def = PATTERNS.find((p) => p.id === h.id);
      if (!byId.has(h.id)) byId.set(h.id, { ...def, examples: [] });
      byId.get(h.id).examples.push(h.example);
      if (!tagsFor[s.id].includes(def.name)) tagsFor[s.id].push(def.name);
    }
  }
  const order = (id) => PATTERNS.findIndex((p) => p.id === id);
  const all = [...byId.values()].sort((a, b) => b.examples.length - a.examples.length || order(a.id) - order(b.id));
  const found = all.slice(0, limit);

  /* A generic cue steps aside only for a pattern that is actually shown. */
  const hitIds = new Set(found.map((p) => p.id));
  const checklist = [
    ...found.map((p) => ({ text: p.cue, example: p.examples[0].before || null })),
    ...GENERIC_CUES.filter((g) => !g.covers.some((id) => hitIds.has(id))).map((g) => ({ text: g.text, example: null }))
  ];

  return { found, all, tagsFor, checklist };
};

/** Plain-text version of the checklist for the Copy button. */
export const checklistText = (checklist) =>
  ['Active voice: my editing checklist', ...checklist.map((c, i) => `${i + 1}. ${c.text}${c.example ? `\n   My example: ${c.example}` : ''}`)].join('\n');
