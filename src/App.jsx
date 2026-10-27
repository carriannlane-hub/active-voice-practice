import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SENTENCES, tokenize, resolveTargets } from './sentences';
import { gradeRewrite, gradeSelection, normalize } from './grader';

/*
  Active Voice Practice
  Sentient Learning

  Three doing-steps per sentence:
    1. Spot it        tap the words that signal passive voice
    2. Find the action tap the word that holds the real action
    3. Activate it     rewrite with unlimited tries and a help ladder

  Sentences and grading rules live in sentences.js and grader.js.
*/

const STORAGE_KEY = 'avp-progress-v2';
const PREFS_KEY = 'avp-prefs-v2';

const STAGES = [
  { key: 'spot', label: 'Spot it' },
  { key: 'action', label: 'Find the action' },
  { key: 'activate', label: 'Activate it' }
];

const FONT_SCALES = [
  { key: 'comfortable', glyph: 'A', label: 'Default text size', css: '100%' },
  { key: 'large', glyph: 'A+', label: 'Large text', css: '112.5%' },
  { key: 'larger', glyph: 'A++', label: 'Largest text', css: '125%' }
];

/* ---------------- theme ---------------- */

const THEMES = {
  light: {
    page: 'bg-stone-50 text-stone-900',
    card: 'bg-white border border-stone-200 shadow-sm',
    muted: 'text-stone-500',
    soft: 'text-stone-600',
    strong: 'text-stone-900',
    eyebrow: 'text-emerald-800',
    accentBar: 'bg-emerald-600',
    ring: 'focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300',
    btnPrimary: 'bg-emerald-700 text-white hover:bg-emerald-800',
    btnQuiet: 'bg-white text-stone-800 border border-stone-300 hover:bg-stone-100',
    word: 'bg-white text-stone-900 border border-stone-300 hover:border-stone-600',
    wordSelected: 'bg-stone-900 text-white border border-stone-900',
    wordSignal: 'bg-rose-100 text-rose-950 border border-rose-200',
    wordAction: 'bg-sky-100 text-sky-950 border border-sky-200',
    wordPlain: 'text-stone-900 border border-transparent',
    panelSignal: 'bg-rose-50 border border-rose-200 text-rose-950',
    panelAction: 'bg-sky-50 border border-sky-200 text-sky-950',
    panelHelp: 'bg-sky-50 border border-sky-200 text-sky-950',
    panelMiss: 'bg-amber-50 border border-amber-300 text-amber-950',
    panelRight: 'bg-emerald-50 border border-emerald-200 text-emerald-950',
    successHead: 'bg-emerald-700 text-white',
    successBody: 'bg-emerald-50 border border-emerald-200 text-emerald-950',
    successCheck: 'text-emerald-700',
    input: 'bg-white text-stone-900 border border-stone-400 placeholder-stone-500',
    inputDone: 'bg-stone-50 text-stone-900 border border-stone-200',
    badge: 'bg-stone-100 text-stone-700 border border-stone-200',
    badgeGood: 'bg-emerald-100 text-emerald-900',
    progressTrack: 'bg-stone-200',
    progressFill: 'bg-emerald-600',
    stepActive: 'bg-stone-900 text-white',
    stepDone: 'bg-emerald-100 text-emerald-900',
    stepTodo: 'bg-white text-stone-500 border border-stone-300',
    strike: 'text-stone-400 line-through decoration-rose-400',
    link: 'text-emerald-800 underline',
    settings: 'bg-white border border-stone-200 shadow-lg'
  },
  hc: {
    page: 'bg-black text-white',
    card: 'bg-zinc-950 border-2 border-white',
    muted: 'text-zinc-300',
    soft: 'text-zinc-200',
    strong: 'text-white',
    eyebrow: 'text-yellow-300',
    accentBar: 'bg-yellow-300',
    ring: 'focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300',
    btnPrimary: 'bg-yellow-300 text-black border-2 border-white hover:bg-yellow-200',
    btnQuiet: 'bg-zinc-900 text-white border border-white hover:bg-zinc-800',
    word: 'bg-zinc-900 text-white border border-zinc-400 hover:border-white',
    wordSelected: 'bg-yellow-300 text-black border border-yellow-300',
    wordSignal: 'bg-white text-black border border-white',
    wordAction: 'bg-cyan-300 text-black border border-cyan-300',
    wordPlain: 'text-white border border-transparent',
    panelSignal: 'bg-zinc-900 border-2 border-white text-white',
    panelAction: 'bg-zinc-900 border-2 border-cyan-300 text-white',
    panelHelp: 'bg-zinc-900 border-2 border-cyan-300 text-white',
    panelMiss: 'bg-zinc-900 border-2 border-white text-white',
    panelRight: 'bg-zinc-900 border-2 border-yellow-300 text-white',
    successHead: 'bg-yellow-300 text-black',
    successBody: 'bg-zinc-900 border-2 border-yellow-300 text-white',
    successCheck: 'text-yellow-300',
    input: 'bg-zinc-900 text-white border-2 border-white placeholder-zinc-400',
    inputDone: 'bg-zinc-900 text-white border-2 border-zinc-500',
    badge: 'bg-zinc-800 text-white border border-zinc-500',
    badgeGood: 'bg-yellow-300 text-black',
    progressTrack: 'bg-zinc-700',
    progressFill: 'bg-yellow-300',
    stepActive: 'bg-yellow-300 text-black',
    stepDone: 'bg-zinc-800 text-white border border-white',
    stepTodo: 'bg-zinc-950 text-zinc-400 border border-zinc-600',
    strike: 'text-zinc-400 line-through',
    link: 'text-yellow-200 underline',
    settings: 'bg-zinc-950 border-2 border-white'
  }
};

