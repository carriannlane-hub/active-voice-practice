/*
  Grading for Active Voice Practice.

  Two graders live here:
  - gradeSelection: for the tap-the-words steps (spot it, find the action).
  - gradeRewrite: for the free-text rewrite. It looks for the passive
    pattern itself (a form of "to be" plus a past participle) rather than
    demanding one exact subject, so legitimate rewrites such as
    "We recommended..." or "An inspector reviewed..." pass.

  Every miss returns a short, specific note the app shows the learner.
*/

export const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[.,!?;:"“”()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const editDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : Math.min(d[i - 1][j - 1] + 1, d[i][j - 1] + 1, d[i - 1][j] + 1);
    }
  }
  return d[m][n];
};

/* Typo tolerance scales with word length so short words must match exactly. */
const tolerance = (word) => (word.length <= 4 ? 0 : word.length <= 7 ? 1 : 2);

export const similar = (a, b) => {
  if (a === b) return true;
  const max = tolerance(b);
  if (max === 0 || Math.abs(a.length - b.length) > max) return false;
  return editDistance(a, b) <= max;
};

/** Index of the first word in `words` that matches a multi-word phrase. */
const indexOfPhrase = (words, phrase) => {
  const parts = phrase.split(' ');
  for (let i = 0; i + parts.length <= words.length; i++) {
    if (parts.every((p, k) => similar(words[i + k], p))) return i;
  }
  return -1;
};

const BE_FORMS = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'gets', 'get', 'got'];
const COMMON_PARTICIPLES = ['made', 'given', 'done', 'taken', 'written', 'sent', 'built', 'kept', 'held', 'seen', 'found', 'put', 'set', 'met', 'led', 'paid', 'shown', 'known', 'chosen', 'begun'];
const PRONOUN_DOERS = ['we', 'i', 'they', 'you', 'he', 'she', 'staff', 'our team', 'my team', 'the team'];

/* ---------------- tap-the-words steps ---------------- */

/**
 * @param {number[]} selected  token indices the learner tapped
 * @param {number[]} targets   token indices that are correct
 * @param {object[]} tokens    tokens of the sentence (for naming words in notes)
 * @param {'signal'|'action'} kind
 * @param {object} [ctx]       { doer, signalIdx, decoys } for action-step notes
 */
export const gradeSelection = (selected, targets, tokens, kind, ctx = {}) => {
  const sel = new Set(selected);
  const tgt = new Set(targets);
  const hits = selected.filter((i) => tgt.has(i));
  const extras = selected.filter((i) => !tgt.has(i));
  const missing = targets.filter((i) => !sel.has(i));

  if (extras.length === 0 && missing.length === 0) return { kind: 'correct' };

  const name = (i) => `"${tokens[i].text.replace(/[.,!?;:]/g, '')}"`;

  /* A specific note for a wrong tap in the action step. */
  const explainExtra = (i) => {
    const word = tokens[i].clean;
    if (ctx.decoys && ctx.decoys[word]) return ctx.decoys[word];
    if (ctx.signalIdx && ctx.signalIdx.includes(i)) {
      return `${name(i)} is part of the passive signal, not the action itself. What did ${ctx.doer || 'the doer'} do?`;
    }
    return `Not ${name(i)}. What did ${ctx.doer || 'the doer'} do? Tap the word that names it, even if it is dressed up as a noun.`;
  };

  /* When several wrong words were tapped, explain the most instructive one:
     a helper verb from the passive signal first, then any other known decoy. */
  const rank = (i) => {
    const inSignal = ctx.signalIdx && ctx.signalIdx.includes(i);
    const hasDecoy = ctx.decoys && ctx.decoys[tokens[i].clean];
    return (inSignal && hasDecoy ? 0 : hasDecoy ? 1 : inSignal ? 2 : 3);
  };
  const worst = [...extras].sort((a, b) => rank(a) - rank(b))[0];

  if (extras.length > 0 && hits.length > 0) {
    return {
      kind: 'partial',
      text: kind === 'action'
        ? `${name(hits[0])} is right. ${explainExtra(worst)}`
        : `${name(hits[0])} is right. ${extras.map(name).join(' and ')} ${extras.length > 1 ? 'are' : 'is'} not part of it. Try again.`
    };
  }
  if (extras.length > 0) {
    return {
      kind: 'wrong',
      text: kind === 'signal'
        ? `Not that one. Look for a form of "to be" (was, were, is), the verb right after it, and the word "by."`
        : (extras.length > 1 ? 'Neither of those. ' : '') + explainExtra(worst)
    };
  }
  return {
    kind: 'partial',
    text: `Yes, ${hits.map(name).join(' and ')} ${hits.length > 1 ? 'are' : 'is'} part of it. There ${missing.length > 1 ? 'are' : 'is'} ${missing.length} more word${missing.length > 1 ? 's' : ''}.`
  };
};

