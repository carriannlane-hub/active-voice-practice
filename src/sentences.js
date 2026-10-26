/*
  Sentence bank for Active Voice Practice.

  Each sentence carries everything the app needs: the words the learner
  must tap in step 1 (signal) and step 2 (action), the explanations shown
  after each step, a help ladder for the rewrite, and the grading rules.

  To add a sentence, copy a block and edit it. Rules of thumb:
  - `signal` and `action` are words from `original`, matched case-insensitively
    with punctuation ignored. Each must appear exactly once in the sentence.
  - `doerTerms` lists ways a learner might name the doer. Pronouns such as
    "we" and "they" are accepted automatically.
  - `activeVerbs` lists verbs that count as activating the sentence.
  - `participles` lists past participles that signal passive voice when they
    follow a form of "to be" (the grader also catches common ones on its own).
*/

export const SENTENCES = [
  {
    id: 'brief',
    docType: 'Brief for a decision maker',
    original: 'A recommendation to approve the new contract was made by the review panel.',
    signal: ['was', 'made', 'by'],
    signalLabel: 'was made by',
    passiveNote: 'This hides who recommends, the very thing a decision maker needs to know.',
    action: ['recommendation'],
    actionPrompt: 'Tap the word that holds the real action.',
    actionLabel: 'recommend',
    verbNote: '"Recommendation" is the action "recommend" dressed up as a noun. Turn it back into a verb and the sentence comes alive.',
    doer: 'the review panel',
    hiddenNoun: 'recommendation',
    sampleActive: 'The review panel recommended approving the new contract.',
    successNote: 'The decision maker can now see at a glance who recommends what.',
    help: {
      question: 'Who makes the recommendation? Lead with them, then turn "recommendation" back into the verb "recommend."',
      starter: 'The review panel'
    },
    check: {
      doerTerms: ['review panel', 'panel', 'reviewers', 'review team'],
      activeVerbs: ['recommended', 'recommends', 'recommend', 'advised', 'advises', 'advise', 'urged', 'urges', 'urge', 'proposed', 'proposes', 'propose'],
      bannedPhrases: ['was made', 'is made', 'were made', 'has been made', 'was recommended', 'is recommended'],
      participles: ['made', 'recommended', 'approved', 'proposed', 'advised'],
      acceptableAnswers: [
        'the review panel recommended approving the new contract',
        'the review panel recommended that the new contract be approved',
        'the panel recommended approving the new contract'
      ]
    }
  },
  {
    id: 'justification',
    docType: 'Justification',
    original: 'A justification for the additional funding was provided by the finance team.',
    signal: ['was', 'provided', 'by'],
    signalLabel: 'was provided by',
    passiveNote: 'It buries who stands behind the request, so the reader cannot tell whom to follow up with.',
    action: ['justification'],
    actionPrompt: 'Tap the word that holds the real action.',
    actionLabel: 'justify',
    verbNote: '"Justification" is the action "justify" in noun form. The doer did not provide a justification; they justified.',
    doer: 'the finance team',
    hiddenNoun: 'justification',
    sampleActive: 'The finance team justified the additional funding.',
    successNote: 'Anyone reading now knows who stands behind the request and whom to follow up with.',
    help: {
      question: 'Who does the justifying? Start with them, then use the verb "justify" (or "explain").',
      starter: 'The finance team'
    },
    check: {
      doerTerms: ['finance team', 'finance', 'team', 'finance department', 'finance staff'],
      activeVerbs: ['justified', 'justifies', 'justify', 'explained', 'explains', 'explain', 'provided', 'provides', 'provide', 'defended', 'defends', 'defend', 'supported', 'supports', 'support', 'documented', 'documents', 'document'],
      bannedPhrases: ['was provided', 'is provided', 'were provided', 'has been provided', 'was justified', 'is justified'],
      participles: ['provided', 'justified', 'explained', 'given'],
      acceptableAnswers: [
        'the finance team justified the additional funding',
        'the finance team provided a justification for the additional funding',
        'the finance team explained the need for the additional funding'
      ]
    }
  },
  {
    id: 'report',
    docType: 'Report',
    original: 'The risks were assessed by the project team and documented in the report.',
    signal: ['were', 'assessed', 'by'],
    signalLabel: 'were assessed by',
    passiveNote: 'Two actions sit in passive form, so the team doing the work disappears from both.',
    action: ['assessed', 'documented'],
    actionPrompt: 'Tap the two words that hold the real actions.',
    actionLabel: 'assessed, documented',
    verbNote: 'Both verbs are already here. They just need the doer in front of them.',
    doer: 'the project team',
    hiddenNoun: null,
    sampleActive: 'The project team assessed the risks and documented them in the report.',
    successNote: 'The report now credits the team that did the work, and both actions have a clear doer.',
    help: {
      question: 'Who assessed the risks? Begin with them. The same team performs both actions.',
      starter: 'The project team'
    },
    check: {
      doerTerms: ['project team', 'team', 'project staff', 'project group'],
      activeVerbs: ['assessed', 'assesses', 'assess', 'evaluated', 'evaluates', 'evaluate', 'reviewed', 'reviews', 'review', 'identified', 'identifies', 'identify', 'analyzed', 'analyzes', 'analyze', 'examined', 'examines', 'examine', 'documented', 'documents', 'document'],
      bannedPhrases: ['were assessed', 'was assessed', 'is assessed', 'has been assessed', 'were documented', 'was documented', 'are documented'],
      participles: ['assessed', 'documented', 'evaluated', 'reviewed', 'identified', 'recorded'],
      acceptableAnswers: [
        'the project team assessed the risks and documented them in the report',
        'the project team assessed the risks and documented them',
        'the project team identified and documented the risks in the report'
      ]
    }
  },
  {
    id: 'compliance',
    docType: 'Compliance document',
    original: 'A review of the safety requirements was completed by the inspector.',
    signal: ['was', 'completed', 'by'],
    signalLabel: 'was completed by',
    passiveNote: 'It hides who is accountable for the check, which is central to any compliance record.',
    action: ['review'],
    actionPrompt: 'Tap the word that holds the real action.',
    actionLabel: 'review',
    verbNote: '"Review" is doing double duty as a noun here. As a verb, it is the real action: the inspector reviewed.',
    doer: 'the inspector',
    hiddenNoun: 'review',
    sampleActive: 'The inspector reviewed the safety requirements.',
    successNote: 'The record now names who must answer for the check, exactly what a compliance document needs.',
    help: {
      question: 'Who did the reviewing? Lead with the inspector, then use "reviewed" (or "inspected").',
      starter: 'The inspector'
    },
    check: {
      doerTerms: ['inspector', 'inspectors', 'safety inspector'],
      activeVerbs: ['reviewed', 'reviews', 'review', 'inspected', 'inspects', 'inspect', 'checked', 'checks', 'check', 'examined', 'examines', 'examine', 'completed', 'completes', 'complete', 'assessed', 'assesses', 'assess', 'evaluated', 'evaluates', 'evaluate'],
      bannedPhrases: ['was completed', 'is completed', 'were completed', 'has been completed', 'was reviewed', 'were reviewed', 'is reviewed'],
      participles: ['completed', 'reviewed', 'inspected', 'checked', 'done', 'finished'],
      acceptableAnswers: [
        'the inspector reviewed the safety requirements',
        'the inspector completed a review of the safety requirements',
        'the inspector inspected the safety requirements'
      ]
    }
  }
];

/* ---- tokenizing helpers shared by the app ---- */

export const cleanWord = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

/** Split the original sentence into tokens that keep their punctuation for display. */
export const tokenize = (sentence) =>
  sentence.split(/\s+/).map((text, index) => ({ text, index, clean: cleanWord(text) }));

/** Resolve a list of target words to token indices (first occurrence). */
export const resolveTargets = (tokens, words) =>
  words.map((w) => {
    const idx = tokens.findIndex((t) => t.clean === cleanWord(w));
    if (idx < 0) throw new Error(`Target word "${w}" not found in sentence.`);
    return idx;
  });
