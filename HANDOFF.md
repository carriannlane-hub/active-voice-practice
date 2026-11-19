# Active Voice Practice: handoff

Written 2026-11-19 for a new chat. State below was checked that day.

## Start here

Two jobs are waiting:

1. **Rotate the Anthropic API key** the live site uses. Steps are in "Rotate the key".
2. **Make changes Carriann will describe** at the start of the new chat. Ask her for them, assess first, then build.

## What this is

A practice activity for a plain language course. Learners are working professionals from 28 state agencies
(engineers, nurses, admin staff, environmental specialists), open enrollment. It runs inside an Adobe Connect
frame during class and on its own in a browser.

- Owner: Carriann Lane, Write Words Inc / Sentient Learning. GitHub `carriannlane-hub`.
- Repo: `carriannlane-hub/active-voice-practice`, branch `main`.
- Local clone: `C:\Users\carri\OneDrive\1A1 Write Words Inc\1 - Course PowerPoints\Plain Talk\active-voice-practice`
- Live: https://active-voice-practice.vercel.app (Vercel project `active-voice-practice`, account `director-2244`)
- Deploys: every push to `main` deploys to production. Allow up to five minutes.

## Verified state on 2026-11-19

- Working tree clean, `main` level with `origin/main`. Last commit `fb3a9f7`.
- Live site serves the same build as a fresh local build.
- The live grade function answers from the model (`"source":"model"`).
- `ANTHROPIC_API_KEY` is set in Vercel for Production and Preview, added 2026-10-27.
- Local dev servers are stopped.
- This file is committed. Delete it once the handoff is done.

## How the activity works

Four sentences, three steps each, then one sentence alone, then a summary.

1. **Spot it.** Tap the passive signal words (form of "to be", participle, "by").
2. **Find the action.** Tap the word holding the real action. In three sentences it hides in a noun.
3. **Activate it.** Rewrite in active voice. Unlimited tries. Help ladder: Hint, Sentence starter, Model answer.

Then **This one is all yours**: a memo sentence, rewritten with no steps, shown beside a model version with
three self-check questions. Skippable.

Then the **summary**: up to three named patterns from the learner's own misses, each with their sentence and a
"When you edit" cue; the four before-and-after rewrites tagged by pattern; a copyable editing checklist ordered
by their patterns.

Sentences (ids): `brief`, `explanation`, `report`, `compliance`, plus `TRANSFER` (memo).

## How rewrites are graded

Three layers, in order. All return one result shape: `{ correct, doer, verb, reason, note, strongerVerb, meaningNote, source }`.

1. **Rules that are certain** (`lib/hybrid.js`, `preCheck`): under three words, stops at the verb, exact model
   answer, or a listed passive phrase. No model call. `source: "rules"`.
2. **Claude Haiku 5.5** through `api/grade.js`, a Vercel function. Low effort, structured JSON output, prompt in
   `lib/grader-prompt.js`. The model classifies only: voice, doer, verb, one issue code, stronger verb.
   `fromModel` in `lib/hybrid.js` turns that into the result using copy from `src/sentences.js`.
   `source: "model"`.
3. **Rule grader** (`src/grader.js`) when the function or the model is unavailable. `source: "fallback"`.

Design decisions Carriann made, keep them:

