# Active Voice Practice

A practice activity for a plain language course. Learners are working professionals from 28 state agencies
(engineers, nurses, admin staff, environmental specialists), open enrollment. It runs inside an Adobe Connect
frame during class and on its own in a browser.

- Owner: Carriann Lane, Write Words Inc / Sentient Learning. GitHub `carriannlane-hub`.
- Repo: `carriannlane-hub/active-voice-practice`, branch `main`.
- Local clone: `C:\Users\carri\dev\active-voice-practice`. Keep it outside OneDrive.
- Live: https://active-voice-practice.vercel.app (Vercel project `active-voice-practice`, account `director-2244`)

## How Carriann works

- She asks for an assessment, then says build. Act as a UX expert and a learning experience designer: name what
  the learner does, compared with what the app tells them.
- Test in the browser before anything ships.
- Messages to her follow the copy rules below: second person, factual, positive statements.

## Ship a change

1. Create a branch and commit there.
2. Push the branch. Vercel builds a preview address for it; `npx vercel ls` lists it.
3. Give Carriann the preview address. She checks it and says ship.
4. Merge to `main` and push. Every push to `main` deploys to production. Allow up to five minutes.
5. Confirm the live page serves the new `assets/index-*.js` name, and call the live function once to confirm
   `"source":"model"`.

`vercel redeploy` is refused by the permission classifier. An empty commit pushed to `main` redeploys.

## How the activity works

Four sentences, three steps each, then one sentence alone, then a summary.

1. **Spot it.** Tap the passive signal words (form of "to be", participle, "by").
2. **Find the action.** Tap the word holding the real action. In three sentences it hides in a noun.
3. **Activate it.** Rewrite in active voice. Unlimited tries. Help ladder: Hint, Sentence starter, Model answer.

Then **This one is all yours**: a memo sentence the learner rewrites alone, shown beside a model version with
three self-check questions. Skippable.

Then the **summary**: up to three named patterns from the learner's own misses, each with their sentence and a
"When you edit" cue; the four before-and-after rewrites tagged by pattern; a copyable editing checklist ordered
by their patterns.

Two sets in `SETS`, one new idea per sentence: plain verbs, action in a noun, a noun spelled like its verb, a passive with the doer left out. Set one: `report`, `brief`, `compliance`, `letter`. Set two: `schedule`, `explanation`, `change`, `deadline`. "Practice with new sentences" moves to the next set. `TRANSFER` is the memo sentence.

## How rewrites are graded

Three layers, in order. All return one result shape:
`{ correct, doer, verb, reason, note, strongerVerb, meaningNote, source }`.

1. **Rules that are certain** (`lib/hybrid.js`, `preCheck`): under three words, stops at the verb, exact model
   answer, or a listed passive phrase. `source: "rules"`.
2. **Claude Haiku 5.5** through `api/grade.js`, a Vercel function. Low effort, structured JSON output, prompt in
   `lib/grader-prompt.js`. The model classifies only: voice, doer, verb, one issue code, stronger verb.
   `fromModel` in `lib/hybrid.js` turns that into the result using copy from `src/sentences.js`.
   `source: "model"`.
3. **Rule grader** (`src/grader.js`) when the function or the model is unavailable. `source: "fallback"`.

Design decisions Carriann made. Keep them:

