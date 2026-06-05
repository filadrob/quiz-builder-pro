
## Stack note

The project template is **TanStack Start + TanStack Router** (not Vite + React Router v6 as requested). I'll honor the intent — purely client-side, no backend, no server functions, no Cloudflare Worker code — by using TanStack Router's file-based routing for pages only. No `createServerFn`, no `/api/*` routes, no Supabase. Leaderboard reads hit the Google Sheets API directly from the browser; writes POST to your Apps Script URL. If you'd rather I rip out TanStack Start and rescaffold on plain Vite + React Router v6, say so and I'll adjust.

## Config

`src/lib/config.ts` with clearly labeled placeholder constants:
```ts
export const SHEETS_API_KEY = "REPLACE_ME_SHEETS_API_KEY";
// Same spreadsheet holds the quiz index tab AND one leaderboard tab per quiz
// (tab name = quiz id). Apps Script writes to this same spreadsheet.
export const QUIZ_INDEX_SHEET_ID = "REPLACE_ME_QUIZ_INDEX_SHEET_ID";
export const QUIZ_INDEX_RANGE = "Quizzes!A2:F";
export const LEADERBOARD_APPS_SCRIPT_URL = "REPLACE_ME_APPS_SCRIPT_URL";
```

## Routes (file-based)

- `/` — Quiz listing (fetches Sheet index, renders cards, empty/error states with retry)
- `/quiz/$quizId` — Pre-quiz setup (name + anonymous toggle, per-question feedback toggle, Start)
- `/quiz/$quizId/play` — Quiz engine (image, choices, timer, progress, interstitials)
- `/quiz/$quizId/results` — Results + leaderboard submit + leaderboard table
- `/admin` — Quiz builder (unlisted, no nav link)

Session state (name, anonymous, feedback toggle, randomized question order, answers, scores, total time) lives in a `QuizSessionContext` provider scoped under `/quiz/$quizId`.

## Data layer (`src/lib/`)

- `types.ts` — `Quiz`, `Question`, `Choice`, `QuizIndexEntry`, `LeaderboardEntry`
- `sheets.ts` — `fetchQuizIndex()` (reads `QUIZ_INDEX_SHEET_ID` + `QUIZ_INDEX_RANGE`), `fetchLeaderboard(quizId)` (reads `QUIZ_INDEX_SHEET_ID` with range `'{quizId}'!A2:D`) via Sheets API v4 with API key
- `leaderboard.ts` — `submitScore(payload)` POSTing JSON to Apps Script URL (with `no-cors` fallback note)
- `quiz-loader.ts` — `fetchQuiz(jsonUrl)` from public/quizzes JSON
- `scoring.ts` — `computePoints(timeRemaining, timeLimit)` = `Math.round(1000 * timeRemaining / timeLimit)`
- `shuffle.ts` — Fisher-Yates
- `image.ts` — `preloadImage(url)` returning a Promise that resolves/rejects on load/error

## Components

- `QuizCard` — listing card
- `Timer` — countdown with color shift (green → amber < 50% → red < 25%), aria-live
- `QuestionView` — image + 2–8 choice buttons (text or image variant), keyboard nav (1–8 keys + arrows/enter), broken-image skip
- `FeedbackInterstitial`, `TimesUpInterstitial`
- `ResultsBreakdown`, `LeaderboardTable`
- Admin: `QuizBuilderForm`, `QuestionEditor`, `ChoiceEditor`, `JsonExportButton`, `AdminInstructionsPanel`

## Quiz engine behavior

- On session start: shuffle questions
- For each question: call `preloadImage(current)`; only after resolve, start timer; in parallel `preloadImage(next)`
- Image `onerror` → show "Image failed to load — Skip (0 pts)" button; timer paused
- Timer expiry → "Time's Up" interstitial (1.2s) → next
- Answer click → record `{choiceIndex, timeRemaining, points}`; if feedback on → interstitial showing correct/incorrect with Continue
- Track per-question response time = `timeLimit - timeRemaining` (or full `timeLimit` on timeout/skip)

## Admin builder

- Metadata: title, description, timeLimitSeconds (number input)
- Questions: array with add/remove/reorder (up/down buttons)
- Per-question: imageUrl with onBlur validation (load test, preview thumbnail, red border on failure), 2–8 choices
- Per-choice: type toggle (text/image), value input, image preview if image type, radio to mark correct
- Validation: disable Export if any question has <2 choices, no correct marked, or empty image
- Export: build `Quiz` object with generated `id` (slug of title + short random), trigger Blob download as `${id}.json`
- Instructions panel: static text explaining commit to `public/quizzes/`, add a row to the Quizzes tab, and create a new tab in the same spreadsheet named exactly with the quiz id (Apps Script will write leaderboard rows there)

## Listing page

- `useQuery` fetches Sheet index via Sheets API v4: `GET https://sheets.googleapis.com/v4/spreadsheets/{QUIZ_INDEX_SHEET_ID}/values/{QUIZ_INDEX_RANGE}?key={key}`
- Parses rows to `QuizIndexEntry[]`
- Cards link to `/quiz/$id`
- Empty state ("No quizzes yet") and error state with Retry button

## Leaderboard

- After results: opt-in name field (prefilled), Submit button → POST to Apps Script URL with `{quizId, participantName, totalScore, totalTime}`
- Below: leaderboard table fetched from Sheets API at `QUIZ_INDEX_SHEET_ID` with range `'{quizId}'!A2:D`, sorted by score desc then totalTime asc, showing rank/name/score/timestamp

## Styling

shadcn/ui components (Button, Card, Input, Label, Switch, RadioGroup, Dialog) with Tailwind. Semantic tokens already in `src/styles.css`. Add timer urgency color tokens (`--timer-ok`, `--timer-warn`, `--timer-danger`) in `:root`/`.dark`.

## Out of scope (per spec)

No auth, no private groups, no quiz status, no analytics, no multiplayer, no sound.

## Files to create

```
src/lib/config.ts
src/lib/types.ts
src/lib/sheets.ts
src/lib/leaderboard.ts
src/lib/quiz-loader.ts
src/lib/scoring.ts
src/lib/shuffle.ts
src/lib/image.ts
src/lib/session-context.tsx
src/components/quiz/QuizCard.tsx
src/components/quiz/Timer.tsx
src/components/quiz/QuestionView.tsx
src/components/quiz/FeedbackInterstitial.tsx
src/components/quiz/TimesUpInterstitial.tsx
src/components/quiz/ResultsBreakdown.tsx
src/components/quiz/LeaderboardTable.tsx
src/components/admin/QuizBuilderForm.tsx
src/components/admin/QuestionEditor.tsx
src/components/admin/ChoiceEditor.tsx
src/components/admin/AdminInstructionsPanel.tsx
src/routes/index.tsx                         (replace placeholder)
src/routes/admin.tsx
src/routes/quiz.$quizId.tsx                  (setup screen)
src/routes/quiz.$quizId.play.tsx
src/routes/quiz.$quizId.results.tsx
public/quizzes/.gitkeep
public/quizzes/sample-quiz.json              (one example quiz)
```

After build, you'll fill in the three placeholder constants in `src/lib/config.ts` and deploy the Apps Script per your proposal.
