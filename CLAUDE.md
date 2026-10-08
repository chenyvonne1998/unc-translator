# Unc Translator

A single-page website that translates Gen-Z / internet slang for people who don't know it ("uncs"), and works in reverse: describe a meaning and it suggests matching slang.

## Stack

- Plain HTML, CSS, and vanilla JavaScript. **No frameworks, no build step, no dependencies.**
- Open `index.html` directly in a browser, or serve locally with `python3 -m http.server 8000`.
- Keep it that way unless the user asks otherwise.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup: language bar (Slang ⇄ Meaning) + two panels |
| `style.css` | All styling, design tokens live in `:root` |
| `app.js` | Lookup logic, swap behavior, voice input / read-aloud |
| `slang-data.js` | The slang dictionary (`SLANG` global array) |

## Design (match the user's mockup)

- Light grey page background (`#ececec`), one white card with large rounded corners (~40px).
- Top bar: two grey pill labels (`Slang` / `Meaning`) with a small white square swap button `⇄` between them; thin divider below.
- Two equal panels separated by a thin vertical divider.
  - Left: input text (medium weight, ~30px).
  - Right: meaning in regular weight, then the example sentence in **blue italic** (`--accent: #2f74e0`) wrapped in curly quotes “…”.
- Microphone icon at the bottom-left of each panel (left = speak input, right = read result aloud).
- System font stack (SF Pro / -apple-system). Clean, minimal, Google-Translate-like.
- On narrow screens (≤720px) panels stack vertically.

## Behavior

- **Slang → Meaning** (default): exact match on `term` or `aliases` (case/punctuation-insensitive), otherwise prefix match (max 3).
- **Meaning → Slang**: word-overlap scoring against each entry's `keywords` and `meaning`; returns up to 3 results within half the best score.
- **Swap button** flips direction and carries the top result across (e.g. "Delulu" → its meaning text).
- Results update live as the user types.
- Voice input uses the Web Speech API; the mic is hidden if unsupported.

## Adding slang

Add an object to `SLANG` in `slang-data.js`:

```js
{
  term: "Rizz",                       // display name
  meaning: "Charm or skill at flirting",
  example: "Unreal rizz.",            // no surrounding quotes, they're added in the UI
  aliases: ["rizzler"],               // optional, other spellings
  keywords: ["charm", "flirting"],    // optional, helps reverse lookup
}
```

Good `keywords` matter most for reverse lookup, so include plain-English synonyms people would type.

## Conventions

- Build DOM with `textContent` / `createElement`, never `innerHTML` with user input.
- Keep code small and readable; the project is meant to stay simple.
- Repo: GitHub `chenyvonne1998/unc-translator`, default branch `main`.
