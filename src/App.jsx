import React, { useState, useEffect, useRef } from 'react';

/*
  Active Voice Practice
  Sentient Learning

  Built for a facilitated session with learners who are new to grammar
  terms. Plain language leads; the labels "passive voice" and
  "nominalization" appear gently, with one-line explanations the
  facilitator can build on.

  Each sentence carries its own grading rules in a `check` object, so you can
  safely add, remove, or reorder sentences without touching the logic below.
  To add a sentence, copy one block and edit the text and the `check` lists.
*/

const SENTENCES = [
  {
    docType: 'Brief for a decision maker',
    original: 'A recommendation to approve the new contract was made by the review panel.',
    passivePhrase: 'was made by',
    passiveNote: 'This hides who actually recommends — the very thing a decision maker needs to know.',
    verbs: "recommend (hidden inside the noun 'recommendation')",
    verbNote: '"Recommendation" is really the action "recommend" dressed up as a noun.',
    sampleActive: 'The review panel recommended approving the new contract.',
    successNote: 'The decision maker can now see at a glance who recommends what.',
    hint: 'Who makes the recommendation? Lead with them, then turn "recommendation" back into the verb "recommend."',
    check: {
      subjectStarts: ['panel', 'the panel', 'review panel', 'the review panel'],
      activeVerbs: ['recommended', 'recommend', 'advised', 'advise', 'urged', 'urge', 'proposed', 'propose'],
      bannedPhrases: ['was made', 'is made', 'were made', 'has been made'],
      acceptableAnswers: [
        'the review panel recommended approving the new contract',
        'the review panel recommended that the new contract be approved',
        'the panel recommended approving the new contract'
      ]
    }
  },
  {
    docType: 'Justification',
    original: 'A justification for the additional funding was provided by the finance team.',
    passivePhrase: 'was provided by',
    passiveNote: 'It buries who stands behind the request, so the reader cannot tell whom to follow up with.',
    verbs: "justify (hidden inside the noun 'justification')",
    verbNote: '"Justification" is the action "justify" in noun form.',
    sampleActive: 'The finance team justified the additional funding.',
    successNote: 'Anyone reading now knows who stands behind the request and whom to follow up with.',
    hint: 'Who does the justifying? Start with them, then use the verb "justify" (or "explain").',
    check: {
      subjectStarts: ['finance team', 'the finance team', 'team', 'the team'],
      activeVerbs: ['justified', 'justify', 'explained', 'explain', 'provided', 'provide', 'defended', 'defend', 'supported', 'support'],
      bannedPhrases: ['was provided', 'is provided', 'were provided', 'has been provided'],
      acceptableAnswers: [
        'the finance team justified the additional funding',
        'the finance team provided a justification for the additional funding',
        'the finance team explained the need for the additional funding'
      ]
    }
  },
  {
    docType: 'Report',
    original: 'The risks were assessed by the project team and documented in the report.',
    passivePhrase: 'were assessed by',
    passiveNote: 'Two actions sit in passive form, so the team doing the work disappears from both.',
    verbs: 'assessed, documented',
    verbNote: 'Both verbs are already here — they just need the doer in front of them.',
    sampleActive: 'The project team assessed the risks and documented them in the report.',
    successNote: 'The report now credits the team that did the work, and both actions have a clear doer.',
    hint: 'Who assessed the risks? Begin with them. The same team performs both actions.',
    check: {
      subjectStarts: ['project team', 'the project team', 'team', 'the team'],
      activeVerbs: ['assessed', 'assess', 'evaluated', 'evaluate', 'reviewed', 'review', 'identified', 'identify', 'analyzed', 'analyze', 'examined', 'examine'],
      bannedPhrases: ['were assessed', 'was assessed', 'is assessed', 'has been assessed', 'were documented'],
      acceptableAnswers: [
        'the project team assessed the risks and documented them in the report',
        'the project team assessed the risks and documented them',
        'the project team identified and documented the risks in the report'
      ]
    }
  },
  {
    docType: 'Compliance document',
    original: 'A review of the safety requirements was completed by the inspector.',
    passivePhrase: 'was completed by',
    passiveNote: 'It hides who is accountable for the check — central to any compliance record.',
    verbs: "review (hidden inside the noun 'review')",
    verbNote: '"Review" is doing double duty as a noun here; as a verb it is the real action.',
    sampleActive: 'The inspector reviewed the safety requirements.',
    successNote: 'The record now names who must answer for the check, exactly what a compliance document needs.',
    hint: 'Who did the reviewing? Lead with the inspector, then use "reviewed" (or "inspected").',
    check: {
      subjectStarts: ['inspector', 'the inspector'],
      activeVerbs: ['reviewed', 'review', 'inspected', 'inspect', 'checked', 'check', 'examined', 'examine', 'completed', 'complete', 'assessed', 'assess', 'evaluated', 'evaluate'],
      bannedPhrases: ['was completed', 'is completed', 'were completed', 'has been completed'],
      acceptableAnswers: [
        'the inspector reviewed the safety requirements',
        'the inspector completed a review of the safety requirements',
        'the inspector inspected the safety requirements'
      ]
    }
  }
];