/* ---------------- the rewrite ---------------- */

const findDoer = (words, rules) => {
  const terms = [...rules.doerTerms, ...PRONOUN_DOERS];
  let best = null;
  for (const term of terms) {
    const idx = indexOfPhrase(words, term);
    if (idx >= 0 && (best === null || idx < best.idx)) best = { idx, term, length: term.split(' ').length };
  }
  return best;
};

const verbMatches = (word, verbs) => {
  if (verbs.some((v) => similar(word, v))) return true;
  if (word.length > 5 && word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    return verbs.includes(stem) || verbs.includes(stem + 'e');
  }
  return false;
};

const findVerb = (words, rules, doer) => {
  const doerWords = new Set(rules.doerTerms.flatMap((t) => t.split(' ')));
  for (let i = 0; i < words.length; i++) {
    if (doer && i >= doer.idx && i < doer.idx + doer.length) continue;
    if (doerWords.has(words[i])) continue;
    if (verbMatches(words[i], rules.activeVerbs)) return { idx: i, word: words[i] };
  }
  return null;
};

const findPassive = (words, rules) => {
  const participles = [...(rules.participles || []), ...COMMON_PARTICIPLES];
  for (let i = 0; i < words.length - 1; i++) {
    if (!BE_FORMS.includes(words[i])) continue;
    let j = i + 1;
    if (/ly$/.test(words[j]) && j + 1 < words.length) j++;
    const w = words[j];
    if (!w) continue;
    const looksLikeParticiple = (w.length > 3 && /(ed|en)$/.test(w)) || participles.some((p) => similar(w, p));
    if (!looksLikeParticiple) continue;
    const tail = words.slice(j + 1, j + 4);
    const byFollows = tail.includes('by');
    const knownParticiple = participles.some((p) => similar(w, p));
    if (byFollows || knownParticiple) return { idx: i, phrase: `${words[i]} ${w}` };
  }
  return null;
};

/**
 * @returns {{correct: boolean, doer?: string, verb?: string, note?: string, reason?: string}}
 */
export const gradeRewrite = (text, sentence) => {
  const rules = sentence.check;
  const answer = normalize(text);
  const words = answer.split(' ').filter(Boolean);

  if (words.length < 3) {
    return { correct: false, reason: 'short', note: 'Write the whole sentence, starting with the person or group who acts.' };
  }

  if (rules.acceptableAnswers.some((a) => normalize(a) === answer)) {
    const doer = findDoer(words, rules);
    const verb = findVerb(words, rules, doer);
    return { correct: true, doer: doer ? words.slice(doer.idx, doer.idx + doer.length).join(' ') : sentence.doer, verb: verb ? verb.word : rules.activeVerbs[0] };
  }

  const doer = findDoer(words, rules);
  const verb = findVerb(words, rules, doer);
  let passive = findPassive(words, rules);

  /* A passive inside a "that" clause after an active main verb is fine:
     "The panel recommended that the contract be approved." */
  if (passive && verb && doer && doer.idx < verb.idx && verb.idx < passive.idx) {
    const between = words.slice(verb.idx, passive.idx);
    if (between.includes('that') || between.includes('which')) passive = null;
  }

  const bannedHit = rules.bannedPhrases.find((p) => answer.includes(p));
  if (bannedHit && !passive) passive = { idx: words.indexOf(bannedHit.split(' ')[0]), phrase: bannedHit };

  if (passive) {
    return {
      correct: false,
      reason: 'passive',
      note: `"${passive.phrase}" is still passive voice. Who does the action? Start with them and give them the verb.`
    };
  }

  if (!doer) {
    return {
      correct: false,
      reason: 'doer',
      note: 'Your sentence does not say who acts. Name them at the start.'
    };
  }

  if (!verb) {
    if (sentence.hiddenNoun && words.some((w) => similar(w, sentence.hiddenNoun))) {
      return {
        correct: false,
        reason: 'noun',
        note: `"${sentence.hiddenNoun}" is still a noun. Turn it back into the verb: ${sentence.actionLabel}.`
      };
    }
    return {
      correct: false,
      reason: 'verb',
      note: `You have the doer. Now give them the action from the original sentence: ${sentence.actionLabel}.`
    };
  }

  if (verb.idx < doer.idx) {
    return {
      correct: false,
      reason: 'order',
      note: 'You have the doer and the verb, but the verb comes first. Put the doer before the action.'
    };
  }

  return {
    correct: true,
    doer: words.slice(doer.idx, doer.idx + doer.length).join(' '),
    verb: verb.word
  };
};
