/*
  The hybrid rewrite grader, shared by the browser and by api/grade.js.

  Order of judgment:
  1. preCheck: rules that are certain. Too short, verb with nothing after it,
     an exact match to a model answer, or a known passive phrase. No model call.
  2. The model (api/grade.js) classifies everything else: voice, doer, verb,
     one issue code, and a stronger verb if the action hides in a noun.
     fromModel turns that classification into the app's result shape using
     the app's own copy. The model never writes a sentence the learner reads.
  3. gradeRewrite (src/grader.js) is the fallback when the model is unavailable.

  A meaning flag on an active sentence is never a miss. It becomes
  `meaningNote`, shown under the success message as a check, not a correction.

  Result shape:
  { correct, doer, verb, reason, note, strongerVerb, meaningNote, source }
*/

import { normalize, gradeRewrite, findDoer, findVerb } from '../src/grader.js';

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Rules that decide with certainty, or null to let the model judge. */
export const preCheck = (text, sentence) => {
  const rules = sentence.check;
  const answer = normalize(text);
  const words = answer.split(' ').filter(Boolean);

  if (words.length < 3) {
    return { correct: false, reason: 'short', note: 'Write the whole sentence, starting with the person or group who acts.', source: 'rules' };
  }

  if (rules.acceptableAnswers.some((a) => normalize(a) === answer)) {
    /* A model answer that still carries the noun ("provided a justification")
       is active, and the one-word verb is worth showing. activeVerbs[0] is it. */
    const keepsNoun = sentence.hiddenNoun && words.includes(normalize(sentence.hiddenNoun));
    return { ...gradeRewrite(text, sentence), strongerVerb: keepsNoun ? rules.activeVerbs[0] : null, source: 'rules' };
  }

  const banned = rules.bannedPhrases.find((p) => answer.includes(p));
  if (banned) {
    return {
      correct: false,
      reason: 'passive',
      note: `"${banned}" is still passive voice. Who does the action? Start with them and give them the verb.`,
      source: 'rules'
    };
  }

  /* "The inspector reviewed." is active, but the sentence stops at the verb. */
  const doer = findDoer(words, rules);
  const verb = findVerb(words, rules, doer);
  if (doer && verb && verb.idx === words.length - 1) {
    return { correct: false, reason: 'incomplete', note: 'You have the doer and the verb. Finish the sentence: what did they act on?', source: 'rules' };
  }

  return null;
};

/** Turn the model's classification into the app's result, using the app's copy. */
export const fromModel = (m, sentence, text) => {
  if (!m || typeof m !== 'object') return null;
  const voice = m.voice;
  const issue = m.issue;

  if (voice === 'active' && (issue === 'none' || issue === 'meaning_changed')) {
    const doer = m.doer || cap(sentence.doer);
    const verb = m.verb || sentence.actionLabel;
    const stronger = m.stronger_verb && normalize(m.stronger_verb) !== normalize(verb) ? normalize(m.stronger_verb) : null;
    return {
      correct: true,
      doer,
      verb,
      strongerVerb: issue === 'none' ? stronger : null,
      meaningNote: issue === 'meaning_changed' ? `Check it against the original. ${sentence.meaningCheck}` : null,
      source: 'model'
    };
  }

  if (issue === 'passive' || voice === 'passive') {
    const phrase = m.verb && /\b(am|is|are|was|were|be|been|being|get|gets|got)\b/.test(m.verb) ? m.verb : null;
    return {
      correct: false,
      reason: 'passive',
      note: phrase
        ? `"${phrase}" is still passive voice. Who does the action? Start with them and give them the verb.`
        : 'That is still passive voice. Who does the action? Start with them and give them the verb.',
      source: 'model'
    };
  }

  if (issue === 'no_doer') {
    return { correct: false, reason: 'doer', note: 'Your sentence does not say who acts. Name them at the start.', source: 'model' };
  }

  if (issue === 'fragment') {
    return { correct: false, reason: 'fragment', note: 'That is not a whole sentence yet. Name who acts, then say what they did.', source: 'model' };
  }

  /* Anything the model could not place: let the rules decide. */
  return null;
};

/** Everything the browser can do on its own when the server is unreachable. */
export const gradeLocally = (text, sentence) =>
  preCheck(text, sentence) || { ...gradeRewrite(text, sentence), source: 'fallback' };

/** The rewrite reasons that get the firmer "Not there yet." title. */
export const FIRM_REASONS = ['passive', 'short', 'fragment'];
