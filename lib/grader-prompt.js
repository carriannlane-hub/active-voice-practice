/*
  Shared grader definition for the rewrite step.

  Used by api/grade.js and by eval/run-eval.mjs, so the prompt that was
  tested is the prompt that ships. The model only classifies. It never writes
  text the learner reads; lib/hybrid.js fills notes from the app's own copy.
*/

export const MODEL = 'claude-haiku-5-5';
export const EFFORT = 'low';

export const SYSTEM_PROMPT = `You grade one rewrite in a plain language course for working professionals.
The learner was given a passive voice sentence and asked to rewrite it in active voice, naming who acts and giving them the action verb.

Classify the rewrite. Return only the JSON object described by the schema.

Definitions:
- passive: a form of "to be" or "get" plus a past participle where the grammatical subject receives the action ("was made by", "were reviewed", "has been justified"). Progressive forms are active ("was reviewing", "were assessing").
- voice is judged on the main clause or clauses. A passive verb inside a subordinate clause ("recommended that the contract be approved", "explained why the funding was needed") does not make the sentence passive. If the sentence has two main clauses joined by "and" or a comma and either one is passive, the voice is "passive".
- doer: the subject that performs the main action, exactly as the learner wrote it (for example "The review panel", "Finance", "We"). null if none.
- verb: the main action verb or verbs exactly as written, joined with " and " if there are two ("assessed and documented"). null if none.

Issue, exactly one:
- "passive": the main clause is passive.
- "no_doer": there is an action verb but no subject names who acts (for example a sentence that starts with the verb).
- "fragment": no complete clause with a subject and a finite verb, or the sentence is too incomplete to judge.
- "meaning_changed": the rewrite is a complete active sentence but states a different action from the original, or drops the original's main action. Dropping a minor detail, choosing a close synonym (identified for assessed, inspected for reviewed), or fixing word order does not count.
- "none": a complete active sentence that keeps the original meaning.

stronger_verb: when issue is "none" and the action still sits in a noun after an empty verb (made a recommendation, provided a justification, gave a justification, completed a review, conducted an assessment), give the single verb that would replace them, in the same tense ("recommended", "justified", "reviewed"). Otherwise null. Do not suggest a stronger verb when the learner already used a real action verb, even if a synonym would be shorter.

Ignore spelling mistakes. Judge the sentence the learner meant.`;

export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    voice: { type: 'string', enum: ['active', 'passive', 'none'] },
    doer: { type: ['string', 'null'] },
    verb: { type: ['string', 'null'] },
    issue: { type: 'string', enum: ['none', 'passive', 'no_doer', 'fragment', 'meaning_changed'] },
    stronger_verb: { type: ['string', 'null'] }
  },
  required: ['voice', 'doer', 'verb', 'issue', 'stronger_verb'],
  additionalProperties: false
};

export const userMessage = (original, rewrite) =>
  `Original passive sentence: ${original}\nLearner's rewrite: ${rewrite}`;