- The model never writes a sentence the learner reads.
- A meaning flag on an active sentence is a soft line under the success message ("Check it against the
  original…"). It never costs a try.
- "Provided an explanation" is active and passes. The app then shows "One verb does the same job: explained."
- Haiku was chosen over Opus for cost. They matched on every learner-facing verdict once meaning became soft.

## Files

| Path | Holds |
|---|---|
| `src/App.jsx` | The whole UI: intro, practice, on-your-own, summary, themes |
| `src/sentences.js` | Sentence bank, `TRANSFER`, tokenizer helpers. All learner copy per sentence |
| `src/grader.js` | Tap-step grader and the rule-based rewrite grader |
| `lib/hybrid.js` | `preCheck`, `fromModel`, `gradeLocally`, `asTyped` |
| `lib/grader-prompt.js` | Model id, effort, system prompt, output schema |
| `lib/patterns.js` | Summary patterns, sentence tags, checklist |
| `api/grade.js` | The Vercel function. Rate limit 30 a minute per visitor, 300 character cap |
| `eval/cases.json` | 40 learner rewrites with expected verdicts, 3 marked debatable |
| `eval/run-eval.mjs` | Runs the cases on one or more models, two runs each |
| `eval/dev-api.mjs` | Local stand-in for the function on port 3001 |

## Run, test, ship

```bash
npx vite --host 127.0.0.1 --port 5173 --strictPort
```

```bash
ANTHROPIC_API_KEY=<key> node eval/dev-api.mjs
```

Vite proxies `/api` to port 3001. Without the second command the browser grades with rules only.

```bash
SOFT_MEANING=1 ANTHROPIC_API_KEY=<key> node eval/run-eval.mjs claude-haiku-5-5
```

Re-run that after any change to the prompt, the sentence bank, or `lib/hybrid.js`. Target: zero misses on the
strict cases. Meaning notes on fair paraphrases are expected and harmless.

```bash
npx vite build
```

Then commit and push to `main`. Confirm the live page serves the new `assets/index-*.js` name, and call the
live function once to confirm `"source":"model"`.

## Rotate the key

Why: the key now in Vercel was pasted into a chat on 2026-10-27, so it sits in that transcript.

1. Carriann creates a new key at https://platform.claude.com under API Keys. Name it for the site.
2. She saves it as `key.txt` in this folder so it stays out of chat. `.gitignore` already covers `.env*`;
   add `key.txt` to `.gitignore` before she saves it, or read it and delete the file in the same step.
3. Replace both Vercel entries. The folder is already linked to the project.

```bash
npx vercel env rm ANTHROPIC_API_KEY production --yes
```

```bash
npx vercel env rm ANTHROPIC_API_KEY preview --yes
```

```bash
npx vercel env add ANTHROPIC_API_KEY production --sensitive < key.txt
```

```bash
npx vercel env add ANTHROPIC_API_KEY preview --sensitive < key.txt
```

4. Deploy by pushing a commit. An empty one works: `git commit --allow-empty -m "Redeploy for the rotated key"`.
   `vercel redeploy` was refused by the permission classifier last time, so use the push.
5. Wait for the new deployment (`npx vercel ls` shows it Ready), then call the live function and look for
   `"source":"model"`.
6. Carriann deletes the old key in the console. Call the live function again. A model answer now proves the
   new key is the one in use. A `"fallback"` answer means the new key failed.
7. Delete `key.txt`. Restart `eval/dev-api.mjs` with the new key if it is running, since it holds its key in
   memory.

## Carriann's rules for copy and design

These are also in the session memory files.

- **Second person, factual.** "You put the doer first." State facts. Leave out effort praise and "I".
- **Say what a thing is.** Lines such as "This is not a score" or "Nothing is graded" get cut or rewritten as a
  positive statement. She calls that framing AI style. This applies to messages to her as well.
- **Plain labels.** Hint, Sentence starter, Model answer. Define a coined term such as "doer" once, early.
- **No field-specific sentences.** Open enrollment across hundreds of jobs.
- **No noun that names a document** in her agencies: justification, assessment, notification, decision memo.
- **Scores only when they help learning stick.** Try counts stay out of the summary.
- **Accessibility is fixed.** WCAG 2.2 AA. Color is never the only cue: signal words are blue with a dotted
  underline, action words teal and bold. Keep the skip link, live region, roving focus, high-contrast theme,
  and text size control.
- **Palette, light theme:** blue (signal, hints), teal (action), emerald (success, primary button), stone grey
  (misses, neutral). She dislikes rose, maroon, and brown-on-yellow.
- **Speech:** a browser Speak button was built and removed. Microphone access fails inside the Adobe Connect
  frame. Device dictation into the text box is the supported route.
- **Working style:** she asks for an assessment, then says build. Test in the browser, then commit and push.

## Things that will trip you

- **The browser pane is shared.** Carriann sometimes drives it while you test. Open a background tab on
  `http://localhost:5173` for your own run; it has separate storage from `127.0.0.1:5173`.
- **Progress storage key is `avp-progress-v3`.** To reach the last screens fast, seed it with four results and
  `phase: "transfer"`, reload, and press Resume.
- **`eval/results.json` and `eval/report*.txt` are gitignored** run output.
- **A scratch rule test from October expects "made a recommendation" to fail.** That expectation is stale.
  `eval/cases.json` is the authority.
- **Git prints LF to CRLF warnings** on every commit. Harmless.
- **Vercel builds can lag.** One deploy took over four minutes before the live page changed.
- **Screenshots in the pane can lag a frame** behind the page. Prefer `get_page_text` for checks.

## Open items, none blocking

- A real dictation and voice-control pass on Carriann's machine.
- A custom domain. `sentient-learning.com` and `carriannlane.com` are in her Vercel account with DNS at
  Cloudflare. Plan: add the subdomain in Vercel, then a CNAME to `cname.vercel-dns.com` set to DNS only, and
  check Cloudflare Zero Trust for a wildcard Access rule.
- One line in the course materials saying learner rewrites go to Anthropic's API for grading.
- A screen-reader pass and a touch pass on a phone.