/* ---------------- storage ---------------- */

const load = (key) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const save = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable; the app still works for this visit */
  }
};
const clear = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

/* ---------------- small pieces ---------------- */

const CheckIcon = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    <path d="M4 10.5l4 4 8-9" />
  </svg>
);

const GearIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-middle">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/**
 * The sentence as tappable words. In "pick" mode each word is a toggle
 * button with roving focus (arrow keys move between words). In "static"
 * mode the words are plain text with the signal and action highlighted.
 */
function WordPicker({ tokens, selected, onToggle, signal, action, mode, t, label, disabled }) {
  const [focusIdx, setFocusIdx] = useState(0);
  const refs = useRef([]);

  const move = (from, delta) => {
    const next = Math.min(Math.max(from + delta, 0), tokens.length - 1);
    setFocusIdx(next);
    refs.current[next] && refs.current[next].focus();
  };

  const classFor = (i) => {
    const isSel = selected.includes(i);
    const isSig = signal.includes(i);
    const isAct = action.includes(i);
    if (mode === 'static') {
      if (isAct) return t.wordAction;
      if (isSig) return t.wordSignal;
      return t.wordPlain;
    }
    if (isSel && disabled) return mode === 'pick-action' ? t.wordAction : t.wordSignal;
    if (isSel) return t.wordSelected;
    if (mode === 'pick-action' && isSig) return t.wordSignal;
    return t.word;
  };

  const base = 'px-2 py-1 rounded-lg leading-tight transition-colors';

  if (mode === 'static') {
    return (
      <p aria-label={label} className="flex flex-wrap gap-x-1 gap-y-2 text-2xl font-medium">
        {tokens.map((tok, i) => (
          <span key={i} className={`${base} ${classFor(i)}`}>{tok.text}</span>
        ))}
      </p>
    );
  }

  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-x-1.5 gap-y-2 text-2xl font-medium">
      {tokens.map((tok, i) => (
        <button
          key={i}
          type="button"
          ref={(el) => (refs.current[i] = el)}
          tabIndex={i === focusIdx ? 0 : -1}
          aria-pressed={selected.includes(i)}
          disabled={disabled}
          onFocus={() => setFocusIdx(i)}
          onClick={() => onToggle(i)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1); }
            if (e.key === 'Home') { e.preventDefault(); move(i, -tokens.length); }
            if (e.key === 'End') { e.preventDefault(); move(i, tokens.length); }
          }}
          className={`${base} ${t.ring} ${classFor(i)} disabled:cursor-default`}
        >
          {tok.text}
        </button>
      ))}
    </div>
  );
}