/* ---- forgiving answer-checking helpers ---- */

const normalize = (text) => text.toLowerCase().trim().replace(/[.,!?;:]/g, '');

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

const similar = (a, b, max = 2) => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  return editDistance(a, b) <= max;
};

const containsSimilar = (text, targets, max = 2) => {
  const words = text.split(/\s+/);
  return targets.some((t) => {
    if (t.split(/\s+/).length > 1) return text.includes(t);
    return words.some((w) => similar(w, t, max));
  });
};

const startsWith = (text, starts, max = 2) =>
  starts.some((target) => {
    const tWords = target.split(/\s+/);
    const uWords = text.split(/\s+/).slice(0, tWords.length);
    if (tWords.length !== uWords.length) return false;
    return tWords.every((tw, i) => similar(uWords[i], tw, max));
  });

const gradeAnswer = (text, sentence) => {
  const answer = normalize(text);
  const rules = sentence.check;
  if (rules.acceptableAnswers.some((a) => normalize(a) === answer)) return { correct: true };
  if (!startsWith(answer, rules.subjectStarts)) {
    return { correct: false, note: 'Begin with the doer — the person or group doing the action. Who acts in this sentence?' };
  }
  if (rules.bannedPhrases.some((p) => answer.includes(p))) {
    return { correct: false, note: 'You still have a passive phrase. Drop the "was / were / will be" construction and use a direct action verb.' };
  }
  if (answer.includes('by the')) {
    return { correct: false, note: 'The phrase "by the" usually signals passive voice. Restructure so the doer leads and acts.' };
  }
  if (!containsSimilar(answer, rules.activeVerbs)) {
    return { correct: false, note: 'Check your verb. Reach for a strong, specific action word that shows who does what.' };
  }
  return { correct: true };
};

const STAGES = [
  { key: 'notice', label: 'Spot it' },
  { key: 'action', label: 'Find the action' },
  { key: 'rewrite', label: 'Rewrite' }
];