- The app writes every sentence the learner reads. The model supplies grammar facts only.
- A meaning flag on an active sentence is a soft line under the success message ("Check it against the
  original…"). The try still counts as a success.
- "Provided an explanation" is active and passes. The app then shows "One verb does the same job: explained."
- Haiku was chosen over Opus for cost. They matched on every learner-facing verdict once meaning became soft.
- Success feedback is unambiguous ("Yes. That is active voice."), names what the learner did right, and offers
  the model answer as "another strong version".
- Tries are unlimited.

## Files

| Path | Holds |
|---|---|
| `src/App.jsx` | The whole UI: intro, practice, on-your-own, summary, themes |
| `src/sentences.js` | Sentence bank, `TRANSFER`, tokenizer helpers. All learner copy per sentence |
| `src/grader.js` | Tap-step grader and the rule-based rewrite grader |
| `lib/hybrid.js` | `preCheck`, `fromModel`, `gradeLocally`, `asTyped` |
| `lib/grader-prompt.js` | Model id, effort, system prompt, output schema |
| `lib/patterns.js` | Summary patterns, sentence tags, checklist |
| `api/grade.js` | The Vercel function. Rate limit 300 a minute per network address, 300 character cap |
| `eval/cases.json` | 40 learner rewrites with expected verdicts, 3 marked debatable |
| `eval/run-eval.mjs` | Runs the cases on one or more models, two runs each |
| `eval/dev-api.mjs` | Local stand-in for the function on port 3001 |

## Run and test

```bash
npx vite --host 127.0.0.1 --port 5173 --strictPort
```

```bash
ANTHROPIC_API_KEY=<key> node eval/dev-api.mjs
```

Vite proxies `/api` to port 3001. With only the first command running, the browser grades with rules.

```bash
SOFT_MEANING=1 ANTHROPIC_API_KEY=<key> node eval/run-eval.mjs claude-haiku-5-5
```

Re-run the eval after any change to the prompt, the sentence bank, or `lib/hybrid.js`. Target: zero misses on
the strict cases. Meaning notes on fair paraphrases are expected and harmless.

```bash
npx vite build
```

## The API key

- The site key is `active-voice-practice-site` in the Claude Console, created 2026-11-19, with no expiry. It
  lives in Vercel as `ANTHROPIC_API_KEY` for Production and Preview.
- Keys stay out of chat and out of files in this folder. Carriann pastes a key straight into Vercel under
  Settings, Environment Variables. A new deployment picks it up.
- To prove a new key: disable the old key in the Console, call the live function, look for `"source":"model"`,
  then delete the old key.
- Local eval runs need a key in the shell environment. Carriann sets it in her own terminal.

## Rules for copy and design

- **Second person, factual.** "You put the doer first." State facts. Effort praise and an app that says "I"
  stay out.
- **Say what a thing is.** Lines such as "This is not a score" or "Nothing is graded" get cut or rewritten as a
  positive statement. Carriann calls that framing AI style. Scan new copy for "not a", "nothing is", "no ",
  and "never", and rewrite each one. This applies to messages to her as well.
- **Plain labels.** Hint, Sentence starter, Model answer. Define a coined term such as "doer" once, early.
- **Sentences fit every job.** Open enrollment spans hundreds of roles, so field-specific content stays out.
- **Avoid nouns that name a document** in her agencies: justification, assessment, notification, decision memo.
- **Scores only when they help learning stick.** The summary shows patterns; try counts stay out of it.
- **Accessibility is fixed.** WCAG 2.2 AA. Color always travels with a second cue: signal words are blue with a
  dotted underline, action words teal and bold. Keep the skip link, live region, roving focus, high-contrast
  theme, and text size control.
- **Palette, light theme:** blue (signal, hints), teal (action), emerald (success, primary button), stone grey
  (misses, neutral). She dislikes rose, maroon, and brown-on-yellow.
- **Speech:** a browser Speak button was built and removed. Microphone access fails inside the Adobe Connect
  frame. Device dictation into the text box is the supported route.

## Things that will trip you

- **The browser pane is shared.** Carriann sometimes drives it while you test. Open a background tab on
  `http://localhost:5173` for your own run; it has separate storage from `127.0.0.1:5173`.
- **Progress storage key is `avp-progress-v4`.** To reach the last screens fast, seed it with four results and
  `phase: "transfer"`, reload, and press Resume.
- **`eval/results.json` and `eval/report*.txt` are gitignored** run output.
- **`eval/cases.json` is the authority** on verdicts. "Made a recommendation" passes.
- **Git prints LF to CRLF warnings** on every commit. Harmless.
- **Vercel builds can lag.** One deploy took over four minutes before the live page changed.
- **Screenshots in the pane can lag a frame** behind the page. Prefer `get_page_text` for checks.

## Open items

- A dictation and voice-control pass on Carriann's machine.
- A custom domain. `sentient-learning.com` and `carriannlane.com` are in her Vercel account with DNS at
  Cloudflare. Plan: add the subdomain in Vercel, then a CNAME to `cname.vercel-dns.com` set to DNS only, and
  check Cloudflare Zero Trust for a wildcard Access rule.
- One line in the course materials saying learner rewrites go to Anthropic's API for grading.
- A screen-reader pass and a touch pass on a phone.
- A monthly spend limit on the Default workspace in the Claude Console.