function Panel({ t, kind, title, children, innerRef, live }) {
  const cls = {
    signal: t.panelSignal,
    action: t.panelAction,
    help: t.panelHelp,
    miss: t.panelMiss,
    right: t.panelRight
  }[kind];
  return (
    <div
      ref={innerRef}
      tabIndex={innerRef ? -1 : undefined}
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      aria-atomic={live ? 'true' : undefined}
      className={`${t.ring} rounded-2xl p-4 sm:p-5 ${cls}`}
    >
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/* ---------------- the app ---------------- */

export default function App() {
  /* preferences */
  const savedPrefs = useMemo(() => load(PREFS_KEY) || {}, []);
  const [hc, setHc] = useState(Boolean(savedPrefs.hc));
  const [fontScale, setFontScale] = useState(savedPrefs.fontScale || 'comfortable');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const t = THEMES[hc ? 'hc' : 'light'];

  useEffect(() => {
    save(PREFS_KEY, { hc, fontScale });
    const scale = FONT_SCALES.find((s) => s.key === fontScale) || FONT_SCALES[0];
    document.documentElement.style.fontSize = scale.css;
    document.documentElement.style.colorScheme = hc ? 'dark' : 'light';
    document.body.className = hc ? 'bg-black' : 'bg-stone-50';
  }, [hc, fontScale]);

  /* journey state */
  const savedProgress = useMemo(() => load(STORAGE_KEY), []);
  const [phase, setPhase] = useState('intro'); // intro | practice | finish
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]);
  const hasSaved = Boolean(savedProgress && savedProgress.phase === 'practice' && savedProgress.results);

  /* per-sentence state */
  const [stage, setStage] = useState('spot');
  const [selected, setSelected] = useState([]);
  const [stageFeedback, setStageFeedback] = useState(null); // { kind, text }
  const [stageMisses, setStageMisses] = useState({ spot: 0, action: 0 });
  const [stageRevealed, setStageRevealed] = useState({ spot: false, action: false });
  const [stageDone, setStageDone] = useState(false);
  const [answer, setAnswer] = useState('');
  const [rewriteFeedback, setRewriteFeedback] = useState(null); // { correct, ... }
  const [rewriteTries, setRewriteTries] = useState(0);
  const [helpLevel, setHelpLevel] = useState(0); // 0 none, 1 question, 2 starter, 3 model
  const [usedModel, setUsedModel] = useState(false);
  const [solved, setSolved] = useState(false);
  const [announce, setAnnounce] = useState('');

  const mainRef = useRef(null);
  const answerRef = useRef(null);
  const nextRef = useRef(null);
  const feedbackRef = useRef(null);
  const taskRef = useRef(null);

  const sentence = SENTENCES[current];
  const total = SENTENCES.length;
  const tokens = useMemo(() => tokenize(sentence.original), [sentence]);
  const signalIdx = useMemo(() => resolveTargets(tokens, sentence.signal), [tokens, sentence]);
  const actionIdx = useMemo(() => resolveTargets(tokens, sentence.action), [tokens, sentence]);

  const focusLater = (ref) => setTimeout(() => ref.current && ref.current.focus(), 60);

  const resetSentence = useCallback(() => {
    setStage('spot');
    setSelected([]);
    setStageFeedback(null);
    setStageMisses({ spot: 0, action: 0 });
    setStageRevealed({ spot: false, action: false });
    setStageDone(false);
    setAnswer('');
    setRewriteFeedback(null);
    setRewriteTries(0);
    setHelpLevel(0);
    setUsedModel(false);
    setSolved(false);
  }, []);

  /* persist journey position (sentence-level, so a refresh resumes at the sentence start) */
  useEffect(() => {
    if (phase === 'practice') save(STORAGE_KEY, { phase, current, results });
    if (phase === 'finish') save(STORAGE_KEY, { phase, current, results });
  }, [phase, current, results]);

  /* announcements */
  useEffect(() => {
    if (phase !== 'practice') return;
    if (stage === 'spot') setAnnounce(`Sentence ${current + 1} of ${total}. Step 1, spot it: tap the words that signal passive voice.`);
    if (stage === 'action') setAnnounce(`Step 2, find the action. ${sentence.actionPrompt}`);
    if (stage === 'activate') {
      setAnnounce('Step 3, activate it: rewrite the sentence in active voice.');
      focusLater(answerRef);
    }
  }, [stage, current, phase, total, sentence]);

  /* ---------- actions ---------- */

  const begin = (resume) => {
    if (resume && hasSaved) {
      setCurrent(Math.min(savedProgress.current, total - 1));
      setResults(savedProgress.results);
    } else {
      clear(STORAGE_KEY);
      setCurrent(0);
      setResults([]);
    }
    resetSentence();
    setPhase('practice');
    focusLater(mainRef);
  };

  const toggleWord = (i) => {
    setStageFeedback(null);
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort((a, b) => a - b)));
  };

  const checkSelection = () => {
    const targets = stage === 'spot' ? signalIdx : actionIdx;
    const result = gradeSelection(selected, targets, tokens, stage === 'spot' ? 'signal' : 'action', {
      doer: sentence.doer,
      signalIdx,
      decoys: sentence.decoys
    });
    if (result.kind === 'correct') {
      setStageDone(true);
      setStageFeedback({ kind: 'right', text: stage === 'spot' ? 'You found the signal.' : 'You found the action.' });
      setAnnounce(stage === 'spot'
        ? `Correct. The passive signal is ${sentence.signalLabel}. ${sentence.passiveNote}`
        : `Correct. The action is ${sentence.actionLabel}. ${sentence.verbNote}`);
      focusLater(nextRef);
    } else {
      setStageMisses((m) => ({ ...m, [stage]: m[stage] + 1 }));
      setStageFeedback({ kind: 'miss', partial: result.kind === 'partial', text: result.text });
      setAnnounce(`${result.kind === 'partial' ? 'Close.' : 'Not there yet.'} ${result.text}`);
      /* Drop the wrong taps so the next try starts clean. Right taps stay marked. */
      setSelected(selected.filter((i) => targets.includes(i)));
    }
  };

  const revealSelection = () => {
    const targets = stage === 'spot' ? signalIdx : actionIdx;
    setSelected(targets);
    setStageRevealed((r) => ({ ...r, [stage]: true }));
    setStageDone(true);
    setStageFeedback({ kind: 'right', text: stage === 'spot' ? 'Here is the signal.' : 'Here is the action.' });
    setAnnounce(stage === 'spot'
      ? `The passive signal is ${sentence.signalLabel}. ${sentence.passiveNote}`
      : `The action is ${sentence.actionLabel}. ${sentence.verbNote}`);
    focusLater(nextRef);
  };

  const nextStage = () => {
    setSelected([]);
    setStageFeedback(null);
    setStageDone(false);
    setStage(stage === 'spot' ? 'action' : 'activate');
    focusLater(taskRef);
  };

  const submitRewrite = () => {
    const result = gradeRewrite(answer, sentence);
    const tries = rewriteTries + 1;
    setRewriteTries(tries);
    if (result.correct) {
      setRewriteFeedback({ ...result, tries, helpLevel, usedModel });
      setSolved(true);
      setAnnounce(`Yes. That is active voice. ${sentence.successNote}`);
      focusLater(nextRef);
    } else {
      setRewriteFeedback({ ...result, tries });
      setAnnounce(`Not there yet. ${result.note}`);
      setTimeout(() => {
        if (answerRef.current) {
          answerRef.current.focus();
          answerRef.current.select();
        }
      }, 60);
    }
  };

  const moreHelp = () => {
    const level = Math.min(helpLevel + 1, 3);
    setHelpLevel(level);
    if (level === 2 && !answer.trim()) setAnswer(sentence.help.starter + ' ');
    if (level === 2) {
      setTimeout(() => {
        const el = answerRef.current;
        if (!el) return;
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
      }, 60);
    }
    setAnnounce(level === 1 ? `Hint: ${sentence.help.question}` : level === 2 ? `Sentence starter: ${sentence.help.starter}` : `Model answer: ${sentence.sampleActive}`);
  };

  const useModel = () => {
    setAnswer(sentence.sampleActive);
    setUsedModel(true);
    focusLater(answerRef);
  };

  const continueNext = () => {
    const record = {
      id: sentence.id,
      rewrite: answer.trim(),
      rewriteTries,
      helpLevel,
      usedModel,
      spotFirstTry: stageMisses.spot === 0 && !stageRevealed.spot,
      actionFirstTry: stageMisses.action === 0 && !stageRevealed.action
    };
    const nextResults = [...results.slice(0, current), record];
    setResults(nextResults);
    if (current < total - 1) {
      setCurrent(current + 1);
      resetSentence();
      focusLater(mainRef);
    } else {
      setPhase('finish');
      setAnnounce('You finished all sentences. Here is your summary.');
      focusLater(mainRef);
    }
  };

  const restart = () => {
    clear(STORAGE_KEY);
    setResults([]);
    setCurrent(0);
    resetSentence();
    setPhase('practice');
    setAnnounce('Starting over from sentence 1.');
    focusLater(mainRef);
  };

  const onAnswerKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !solved && answer.trim()) {
      e.preventDefault();
      submitRewrite();
    }
  };

  /* ---------- shared chrome ---------- */

  const btnPrimary = `${t.ring} ${t.btnPrimary} inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`;
  const btnQuiet = `${t.ring} ${t.btnQuiet} inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed`;

  const chrome = (
    <>
      <a href="#avp-main" className={`sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 rounded-full font-semibold ${t.btnPrimary}`}>
        Skip to main content
      </a>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announce}</div>

      <header className="relative flex items-center justify-between mb-5">
        <p className={`text-sm font-semibold tracking-wide uppercase ${t.eyebrow}`}>Sentient Learning</p>
        <button onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen} aria-controls="avp-settings" className={btnQuiet}>
          <GearIcon />
          <span>Display</span>
        </button>

        {settingsOpen && (
          <div id="avp-settings" role="group" aria-label="Display settings" className={`${t.settings} rounded-2xl p-4 absolute right-0 top-12 z-40 w-72`}>
            <p className="font-semibold mb-3">Display settings</p>
            <div className="mb-4">
              <span className={`block text-sm mb-2 ${t.soft}`}>Contrast</span>
              <button onClick={() => setHc(!hc)} aria-pressed={hc} className={`${btnQuiet} w-full justify-center`}>
                {hc ? 'High contrast: on' : 'High contrast: off'}
              </button>
            </div>
            <div>
              <span className={`block text-sm mb-2 ${t.soft}`}>Text size</span>
              <div className="flex gap-2" role="group" aria-label="Text size">
                {FONT_SCALES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setFontScale(s.key)}
                    aria-pressed={fontScale === s.key}
                    aria-label={s.label}
                    className={`${t.ring} flex-1 px-3 py-2 rounded-full font-medium transition ${fontScale === s.key ? t.stepActive : t.btnQuiet}`}
                  >
                    {s.glyph}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );

  const footer = (
    <footer className={`mt-8 text-center text-sm ${t.muted}`}>
      <p>&copy; 2026 Sentient Learning. All rights reserved.</p>
    </footer>
  );

  const rootClass = `min-h-screen px-4 py-6 sm:px-8 sm:py-10 ${t.page}`;

  /* =========================== INTRO =========================== */

  if (phase === 'intro') {
    return (
      <div className={rootClass}>
        <div className="max-w-2xl mx-auto">
          {chrome}
          <main id="avp-main" ref={mainRef} tabIndex={-1} className={`${t.ring} ${t.card} rounded-3xl p-7 sm:p-10`}>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight tracking-tight">Active Voice Practice</h1>
            <div className={`h-1.5 w-16 rounded-full mb-6 ${t.accentBar}`} aria-hidden="true"></div>
            <p className={`${t.soft} mb-8 leading-relaxed text-lg`}>
              Passive voice hides who decided, who recommended, and who must answer for it.
              In four sentences from workplace documents, you will spot it, find the action, and name the doer:
              the person or group who acts.
            </p>

            <ol className="grid gap-3 sm:grid-cols-3 mb-8">
              {STAGES.map((s, i) => (
                <li key={s.key} className={`rounded-2xl p-4 ${hc ? 'bg-zinc-900 border border-zinc-500' : 'bg-stone-50 border border-stone-200'}`}>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mb-2 ${t.stepActive}`} aria-hidden="true">{i + 1}</span>
                  <p className="font-semibold">{s.label}</p>
                  <p className={`text-sm ${t.soft}`}>
                    {i === 0 && 'Tap the words that give passive voice away.'}
                    {i === 1 && 'Tap the word that names what the doer did.'}
                    {i === 2 && 'Rewrite it with the doer up front.'}
                  </p>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-3 items-center">
              {hasSaved ? (
                <>
                  <button onClick={() => begin(true)} className={btnPrimary}>Resume at sentence {Math.min(savedProgress.current, total - 1) + 1}</button>
                  <button onClick={() => begin(false)} className={btnQuiet}>Start over</button>
                </>
              ) : (
                <button onClick={() => begin(false)} className={btnPrimary}>Begin practice</button>
              )}
              <span className={`text-sm ${t.muted}`}>About 5 minutes</span>
            </div>

            <div className="mt-8">
              <button onClick={() => setHelpOpen(!helpOpen)} aria-expanded={helpOpen} aria-controls="avp-help" className={`${t.ring} inline-block py-2 text-sm font-semibold ${t.link}`}>
                {helpOpen ? 'Hide keyboard and accessibility tips' : 'Keyboard and accessibility tips'}
              </button>
              {helpOpen && (
                <div id="avp-help" role="region" aria-label="Keyboard and accessibility tips" className={`mt-3 p-4 rounded-xl text-sm ${t.panelHelp}`}>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Tab moves between controls. Enter or Space activates a button.</li>
                    <li>In the sentence, use the arrow keys to move between words and Enter to select one.</li>
                    <li>In the rewrite box, Enter submits and Shift + Enter adds a new line.</li>
                    <li>Open Display (top right) for high contrast or larger text.</li>
                    <li>A screen reader announces each step and every result.</li>
                  </ul>
                </div>
              )}
            </div>
          </main>
          {footer}
        </div>
      </div>
    );
  }

  /* =========================== FINISH =========================== */

  if (phase === 'finish') {
    const spotCount = results.filter((r) => r.spotFirstTry).length;
    const actionCount = results.filter((r) => r.actionFirstTry).length;
    const ownCount = results.filter((r) => !r.usedModel).length;
    const stat = (n, label) => (
      <div className={`rounded-2xl p-4 ${t.panelRight}`}>
        <p className="text-3xl font-bold leading-none mb-1">{n}<span className={`text-base font-medium ${t.soft}`}> of {total}</span></p>
        <p className={`text-sm ${t.soft}`}>{label}</p>
      </div>
    );
    const triesLabel = (r) => {
      if (r.usedModel) return 'With the model';
      if (r.rewriteTries === 1 && r.helpLevel === 0) return 'First try';
      if (r.rewriteTries === 1) return 'First try, with a hint';
      return `${r.rewriteTries} tries`;
    };
    return (
      <div className={rootClass}>
        <div className="max-w-2xl mx-auto">
          {chrome}
          <main id="avp-main" ref={mainRef} tabIndex={-1} className={`${t.ring} ${t.card} rounded-3xl p-7 sm:p-10`}>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">You activated all {total} sentences.</h1>
            <p className={`${t.soft} mb-6 leading-relaxed`}>Every rewrite below names who acts and what they do. That is the move to carry into your next brief, report, or agreement.</p>

            <div className="grid gap-3 sm:grid-cols-3 mb-8">
              {stat(spotCount, 'spotted the signal first try')}
              {stat(actionCount, 'found the action first try')}
              {stat(ownCount, 'wrote in your own words')}
            </div>

            <h2 className="text-xl font-semibold mb-3">Your rewrites</h2>
            <ol className="space-y-4 mb-8">
              {SENTENCES.map((s, i) => {
                const r = results[i];
                if (!r) return null;
                const toks = tokenize(s.original);
                const sig = resolveTargets(toks, s.signal);
                return (
                  <li key={s.id} className={`rounded-2xl p-4 sm:p-5 ${hc ? 'bg-zinc-900 border border-zinc-500' : 'bg-stone-50 border border-stone-200'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${t.badge}`}>{s.docType}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.badgeGood}`}>{triesLabel(r)}</span>
                    </div>
                    <p className={`text-sm mb-2 ${t.muted}`}>
                      {toks.map((tok, k) => (
                        <span key={k} className={sig.includes(k) ? t.strike : ''}>{tok.text}{k < toks.length - 1 ? ' ' : ''}</span>
                      ))}
                    </p>
                    <p className="text-lg font-medium flex items-start gap-2">
                      <CheckIcon className={`${t.successCheck} shrink-0 mt-1`} />
                      <span>{r.rewrite}</span>
                    </p>
                  </li>
                );
              })}
            </ol>

            <div className={`rounded-2xl p-5 mb-8 ${t.panelHelp}`}>
              <h2 className="font-semibold mb-2">Carry this into your writing</h2>
              <ol className="list-decimal list-inside space-y-1">
                <li>Scan for <strong>was, were, is, are, be</strong> followed by a past-tense verb.</li>
                <li>Look for <strong>by</strong> right after it. The doer is hiding there, or missing.</li>
                <li>Watch for nouns ending in <strong>-tion</strong> or <strong>-ment</strong>. A verb is trapped inside.</li>
                <li>Ask <strong>who does this?</strong> Start the sentence with them.</li>
              </ol>
            </div>

            <button onClick={restart} className={btnPrimary}>Practice again</button>
          </main>
          {footer}
        </div>
      </div>
    );
  }

  /* =========================== PRACTICE =========================== */

  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const misses = stageMisses[stage] || 0;

  const stepper = (
    <ol className="flex flex-wrap gap-2" aria-label="Steps for this sentence">
      {STAGES.map((s, i) => {
        const done = i < stageIdx || solved;
        const active = i === stageIdx && !solved;
        return (
          <li
            key={s.key}
            aria-current={active ? 'step' : undefined}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${active ? t.stepActive : done ? t.stepDone : t.stepTodo}`}
          >
            {done ? <CheckIcon className="w-4 h-4" /> : <span aria-hidden="true">{i + 1}</span>}
            <span>{done && <span className="sr-only">Done: </span>}{s.label}</span>
          </li>
        );
      })}
    </ol>
  );

  const progress = (
    <div className="flex items-center justify-between gap-4 mb-5">
      <p className={`text-sm font-medium ${t.soft}`}>Sentence {current + 1} of {total}</p>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={current + (solved ? 1 : 0)} aria-valuemin={0} aria-valuemax={total} aria-label="Sentences completed">
        {SENTENCES.map((s, i) => (
          <span key={s.id} className={`h-2 w-8 rounded-full ${i < current || (i === current && solved) ? t.progressFill : t.progressTrack}`} />
        ))}
      </div>
    </div>
  );

  const pickMode = stage === 'spot' ? 'pick' : stage === 'action' ? 'pick-action' : 'static';

  return (
    <div className={rootClass}>
      <div className="max-w-2xl mx-auto">
        {chrome}
        {progress}

        <main id="avp-main" ref={mainRef} tabIndex={-1} className={`${t.ring} ${t.card} rounded-3xl p-6 sm:p-9`}>
          <h1 className="sr-only">Active Voice Practice</h1>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            {stepper}
            <span className={`text-xs px-2.5 py-1 rounded-full ${t.badge}`}>{sentence.docType}</span>
          </div>

          <div className="mb-6">
            <WordPicker
              tokens={tokens}
              selected={selected}
              onToggle={toggleWord}
              signal={signalIdx}
              action={actionIdx}
              mode={pickMode}
              t={t}
              disabled={stageDone}
              label={stage === 'activate' ? 'Original sentence with the passive signal and the action marked' : 'Original sentence. Select words.'}
            />
            {stage === 'activate' && (
              <p className={`mt-3 text-sm ${t.soft}`}>
                <span className={`inline-block px-2 py-0.5 rounded-md mr-2 ${t.wordSignal}`}>Passive signal: {sentence.signalLabel}</span>
                <span className={`inline-block px-2 py-0.5 rounded-md ${t.wordAction}`}>Action: {sentence.actionLabel}</span>
              </p>
            )}
          </div>

          {/* ---------- steps 1 and 2: tap the words ---------- */}
          {stage !== 'activate' && (
            <section aria-labelledby="avp-task" ref={taskRef} tabIndex={-1} className={t.ring}>
              <h2 id="avp-task" className="text-xl font-semibold mb-1">
                {stage === 'spot' ? 'Spot it' : 'Find the action'}
              </h2>
              <p className={`${t.soft} mb-4 leading-relaxed`}>
                {stage === 'spot'
                  ? 'Tap the words that signal passive voice: a form of "to be," the verb after it, and "by."'
                  : sentence.actionPrompt}
              </p>

              {!stageDone && (
                <div className="flex flex-wrap gap-3 items-center mb-4">
                  <button onClick={checkSelection} disabled={selected.length === 0} className={btnPrimary}>Check</button>
                  {misses > 0 && <button onClick={revealSelection} className={btnQuiet}>Show me</button>}
                  <span className={`text-sm ${t.muted}`}>{selected.length === 0 ? 'Tap a word to begin.' : `${selected.length} selected`}</span>
                </div>
              )}

              {stageFeedback && stageFeedback.kind === 'miss' && (
                <Panel t={t} kind="miss" title={stageFeedback.partial ? 'Close.' : 'Not there yet.'} live>
                  {stageFeedback.text}
                </Panel>
              )}

              {stageDone && (
                <div className="space-y-4">
                  <Panel t={t} kind={stage === 'spot' ? 'signal' : 'action'} title={stage === 'spot' ? `${stageFeedback.text} Passive signal: "${sentence.signalLabel}"` : `${stageFeedback.text} The real action: "${sentence.actionLabel}"`}>
                    {stage === 'spot' ? sentence.passiveNote : sentence.verbNote}
                  </Panel>
                  <button ref={nextRef} onClick={nextStage} className={btnPrimary}>
                    {stage === 'spot' ? 'Next: find the action' : 'Next: activate it'} <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ---------- step 3: rewrite ---------- */}
          {stage === 'activate' && (
            <section aria-labelledby="avp-task" ref={taskRef} tabIndex={-1} className={t.ring}>
              <h2 id="avp-task" className="text-xl font-semibold mb-1">Activate it</h2>
              <p className={`${t.soft} mb-4 leading-relaxed`}>Rewrite the sentence so the doer comes first and does the action.</p>

              <label htmlFor="avp-answer" className="block font-medium mb-2">Your active-voice sentence</label>
              {solved ? (
                <p id="avp-answer" className={`w-full p-4 rounded-2xl mb-5 text-lg font-medium flex items-start gap-2 ${t.inputDone}`}>
                  <CheckIcon className={`${t.successCheck} shrink-0 mt-1`} />
                  <span>{answer.trim()}</span>
                </p>
              ) : (
                <>
                  <textarea
                    id="avp-answer"
                    ref={answerRef}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={onAnswerKey}
                    rows={2}
                    placeholder="Start with who does it…"
                    aria-describedby="avp-answer-help"
                    aria-invalid={rewriteFeedback && !rewriteFeedback.correct ? 'true' : undefined}
                    className={`${t.ring} ${t.input} w-full p-4 rounded-2xl mb-2 resize-y text-lg`}
                  />
                  <p id="avp-answer-help" className={`text-sm mb-4 ${t.muted}`}>Enter submits. Shift + Enter adds a line.</p>
                  <div className="flex flex-wrap gap-3 items-center mb-4">
                    <button onClick={submitRewrite} disabled={!answer.trim()} className={btnPrimary}>Check my sentence</button>
                    {helpLevel < 3 && (
                      <button onClick={moreHelp} className={btnQuiet}>
                        {helpLevel === 0 ? 'Hint' : helpLevel === 1 ? 'Sentence starter' : 'Model answer'}
                      </button>
                    )}
                  </div>
                </>
              )}

              {rewriteFeedback && !rewriteFeedback.correct && (
                <div className="mb-4">
                <Panel t={t} kind="miss" title={rewriteFeedback.reason === 'passive' || rewriteFeedback.reason === 'short' ? 'Not there yet.' : 'Close.'} live innerRef={feedbackRef}>
                  {rewriteFeedback.note}
                </Panel>
                </div>
              )}

              {!solved && helpLevel > 0 && (
                <div className="mb-4">
                  <Panel t={t} kind="help" title={helpLevel === 1 ? 'Hint' : helpLevel === 2 ? 'Sentence starter' : 'Model answer'}>
                    {helpLevel === 1 && sentence.help.question}
                    {helpLevel === 2 && <>Begin with <strong>{sentence.help.starter}</strong> and give them the action: <strong>{sentence.actionLabel}</strong>.</>}
                    {helpLevel === 3 && (
                      <>
                        <p className="text-lg font-medium mb-2">&ldquo;{sentence.sampleActive}&rdquo;</p>
                        <p className={`text-sm mb-3`}>The doer comes first and the verb does the work. Write your own version, or use this one and keep going.</p>
                        <button onClick={useModel} className={btnQuiet}>Use this version</button>
                      </>
                    )}
                  </Panel>
                </div>
              )}

              {rewriteFeedback && rewriteFeedback.correct && (
                <div className="rounded-2xl overflow-hidden" role="status" aria-live="polite" aria-atomic="true">
                  <div className={`${t.successHead} px-5 py-4 flex items-center gap-3`}>
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${hc ? 'bg-black text-yellow-300' : 'bg-white text-emerald-700'}`}>
                      <CheckIcon />
                    </span>
                    <div>
                      <p className="text-xl font-bold leading-tight">
                        {rewriteFeedback.usedModel ? 'That is active voice.' : 'Yes. That is active voice.'}
                      </p>
                      <p className="text-sm opacity-90">
                        {rewriteFeedback.usedModel
                          ? 'You built it from the model. Try the next one in your own words.'
                          : rewriteFeedback.tries === 1 && rewriteFeedback.helpLevel === 0
                          ? 'You got it on the first try.'
                          : rewriteFeedback.tries === 1
                          ? 'You got it on the first try, with a hint.'
                          : `You got it on try ${rewriteFeedback.tries}.`}
                      </p>
                    </div>
                  </div>
                  <div className={`${t.successBody} px-5 py-4 border-t-0 rounded-b-2xl`}>
                    <ul className="space-y-1.5 mb-3">
                      <li className="flex items-start gap-2"><CheckIcon className={`${t.successCheck} shrink-0 mt-0.5`} /><span><strong>You put the doer first:</strong> {rewriteFeedback.doer}</span></li>
                      <li className="flex items-start gap-2"><CheckIcon className={`${t.successCheck} shrink-0 mt-0.5`} /><span><strong>You used an action verb:</strong> {rewriteFeedback.verb}</span></li>
                      <li className="flex items-start gap-2"><CheckIcon className={`${t.successCheck} shrink-0 mt-0.5`} /><span><strong>You dropped the passive signal:</strong> &ldquo;{sentence.signalLabel}&rdquo;</span></li>
                    </ul>
                    <p className="leading-relaxed">{sentence.successNote}</p>
                    {normalize(answer) !== normalize(sentence.sampleActive) && !rewriteFeedback.usedModel && (
                      <p className={`mt-3 text-sm ${t.soft}`}><span className="font-medium">Another strong version:</span> &ldquo;{sentence.sampleActive}&rdquo;</p>
                    )}
                  </div>
                </div>
              )}

              {solved && (
                <button ref={nextRef} onClick={continueNext} className={`${btnPrimary} mt-5`}>
                  {current < total - 1 ? `Next sentence (${current + 2} of ${total})` : 'See your summary'} <span aria-hidden="true">&rarr;</span>
                </button>
              )}
            </section>
          )}
        </main>

        {footer}
      </div>
    </div>
  );
}
