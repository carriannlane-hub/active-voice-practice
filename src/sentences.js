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
  - `signalOptional` lists words that also count in step 1 without being
    required, such as a second passive verb that shares the helper.
  - `spotPrompt` replaces the step 1 instruction for a passive with no "by" phrase.
  - `context` is one line shown under the sentence. It tells the learner who acts
    when the sentence leaves the doer out.
  - `decoys` maps tempting wrong taps in step 2 to a specific note. Any other
    wrong tap gets a general note built from `doer`.
  - Step 2 lets the learner hold as many words as `action` lists. With one
    action word, a new tap moves the selection.
  - `meaningCheck` is shown under a correct rewrite when the grader thinks the
    action drifted from the original. It is a prompt to compare, never a miss.
  - `activeVerbs` lists verbs that count as activating the sentence.
  - `participles` lists past participles that signal passive voice when they
    follow a form of "to be" (the grader also catches common ones on its own).
*/

/*
  Two sets with the same shape, one new idea per sentence:
  1. plain verbs with a "by" phrase   2. the action hides in a noun
  3. a noun spelled like its verb     4. a passive with the doer left out
  "Practice again" moves to the next set.
*/
export const SETS = [
  [
  {
    id: 'report',
    docType: 'Report',
    original: 'The risks were assessed by the project team and documented in the report.',
    signal: ['were', 'assessed', 'by'],
    signalOptional: ['documented'],
    signalLabel: 'were assessed by',
    passiveNote: '"Documented" shares the helper "were," so two actions sit in passive form and the team doing the work disappears from both.',
    action: ['assessed', 'documented'],
    actionPrompt: 'Here both actions are already verbs, and one of them sits inside the passive signal. What did the project team do? Tap the two words that name it.',
    actionLabel: 'assessed, documented',
    decoys: {
      were: '"Were" is the helper verb in the passive signal. It carries no action of its own. What did the project team do?',
      risks: '"Risks" is what the team acted on. What did they do to the risks?'
    },
    verbNote: 'Both verbs are already here. They just need the doer in front of them.',
    meaningCheck: 'The original says the project team assessed the risks and documented them in the report.',
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
    id: 'brief',
    docType: 'Brief for a decision maker',
    original: 'A recommendation to approve the new contract was made by the review panel.',
    signal: ['was', 'made', 'by'],
    signalLabel: 'was made by',
    passiveNote: 'This hides who recommends, the very thing a decision maker needs to know.',
    action: ['recommendation'],
    actionPrompt: 'This time the real action is hiding inside a noun. Which word holds it? Ask: what did the review panel do?',
    actionLabel: 'recommend',
    decoys: {
      made: '"Made" is a verb, but an empty one. It only carries the noun after it. What did the review panel make?',
      approve: '"Approve" is what might happen to the contract. What did the review panel do?'
    },
    verbNote: '"Recommendation" is the action "recommend" dressed up as a noun. "Made a recommendation" is active once the panel leads, and "recommended" says it in one word.',
    meaningCheck: 'The original says the review panel recommended approving the new contract.',
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
      activeVerbs: ['recommended', 'recommends', 'recommend', 'advised', 'advises', 'advise', 'urged', 'urges', 'urge', 'proposed', 'proposes', 'propose', 'made', 'makes', 'make'],
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
    id: 'compliance',
    docType: 'Compliance document',
    original: 'A review of the safety requirements was completed by the inspector.',
    signal: ['was', 'completed', 'by'],
    signalLabel: 'was completed by',
    passiveNote: 'It hides who is accountable for the check, which is central to any compliance record.',
    action: ['review'],
    actionPrompt: 'The action is hiding in a noun again, and this noun is spelled exactly like its verb. Which word holds it? Ask: what did the inspector do?',
    actionLabel: 'review',
    decoys: {
      completed: '"Completed" is a verb, but an empty one. It only carries the noun after it. What did the inspector complete?',
      requirements: '"Requirements" is what the inspector acted on. What did they do to them?'
    },
    verbNote: '"Review" is spelled the same as a noun and as a verb. Here "A" in front marks it as a noun: a review. As a verb it follows the doer: the inspector reviewed. Change, update, request, and check work the same way. For these words, the flag is the word in front: a, an, or the.',
    meaningCheck: 'The original says the inspector reviewed the safety requirements.',
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
  },
  {
    id: 'letter',
    docType: 'Letter to a customer',
    original: 'Your request was received on May 2.',
    context: 'You are writing for your office.',
    signal: ['was', 'received'],
    signalLabel: 'was received',
    spotPrompt: 'This passive has two signal words. Tap the form of "to be" and the verb after it.',
    passiveNote: 'The sentence stops before any "by" phrase, so the customer cannot tell who has the request. Most passive sentences in workplace documents look like this one.',
    action: ['received'],
    actionPrompt: 'The action is already a verb, and it sits inside the passive signal. What did your office do? Tap one word.',
    actionLabel: 'received',
    decoys: {
      request: '"Request" is what the customer did. What did your office do with it?',
      was: '"Was" is the helper verb in the passive signal. It carries no action of its own. What did your office do?'
    },
    verbNote: 'The verb is ready. The sentence is missing its doer. When you write for your office, the doer is "we."',
    meaningCheck: 'The original says your office received the request on May 2.',
    doer: 'your office',
    hiddenNoun: null,
    sampleActive: 'We received your request on May 2.',
    successNote: 'The customer now knows who has the request.',
    help: {
      question: 'Who received the request? You are writing for your office, so name it or use "we."',
      starter: 'We'
    },
    check: {
      doerTerms: ['our office', 'the office', 'this office', 'office', 'our agency', 'the agency', 'our department', 'the department', 'our staff', 'our program'],
      activeVerbs: ['received', 'receives', 'receive', 'got', 'accepted', 'accepts', 'accept', 'logged', 'logs', 'log', 'have', 'has'],
      bannedPhrases: ['was received', 'is received', 'were received', 'has been received', 'was accepted'],
      participles: ['received', 'accepted', 'logged'],
      acceptableAnswers: [
        'we received your request on may 2',
        'our office received your request on may 2'
      ]
    }
  }
  ],
  [
  {
    id: 'schedule',
    docType: 'Project update',
    original: 'The schedule was updated by the planning team and posted on the shared drive.',
    signal: ['was', 'updated', 'by'],
    signalOptional: ['posted'],
    signalLabel: 'was updated by',
    passiveNote: '"Posted" shares the helper "was," so two actions sit in passive form and the team doing the work disappears from both.',
    action: ['updated', 'posted'],
    actionPrompt: 'Here both actions are already verbs, and one of them sits inside the passive signal. What did the planning team do? Tap the two words that name it.',
    actionLabel: 'updated, posted',
    decoys: {
      was: '"Was" is the helper verb in the passive signal. It carries no action of its own. What did the planning team do?',
      schedule: '"Schedule" is what the team acted on. What did they do to the schedule?'
    },
    verbNote: 'Both verbs are already here. They just need the doer in front of them.',
    meaningCheck: 'The original says the planning team updated the schedule and posted it on the shared drive.',
    doer: 'the planning team',
    hiddenNoun: null,
    sampleActive: 'The planning team updated the schedule and posted it on the shared drive.',
    successNote: 'The update now names the team behind both actions.',
    help: {
      question: 'Who updated the schedule? Begin with them. The same team performs both actions.',
      starter: 'The planning team'
    },
    check: {
      doerTerms: ['planning team', 'team', 'planners', 'planning staff', 'planning group'],
      activeVerbs: ['updated', 'updates', 'update', 'revised', 'revises', 'revise', 'changed', 'changes', 'change', 'posted', 'posts', 'post', 'shared', 'shares', 'share', 'uploaded', 'uploads', 'upload', 'published', 'publishes', 'publish', 'saved', 'saves', 'save'],
      bannedPhrases: ['was updated', 'were updated', 'is updated', 'has been updated', 'was posted', 'were posted', 'is posted'],
      participles: ['updated', 'posted', 'revised', 'shared', 'uploaded', 'published'],
      acceptableAnswers: [
        'the planning team updated the schedule and posted it on the shared drive',
        'the planning team updated the schedule and posted it to the shared drive',
        'the planning team updated and posted the schedule on the shared drive'
      ]
    }
  },
  {
    id: 'explanation',
    docType: 'Status update',
    original: 'An explanation of the delay was provided by the contractor.',
    signal: ['was', 'provided', 'by'],
    signalLabel: 'was provided by',
    passiveNote: 'It buries who explained the delay, so the reader has no one to ask about the next one.',
    action: ['explanation'],
    actionPrompt: 'The real action is hiding inside a noun. Which word holds it? Ask: what did the contractor do?',
    actionLabel: 'explain',
    decoys: {
      provided: '"Provided" is a verb, but an empty one. It only carries the noun after it. What did the contractor provide?',
      delay: '"Delay" is what the explanation is about. What did the contractor do?'
    },
    verbNote: '"Explanation" is the action "explain" in noun form. "Provided an explanation" is active once the contractor leads, and "explained" says it in one word.',
    meaningCheck: 'The original says the contractor explained the delay.',
    doer: 'the contractor',
    hiddenNoun: 'explanation',
    sampleActive: 'The contractor explained the delay.',
    successNote: 'The reader now knows who explained the delay and whom to ask about the next one.',
    help: {
      question: 'Who does the explaining? Start with them, then use the verb "explain."',
      starter: 'The contractor'
    },
    check: {
      doerTerms: ['contractor', 'contractors', 'vendor', 'the vendor', 'contracting firm'],
      activeVerbs: ['explained', 'explains', 'explain', 'provided', 'provides', 'provide', 'gave', 'gives', 'give', 'described', 'describes', 'describe', 'told', 'tells', 'tell', 'reported', 'reports', 'report', 'clarified', 'clarifies', 'clarify', 'accounted', 'accounts', 'account'],
      bannedPhrases: ['was provided', 'is provided', 'were provided', 'has been provided', 'was explained', 'is explained', 'was given'],
      participles: ['provided', 'explained', 'given', 'offered', 'sent'],
      acceptableAnswers: [
        'the contractor explained the delay',
        'the contractor provided an explanation of the delay',
        'the contractor explained why the work was delayed'
      ]
    }
  },
  {
    id: 'change',
    docType: 'Email to a team',
    original: 'A change to the meeting time was made by the supervisor.',
    signal: ['was', 'made', 'by'],
    signalLabel: 'was made by',
    passiveNote: 'It hides who changed the time until the last word, so the team reads the whole sentence before learning whom to ask.',
    action: ['change'],
    actionPrompt: 'The action is hiding in a noun again, and this noun is spelled exactly like its verb. Which word holds it? Ask: what did the supervisor do?',
    actionLabel: 'change',
    decoys: {
      made: '"Made" is a verb, but an empty one. It only carries the noun before it. What did the supervisor make?',
      meeting: '"Meeting" is part of what changed. What did the supervisor do?',
      time: '"Time" is what changed. What did the supervisor do to it?'
    },
    verbNote: '"Change" is spelled the same as a noun and as a verb. Here "A" in front marks it as a noun: a change. As a verb it follows the doer: the supervisor changed. Review, update, request, and check work the same way. For these words, the flag is the word in front: a, an, or the.',
    meaningCheck: 'The original says the supervisor changed the meeting time.',
    doer: 'the supervisor',
    hiddenNoun: 'change',
    sampleActive: 'The supervisor changed the meeting time.',
    successNote: 'The team now sees at once who changed the time and whom to ask about it.',
    help: {
      question: 'Who made the change? Lead with them, then turn "change" back into a verb.',
      starter: 'The supervisor'
    },
    check: {
      doerTerms: ['supervisor', 'supervisors', 'manager', 'the manager', 'our supervisor'],
      activeVerbs: ['changed', 'changes', 'change', 'moved', 'moves', 'move', 'rescheduled', 'reschedules', 'reschedule', 'shifted', 'shifts', 'shift', 'adjusted', 'adjusts', 'adjust', 'updated', 'updates', 'update', 'made', 'makes', 'make'],
      bannedPhrases: ['was made', 'is made', 'were made', 'has been made', 'was changed', 'were changed', 'is changed', 'was moved'],
      participles: ['made', 'changed', 'moved', 'rescheduled', 'shifted', 'adjusted'],
      acceptableAnswers: [
        'the supervisor changed the meeting time',
        'the supervisor made a change to the meeting time',
        'the supervisor moved the meeting time'
      ]
    }
  },
  {
    id: 'deadline',
    docType: 'Project message',
    original: 'The deadline was moved to Friday.',
    context: 'The project lead made this change.',
    signal: ['was', 'moved'],
    signalLabel: 'was moved',
    spotPrompt: 'This passive has two signal words. Tap the form of "to be" and the verb after it.',
    passiveNote: 'The sentence stops before any "by" phrase, so the team cannot tell who moved the deadline. Most passive sentences in workplace documents look like this one.',
    action: ['moved'],
    actionPrompt: 'The action is already a verb, and it sits inside the passive signal. What did the project lead do? Tap one word.',
    actionLabel: 'moved',
    decoys: {
      deadline: '"Deadline" is what the project lead acted on. What did they do to it?',
      was: '"Was" is the helper verb in the passive signal. It carries no action of its own. What did the project lead do?'
    },
    verbNote: 'The verb is ready. The sentence is missing its doer. The writer knows who acted and can name them.',
    meaningCheck: 'The original says the deadline moved to Friday, and the project lead moved it.',
    doer: 'the project lead',
    hiddenNoun: null,
    sampleActive: 'The project lead moved the deadline to Friday.',
    successNote: 'The team now knows who moved the deadline and whom to ask about it.',
    help: {
      question: 'Who moved the deadline? The line under the sentence names them. Put them first.',
      starter: 'The project lead'
    },
    check: {
      doerTerms: ['project lead', 'lead', 'project leader', 'project manager', 'team lead'],
      activeVerbs: ['moved', 'moves', 'move', 'changed', 'changes', 'change', 'shifted', 'shifts', 'shift', 'pushed', 'pushes', 'push', 'rescheduled', 'reschedules', 'reschedule', 'extended', 'extends', 'extend', 'set', 'sets'],
      bannedPhrases: ['was moved', 'is moved', 'were moved', 'has been moved', 'was changed', 'was pushed'],
      participles: ['moved', 'changed', 'shifted', 'pushed', 'rescheduled', 'extended'],
      acceptableAnswers: [
        'the project lead moved the deadline to friday',
        'the project lead changed the deadline to friday'
      ]
    }
  }
  ]
];

/* Every sentence, for looking one up by id (the grade function and the eval). */
export const SENTENCES = SETS.flat();

/*
  The sentence the learner rewrites on their own at the end: no steps, no
  grading. The app shows their version beside a model version and asks three
  questions they answer for themselves. Two passives, two hidden verbs.
*/
export const TRANSFER = {
  id: 'memo',
  docType: 'Memo',
  original: 'A request for an extension to the reporting deadline was submitted by the program office, and approval was granted by the director.',
  model: 'The program office requested an extension to the reporting deadline, and the director approved it.',
  selfCheck: [
    'Does each part of your sentence start with who acts?',
    'Did the hidden verbs come out: requested, approved?',
    'Is every "was … by" gone?'
  ]
};

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
