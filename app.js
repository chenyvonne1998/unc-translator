// "slang" mode: user types a slang term, we show its meaning.
// "meaning" mode: user describes a meaning, we suggest matching slang.
let mode = "slang";

const input = document.getElementById("input");
const output = document.getElementById("output");
const sourceLabel = document.getElementById("source-label");
const targetLabel = document.getElementById("target-label");
const swapBtn = document.getElementById("swap-btn");
const micBtn = document.getElementById("mic-btn");
const speakBtn = document.getElementById("speak-btn");

const STOP_WORDS = new Set([
  "a", "an", "the", "to", "of", "or", "and", "is", "it", "be", "being", "for",
  "in", "on", "at", "about", "someone", "something", "you", "your", "i", "my",
  "me", "that", "this", "with", "what", "word", "slang", "mean", "means", "when",
]);

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
const tokenize = (s) => normalize(s).split(" ").filter((w) => w && !STOP_WORDS.has(w));

// Slang → meaning: exact term/alias match first, then prefix match.
function lookupSlang(query) {
  const q = normalize(query);
  if (!q) return [];
  const names = (e) => [e.term, ...(e.aliases || [])].map(normalize);
  const exact = SLANG.filter((e) => names(e).includes(q));
  if (exact.length) return exact;
  return SLANG.filter((e) => names(e).some((n) => n.startsWith(q))).slice(0, 3);
}

// Meaning → slang: score entries by word overlap with meaning + keywords.
function lookupMeaning(query) {
  const words = tokenize(query);
  if (!words.length) return [];
  const phrase = normalize(query);

  const scored = SLANG.map((e) => {
    const keywords = (e.keywords || []).map(normalize);
    const meaningWords = new Set(tokenize(e.meaning));
    let score = 0;
    for (const k of keywords) if (k.includes(" ") && phrase.includes(k)) score += 3;
    for (const w of words) {
      if (keywords.includes(w)) score += 2;
      else if (keywords.some((k) => k.startsWith(w) || w.startsWith(k))) score += 1;
      if (meaningWords.has(w)) score += 1;
    }
    return { e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].score;
  // Keep only matches reasonably close to the best one.
  return scored
    .filter((s) => s.score > 0 && s.score >= best / 2)
    .slice(0, 3)
    .map((s) => s.e);
}

function render() {
  const query = input.value;
  output.replaceChildren();
  if (!query.trim()) return;

  const results = mode === "slang" ? lookupSlang(query) : lookupMeaning(query);
  if (!results.length) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = mode === "slang"
      ? "Hmm, we don't know that one yet."
      : "No matching slang found. Try describing it differently.";
    output.append(p);
    return;
  }

  for (const e of results) {
    const block = document.createElement("div");
    block.className = "result";
    if (mode === "meaning" || results.length > 1) {
      const term = document.createElement("p");
      term.className = "result-term";
      term.textContent = e.term;
      block.append(term);
    }
    const meaning = document.createElement("p");
    meaning.className = "result-meaning";
    meaning.textContent = e.meaning;
    const example = document.createElement("p");
    example.className = "result-example";
    example.textContent = `“${e.example}”`;
    block.append(meaning, example);
    output.append(block);
  }
}

function setMode(next) {
  mode = next;
  sourceLabel.textContent = mode === "slang" ? "Slang" : "Meaning";
  targetLabel.textContent = mode === "slang" ? "Meaning" : "Slang";
  input.placeholder = mode === "slang"
    ? "Type a slang word…"
    : "Describe what you want to say…";
}

swapBtn.addEventListener("click", () => {
  // Carry the top result across so the swap feels like a real flip.
  const results = mode === "slang" ? lookupSlang(input.value) : lookupMeaning(input.value);
  setMode(mode === "slang" ? "meaning" : "slang");
  if (results.length) {
    input.value = mode === "slang" ? results[0].term : results[0].meaning;
  }
  swapBtn.classList.toggle("spin");
  render();
  input.focus();
});

input.addEventListener("input", render);

// Voice input via the Web Speech API (Chrome, Edge, Safari).
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (Recognition) {
  const rec = new Recognition();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.onresult = (ev) => {
    input.value = ev.results[0][0].transcript;
    render();
  };
  rec.onend = () => micBtn.classList.remove("listening");
  micBtn.addEventListener("click", () => {
    if (micBtn.classList.contains("listening")) return rec.stop();
    micBtn.classList.add("listening");
    rec.start();
  });
} else {
  micBtn.hidden = true;
}

// Read the result aloud.
speakBtn.addEventListener("click", () => {
  const text = output.innerText.trim();
  if (!text || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
});

// Start with the example from the design.
input.value = "Delulu";
render();