export default function ActiveVoicePractice() {
  const [phase, setPhase] = useState('intro'); // intro | practice | complete
  const [current, setCurrent] = useState(0);
  const [stage, setStage] = useState('notice');
  const [revealedPassive, setRevealedPassive] = useState(false);
  const [revealedVerbs, setRevealedVerbs] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); // { kind, text }
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState('comfortable'); // comfortable | large | larger
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [announce, setAnnounce] = useState('');

  const mainRef = useRef(null);
  const answerRef = useRef(null);
  const feedbackRef = useRef(null);
  const nextRef = useRef(null);

  const sentence = SENTENCES[current];
  const total = SENTENCES.length;
  const completed = current + (solved ? 1 : 0);
  const progressPct = phase === 'complete' ? 100 : Math.round((completed / total) * 100);

  /* load editorial fonts + reliable placeholder contrast once */
  useEffect(() => {
    if (!document.getElementById('avp-fonts')) {
      const link = document.createElement('link');
      link.id = 'avp-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('avp-style')) {
      const style = document.createElement('style');
      style.id = 'avp-style';
      style.textContent =
        '#avp-answer::placeholder{color:#57534e;opacity:1}' +
        '.avp-hc #avp-answer::placeholder{color:#d6d3d1;opacity:1}';
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (phase !== 'practice') return;
    if (stage === 'notice') setAnnounce(`Sentence ${current + 1} of ${total}. Step 1: spot the passive voice.`);
    if (stage === 'action') setAnnounce('Step 2: find the action.');
    if (stage === 'rewrite') {
      setAnnounce('Step 3: rewrite the sentence in active voice.');
      setTimeout(() => answerRef.current && answerRef.current.focus(), 80);
    }
  }, [stage, current, phase]);

  useEffect(() => {
    if (feedback && feedbackRef.current) feedbackRef.current.focus();
  }, [feedback]);

  const resetSentence = () => {
    setStage('notice');
    setRevealedPassive(false);
    setRevealedVerbs(false);
    setAnswer('');
    setFeedback(null);
    setAttempts(0);
    setSolved(false);
    setShowHint(false);
  };

  const start = () => {
    setPhase('practice');
    setCurrent(0);
    resetSentence();
    setAnnounce('Practice started. Sentence 1.');
    setTimeout(() => mainRef.current && mainRef.current.focus(), 80);
  };

  const submit = () => {
    const result = gradeAnswer(answer, sentence);
    if (result.correct) {
      setFeedback({ kind: 'success', text: sentence.successNote });
      setSolved(true);
      setAnnounce('Correct. Continue to the next sentence.');
      setTimeout(() => nextRef.current && nextRef.current.focus(), 80);
    } else if (attempts === 0) {
      setFeedback({ kind: 'retry', text: `${result.note} You have one more try.` });
      setAttempts(1);
      setAnnounce('Not yet. Read the hint and try once more.');
    } else {
      setFeedback({ kind: 'example', text: `Here is one strong version: "${sentence.sampleActive}" Notice how the doer comes first and the verb does the work.` });
      setSolved(true);
      setAnnounce('Review the model answer, then continue to the next sentence.');
      setTimeout(() => nextRef.current && nextRef.current.focus(), 80);
    }
  };

  const next = () => {
    if (current < total - 1) {
      setCurrent(current + 1);
      resetSentence();
      setTimeout(() => mainRef.current && mainRef.current.focus(), 80);
    } else {
      setPhase('complete');
      setAnnounce('You finished all sentences.');
    }
  };

  const restart = () => {
    setPhase('practice');
    setCurrent(0);
    resetSentence();
    setAnnounce('Starting over from sentence 1.');
    setTimeout(() => mainRef.current && mainRef.current.focus(), 80);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && stage === 'rewrite' && !solved && answer.trim()) {
      e.preventDefault();
      submit();
    }
  };

  /* ---- theme tokens ---- */
  const hc = highContrast;
  const scale = {
    comfortable: { body: 'text-base', h1: 'text-4xl', h2: 'text-2xl', step: 'text-xl', sentence: 'text-2xl' },
    large: { body: 'text-lg', h1: 'text-5xl', h2: 'text-3xl', step: 'text-2xl', sentence: 'text-3xl' },
    larger: { body: 'text-xl', h1: 'text-5xl', h2: 'text-3xl', step: 'text-2xl', sentence: 'text-4xl' }
  }[fontScale];

  const page = hc ? 'bg-black text-white' : 'bg-emerald-50 text-emerald-950';
  const card = hc ? 'bg-zinc-900 border-2 border-white' : 'bg-white border border-emerald-100 shadow-sm';
  const muted = hc ? 'text-stone-300' : 'text-zinc-600';
  const soft = hc ? 'text-stone-200' : 'text-zinc-700';
  const ring = hc ? 'focus:outline-none focus:ring-2 focus:ring-yellow-300' : 'focus:outline-none focus:ring-2 focus:ring-emerald-600';

  const btnPrimary = `${ring} ${hc ? 'bg-yellow-300 text-black border-2 border-white hover:bg-yellow-200' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-600'} px-6 py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`;
  const btnQuiet = `${ring} ${hc ? 'bg-zinc-800 text-white border border-white hover:bg-zinc-700' : 'bg-white text-emerald-800 border border-emerald-700 hover:bg-emerald-50'} px-4 py-2 rounded-full text-sm font-medium transition`;

  const fontStyle = { fontFamily: "'Outfit', system-ui, sans-serif" };
  const displayStyle = { fontFamily: "'Outfit', system-ui, sans-serif" };
  const uiStyle = { fontFamily: "'Outfit', system-ui, sans-serif" };
  const rootClass = `${hc ? 'avp-hc ' : ''}min-h-screen p-6 sm:p-10 ${page} ${scale.body}`;

  /* ---- shared chrome (inline JSX so the live region stays mounted) ---- */
  const chrome = (
    <>
      <a href="#avp-main" className={`sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 rounded-full font-semibold ${hc ? 'bg-yellow-300 text-black' : 'bg-emerald-500 text-emerald-950'}`}>
        Skip to main content
      </a>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>

      <div className="relative">
        <div className="flex justify-end mb-2">
          <button onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen} aria-controls="avp-settings" className={btnQuiet}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-middle">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="ml-2 align-middle">Display</span>
          </button>
        </div>

        {settingsOpen && (
          <div id="avp-settings" role="group" aria-label="Display settings" className={`${card} rounded-2xl p-4 mb-4 absolute right-0 z-40 w-72`}>
            <p className="font-semibold mb-3" style={displayStyle}>Display settings</p>
            <div className="mb-4">
              <span className={`block text-sm mb-2 ${soft}`}>Contrast</span>
              <button onClick={() => setHighContrast(!hc)} aria-pressed={hc} className={btnQuiet + ' w-full text-center'}>
                {hc ? 'High contrast: on' : 'High contrast: off'}
              </button>
            </div>
            <div>
              <span className={`block text-sm mb-2 ${soft}`}>Text size</span>
              <div className="flex gap-2" role="group" aria-label="Text size">
                {[['comfortable', 'A'], ['large', 'A+'], ['larger', 'A++']].map(([key, glyph]) => (
                  <button
                    key={key}
                    onClick={() => setFontScale(key)}
                    aria-pressed={fontScale === key}
                    className={`${ring} flex-1 px-3 py-2 rounded-full font-medium transition ${
                      fontScale === key
                        ? (hc ? 'bg-yellow-300 text-black border-2 border-white' : 'bg-emerald-500 text-emerald-950 border border-emerald-500')
                        : (hc ? 'bg-zinc-800 text-white border border-white' : 'bg-white text-zinc-800 border border-zinc-500')
                    }`}
                  >
                    {glyph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const progress = (
    <div className="mb-8">
      <div className="flex justify-between items-baseline mb-2">
        <span className={`text-sm font-medium ${soft}`}>Sentence {Math.min(current + 1, total)} of {total}</span>
        <span className={`text-sm ${muted}`}>{progressPct}% complete</span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${hc ? 'bg-zinc-700' : 'bg-emerald-100'}`} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
        <div className={`h-full rounded-full transition-all duration-500 ${hc ? 'bg-yellow-300' : 'bg-emerald-700'}`} style={{ width: `${progressPct}%` }} />
      </div>
    </div>
  );

  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const stageStrip = (
    <ol className="flex flex-wrap gap-2 mb-6" aria-label="Steps in this sentence">
      {STAGES.map((s, i) => {
        const done = i < stageIdx || solved;
        const active = i === stageIdx && !solved;
        return (
          <li
            key={s.key}
            aria-current={active ? 'step' : undefined}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${
              active
                ? (hc ? 'bg-yellow-300 text-black border-white' : 'bg-emerald-500 text-emerald-950 border-emerald-500')
                : done
                ? (hc ? 'bg-zinc-800 text-white border-white' : 'bg-emerald-50 text-emerald-800 border-emerald-200')
                : (hc ? 'bg-zinc-900 text-stone-300 border-zinc-600' : 'bg-white text-zinc-600 border-zinc-300')
            }`}
          >
            <span aria-hidden="true" className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${active ? (hc ? 'bg-black text-yellow-300' : 'bg-emerald-900 text-emerald-50') : (hc ? 'bg-zinc-700' : 'bg-zinc-100 text-zinc-600')}`}>
              {done ? '\u2713' : i + 1}
            </span>
            {s.label}
          </li>
        );
      })}
    </ol>
  );

  const hintBlock = (
    <div className="mb-5">
      <button onClick={() => setShowHint(!showHint)} aria-expanded={showHint} className={btnQuiet}>
        {showHint ? 'Hide hint' : 'Need a hint?'}
      </button>
      {showHint && (
        <div className={`mt-3 p-4 rounded-xl ${hc ? 'bg-zinc-800 border border-yellow-300 text-yellow-100' : 'bg-amber-50 border border-amber-200 text-amber-900'}`} role="region" aria-label="Hint">
          {sentence.hint}
        </div>
      )}
    </div>
  );

  const finding = (label, value) => (
    <div className={`p-4 rounded-2xl mb-5 ${hc ? 'bg-zinc-800 border border-emerald-300' : 'bg-emerald-50 border border-emerald-200'}`}>
      <p className={`text-sm font-semibold mb-1 ${hc ? 'text-emerald-200' : 'text-emerald-800'}`}>{label}</p>
      <p className={hc ? 'text-white' : 'text-emerald-950'}>{value}</p>
    </div>
  );

  /* =========================== SCREENS =========================== */

  if (phase === 'intro') {
    return (
      <div className={rootClass} lang="en" style={uiStyle}>
        <div className="max-w-2xl mx-auto">
          {chrome}
          <main id="avp-main" ref={mainRef} tabIndex={-1} className={`${ring} ${card} rounded-3xl p-8 sm:p-10`}>
            <p className={`text-sm font-semibold tracking-wide uppercase mb-3 ${hc ? 'text-yellow-300' : 'text-emerald-800'}`}>Sentient Learning</p>
            <h1 className={`${scale.h1} font-bold mb-4 leading-tight tracking-tight`} style={displayStyle}>Active Voice Practice</h1>
            <div className={`h-1.5 w-16 rounded-full mb-6 ${hc ? 'bg-yellow-300' : 'bg-rose-400'}`} aria-hidden="true"></div>
            <p className={`${soft} mb-6 leading-relaxed`}>
              In briefs, agreements, reports, and compliance documents, passive voice hides who decided,
              who recommended, and who must answer for it. Active voice names the doer and states the action plainly —
              so a decision maker can read it in one pass.
            </p>

            <div className={`rounded-2xl p-5 mb-8 ${hc ? 'bg-zinc-800 border border-white' : 'bg-emerald-50 border border-emerald-100'}`}>
              <h2 className="font-semibold mb-3" style={displayStyle}>How it works</h2>
              <ol className={`space-y-2 ${soft}`}>
                <li><span className="font-semibold">1. Spot it</span> — find where the sentence hides who did the action.</li>
                <li><span className="font-semibold">2. Find the action</span> — uncover the real verb, even when it hides inside a noun.</li>
                <li><span className="font-semibold">3. Rewrite</span> — put the doer first and let the verb do the work.</li>
              </ol>
            </div>

            <button onClick={start} className={btnPrimary}>Begin practice</button>

            <div className="mt-8">
              <button onClick={() => setHelpOpen(!helpOpen)} aria-expanded={helpOpen} aria-controls="avp-help" className={`${ring} inline-block py-2 text-sm font-semibold underline ${hc ? 'text-yellow-200' : 'text-emerald-800'}`}>
                {helpOpen ? 'Hide Accessibility/Keyboard Navigation Tips' : 'Accessibility/Keyboard Navigation Tips'}
              </button>
              {helpOpen && (
                <div id="avp-help" role="region" aria-label="Accessibility and keyboard navigation tips" className={`mt-3 p-4 rounded-xl text-sm ${hc ? 'bg-zinc-800 border border-white text-stone-200' : 'bg-emerald-50 border border-emerald-200 text-zinc-700'}`}>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use Tab to move between controls and Enter to activate buttons.</li>
                    <li>In the rewrite box, press Enter to submit or Shift + Enter for a new line.</li>
                    <li>Open Display (top right) to turn on high contrast or enlarge the text.</li>
                    <li>Screen readers announce each step as you move through them.</li>
                  </ul>
                </div>
              )}
            </div>
          </main>
          <Footer muted={muted} />
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className={rootClass} lang="en" style={uiStyle}>
        <div className="max-w-2xl mx-auto">
          {chrome}
          <main id="avp-main" ref={mainRef} tabIndex={-1} className={`${ring} ${card} rounded-3xl p-8 sm:p-10`}>
            {progress}
            <h1 className={`${scale.h2} font-bold mb-4 tracking-tight`} style={displayStyle}>Nicely done.</h1>
            <p className={`${soft} mb-6 leading-relaxed`}>
              You worked through all {total} sentences — spotting passive voice, freeing the verb, and putting the doer
              first. You can make the same move in your next brief or agreement.
            </p>
            <div className={`rounded-2xl p-5 mb-8 ${hc ? 'bg-zinc-800 border border-emerald-300' : 'bg-emerald-50 border border-emerald-200'}`}>
              <h2 className={`font-semibold mb-2 ${hc ? 'text-emerald-100' : 'text-emerald-800'}`} style={displayStyle}>Carry this into your writing</h2>
              <p className={hc ? 'text-stone-100' : 'text-emerald-900'}>
                When you draft, scan for "was," "were," "is," or "will be" with "by" close behind. Ask "who does this?" —
                then start the sentence with them.
              </p>
            </div>
            <button onClick={restart} className={btnPrimary}>Practice again</button>
          </main>
          <Footer muted={muted} />
        </div>
      </div>
    );
  }

  /* ---- practice phase ---- */
  return (
    <div className={rootClass} lang="en" style={uiStyle}>
      <div className="max-w-2xl mx-auto">
        {chrome}
        {progress}

        <main id="avp-main" ref={mainRef} tabIndex={-1} className={`${ring} ${card} rounded-3xl p-7 sm:p-9`}>
          <h1 className="sr-only">Active Voice Practice</h1>
          <p className={`inline-block text-sm px-3 py-1 rounded-full mb-5 ${hc ? 'bg-zinc-800 text-white border border-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>You get two tries on each rewrite.</p>
          {stageStrip}

          {stage !== 'rewrite' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${muted}`}>Original sentence</p>
                <span className={`text-xs px-2.5 py-1 rounded-full ${hc ? 'bg-zinc-800 text-stone-200 border border-zinc-600' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>{sentence.docType}</span>
              </div>
              <blockquote className={`${scale.sentence} font-medium leading-snug mb-7 ${hc ? 'text-white' : 'text-emerald-950'}`} style={fontStyle}>
                {sentence.original}
              </blockquote>

              {revealedPassive && finding('The passive part', sentence.passivePhrase)}
              {revealedVerbs && finding('The action verbs', sentence.verbs)}
            </>
          )}

          {stage === 'notice' && (
            <section aria-labelledby="avp-stage">
              <h2 id="avp-stage" className={`${scale.step} font-semibold mb-3`} style={displayStyle}>Step 1 · Spot the passive voice</h2>
              <p className={`${soft} mb-5 leading-relaxed`}>
                Passive voice hides who did the action — usually with a form of "to be" (was, were, is, will be)
                plus "by." Read the sentence and find that part. Picture it in your head, then reveal to check.
              </p>
              {hintBlock}
              <button onClick={() => { setRevealedPassive(true); setShowHint(false); setStage('action'); setAnnounce('You revealed the passive part.'); }} className={btnPrimary}>
                Show me the passive part
              </button>
            </section>
          )}

          {stage === 'action' && (
            <section aria-labelledby="avp-stage">
              <h2 id="avp-stage" className={`${scale.step} font-semibold mb-3`} style={displayStyle}>Step 2 · Find the action</h2>
              <p className={`${soft} mb-5 leading-relaxed`}>
                Now find the real action. Sometimes the verb hides inside a noun — for example, "recommendation" is really
                the action "recommend." (Grammar people call that hidden-verb noun a <span className="italic">nominalization</span>.)
              </p>
              {hintBlock}
              <button onClick={() => { setRevealedVerbs(true); setShowHint(false); setStage('rewrite'); setAnnounce('You revealed the verbs. Now rewrite.'); }} className={btnPrimary}>
                Show me the verbs
              </button>
            </section>
          )}

          {stage === 'rewrite' && (
            <section aria-labelledby="avp-stage">
              <h2 id="avp-stage" className={`${scale.step} font-semibold mb-3`} style={displayStyle}>Step 3 · Rewrite in active voice</h2>
              <p className={`${soft} mb-5 leading-relaxed`}>Put the doer first, then a strong, direct verb.</p>

              {!solved && hintBlock}

              <div className={`rounded-2xl p-4 mb-5 ${hc ? 'bg-zinc-800 border border-white' : 'bg-emerald-50 border border-emerald-200'}`}>
                <p className={`text-sm font-semibold mb-1 ${hc ? 'text-yellow-300' : 'text-emerald-800'}`}>Rewrite this sentence:</p>
                <p className={`leading-snug mb-3 ${hc ? 'text-white' : 'text-emerald-950'}`} style={fontStyle}>{sentence.original}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span className={soft}><span className="font-medium">Passive part:</span> {sentence.passivePhrase}</span>
                  <span className={soft}><span className="font-medium">Action:</span> {sentence.verbs}</span>
                </div>
              </div>

              <label htmlFor="avp-answer" className={`block font-medium mb-2 ${hc ? 'text-white' : 'text-emerald-900'}`}>Your active-voice sentence</label>
              <textarea
                id="avp-answer"
                ref={answerRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={solved}
                rows={3}
                placeholder="Type your rewrite here…"
                aria-describedby="avp-answer-help"
                className={`${ring} w-full p-4 rounded-2xl mb-2 resize-y disabled:cursor-not-allowed ${hc ? 'bg-zinc-800 text-white border-2 border-white disabled:bg-zinc-900 disabled:border-zinc-600' : 'bg-white border border-zinc-500 text-emerald-950 disabled:bg-zinc-100'}`}
                style={uiStyle}
              />
              <p id="avp-answer-help" className={`text-sm mb-5 ${muted}`}>Press Enter to submit, or Shift + Enter for a new line.</p>

              {!solved && <button onClick={submit} disabled={!answer.trim()} className={btnPrimary}>Submit my answer</button>}
            </section>
          )}

          {feedback && (
            <div
              ref={feedbackRef}
              tabIndex={-1}
              role="status"
              aria-live="assertive"
              aria-atomic="true"
              className={`${ring} mt-6 p-5 rounded-2xl ${
                feedback.kind === 'success'
                  ? (hc ? 'bg-zinc-900 border-2 border-green-400 text-green-200' : 'bg-emerald-50 border border-emerald-300 text-emerald-900')
                  : feedback.kind === 'retry'
                  ? (hc ? 'bg-zinc-900 border-2 border-yellow-300 text-yellow-100' : 'bg-amber-50 border border-amber-300 text-amber-900')
                  : (hc ? 'bg-zinc-900 border-2 border-white text-stone-100' : 'bg-slate-50 border border-slate-300 text-slate-900')
              }`}
            >
              <p className="font-semibold mb-1" style={displayStyle}>
                {feedback.kind === 'success' ? 'That works.' : feedback.kind === 'retry' ? 'Not quite yet.' : 'A model answer'}
              </p>
              <p className="leading-relaxed">{feedback.text}</p>
            </div>
          )}

          {solved && (
            <button ref={nextRef} onClick={next} className={`${btnPrimary} mt-6`} aria-label={current < total - 1 ? `Continue to sentence ${current + 2} of ${total}` : 'Finish practice'}>
              {current < total - 1 ? 'Continue \u2192' : 'Finish \u2192'}
            </button>
          )}
        </main>

        <Footer muted={muted} />
      </div>
    </div>
  );
}

function Footer({ muted }) {
  return (
    <footer className={`mt-8 text-center text-sm ${muted}`}>
      <p>&copy; 2026 Sentient Learning. All rights reserved.</p>
    </footer>
  );
}
