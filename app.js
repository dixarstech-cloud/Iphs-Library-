/* IPHS School Library - runs entirely in the browser (no server needed).
   Books, units and quiz questions come from data.js (built from library.db).
   Your profile, progress, bookmarks and scores are saved in this browser's localStorage. */
(() => {
"use strict";

/* ---------- helpers ---------- */
const D = window.IPHS_DATA || { books: [], units: {}, trivia: [] };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nowISO = () => new Date().toISOString();
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5v-17"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17v4M17 19h4"/>',
  chart: '<path d="M5 20v-8M12 20V4M19 20v-11"/>',
  gear: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  send: '<path d="M4 12 20 4l-5 16-3.5-6.5z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  next: '<path d="M5 5l9 7-9 7zM19 5v14"/>',
  prev: '<path d="M19 5l-9 7 9 7zM5 5v14"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.4c2.2.7 3.5 2.6 3.5 5.6"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  print: '<path d="M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8"/>'
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;

/* ---------- curriculum ---------- */
const LEVELS = { STD: { name: "Standard", count: 8, group: "Primary" }, Form: { name: "Form", count: 4, group: "Secondary" } };
const SUBJECTS = {
  STD: ["English", "Chichewa", "Mathematics", "Science and Technology", "Social and Environmental Studies", "Life Skills", "Agriculture", "Religious Education", "Expressive Arts"],
  Form: ["Mathematics", "English", "Chichewa", "Physics", "Chemistry", "Biology", "Agriculture", "Social Studies", "Business Studies", "Computer Studies"]
};
const CODES = { "English": "english", "Chichewa": "chichewa", "Mathematics": "math", "Science and Technology": "science", "Social and Environmental Studies": "social", "Life Skills": "life", "Agriculture": "agri", "Religious Education": "religion", "Expressive Arts": "arts", "Physics": "physics", "Chemistry": "chem", "Biology": "bio", "Social Studies": "social", "Business Studies": "business", "Computer Studies": "cs" };
const code = s => CODES[s] || String(s || "").trim().toLowerCase();
const gradeName = (l, g) => `${LEVELS[l].name} ${g}`;
const subjectName = (l, c) => (SUBJECTS[l] || []).find(s => code(s) === c) || (c ? c[0].toUpperCase() + c.slice(1) : "");
const SPINE_COLORS = ["#1d3a6e", "#1f5c3b", "#8a3342", "#b07a1c", "#1b6b73", "#5b3d78", "#3f5068", "#7a4a21", "#2c6a4f", "#8a4b1f"];
const SPINE_HEIGHTS = [276, 262, 286, 270, 258, 282, 266, 288, 260, 274];
const colorFor = c => { let h = 0; for (const ch of c) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return SPINE_COLORS[h % SPINE_COLORS.length]; };

/* ---------- class guide ---------- */
const G = window.IPHS_GUIDE || null;
const bandOf = (level, grade) => level === "STD" ? (grade <= 4 ? "lower" : "upper") : (grade <= 2 ? "junior" : "senior");
const typicalAge = (level, grade) => level === "STD" ? 5 + grade : 13 + grade;
const guideMode = () => db.guideView || (db.profile && db.profile.role === "Student" ? "learn" : "teach");
const hintCard = h => `<div class="hint"><span class="hint-ic">${icon("bulb")}</span><div><strong>${esc(h.t)}</strong><p>${esc(h.d)}</p></div></div>`;


/* ---------- class screen: subject groups and exam notes ---------- */
const EXAM_NOTE = { "STD7": "Exam preparation starts this year. Plan revision for the PSLCE now.", "STD8": "PSLCE year. Focus on revision, past papers and exam technique.", "Form3": "Exam preparation starts this year. Plan revision for the MSCE now.", "Form4": "MSCE year. Focus on revision, past papers and exam technique." };
const GROUPS = {
  STD: [["Languages", ["english", "chichewa"]], ["Mathematics and science", ["math", "science"]], ["People and society", ["social", "religion", "life"]], ["Practical and creative", ["agri", "arts"]]],
  Form: [["Languages", ["english", "chichewa"]], ["Mathematics and computers", ["math", "cs"]], ["Sciences", ["physics", "chem", "bio", "agri"]], ["Humanities and business", ["social", "business"]]]
};
const BAND_ORDER = { STD: [["lower", 1], ["upper", 5]], Form: [["junior", 1], ["senior", 3]] };

/* ---------- data access ---------- */
const books = D.books || [];
const bookById = id => books.find(b => b.id === Number(id));
const booksFor = (level, grade, c) => books.filter(b => b.level === level && String(b.grade) === String(grade) && (b.subject || "").toLowerCase() === c).sort((a, b) => a.title.localeCompare(b.title));
const quizFor = (level, grade, c) => (D.trivia || []).filter(t => String(t.grade) === String(grade) && (t.subject || "").toLowerCase() === c && (!t.level || t.level === level));
const plainCache = {};
function plainText(html) {
  return String(html || "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?(p|li|h1|h2|h3|br|div|tr|ul|ol)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
const plainOf = b => plainCache[b.id] || (plainCache[b.id] = plainText(b.content));
const answerCache = {};
/* text used to answer questions: the book without its own review-question lists */
const answerTextOf = b => answerCache[b.id] || (answerCache[b.id] = plainText(String(b.content || "").replace(/<h3>\s*Review Questions\s*<\/h3>\s*<ol>[\s\S]*?<\/ol>/gi, "")));
function searchBooks(q) {
  const t = String(q || "").trim().toLowerCase();
  if (!t) return [...books].sort((a, b) => a.title.localeCompare(b.title));
  return books.filter(b => b.title.toLowerCase().includes(t) || (b.subject || "").toLowerCase().includes(t) || subjectName(b.level, (b.subject || "").toLowerCase()).toLowerCase().includes(t) || plainOf(b).toLowerCase().includes(t)).sort((a, b) => a.title.localeCompare(b.title));
}

/* ---------- saved data (this browser only) ---------- */
const KEY = "iphs.library.v2";
let storageOK = true;
const defaults = () => ({ profile: null, settings: { theme: null, mode: "Offline", apiUrl: "", apiModel: "" }, bookmarks: {}, favorites: {}, reading: {}, done: {}, scores: [], lastGrade: null, guideView: null, classes: [], assessments: [] });
function load() {
  try { const raw = localStorage.getItem(KEY); const saved = raw ? JSON.parse(raw) : {}; const d = defaults(); return { ...d, ...saved, settings: { ...d.settings, ...(saved.settings || {}) } }; }
  catch { storageOK = false; return defaults(); }
}
let db = load();
let onSaved = () => { };
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { storageOK = false; } onSaved(); }
const session = { apiKey: "", chat: [], quiz: null };
/* Gemini for teachers. After you deploy gemini-proxy.js, put its address here so teachers only type their access code. */
const DEFAULT_PROXY_URL = "";
const GEMINI_DIRECT_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", GEMINI_MODEL = "gemini-2.5-flash";

/* ---------- theme ---------- */
const themeChoice = () => db.settings.theme || "light";
function currentTheme() { const m = themeChoice(); return m === "auto" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : m; }
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (themeChoice() === "auto") applyTheme(); }); } catch { }
function applyTheme() {
  const t = currentTheme();
  document.documentElement.dataset.theme = t;
  const m = $('meta[name="theme-color"]'); if (m) m.content = t === "dark" ? "#0b1220" : "#12264a";
  const btn = $("#themeBtn"); if (btn) { btn.innerHTML = icon(t === "dark" ? "sun" : "moon"); btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme"); }
}
function setTheme(t) { db.settings.theme = t; save(); applyTheme(); }

/* ---------- chrome (nav, account) ---------- */
const NAV_STUDENT = [["", "Home", "home"], ["library", "Library", "book"], ["ask", "Ask AI", "spark"], ["progress", "Progress", "chart"], ["settings", "Settings", "gear"]];
const NAV_TEACHER = [["", "Home", "home"], ["library", "Library", "book"], ["results", "Results", "clip"], ["ask", "Ask AI", "spark"], ["settings", "Settings", "gear"]];
let navRole = null;
function buildNav() {
  const t = isTeacher(); if (navRole === t) return; navRole = t;
  const html = (t ? NAV_TEACHER : NAV_STUDENT).map(([p, label, ic]) => `<a href="#/${p}" data-nav="${p}">${icon(ic)}<span>${label}</span></a>`).join("");
  $("#nav").innerHTML = html; $("#bottomnav").innerHTML = html;
}
function renderChrome(section) {
  buildNav();
  $$("[data-nav]").forEach(a => { const on = a.dataset.nav === section; a.classList.toggle("active", on); on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"); });
  const p = db.profile;
  $("#account").innerHTML = p ? `<a class="account-chip" href="#/profile" title="Your profile"><span class="avatar" aria-hidden="true">${esc(p.full_name.trim()[0] || "?").toUpperCase()}</span><span class="account-name">${esc(p.full_name.split(" ")[0])}</span></a>` : `<a class="account-chip join" href="#/register">${icon("user")}<span>Create profile</span></a>`;
}

/* ---------- rendering plumbing ---------- */
let cleanups = [];
const onCleanup = fn => cleanups.push(fn);
function show(html, { title = "", section = "", cls = "" } = {}) {
  $("#view").innerHTML = `<div class="wrap ${cls}">${html}</div>`;
  document.title = (title ? title + " - " : "") + "IPHS School Library";
  renderChrome(section);
  refreshInstall();
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2600); }
const go = h => { location.hash = h; };

/* ---------- small shared pieces ---------- */
function stats() {
  const done = Object.keys(db.done).filter(id => bookById(id)).length, total = books.length;
  let correct = 0, possible = 0; db.scores.forEach(s => { correct += s.score; possible += s.total; });
  return { done, total, pct: total ? Math.round(done / total * 100) : 0, correct, possible, favs: Object.keys(db.favorites).filter(bookById).length, marks: Object.keys(db.bookmarks).filter(bookById).length };
}
const LADDER = [[0, "First steps", "Open a book to begin"], [1, "Book finisher", "Finish your first book"], [2, "Library explorer", "Finish 2 books"], [5, "Reading champion", "Finish 5 books"]];
function achievement(done) { let i = 0; LADDER.forEach((l, k) => { if (done >= l[0]) i = k; }); return { index: i, current: LADDER[i], next: LADDER[i + 1] || null }; }
function bookStatus(b) {
  if (db.done[b.id]) return `<span class="status done">${icon("check")}Completed</span>`;
  const r = db.reading[b.id]; if (r && r.pos > 0.02) return `<span class="status">${Math.round(r.pos * 100)}% read</span>`;
  return `<span class="status quiet">Not started</span>`;
}
function favButton(id) { const on = !!db.favorites[id]; return `<button class="icon-btn fav ${on ? "on" : ""}" data-act="fav" data-id="${id}" aria-pressed="${on}" aria-label="${on ? "Remove from favourites" : "Add to favourites"}">${icon("heart")}</button>`; }
function bookCard(b) {
  const c = colorFor((b.subject || "x").toLowerCase());
  return `<article class="book"><a class="book-cover" style="--c:${c}" href="#/book/${b.id}" aria-label="Open ${esc(b.title)}"><span class="book-cover-title">${esc(b.title)}</span><span class="book-cover-grade">${esc(gradeName(b.level, b.grade))}</span></a>
    <div class="book-body"><div class="tags"><span class="tag">${esc(gradeName(b.level, b.grade))}</span><span class="tag">${esc(subjectName(b.level, (b.subject || "").toLowerCase()))}</span></div>${bookStatus(b)}
    <div class="book-actions"><a class="btn small" href="#/book/${b.id}">${icon("book")}Read</a>${favButton(b.id)}</div></div></article>`;
}
function searchForm(q = "", ph = "Search books, topics or words") {
  return `<form class="searchbar" data-form="search" role="search"><label class="sr" for="q-${ph.length}">Search the library</label>${icon("search")}<input id="q-${ph.length}" name="q" type="search" value="${esc(q)}" placeholder="${esc(ph)}" autocomplete="off"><button class="btn">Search</button></form>`;
}
function gradeChips() {
  return `<div class="chip-groups">${Object.entries(LEVELS).map(([l, info]) => `<div class="chip-group"><span class="chip-group-label">${info.group}</span><div class="chips">${Array.from({ length: info.count }, (_, i) => `<a class="chip" href="#/library/${l}/${i + 1}">${l === "STD" ? "Std" : "Form"} ${i + 1}</a>`).join("")}</div></div>`).join("")}</div>`;
}

/* ---------- views ---------- */
function viewLanding() {
  show(`<section class="hero">
      <div class="hero-copy">
        <h1>Every school book you need, saved on this device.</h1>
        <p>Read books from Standard 1 to Form 4, practise with quizzes and ask questions about what you read. It all works without internet.</p>
        ${searchForm("", "Search books, topics or words")}
        <div class="hero-cta"><a class="btn gold" href="#/library">Browse the library</a><a class="btn ghost-light" href="#/register">Create your profile</a></div>
      </div>
      <div class="hero-art" role="img" aria-label="The IPHS school library with reading tables and bookshelves"></div>
    </section>
    <section class="block"><h2>Start from your grade</h2><p class="lead">Pick your class to see its subjects on the shelf.</p>${gradeChips()}</section>
    <section class="block three">
      <div><span class="mark">${icon("book")}</span><h3>Read</h3><p>Open a book, jump between units and pick up where you stopped. Your place is saved.</p></div>
      <div><span class="mark">${icon("trophy")}</span><h3>Practise</h3><p>Answer subject quizzes, see the right answer straight away and keep your scores.</p></div>
      <div><span class="mark">${icon("spark")}</span><h3>Ask</h3><p>Type a question and get an answer taken from the books in your library.</p></div>
    </section>`, { section: "", cls: "landing" });
}

function viewHome() {
  const p = db.profile; if (!p) return viewLanding();
  const s = stats(), ach = achievement(s.done);
  const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const recent = Object.entries(db.reading).filter(([id]) => bookById(id)).sort((a, b) => (b[1].updated || "").localeCompare(a[1].updated || ""))[0];
  const rb = recent ? bookById(recent[0]) : null;
  const cont = rb ? `<div class="continue"><a class="book-cover small" style="--c:${colorFor((rb.subject || "x").toLowerCase())}" href="#/book/${rb.id}"><span class="book-cover-title">${esc(rb.title)}</span></a>
      <div><h3>Continue reading</h3><p class="strong">${esc(rb.title)}</p><p class="muted">${esc(gradeName(rb.level, rb.grade))}, ${Math.round((recent[1].pos || 0) * 100)}% read</p><div class="meter slim"><span style="width:${Math.round((recent[1].pos || 0) * 100)}%"></span></div><a class="btn" href="#/book/${rb.id}">Resume reading</a></div></div>`
    : `<div class="continue empty-cont"><div><h3>Choose what to read first</h3><p class="muted">Pick your grade and open a book. It will appear here so you can come back to it.</p><a class="btn" href="#/library">Open the library</a></div></div>`;
  show(`<header class="page-head"><h1>${greet}, ${esc(p.full_name.split(" ")[0])}.</h1><p class="lead">Pick up where you left off, or find something new.</p></header>
    ${searchForm()}
    ${teacherPanel()}
    <div id="installHome"></div>
    <div class="home-grid">
      <section class="panel">${cont}</section>
      <aside class="panel stat-panel"><h3>Your progress</h3>
        <div class="stat-line"><span class="stat-num">${s.done}<small> of ${s.total}</small></span><span class="muted">books completed</span></div>
        <div class="meter"><span style="width:${s.pct}%"></span></div>
        <div class="stat-line"><span class="stat-num">${s.possible ? s.correct + "<small> of " + s.possible + "</small>" : "0"}</span><span class="muted">quiz answers correct</span></div>
        <p class="badge-line">${icon("trophy")}<span>${esc(ach.current[1])}</span></p>
        <a class="textlink" href="#/progress">See all progress</a></aside>
    </div>
    <section class="block"><h2>Your grade shelf</h2>${gradeChips()}</section>
    <section class="block"><div class="block-head"><h2>In the library</h2><a class="textlink" href="#/search/">See all books</a></div><div class="cover-grid">${books.slice(0, 6).map(bookCard).join("") || `<p class="empty">No books have been added yet.</p>`}</div></section>`, { title: "Home", section: "" });
}

function guideHtml(level, grade, mode) {
  if (!G) return "";
  const band = G.bands[bandOf(level, grade)], teach = mode === "teach", routine = G.routine[mode];
  const subs = SUBJECTS[level].map(name => {
    const c = code(name), g = G.subjects[c]; if (!g) return "";
    const n = booksFor(level, grade, c).length;
    return `<details class="hint-sub"><summary><span>${esc(name)}</span><span class="tag">${n} ${n === 1 ? "book" : "books"}</span></summary><ul>${(teach ? g.teach : g.learn).map(x => `<li>${esc(x)}</li>`).join("")}</ul><a class="textlink" href="#/library/${level}/${grade}/${encodeURIComponent(c)}">Open ${esc(name)}</a></details>`;
  }).join("");
  return `<div class="guide-grid">
      <article class="panel about"><h3>About ${esc(band.name.toLowerCase())}</h3><p>${esc(band.about)}</p><h4>What learners are like</h4><ul class="ticks">${band.learners.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article>
      <article class="panel"><h3>${teach ? "Teaching hints" : "Study tips"}</h3><div class="hint-grid">${(teach ? band.teach : band.learn).map(hintCard).join("")}</div></article>
    </div>
    <article class="panel routine"><div class="routine-head"><h3>${esc(routine.title)}</h3><p class="muted small">${esc(routine.note)}</p></div>
      <ol class="steps">${routine.steps.map(st => `<li><span class="time">${icon("clock")}${esc(st.m)}</span><strong>${esc(st.t)}</strong><p>${esc(st.d)}</p></li>`).join("")}</ol></article>
    <div class="guide-grid even">
      <article class="panel"><h3>Using this library${teach ? " in class" : " to study"}</h3><ul class="ticks">${G.library[mode].map(x => `<li>${esc(x)}</li>`).join("")}</ul></article>
      <article class="panel"><h3>Subject by subject</h3><p class="muted small">${teach ? "Tap a subject for general teaching hints." : "Tap a subject for study tips."}</p><div class="hint-subs">${subs}</div></article>
    </div>`;
}

function viewLibrary(level, grade) {
  let ok = LEVELS[level] && grade >= 1 && grade <= LEVELS[level].count;
  if (!ok) {
    const last = db.lastGrade;
    if (last && LEVELS[last.level]) { level = last.level; grade = last.grade; }
    else { const first = [...books].sort((a, b) => a.level.localeCompare(b.level) || a.grade - b.grade)[0]; level = first ? first.level : "STD"; grade = first ? Number(first.grade) : 1; }
    if (location.hash.replace(/^#\/?/, "").split("/").length > 1) return go(`#/library/${level}/${grade}`);
  }
  db.lastGrade = { level, grade }; save();
  const info = LEVELS[level], bandKey = bandOf(level, grade), band = G ? G.bands[bandKey] : null, gm = guideMode();
  const mode = db.settings.libView === "shelf" ? "shelf" : "list", note = EXAM_NOTE[level + grade];
  const hasBooks = (l, g) => books.some(b => b.level === l && String(b.grade) === String(g));
  const tabs = Object.entries(LEVELS).map(([l, inf]) => `<div class="tabgroup" role="group" aria-label="${inf.group} school"><span class="tabgroup-label">${inf.group}</span><div class="tabrow">${Array.from({ length: inf.count }, (_, i) => { const g = i + 1, on = l === level && g === grade; return `<a class="tab ${on ? "active" : ""} ${hasBooks(l, g) ? "has" : ""}" href="#/library/${l}/${g}" ${on ? 'aria-current="page"' : ""}>${l === "STD" ? "Std" : "Form"} ${g}</a>`; }).join("")}</div></div>`).join("");
  const stagebar = G ? `<ol class="stagebar" aria-label="Stages of ${info.group.toLowerCase()} school">${BAND_ORDER[level].map(([k, first]) => `<li class="${k === bandKey ? "now" : ""}"><a href="#/library/${level}/${first}" ${k === bandKey ? 'aria-current="true"' : ""}><strong>${esc(G.bands[k].name)}</strong><span>${esc(G.bands[k].stages)}</span></a></li>`).join("")}</ol>` : "";
  const subjects = SUBJECTS[level].map(n => ({ name: n, c: code(n) }));
  subjects.forEach(x => { x.n = booksFor(level, grade, x.c).length; x.q = quizFor(level, grade, x.c).length; });
  const bookTotal = subjects.reduce((n, x) => n + x.n, 0), quizTotal = subjects.reduce((n, x) => n + x.q, 0);
  const href = c => `#/library/${level}/${grade}/${encodeURIComponent(c)}`;
  const FORM_HINTS = { math: { teach: "Show why a method works before drilling it. Ask learners to write every step of their working.", learn: "Write every step of your working. Redo each mistake until you can explain it." }, english: { teach: "Practise writing for a purpose: letters, reports and essays. Read widely and discuss how writers make meaning.", learn: "Read widely and write short pieces often. Ask for feedback on one thing at a time." } };
  const hintOf = c => { if (level === "Form" && FORM_HINTS[c]) return FORM_HINTS[c]; const g = G && G.subjects[c]; return g ? { teach: g.teach[0] || "", learn: g.learn[0] || "" } : null; };
  const row = x => { const h = hintOf(x.c);
    return `<a class="subj ${x.n ? "" : "none"}" style="--c:${colorFor(x.c)}" href="${href(x.c)}"><span class="subj-bar" aria-hidden="true"></span>
      <div class="subj-main"><strong>${esc(x.name)}</strong>${h ? `<p class="subj-hint" data-teach="${esc(h.teach)}" data-learn="${esc(h.learn)}">${esc(h[gm])}</p>` : ""}
      <div class="tags">${x.n ? `<span class="tag on">${x.n} ${x.n === 1 ? "book" : "books"}</span>` : `<span class="tag quiet">No books yet</span>`}${x.q ? `<span class="tag">${x.q} quiz ${x.q === 1 ? "question" : "questions"}</span>` : ""}</div></div>
      <span class="subj-go" aria-hidden="true">${icon("back", "flip")}</span></a>`; };
  const listView = `<div class="subj-groups">${GROUPS[level].map(([title, codes]) => { const items = codes.map(c => subjects.find(x => x.c === c)).filter(Boolean); return items.length ? `<section class="subj-group"><h3>${title}</h3><div class="subj-list">${items.map(row).join("")}</div></section>` : ""; }).join("")}</div>`;
  const shelfView = `<div class="shelf" role="list">${subjects.map((x, i) => `<a class="spine ${x.n ? "" : "none"}" style="--c:${colorFor(x.c)};--h:${SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]}px" href="${href(x.c)}" title="${esc(x.name)}: ${x.n ? x.n + (x.n === 1 ? " book" : " books") : "no books yet"}"><span class="spine-title">${esc(x.name)}</span>${x.n ? `<span class="spine-count">${x.n}</span>` : ""}<span class="sr">${x.n} ${x.n === 1 ? "book" : "books"}</span></a>`).join("")}</div><p class="shelf-note">The number on each spine shows how many books you can open. Faded spines have no books yet.</p>`;
  const seg = (act, cur, opts) => opts.map(([v, label]) => `<button class="${cur === v ? "on" : ""}" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${label}</button>`).join("");
  show(`<header class="class-head"><div>${band ? `<span class="stage-tag">${info.group} school, ${esc(band.name.toLowerCase())}</span>` : ""}<h1>${esc(gradeName(level, grade))}</h1>
      <p class="lead">Learners in this class are usually around ${typicalAge(level, grade)} years old.${band ? " " + esc(band.about) : ""}</p></div>
      <dl class="glance"><div><dt>subjects</dt><dd>${subjects.length}</dd></div><div><dt>${bookTotal === 1 ? "book" : "books"}</dt><dd>${bookTotal}</dd></div><div><dt>quiz ${quizTotal === 1 ? "question" : "questions"}</dt><dd>${quizTotal}</dd></div></dl></header>
    <nav class="tabs" aria-label="Choose a grade">${tabs}</nav>
    ${stagebar}
    ${note ? `<p class="exam-note">${icon("trophy")}<span>${esc(note)}</span></p>` : ""}
    <section class="subjects"><div class="block-head subj-head"><h2>Subjects</h2><div class="seg small" role="group" aria-label="Subject view">${seg("libview", mode, [["list", "List"], ["shelf", "Shelf"]])}</div></div>
      ${bookTotal ? "" : `<p class="muted subj-empty">No books have been added for this class yet. The hints and the class guide below still apply.</p>`}
      ${mode === "list" ? listView : shelfView}</section>
    ${G ? `<section class="guide" id="guideWrap" data-level="${level}" data-grade="${grade}"><div class="guide-head"><div><h2>Class guide</h2><p class="muted">General notes for ${esc(gradeName(level, grade))}. They are practical hints, not the official syllabus.</p></div>
      <div class="seg" role="group" aria-label="Guide view">${seg("guide-view", gm, [["teach", "Teaching hints"], ["learn", "Study tips"]])}</div></div><div id="guide">${guideHtml(level, grade, gm)}</div></section>` : ""}`, { title: gradeName(level, grade), section: "library" });
}

function viewSubject(level, grade, c) {
  const name = subjectName(level, c), list = booksFor(level, grade, c), quiz = quizFor(level, grade, c);
  show(`<nav class="crumbs" aria-label="Breadcrumb"><a href="#/library">Library</a><span aria-hidden="true">/</span><a href="#/library/${level}/${grade}">${esc(gradeName(level, grade))}</a><span aria-hidden="true">/</span><span>${esc(name)}</span></nav>
    <header class="page-head"><h1>${esc(name)}</h1><p class="lead">${esc(gradeName(level, grade))}</p></header>
    <section class="block flush"><h2>Books</h2>${list.length ? `<div class="cover-grid">${list.map(bookCard).join("")}</div>` : `<div class="empty-state"><h3>No books here yet</h3><p>There are no ${esc(name)} books for ${esc(gradeName(level, grade))} in the library. Try another subject on the shelf.</p><a class="btn" href="#/library/${level}/${grade}">Back to the shelf</a></div>`}</section>
    ${G && G.subjects[c] ? `<section class="block"><h2>Hints for ${esc(name)}</h2><div class="guide-grid even"><article class="panel"><h3>For teaching</h3><ul class="ticks">${G.subjects[c].teach.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article><article class="panel"><h3>For learning</h3><ul class="ticks">${G.subjects[c].learn.map(x => `<li>${esc(x)}</li>`).join("")}</ul></article></div></section>` : ""}
    <section class="block"><h2>Practice quiz</h2>${quiz.length ? `<div class="panel row-panel"><div><h3>${quiz.length} ${quiz.length === 1 ? "question" : "questions"} on ${esc(name)}</h3><p class="muted">Your score is saved to your progress when you finish.</p></div><a class="btn" href="#/quiz/${level}/${grade}/${encodeURIComponent(c)}">${icon("play")}Start quiz</a></div>` : `<p class="muted">No quiz questions have been added for this subject yet.</p>`}</section>`, { title: `${name}, ${gradeName(level, grade)}`, section: "library" });
}

function viewSearch(q) {
  const res = searchBooks(q), w = cleanWord(q);
  show(`<header class="page-head"><h1>${q ? "Search results" : "All books"}</h1><p class="lead">${q ? `${res.length} ${res.length === 1 ? "book matches" : "books match"} "${esc(q)}".` : `${res.length} ${res.length === 1 ? "book" : "books"} in the library.`}</p></header>
    ${searchForm(q)}
    ${w ? `<section class="dict" id="dictBox" aria-live="polite"><p class="muted">Looking up "${esc(w)}" in the dictionary...</p></section>` : ""}
    <section class="block"><h2>Books</h2>${res.length ? `<div class="cover-grid">${res.map(bookCard).join("")}</div>` : `<div class="empty-state"><h3>No books mention "${esc(q)}"</h3><p>Try a shorter word, or browse by grade.</p><a class="btn" href="#/library">Browse the library</a></div>`}</section>`, { title: "Search", section: "library" });
  $("#view input[name=q]")?.focus();
  if (w) fillDict(w, $("#dictBox"), { quietIfMissing: w.includes(" ") });
}

/* sanitise book HTML: keep simple formatting only */
function safeBookHtml(html) {
  const tpl = document.createElement("template"); tpl.innerHTML = String(html || "");
  const allowed = new Set(["H2", "H3", "H4", "P", "UL", "OL", "LI", "STRONG", "B", "EM", "I", "BR", "BLOCKQUOTE", "A"]);
  const walk = node => [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 1) {
      if (!allowed.has(ch.tagName)) { ch.replaceWith(...ch.childNodes); return; }
      [...ch.attributes].forEach(a => { if (ch.tagName === "H2" && a.name === "id" && /^unit\d+$/i.test(a.value)) return; ch.removeAttribute(a.name); });
      walk(ch);
    } else if (ch.nodeType !== 3) ch.remove();
  });
  walk(tpl.content); return tpl.innerHTML;
}

function viewBook(id) {
  const b = bookById(id);
  if (!b) return show(`<div class="empty-state"><h3>Book not found</h3><p>This book is not in the library.</p><a class="btn" href="#/library">Back to the library</a></div>`, { title: "Not found", section: "library" });
  const html = safeBookHtml(b.content);
  const tmp = document.createElement("div"); tmp.innerHTML = html;
  const heads = $$("h2", tmp).map((h, i) => ({ n: i + 1, title: h.textContent.trim() }));
  const units = (D.units[b.id] && D.units[b.id].length ? D.units[b.id].map(u => ({ n: u.n, title: u.title })) : heads);
  const name = subjectName(b.level, (b.subject || "").toLowerCase());
  show(`<div id="readTop"></div>
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/library">Library</a><span aria-hidden="true">/</span><a href="#/library/${b.level}/${b.grade}">${esc(gradeName(b.level, b.grade))}</a><span aria-hidden="true">/</span><a href="#/library/${b.level}/${b.grade}/${encodeURIComponent((b.subject || "").toLowerCase())}">${esc(name)}</a></nav>
    <div class="reader-layout">
      <aside class="units" aria-label="Units in this book"><h3>In this book</h3>${units.length ? `<ol>${units.map(u => `<li><button type="button" data-unit="${u.n}">${esc(u.title)}</button></li>`).join("")}</ol>` : `<p class="muted">This book has no units.</p>`}</aside>
      <article class="paper">
        <header class="paper-head"><h1>${esc(b.title)}</h1><div class="tags"><span class="tag">${esc(gradeName(b.level, b.grade))}</span><span class="tag">${esc(name)}</span></div><div class="reader-actions" id="readerActions"></div><p class="muted small read-tip">Tip: double-tap any word to see what it means.</p></header>
        <div class="prose" id="prose">${html}</div>
        <footer class="paper-foot"><div id="finishBlock"></div></footer>
      </article>
    </div>
    ${playerHtml()}`, { title: b.title, section: "library" });
  const actions = () => {
    const bm = !!db.bookmarks[b.id], fv = !!db.favorites[b.id], dn = !!db.done[b.id];
    $("#readerActions").innerHTML = `<button class="btn small" data-act="tts-open" ${ttsSupported() ? "" : "disabled title=\"Listening is not supported in this browser\""}>${icon("speaker")}Listen</button>
      <button class="btn outline small ${bm ? "on" : ""}" data-act="bookmark" data-id="${b.id}" aria-pressed="${bm}">${icon("bookmark")}${bm ? "Bookmarked" : "Bookmark"}</button>
      <button class="btn outline small ${fv ? "on" : ""}" data-act="fav-reader" data-id="${b.id}" aria-pressed="${fv}">${icon("heart")}${fv ? "Favourite" : "Add to favourites"}</button>`;
    $("#finishBlock").innerHTML = dn ? `<p class="finish-msg">${icon("check")}You finished this book.</p><button class="btn outline" data-act="done" data-id="${b.id}">Mark as not read</button>` : `<p class="finish-msg">Reached the end?</p><button class="btn" data-act="done" data-id="${b.id}">${icon("check")}Mark as read</button>`;
  };
  actions();
  window.__readerRefresh = actions; onCleanup(() => { window.__readerRefresh = null; $("#readbar").style.width = "0"; });
  const prose = $("#prose"), h2s = $$("h2", prose);
  ttsBuild(prose); onCleanup(() => { ttsStop(); });
  prose.addEventListener("click", e => { const pl = $("#player"); if (!pl || pl.hidden || String(getSelection())) return; const el = e.target.closest("h2,h3,h4,p,li,blockquote"), k = tts.blocks.indexOf(el); if (k >= 0) ttsPlayFrom(tts.blockStart[k]); });
  prose.addEventListener("dblclick", () => { const t = cleanWord(String(getSelection())); if (t && !t.includes(" ")) openDictSheet(t); });
  $$("[data-unit]").forEach(btn => btn.addEventListener("click", () => h2s[Number(btn.dataset.unit) - 1]?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })));
  const saved = db.reading[b.id];
  if (saved && saved.pos > 0.02 && saved.pos < 0.99) requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; scrollTo(0, max * saved.pos); });
  let timer;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight, pos = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
    $("#readbar").style.width = (pos * 100) + "%";
    let active = 0; h2s.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) active = i + 1; });
    if (max > 0 && max - scrollY < 6) active = h2s.length;
    $$("[data-unit]").forEach(btn => btn.classList.toggle("active", Number(btn.dataset.unit) === active));
    clearTimeout(timer); timer = setTimeout(() => { db.reading[b.id] = { pos: Number(pos.toFixed(3)), updated: nowISO() }; save(); }, 400);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  onCleanup(() => { removeEventListener("scroll", onScroll); clearTimeout(timer); });
  if (!db.reading[b.id]) { db.reading[b.id] = { pos: 0, updated: nowISO() }; save(); }
}

function viewProgress() {
  const s = stats(), ach = achievement(s.done);
  const list = (title, ids, empty) => `<section class="block"><h2>${title}</h2>${ids.length ? `<div class="rows">${ids.map(b => `<div class="row"><div><a class="strong" href="#/book/${b.id}">${esc(b.title)}</a><div class="muted small">${esc(gradeName(b.level, b.grade))}</div></div>${bookStatus(b)}<a class="btn outline small" href="#/book/${b.id}">Open</a></div>`).join("")}</div>` : `<p class="muted">${empty}</p>`}</section>`;
  const recent = Object.entries(db.reading).filter(([id]) => bookById(id)).sort((a, b) => (b[1].updated || "").localeCompare(a[1].updated || "")).slice(0, 5).map(([id]) => bookById(id));
  const marks = Object.entries(db.bookmarks).filter(([id]) => bookById(id)).sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => bookById(id));
  const favs = Object.entries(db.favorites).filter(([id]) => bookById(id)).sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => bookById(id));
  const scores = [...db.scores].reverse().slice(0, 8);
  show(`<header class="page-head"><h1>My progress</h1><p class="lead">Everything you have read, saved and scored on this device.</p></header>
    <div class="top-stats">
      <div class="panel"><span class="muted">Books completed</span><div class="big-num">${s.done}<small> of ${s.total}</small></div><div class="meter"><span style="width:${s.pct}%"></span></div><p class="muted small">${s.pct}% of the library</p></div>
      <div class="panel"><span class="muted">Quiz answers correct</span><div class="big-num">${s.correct}<small> of ${s.possible}</small></div><div class="meter"><span style="width:${s.possible ? Math.round(s.correct / s.possible * 100) : 0}%"></span></div><p class="muted small">${db.scores.length} ${db.scores.length === 1 ? "quiz" : "quizzes"} finished</p></div>
      <div class="panel"><span class="muted">Saved</span><div class="big-num">${s.favs + s.marks}</div><p class="muted small">${s.favs} favourite${s.favs === 1 ? "" : "s"} and ${s.marks} bookmark${s.marks === 1 ? "" : "s"}</p></div>
    </div>
    <section class="block"><h2>Achievements</h2><ol class="ladder">${LADDER.map((l, i) => `<li class="${i < ach.index ? "past" : i === ach.index ? "now" : ""}"><span class="ladder-dot">${i <= ach.index ? icon("check") : ""}</span><div><strong>${l[1]}</strong><span class="muted small">${l[2]}</span></div></li>`).join("")}</ol>${ach.next ? `<p class="muted">Next: ${esc(ach.next[1])}. ${esc(ach.next[2])}.</p>` : `<p class="muted">You have reached the top level.</p>`}</section>
    <section class="block"><h2>Quiz history</h2>${scores.length ? `<div class="rows">${scores.map(x => `<div class="row"><div><span class="strong">${esc(subjectName(x.level || "STD", x.subject))}</span><div class="muted small">${esc(x.level ? gradeName(x.level, x.grade) : "Grade " + x.grade)}, ${fmtDate(x.at)}</div></div><span class="score-pill">${x.score} / ${x.total}</span></div>`).join("")}</div>` : `<p class="muted">No quizzes finished yet. Open a subject and choose Start quiz.</p>`}</section>
    ${list("Continue reading", recent, "Books you open will appear here.")}${list("Bookmarks", marks, "Bookmark a book while reading and it will be listed here.")}${list("Favourites", favs, "Tap the heart on a book to keep it here.")}`, { title: "Progress", section: "progress" });
}

function libraryCardNo(p) { let h = 7; for (const ch of p.full_name + (p.created || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return "IPHS-" + String(h % 10000).padStart(4, "0"); }
function viewProfile() {
  const p = db.profile; if (!p) return go("#/register");
  show(`<header class="page-head"><h1>My profile</h1><p class="lead">Your library card. It is stored only on this device.</p></header>
    <div class="profile-layout">
      <div class="libcard" aria-label="Library card"><div class="libcard-top"><img src="logo.png" alt="" width="46" height="54"><div><strong>IPHS School Library</strong><span>Library card</span></div></div>
        <div class="libcard-name">${esc(p.full_name)}</div>
        <dl class="libcard-grid"><div><dt>Role</dt><dd>${esc(p.role)}</dd></div><div><dt>Sector</dt><dd>${esc(p.sector)}</dd></div><div><dt>Age</dt><dd>${esc(p.age)}</dd></div><div><dt>Gender</dt><dd>${esc(p.gender)}</dd></div></dl>
        <div class="libcard-no">${libraryCardNo(p)}</div></div>
      <div class="panel"><h3>Manage your profile</h3><p class="muted">Change your details, or remove everything saved by this app from this device.</p><div class="btn-row"><a class="btn" href="#/register">Edit profile</a><button class="btn danger" data-act="reset">Delete my data</button></div></div>
    </div>`, { title: "Profile", section: "" });
}

function viewRegister() {
  const p = db.profile || {}, edit = !!db.profile;
  const choice = (name, vals, cur) => `<div class="choices" role="radiogroup">${vals.map((v, i) => `<label class="choice"><input type="radio" name="${name}" value="${v}" ${cur ? (cur === v ? "checked" : "") : (i === 0 && name !== "gender" ? "checked" : "")} ${name === "gender" ? "required" : ""}><span>${v}</span></label>`).join("")}</div>`;
  show(`<div class="register">
    <div class="register-art" role="img" aria-label="Books, a graduation cap and an apple on a desk"><div class="register-art-text"><h2>Your reading, remembered.</h2><p>Your profile keeps your place in every book, your bookmarks and your quiz scores.</p></div></div>
    <form class="register-form" data-form="register" novalidate>
      <h1>${edit ? "Edit your profile" : "Create your profile"}</h1><p class="muted">It is saved on this device. Sign in with an account if you also want it saved online.</p>
      <div class="field"><label for="f-name">Full name</label><input id="f-name" name="name" value="${esc(p.full_name || "")}" autocomplete="name" placeholder="For example, Chikondi Banda" required></div>
      <div class="field"><label>Role</label>${choice("role", ["Student", "Teacher"], p.role)}</div>
      <div class="field"><label>Sector</label>${choice("sector", ["Private", "Public"], p.sector)}</div>
      <div class="field"><label for="f-age">Age</label><input id="f-age" name="age" type="number" inputmode="numeric" min="1" max="99" value="${esc(p.age || "")}" placeholder="Your age in years" required></div>
      <div class="field"><label>Gender</label>${choice("gender", ["Female", "Male"], p.gender)}</div>
      <p class="form-error" id="formError" role="alert"></p>
      <div class="btn-row"><button class="btn big" type="submit">${edit ? "Save changes" : "Create profile"}</button><a class="btn outline big" href="${edit ? "#/profile" : "#/"}">Cancel</a></div>
    </form></div>`, { title: edit ? "Edit profile" : "Create profile", section: "", cls: "wide" });
}

function aiSettingsHtml() {
  const s = db.settings, online = s.mode === "Online";
  if (!isTeacher()) return `<section class="panel"><div class="setting nopad"><div><h3>Ask Library AI</h3><p class="muted">Answers come from the books on this device, with no internet needed. Gemini AI is available to teachers.</p></div></div></section>`;
  if (!canUseAi()) return `<section class="panel"><div class="setting nopad"><div><h3>Ask Library AI with Gemini</h3><p class="muted">${cloud.session ? "Your account is waiting for the school to approve it for Gemini. Until then Ask AI answers from the books on this device." : "Sign in with your teacher account to use Gemini. Until then Ask AI answers from the books on this device."}</p></div><a class="btn outline" href="#/account">${cloud.session ? "My account" : "Sign in"}</a></div></section>`;
  const via = aiVia(), proxy = via === "proxy";
  return `<section class="panel"><div class="setting nopad"><div><h3>Ask Library AI with Gemini</h3><p class="muted">Offline mode finds answers in your books. Online mode sends your question and matching book passages to Google Gemini. Only teachers can turn this on.</p></div>
      <div class="seg" role="group" aria-label="Assistant mode"><button class="${!online ? "on" : ""}" data-act="mode" data-v="Offline" aria-pressed="${!online}">Offline</button><button class="${online ? "on" : ""}" data-act="mode" data-v="Online" aria-pressed="${online}">Online</button></div></div>
    <div class="ai-form ${online ? "" : "dim"}"><p class="field-label">Connect with</p>
      <div class="seg" role="group" aria-label="Connection"><button class="${proxy ? "on" : ""}" data-act="ai-via" data-v="proxy" aria-pressed="${proxy}">School proxy</button><button class="${!proxy ? "on" : ""}" data-act="ai-via" data-v="direct" aria-pressed="${!proxy}">My Gemini key</button></div>
      <p class="muted small-note">${proxy ? "Recommended. The Gemini key stays on the school's proxy. You only need the teacher access code." : "Uses your own key from Google AI Studio. The key is kept for this visit only. Do not use this on a shared computer."}</p>
      <form data-form="ai"><div class="field"><label for="ai-url">${proxy ? "Proxy address" : "Gemini address"}</label><input id="ai-url" name="url" value="${esc(aiUrl())}" ${proxy ? 'placeholder="https://iphs-gemini-proxy.your-name.workers.dev"' : ""} autocapitalize="off" spellcheck="false"></div>
        <div class="field"><label for="ai-model">Model</label><input id="ai-model" name="model" value="${esc(aiModel())}" autocapitalize="off" spellcheck="false"></div>
        <div class="field"><label for="ai-key">${proxy ? "Teacher access code" : "Gemini API key"}</label><input id="ai-key" name="key" type="password" autocomplete="off" value="${esc(aiKey())}" placeholder="${proxy ? "Given to you by the school" : "Kept for this visit only"}"></div>
        ${proxy ? `<label class="chk"><input type="checkbox" name="remember" ${s.proxyCode ? "checked" : ""}><span>Remember the access code on this device</span></label>` : ""}
        <div class="btn-row"><button class="btn">Save</button><button class="btn outline" type="button" data-act="ai-test">Test connection</button></div><p class="muted small-note" id="aiTest" role="status"></p></form></div></section>`;
}
function viewSettings() {
  const s = db.settings, t = currentTheme(), online = s.mode === "Online";
  show(`<header class="page-head"><h1>Settings</h1><p class="lead">Make the library comfortable to use.</p></header>
    ${storageOK ? "" : `<div class="notice warn">This browser is blocking saved data, so your progress will be lost when you close the page. Try opening the file in a normal (not private) browser window.</div>`}
    <section class="panel setting"><div><h3>Theme</h3><p class="muted">Dark theme is easier on the eyes in low light.</p></div>
      <div class="seg" role="group" aria-label="Theme">${[["light", "Light", "sun"], ["dark", "Dark", "moon"], ["auto", "Auto", "gear"]].map(([v, l, ic]) => `<button class="${themeChoice() === v ? "on" : ""}" data-act="theme" data-v="${v}" aria-pressed="${themeChoice() === v}">${icon(ic)}${l}</button>`).join("")}</div></section>
    ${cloudPanel()}
    ${aiSettingsHtml()}
    <section class="panel" id="installSlot"></section>
    <section class="panel setting"><div><h3>About</h3><p class="muted">IPHS School Library, developed by Dixars. <a href="#/about">About</a>, <a href="#/support">support</a>, <a href="#/license">licence</a> and <a href="#/privacy">privacy</a>.</p></div></section>
    <section class="panel setting"><div><h3>Your data</h3><p class="muted">Progress, bookmarks and scores are saved in this browser on this device.</p></div><a class="btn outline" href="#/profile">View profile</a></section>`, { title: "Settings", section: "settings" });
}

/* ---------- Ask Library AI ---------- */
function reviewQuestions() {
  const out = [];
  books.forEach(b => { const re = /<h3>\s*Review Questions\s*<\/h3>\s*<ol>([\s\S]*?)<\/ol>/gi; let m; while ((m = re.exec(b.content))) { (m[1].match(/<li>([\s\S]*?)<\/li>/gi) || []).forEach(li => out.push(plainText(li))); } });
  return out.filter((q, i) => out.indexOf(q) === i).slice(0, 4);
}
const endP = t => /[.!?]$/.test(t) ? t : t + ".";
function passages(question) {
  const stop = new Set(["about", "answer", "does", "explain", "from", "have", "into", "that", "the", "this", "what", "when", "where", "which", "with", "would", "your"]);
  const terms = (String(question).match(/[A-Za-z]{3,}/g) || []).map(x => x.toLowerCase()).filter(x => !stop.has(x));
  if (!terms.length) return [];
  const isHeading = t => /^Unit \d+\s*:/i.test(t), cands = [];
  for (const b of books) {
    const sentences = answerTextOf(b).split(/(?<=[.!?])\s+|\n+/).map(x => x.trim());
    sentences.forEach((s, i) => {
      if (!s || s.endsWith("?") || isHeading(s)) return;
      const score = terms.reduce((n, t) => n + (s.toLowerCase().split(t).length - 1), 0);
      if (score) { const next = sentences[i + 1] || ""; const withNext = next && !next.endsWith("?") && !isHeading(next); cands.push({ score, title: b.title, i, withNext, text: endP(s) + (withNext ? " " + endP(next) : "") }); }
    });
  }
  cands.sort((a, b) => b.score - a.score || b.text.length - a.text.length);
  const used = new Set(), out = [];
  for (const c of cands) {
    const k1 = c.title + ":" + c.i, k2 = c.title + ":" + (c.i + 1);
    if (used.has(k1) || (c.withNext && used.has(k2))) continue;
    used.add(k1); if (c.withNext) used.add(k2);
    out.push({ score: c.score, title: c.title, text: c.text }); if (out.length === 3) break;
  }
  return out;
}
const NO_ANSWER = "I could not find that answer in the books saved in this library. Try different words, or open a subject and book first.";
const aiVia = () => db.settings.aiVia === "direct" ? "direct" : "proxy";
const aiUrl = () => db.settings.apiUrl || (aiVia() === "proxy" ? DEFAULT_PROXY_URL : GEMINI_DIRECT_URL);
const aiModel = () => db.settings.apiModel || GEMINI_MODEL;
const aiKey = () => session.apiKey || (aiVia() === "proxy" ? db.settings.proxyCode || "" : "");
const aiReady = () => isTeacher() && canUseAi() && db.settings.mode === "Online" && !!(aiKey() && aiUrl());
function offlineAnswer(q) {
  const m = passages(q); if (!m.length) return { answer: NO_ANSWER, source: "", mode: "offline" };
  const source = m[0].title; return { answer: m.filter(x => x.title === source).map(x => x.text).join(" "), source, mode: "offline" };
}
async function onlineAnswer(q) {
  const s = db.settings, m = passages(q), context = m.map(x => `${x.title}: ${x.text}`).join("\n");
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(aiUrl(), { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${aiKey()}` },
      body: JSON.stringify({ model: aiModel(), messages: [{ role: "system", content: "Answer only from the supplied school-library excerpts. Use clear, student-friendly language. If the excerpts do not answer the question, say so." }, { role: "user", content: `Question: ${q}\n\nLibrary excerpts:\n${context}` }] }) });
    if (!r.ok) { const er = await r.json().catch(() => null); throw new Error((er && er.error && er.error.message) || `The AI service replied with HTTP ${r.status}`); }
    const data = await r.json(); return { answer: data.choices[0].message.content, source: m[0]?.title || "", mode: "online" };
  } catch (e) {
    const o = offlineAnswer(q); return { ...o, mode: "fallback", note: e.name === "AbortError" ? "The AI service took too long to reply." : "Could not reach the AI service (" + e.message + ")." };
  } finally { clearTimeout(timer); }
}
function chatHtml() {
  if (!session.chat.length) return `<div class="chat-empty"><p>Ask about something you have read. The answer comes from the books in this library.</p></div>`;
  return session.chat.map(m => m.role === "user" ? `<div class="msg me"><p>${esc(m.text)}</p></div>` : `<div class="msg ai ${m.pending ? "pending" : ""}"><p>${esc(m.text)}</p>${m.source ? `<span class="src">Source: ${esc(m.source)}</span>` : ""}${m.note ? `<span class="note">${esc(m.note)} Showing the offline answer instead.</span>` : ""}</div>`).join("");
}
function viewAsk() {
  const online = isTeacher() && db.settings.mode === "Online", ready = aiReady();
  const sug = reviewQuestions();
  show(`<header class="page-head"><h1>Ask Library AI</h1><p class="lead">Questions are answered from the books in your library.</p></header>
    <section class="chat panel"><div class="chat-log" id="chatLog" aria-live="polite">${chatHtml()}</div>
      ${sug.length && !session.chat.length ? `<div class="suggest"><span class="muted small">Try asking</span>${sug.map(x => `<button class="chip btn-chip" type="button" data-act="suggest" data-q="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
      <form class="chat-form" data-form="ask"><label class="sr" for="question">Your question</label><textarea id="question" rows="2" placeholder="For example: What is personal hygiene?" required></textarea><button class="btn" id="askBtn">${icon("send")}Ask</button></form>
      <p class="muted small chat-mode">${ready ? "Gemini is on. Your question and matching book passages are sent to Google Gemini." : online ? 'Online mode is selected but not set up, so answers come from the books. <a href="#/settings">Open settings</a>' : "Offline mode. Answers come from the books on this device."}</p></section>`, { title: "Ask Library AI", section: "ask" });
  const log = $("#chatLog"); log.scrollTop = log.scrollHeight;
}
async function testAi(btn) {
  const f = btn.closest("form"), out = $("#aiTest"), fd = new FormData(f);
  const url = String(fd.get("url") || "").trim(), model = String(fd.get("model") || "").trim() || GEMINI_MODEL, key = String(fd.get("key") || "").trim();
  if (!url) { out.textContent = "Enter the address first."; return; } if (!key) { out.textContent = aiVia() === "proxy" ? "Enter the teacher access code first." : "Enter your Gemini API key first."; return; }
  out.textContent = "Testing..."; btn.disabled = true;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` }, body: JSON.stringify({ model, max_tokens: 20, messages: [{ role: "user", content: "Reply with the single word: ready" }] }) });
    const d = await r.json().catch(() => null);
    if (!r.ok) out.textContent = (d && d.error && d.error.message) || `The service replied with HTTP ${r.status}.`;
    else out.textContent = "Connected. Gemini replied: " + String(d.choices[0].message.content).trim().slice(0, 60);
  } catch (e) { out.textContent = e.name === "AbortError" ? "No reply after 20 seconds." : "Could not reach the address. Check it and your internet."; }
  finally { clearTimeout(timer); btn.disabled = false; }
}
async function ask(q) {
  q = q.trim(); if (!q) return toast("Type a question first.");
  const log = $("#chatLog"), btn = $("#askBtn");
  session.chat.push({ role: "user", text: q }); session.chat.push({ role: "ai", text: "Searching your school books", pending: true });
  log.innerHTML = chatHtml(); log.scrollTop = log.scrollHeight; $(".suggest")?.remove(); if (btn) btn.disabled = true;
  const useOnline = aiReady();
  const r = useOnline ? await onlineAnswer(q) : offlineAnswer(q);
  session.chat.pop(); session.chat.push({ role: "ai", text: r.answer, source: r.source, note: r.note });
  if ($("#chatLog")) { $("#chatLog").innerHTML = chatHtml(); $("#chatLog").scrollTop = $("#chatLog").scrollHeight; }
  if ($("#askBtn")) $("#askBtn").disabled = false;
}

/* ---------- quiz ---------- */
function viewQuiz(level, grade, c) {
  const list = quizFor(level, grade, c), name = subjectName(level, c);
  if (!list.length) return show(`<div class="empty-state"><h3>No quiz yet</h3><p>There are no quiz questions for ${esc(name)} in ${esc(gradeName(level, grade))}.</p><a class="btn" href="#/library/${level}/${grade}/${encodeURIComponent(c)}">Back to ${esc(name)}</a></div>`, { title: "Quiz", section: "library" });
  session.quiz = { level, grade, c, name, list, i: 0, score: 0, answered: false, results: [] };
  drawQuiz();
}
function drawQuiz() {
  const z = session.quiz, back = `#/library/${z.level}/${z.grade}/${encodeURIComponent(z.c)}`;
  if (z.i >= z.list.length) {
    const pct = Math.round(z.score / z.list.length * 100);
    const msg = pct === 100 ? "Perfect score. Well done." : pct >= 70 ? "Strong result. Keep going." : pct >= 40 ? "A good start. Read the unit again and try once more." : "Read the book again, then try the quiz once more.";
    return show(`<div class="quiz result"><div class="panel center"><h1>Quiz complete</h1><div class="huge">${z.score}<small> of ${z.list.length}</small></div><div class="meter"><span style="width:${pct}%"></span></div><p class="lead">${msg}</p><p class="muted">Your score has been saved to your progress.</p><div class="btn-row center"><button class="btn" data-act="quiz-again">Try again</button><a class="btn outline" href="${back}">Back to ${esc(z.name)}</a><a class="btn outline" href="#/progress">View progress</a></div></div></div>`, { title: "Quiz complete", section: "library" });
  }
  const q = z.list[z.i];
  show(`<div class="quiz"><a class="textlink back" href="${back}">${icon("back")}Leave quiz</a>
    <div class="quiz-meta"><span>${esc(z.name)}, ${esc(gradeName(z.level, z.grade))}</span><span>Question ${z.i + 1} of ${z.list.length}</span></div>
    <div class="meter slim"><span style="width:${z.i / z.list.length * 100}%"></span></div>
    <h1 class="q">${esc(q.question)}</h1>
    <div class="opts">${["A", "B", "C", "D"].map(k => `<button class="opt" data-act="answer" data-k="${k}"><span class="key">${k}</span><span>${esc(q["option_" + k.toLowerCase()])}</span></button>`).join("")}</div>
    <div class="quiz-foot" id="quizFoot" aria-live="polite"></div></div>`, { title: `Quiz, ${z.name}`, section: "library" });
}
function answerQuiz(k) {
  const z = session.quiz; if (!z || z.answered) return; z.answered = true;
  const q = z.list[z.i], right = String(q.correct_option).toUpperCase(), good = k === right; if (good) z.score++;
  $$(".opt").forEach(b => { b.disabled = true; if (b.dataset.k === right) b.classList.add("right"); else if (b.dataset.k === k) b.classList.add("wrong"); });
  const last = z.i === z.list.length - 1;
  $("#quizFoot").innerHTML = `<p class="fb ${good ? "ok" : "no"}">${good ? "Correct." : `Not quite. The answer is ${right}: ${esc(q["option_" + right.toLowerCase()])}.`}</p><button class="btn" data-act="quiz-next" id="nextBtn">${last ? "See your score" : "Next question"}</button>`;
  $("#nextBtn").focus();
}
function nextQuiz() {
  const z = session.quiz; z.i++; z.answered = false;
  if (z.i >= z.list.length) { db.scores.push({ level: z.level, grade: String(z.grade), subject: z.c, score: z.score, total: z.list.length, at: nowISO() }); save(); }
  drawQuiz(); scrollTo(0, 0);
}


/* ---------- dictionary ---------- */
/* Lookup order: words saved on this device -> optional offline pack (dict-*.js, see README) -> free online dictionary.
   Every word found online is saved on this device, so it works offline the next time. */
const DICT_API = "https://api.dictionaryapi.dev/v2/entries/en/";
const DICT_KEY = "iphs.dict.v1";
let dictCache = {};
try { dictCache = JSON.parse(localStorage.getItem(DICT_KEY)) || {}; } catch { dictCache = {}; }
const saveDictCache = () => { const keys = Object.keys(dictCache); if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(k => delete dictCache[k]); try { localStorage.setItem(DICT_KEY, JSON.stringify(dictCache)); } catch { } };
const cleanWord = q => { const t = String(q || "").trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, "").replace(/\s+/g, " "); return /^[a-z][a-z'\- ]{0,40}$/.test(t) && t.split(" ").length <= 3 ? t : ""; };
function wordVariants(w) {
  const v = [w], add = x => { if (x && x.length > 2 && !v.includes(x)) v.push(x); };
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ied")) add(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) { add(w.slice(0, -2)); add(w.slice(0, -1)); }
  if (w.endsWith("ing")) { const b = w.slice(0, -3); add(b); add(b + "e"); if (/(.)\1$/.test(b)) add(b.slice(0, -1)); }
  if (w.endsWith("er")) add(w.slice(0, -2));
  if (w.endsWith("est")) add(w.slice(0, -3));
  if (w.endsWith("ly")) add(w.slice(0, -2));
  return v;
}
/* optional offline pack: dict-a.js ... dict-z.js, dict-0.js (made by build_dictionary.py) */
const shardState = {}; let packMissing = false, packSeen = false;
function loadShard(letter) {
  if (packMissing) return Promise.resolve(false);
  if (shardState[letter]) return shardState[letter];
  return shardState[letter] = new Promise(res => {
    const el = document.createElement("script"); el.src = `dict-${letter}.js`;
    el.onload = () => { packSeen = true; res(true); }; el.onerror = () => { if (!packSeen) packMissing = true; res(false); }; document.head.appendChild(el);
  });
}
async function packLookup(word) {
  for (const v of wordVariants(word)) {
    const letter = /^[a-z]/.test(v) ? v[0] : "0";
    if (!(await loadShard(letter))) return null;
    const rows = (window.IPHS_DICT || {})[letter]?.[v]; if (!rows) continue;
    const meanings = [], syn = [];
    rows.forEach(r => { let m = meanings.find(x => x.pos === r[0]); if (!m) meanings.push(m = { pos: r[0], defs: [] }); m.defs.push({ d: r[1], ex: r[2] || "", syn: r[3] || [] }); (r[3] || []).forEach(x => { if (!syn.includes(x)) syn.push(x); }); });
    return { word: v, phonetic: "", audio: "", meanings, syn: syn.slice(0, 8), source: "WordNet (offline dictionary pack)" };
  }
  return null;
}
function normalizeApi(data) {
  if (!Array.isArray(data) || !data.length) return null;
  const meanings = [], syn = [];
  let phonetic = "", audio = "";
  data.forEach(en => {
    phonetic = phonetic || en.phonetic || (en.phonetics || []).map(p => p.text).find(Boolean) || "";
    audio = audio || (en.phonetics || []).map(p => p.audio).find(Boolean) || "";
    (en.meanings || []).forEach(m => {
      let t = meanings.find(x => x.pos === m.partOfSpeech); if (!t) meanings.push(t = { pos: m.partOfSpeech, defs: [] });
      (m.definitions || []).forEach(d => t.defs.push({ d: d.definition, ex: d.example || "", syn: (d.synonyms || []).slice(0, 5) }));
      (m.synonyms || []).forEach(x => { if (!syn.includes(x)) syn.push(x); });
    });
  });
  return meanings.length ? { word: data[0].word, phonetic, audio, meanings, syn: syn.slice(0, 8), source: "Wiktionary, through the Free Dictionary API" } : null;
}
async function lookup(word) {
  for (const v of wordVariants(word)) if (dictCache[v]) return dictCache[v];
  const off = await packLookup(word); if (off) return off;
  let netProblem = false;
  for (const v of wordVariants(word)) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(DICT_API + encodeURIComponent(v), { signal: ctl.signal });
      if (r.status === 404) continue;
      if (!r.ok) { netProblem = true; break; }
      const e = normalizeApi(await r.json());
      if (e) { dictCache[word] = e; dictCache[v] = e; saveDictCache(); return e; }
    } catch { netProblem = true; break; } finally { clearTimeout(timer); }
  }
  if (netProblem) throw new Error("offline");
  return null;
}
function entryHtml(e) {
  const count = e.meanings.reduce((n, m) => n + m.defs.length, 0);
  const link = w => `<a href="#/search/${encodeURIComponent(w)}">${esc(w)}</a>`;
  return `<article class="dict-entry"><header class="dict-head"><div><h2 class="dict-word">${esc(e.word)}</h2>${e.phonetic ? `<span class="dict-phon">${esc(e.phonetic)}</span>` : ""}</div>
      <button class="btn outline small" type="button" data-act="say" data-word="${esc(e.word)}" data-src="${esc(e.audio || "")}">${icon("play")}Listen</button></header>
    <p class="muted small dict-count">${count} ${count === 1 ? "meaning" : "meanings"} in ${e.meanings.length} ${e.meanings.length === 1 ? "part of speech" : "parts of speech"}</p>
    ${e.meanings.map(m => `<section class="dict-pos"><h3>${esc(m.pos)}</h3><ol>${m.defs.map(d => `<li><p>${esc(d.d)}</p>${d.ex ? `<p class="dict-ex">${esc(d.ex)}</p>` : ""}${d.syn && d.syn.length ? `<p class="dict-syn">Similar: ${d.syn.map(link).join(", ")}</p>` : ""}</li>`).join("")}</ol></section>`).join("")}
    ${e.syn && e.syn.length ? `<p class="dict-syn all">Related words: ${e.syn.map(link).join(", ")}</p>` : ""}
    <footer class="muted small">Source: ${esc(e.source)}</footer></article>`;
}
function dictMessage(word, kind) {
  if (kind === "offline") return `<div class="dict-note"><h2>${esc(word)}</h2><p>You are offline and this word is not saved on this device yet. Connect to the internet once and look it up again. It is saved after that and works offline.</p></div>`;
  return `<div class="dict-note"><h2>${esc(word)}</h2><p>No dictionary entry found. Check the spelling, or try the base form of the word, such as "run" instead of "running".</p></div>`;
}
let dictToken = 0;
async function fillDict(word, box, { quietIfMissing = false } = {}) {
  const token = ++dictToken;
  try {
    const e = await lookup(word); if (token !== dictToken || !box.isConnected) return;
    if (e) box.innerHTML = entryHtml(e); else if (quietIfMissing) box.remove(); else box.innerHTML = dictMessage(word, "none");
  } catch { if (token === dictToken && box.isConnected) box.innerHTML = dictMessage(word, "offline"); }
}
function openDictSheet(word) {
  const sheet = $("#dictSheet"), body = $("#dictSheetBody"); if (!sheet) return;
  body.innerHTML = `<p class="muted">Looking up "${esc(word)}"...</p>`; sheet.hidden = false; $("#dictClose").focus();
  fillDict(word, body);
}
const closeDictSheet = () => { const s = $("#dictSheet"); if (s) s.hidden = true; };
function sayWord(word, src) {
  try { if (src) { new Audio(src).play().catch(() => speakFallback(word)); return; } } catch { }
  speakFallback(word);
}
function speakFallback(word) { if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(word); u.lang = "en"; speechSynthesis.cancel(); speechSynthesis.speak(u); } else toast("This device cannot play pronunciation."); }


/* ---------- read aloud (the device's own text-to-speech) ---------- */
const ttsSupported = () => "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const tts = { chunks: [], blocks: [], i: 0, playing: false, token: 0, voices: [], lastBlock: -1, utter: null };
const RATES = [[0.75, "Slow"], [1, "Normal"], [1.25, "Fast"], [1.5, "Faster"]];
function ttsLoadVoices() {
  if (!ttsSupported()) return;
  const rank = v => (v.localService ? 0 : 10) + (/en[-_]GB/i.test(v.lang) ? 0 : /en[-_]US/i.test(v.lang) ? 1 : /en[-_]ZA|en[-_]KE|en[-_]NG|en[-_]IN/i.test(v.lang) ? 2 : 3);
  tts.voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const sel = $("#ttsVoice"); if (!sel) return;
  const cur = ttsVoice();
  sel.innerHTML = tts.voices.length ? tts.voices.map(v => `<option value="${esc(v.name)}" ${cur && cur.name === v.name ? "selected" : ""}>${esc(v.name)}${v.localService ? "" : " (online)"}</option>`).join("") : `<option value="">Device voice</option>`;
}
const ttsVoice = () => tts.voices.find(v => v.name === db.settings.ttsVoice) || tts.voices[0] || null;
const ttsRate = () => Number(db.settings.ttsRate) || 1;
function ttsBuild(prose) {
  tts.blocks = $$("h2,h3,h4,p,li,blockquote", prose).filter(el => !(el.tagName === "BLOCKQUOTE" && el.querySelector("p,li")) && el.textContent.trim());
  tts.chunks = []; tts.blockStart = [];
  tts.blocks.forEach((el, bi) => {
    const text = el.textContent.replace(/\s+/g, " ").trim(), parts = text.match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
    let cur = ""; tts.blockStart[bi] = tts.chunks.length;
    parts.forEach(p => { if (cur && (cur + p).length > 200) { tts.chunks.push({ bi, text: cur.trim() }); cur = ""; } cur += p; });
    if (cur.trim()) tts.chunks.push({ bi, text: /[.!?]$/.test(cur.trim()) || !/^H[2-4]$/.test(el.tagName) ? cur.trim() : cur.trim() + "." });
  });
}
function ttsUi() {
  const ch = tts.chunks[Math.min(tts.i, tts.chunks.length - 1)], bi = ch ? ch.bi : 0, n = tts.blocks.length;
  const t = $("#ttsToggle"); if (t) { t.innerHTML = tts.playing ? `${icon("pause")}Pause` : `${icon("play")}${tts.i > 0 ? "Resume" : "Play"}`; t.setAttribute("aria-label", tts.playing ? "Pause reading" : "Play reading"); }
  const l = $("#ttsLabel"); if (l) l.textContent = `Paragraph ${bi + 1} of ${n}`;
  const bar = $("#ttsBar"); if (bar) bar.style.width = (n ? (bi + 1) / n * 100 : 0) + "%";
  if (bi !== tts.lastBlock) {
    tts.blocks.forEach((el, k) => el.classList.toggle("speaking", tts.playing && k === bi)); tts.lastBlock = bi;
    const el = tts.blocks[bi];
    if (tts.playing && el) { const r = el.getBoundingClientRect(); if (r.top < 140 || r.bottom > innerHeight - 190) el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
  } else tts.blocks[bi]?.classList.toggle("speaking", tts.playing);
}
function ttsSpeak() {
  if (!tts.playing) return;
  if (tts.i >= tts.chunks.length) { tts.playing = false; tts.i = 0; tts.lastBlock = -1; tts.blocks.forEach(el => el.classList.remove("speaking")); ttsUi(); toast("Finished reading this book"); return; }
  const token = tts.token, ch = tts.chunks[tts.i], u = new SpeechSynthesisUtterance(ch.text), v = ttsVoice();
  if (v) u.voice = v; u.lang = v ? v.lang : "en"; u.rate = ttsRate(); tts.utter = u;
  u.onend = () => { if (token !== tts.token) return; tts.i++; ttsSpeak(); };
  u.onerror = e => { if (token !== tts.token || e.error === "interrupted" || e.error === "canceled") return; tts.playing = false; ttsUi(); toast("This device could not play audio. Try another voice."); };
  ttsUi(); speechSynthesis.speak(u);
}
function ttsPlayFrom(i) {
  if (!ttsSupported() || !tts.chunks.length) return;
  tts.token++; speechSynthesis.cancel(); tts.i = clamp(i, 0, tts.chunks.length - 1); tts.playing = true; ttsUi();
  const token = tts.token; setTimeout(() => { if (token === tts.token) ttsSpeak(); }, 80);
}
function ttsPause() { tts.token++; tts.playing = false; try { speechSynthesis.cancel(); } catch { } ttsUi(); }
function ttsReset() { ttsPause(); tts.i = 0; tts.lastBlock = -1; tts.blocks.forEach(el => el.classList.remove("speaking")); }
function ttsStop() { ttsReset(); tts.blocks = []; tts.chunks = []; }
function ttsStep(dir) {
  const cur = tts.chunks[Math.min(tts.i, tts.chunks.length - 1)]; if (!cur) return;
  const bi = clamp(cur.bi + dir, 0, tts.blocks.length - 1), wasPlaying = tts.playing; tts.i = tts.blockStart[bi]; tts.lastBlock = -2;
  wasPlaying ? ttsPlayFrom(tts.i) : ttsUi();
}
function ttsOpen() {
  const p = $("#player"); if (!p || !ttsSupported()) return toast("Listening is not supported in this browser.");
  p.hidden = false; $("#view .wrap")?.classList.add("player-on"); ttsLoadVoices();
  let start = 0; const k = tts.blocks.findIndex(el => el.getBoundingClientRect().bottom > 130); if (k > 0) start = tts.blockStart[k];
  ttsPlayFrom(start); $("#ttsToggle")?.focus();
}
function ttsClose() { ttsReset(); const p = $("#player"); if (p) p.hidden = true; $("#view .wrap")?.classList.remove("player-on"); }
function playerHtml() {
  if (!ttsSupported()) return "";
  return `<div class="player" id="player" role="region" aria-label="Read aloud" hidden>
    <div class="player-row"><button class="icon-btn" type="button" data-act="tts-prev" aria-label="Previous paragraph">${icon("prev")}</button>
      <button class="btn player-play" type="button" id="ttsToggle" data-act="tts-toggle">${icon("play")}Play</button>
      <button class="icon-btn" type="button" data-act="tts-next" aria-label="Next paragraph">${icon("next")}</button>
      <div class="player-info"><strong id="ttsLabel">Paragraph 1</strong><div class="meter slim"><span id="ttsBar"></span></div></div>
      <button class="icon-btn" type="button" data-act="tts-close" aria-label="Close reader">${icon("close")}</button></div>
    <div class="player-row opts"><label>Speed <select id="ttsRate">${RATES.map(([v, n]) => `<option value="${v}" ${ttsRate() === v ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>Voice <select id="ttsVoice"><option value="">Device voice</option></select></label></div></div>`;
}
if (ttsSupported()) { ttsLoadVoices(); speechSynthesis.onvoiceschanged = ttsLoadVoices; addEventListener("pagehide", () => { try { speechSynthesis.cancel(); } catch { } }); }

/* ---------- teacher results ---------- */
const isTeacher = () => !!(db.profile && db.profile.role === "Teacher");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const BANDS = [[80, "A"], [70, "B"], [60, "C"], [50, "D"], [40, "E"]];
const PASS_MARK = 50;
const GRADES = ["A", "B", "C", "D", "E", "F"];
const TERMS = ["Term 1", "Term 2", "Term 3"];
const ATYPES = ["Test", "Quiz", "Assignment", "Exam", "Practical", "Classwork"];
const gradeOf = pct => pct == null ? "" : (BANDS.find(([m]) => pct >= m) || [0, "F"])[1];
const num1 = n => n == null ? "" : String(Math.round(n * 10) / 10);
const classById = id => db.classes.find(c => c.id === id);
const assById = id => db.assessments.find(a => a.id === id);
const classAss = cid => db.assessments.filter(a => a.classId === cid).sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.created || "").localeCompare(b.created || ""));
const sortedLearners = c => [...c.learners].sort((a, b) => a.name.localeCompare(b.name));
const parseNames = t => String(t || "").split(/[\n;\t]+/).map(s => s.replace(/^\s*\d+[.)]\s+/, "").replace(/\s+/g, " ").trim()).filter(Boolean);
const csvCell = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function markStats(a, learners) {
  const vals = learners.map(l => a.marks[l.id]).filter(v => typeof v === "number");
  const absent = learners.filter(l => a.marks[l.id] === "A").length;
  const dist = Object.fromEntries(GRADES.map(g => [g, 0]));
  vals.forEach(v => dist[gradeOf(v / a.max * 100)]++);
  const n = vals.length, avg = n ? vals.reduce((s, v) => s + v, 0) / n : null;
  return { n, absent, total: learners.length, avg, avgPct: avg == null ? null : avg / a.max * 100, high: n ? Math.max(...vals) : null, low: n ? Math.min(...vals) : null, pass: n ? vals.filter(v => v / a.max * 100 >= PASS_MARK).length : 0, dist };
}
function learnerOverall(list, lid) {
  let got = 0, out = 0;
  list.forEach(a => { const v = a.marks[lid]; if (typeof v === "number") { got += v; out += a.max; } });
  return out ? got / out * 100 : null;
}
const classAvgPct = c => { const p = classAss(c.id).map(a => markStats(a, c.learners).avgPct).filter(v => v != null); return p.length ? p.reduce((s, v) => s + v, 0) / p.length : null; };
const gtag = g => g ? `<span class="grade g-${g}">${g}</span>` : "";
const rcrumbs = (...items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([h, t]) => h ? `<a href="${h}">${esc(t)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(t)}</span>`).join("")}</nav>`;
const rshow = (html, title) => show(html, { title, section: "results", cls: "results" });
const rmissing = () => rshow(`<div class="empty-state"><h3>Not found</h3><p>That class or assessment no longer exists on this device.</p><a class="btn" href="#/results">Back to results</a></div>`, "Results");
const subjOptions = (level, cur) => (SUBJECTS[level] || []).map(s => `<option ${s === cur ? "selected" : ""}>${esc(s)}</option>`).join("");
const gradeOptions = (level, cur) => Array.from({ length: LEVELS[level].count }, (_, i) => `<option value="${i + 1}" ${i + 1 === cur ? "selected" : ""}>${gradeName(level, i + 1)}</option>`).join("");

function teacherPanel() {
  if (!isTeacher()) return "";
  const cs = db.classes, na = db.assessments.length;
  const body = cs.length
    ? `<ul class="mini-classes">${cs.slice(0, 3).map(c => { const avg = classAvgPct(c); return `<li><a href="#/results/c/${c.id}"><strong>${esc(c.name)}</strong><span class="muted">${c.learners.length} learners${avg != null ? `, average ${Math.round(avg)}%` : ""}</span></a></li>`; }).join("")}</ul>`
    : `<p class="muted">Add a class, list your learners, then record marks for each test. Averages, grades and positions are worked out for you.</p>`;
  return `<section class="panel teacher-panel"><div class="block-head"><h3>${icon("clip")} Learner results</h3><a class="btn small ${cs.length ? "outline" : ""}" href="#/results${cs.length ? "" : "/new"}">${cs.length ? "Open results" : "Add your first class"}</a></div>${body}${cs.length ? `<p class="muted small-note">${cs.length} ${cs.length === 1 ? "class" : "classes"}, ${na} ${na === 1 ? "assessment" : "assessments"}</p>` : ""}</section>`;
}

function viewResults(p) {
  if (!db.profile) return viewLanding();
  if (!isTeacher()) return rshow(`<div class="empty-state"><h3>Results are for teachers</h3><p>Your profile role is ${esc(db.profile.role)}. Change your role to Teacher to record and report learner marks.</p><a class="btn" href="#/register">Edit profile</a></div>`, "Results");
  const [a, b, c] = p;
  if (!a) return resultsHome();
  if (a === "new") return classForm();
  if (a === "c" && b) { const cl = classById(b); if (!cl) return rmissing();
    if (!c) return classHub(cl);
    if (c === "edit") return classForm(cl);
    if (c === "learners") return learnersPage(cl);
    if (c === "positions") return positionsPage(cl);
    if (c === "focus") return focusPage(cl);
    if (c === "learner" && p[3]) { const lr = cl.learners.find(x => x.id === p[3]); return lr ? learnerForm(cl, lr) : rmissing(); }
    if (c === "report") return reportPage(cl);
    if (c === "a" && p[3] === "new") return assessmentForm(cl);
  }
  if (a === "a" && b) { const as = assById(b); if (!as) return rmissing();
    if (c === "marks") return marksPage(as);
    if (c === "edit") return assessmentForm(classById(as.classId), as);
  }
  return rmissing();
}

function resultsHome() {
  const cards = db.classes.map(c => { const avg = classAvgPct(c), n = classAss(c.id).length;
    return `<a class="class-card" href="#/results/c/${c.id}"><span class="cc-level">${esc(gradeName(c.level, c.grade))}</span><h3>${esc(c.name)}</h3><p class="muted">${c.learners.length} ${c.learners.length === 1 ? "learner" : "learners"}, ${n} ${n === 1 ? "assessment" : "assessments"}</p>${avg != null ? `<div class="cc-avg"><span>Class average</span><strong>${Math.round(avg)}% ${gtag(gradeOf(avg))}</strong></div>` : `<div class="cc-avg muted">No marks yet</div>`}</a>`; }).join("");
  rshow(`<header class="page-head"><h1>Learner results</h1><p class="lead">Record marks for tests and assignments, then see averages, grades and class positions.</p></header>
    <div class="toolbar"><a class="btn" href="#/results/new">${icon("plus")} Add a class</a></div>
    ${cards ? `<div class="class-grid">${cards}</div>` : `<div class="empty-state"><h3>No classes yet</h3><p>Start by adding a class. You can paste a list of learner names from a register or spreadsheet.</p><a class="btn" href="#/results/new">Add a class</a></div>`}
    <section class="panel backup"><h3>Backup and restore</h3><p class="muted">Your results are saved only in this browser. Download a backup file regularly, and use it to move your classes to another phone or computer.</p>
      <div class="toolbar"><button class="btn outline" data-r="export-json">${icon("download")} Download backup</button><button class="btn outline" data-r="import-pick">Restore from backup</button><input type="file" id="importFile" accept=".json,application/json" hidden></div></section>`, "Results");
}

function classForm(cl) {
  const edit = !!cl, lv = cl ? cl.level : (db.lastClass?.level || "STD"), gr = cl ? cl.grade : (db.lastClass?.grade || 1);
  rshow(`${edit ? rcrumbs(["#/results", "Results"], [`#/results/c/${cl.id}`, cl.name], [null, "Edit class"]) : rcrumbs(["#/results", "Results"], [null, "New class"])}
    <header class="page-head"><h1>${edit ? "Edit class" : "Add a class"}</h1></header>
    <form class="panel narrow" data-rform="class" data-id="${cl ? cl.id : ""}" novalidate>
      <div class="field"><label for="c-name">Class name</label><input id="c-name" name="name" type="text" maxlength="60" value="${esc(cl ? cl.name : "")}" placeholder="For example: Standard 6 Blue" required autocomplete="off"></div>
      <div class="two-col"><div class="field"><label for="c-level">School level</label><select id="c-level" name="level"><option value="STD" ${lv === "STD" ? "selected" : ""}>Primary (Standard)</option><option value="Form" ${lv === "Form" ? "selected" : ""}>Secondary (Form)</option></select></div>
      <div class="field"><label for="c-grade">Grade</label><select id="c-grade" name="grade">${gradeOptions(lv, gr)}</select></div></div>
      ${edit ? "" : `<div class="field"><label for="c-names">Learners <span class="muted">(optional, one per line. After a name you can add gender and admission number, separated by commas)</span></label><textarea id="c-names" name="names" rows="6" placeholder="Paste a list from a register or spreadsheet"></textarea></div>`}
      <p class="form-error" role="alert" id="rError"></p>
      <div class="toolbar"><button class="btn" type="submit">${edit ? "Save changes" : "Add class"}</button><a class="btn outline" href="${edit ? `#/results/c/${cl.id}` : "#/results"}">Cancel</a>${edit ? `<button class="btn danger" type="button" data-r="del-class" data-id="${cl.id}">${icon("trash")} Delete class</button>` : ""}</div>
    </form>`, edit ? "Edit class" : "Add a class");
}

function classHub(c) {
  const list = classAss(c.id), avg = classAvgPct(c);
  const rows = list.map(a => { const s = markStats(a, c.learners);
    return `<li class="assess"><div class="assess-main"><h3>${esc(a.title)}</h3><p class="muted">${esc(a.subject)}, ${esc(a.term)}, ${esc(a.type)}${a.date ? ", " + esc(fmtDate(a.date)) : ""}, out of ${a.max}</p></div>
      <div class="assess-stat"><span>${s.n + s.absent} of ${s.total} entered</span>${s.avgPct != null ? `<strong>${Math.round(s.avgPct)}% ${gtag(gradeOf(s.avgPct))}</strong>` : `<span class="muted">No marks</span>`}</div>
      <div class="assess-actions"><a class="btn small" href="#/results/a/${a.id}/marks">Enter marks</a><a class="btn small outline" href="#/results/a/${a.id}/edit">Edit</a></div></li>`; }).join("");
  rshow(`${rcrumbs(["#/results", "Results"], [null, c.name])}${classMenu(c, "")}
    <header class="page-head class-top"><div><span class="cc-level">${esc(gradeName(c.level, c.grade))}</span><h1>${esc(c.name)}</h1><p class="lead">${c.learners.length} ${c.learners.length === 1 ? "learner" : "learners"}${avg != null ? `, class average ${Math.round(avg)}%` : ""}</p></div>
      <div class="toolbar"><a class="btn outline small" href="#/results/c/${c.id}/edit">Edit class</a></div></header>
    ${c.learners.length ? "" : `<div class="notice">Add your learners first, then record marks. <a href="#/results/c/${c.id}/learners">Add learners</a></div>`}
    <div class="block-head"><h2>Assessments</h2><a class="btn small" href="#/results/c/${c.id}/a/new">${icon("plus")} New assessment</a></div>
    ${rows ? `<ul class="assess-list">${rows}</ul>` : `<div class="empty-state"><h3>No assessments yet</h3><p>Create one for each test, quiz or assignment, then enter the marks.</p><a class="btn" href="#/results/c/${c.id}/a/new">New assessment</a></div>`}`, c.name);
}


function assessmentForm(c, as) {
  const edit = !!as, v = as || { title: "", subject: "", type: "Test", term: db.lastTerm || "Term 1", date: new Date().toISOString().slice(0, 10), max: 100 };
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [null, edit ? "Edit assessment" : "New assessment"])}${classMenu(c, "")}
    <header class="page-head"><h1>${edit ? "Edit assessment" : "New assessment"}</h1></header>
    <form class="panel narrow" data-rform="assess" data-class="${c.id}" data-id="${as ? as.id : ""}" novalidate>
      <div class="field"><label for="a-title">Title</label><input id="a-title" name="title" type="text" maxlength="80" value="${esc(v.title)}" placeholder="For example: End of unit 3 test" required autocomplete="off"></div>
      <div class="two-col"><div class="field"><label for="a-subject">Subject</label><select id="a-subject" name="subject">${subjOptions(c.level, v.subject)}</select></div>
      <div class="field"><label for="a-type">Type</label><select id="a-type" name="type">${ATYPES.map(t => `<option ${t === v.type ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
      <div class="two-col"><div class="field"><label for="a-term">Term</label><select id="a-term" name="term">${TERMS.map(t => `<option ${t === v.term ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label for="a-date">Date</label><input id="a-date" name="date" type="date" value="${esc(v.date)}"></div></div>
      <div class="field"><label for="a-max">Total marks</label><input id="a-max" name="max" type="number" min="1" max="1000" step="any" inputmode="decimal" value="${v.max}" required></div>
      <p class="form-error" role="alert" id="rError"></p>
      <div class="toolbar"><button class="btn" type="submit">${edit ? "Save changes" : "Save and enter marks"}</button><a class="btn outline" href="#/results/c/${c.id}">Cancel</a>${edit ? `<button class="btn danger" type="button" data-r="del-assess" data-id="${as.id}">${icon("trash")} Delete</button>` : ""}</div>
    </form>`, edit ? "Edit assessment" : "New assessment");
}

function statsHtml(a, c) {
  const s = markStats(a, c.learners), max = Math.max(1, ...Object.values(s.dist));
  if (!s.n) return `<h3>Summary</h3><p class="muted">Marks you enter appear here as a summary.</p>`;
  return `<h3>Summary</h3><div class="mini-stats"><div><span>Average</span><strong>${num1(s.avg)}<small> / ${a.max}</small></strong><em>${Math.round(s.avgPct)}% ${gradeOf(s.avgPct)}</em></div><div><span>Highest</span><strong>${num1(s.high)}</strong></div><div><span>Lowest</span><strong>${num1(s.low)}</strong></div><div><span>Passed</span><strong>${s.pass}<small> of ${s.n}</small></strong><em>${Math.round(s.pass / s.n * 100)}%</em></div></div>
    <h4>Grades</h4><div class="dist">${GRADES.map(g => `<div class="dist-row"><span class="grade g-${g}">${g}</span><span class="dist-bar"><i class="g-${g}" style="width:${s.dist[g] / max * 100}%"></i></span><span class="dist-n">${s.dist[g]}</span></div>`).join("")}</div>
    ${s.absent ? `<p class="muted small-note">${s.absent} absent, not counted.</p>` : ""}`;
}
function rowCells(a, lid) {
  const v = a.marks[lid];
  if (v === "A") return ["", `<span class="muted">Absent</span>`];
  if (typeof v !== "number") return ["", ""];
  const p = v / a.max * 100; return [`${Math.round(p)}%`, gtag(gradeOf(p))];
}
function marksPage(a) {
  const c = classById(a.classId), ls = sortedLearners(c);
  const rows = ls.map((l, i) => { const v = a.marks[l.id], ab = v === "A", [pc, gr] = rowCells(a, l.id);
    return `<tr data-l="${l.id}"><td class="idx">${i + 1}</td><th scope="row">${esc(l.name)}</th><td><input class="mark-input" type="text" inputmode="decimal" autocomplete="off" data-l="${l.id}" value="${ab || v == null ? "" : v}" ${ab ? "disabled" : ""} aria-label="Mark for ${esc(l.name)} out of ${a.max}"></td><td class="abs"><label class="chk"><input type="checkbox" data-abs="${l.id}" ${ab ? "checked" : ""}><span>Absent</span></label></td><td class="pc">${pc}</td><td class="gr">${gr}</td></tr>`; }).join("");
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [null, a.title])}${classMenu(c, "")}
    <header class="page-head"><h1>${esc(a.title)}</h1><p class="lead">${esc(a.subject)}, ${esc(a.term)}, out of ${a.max}</p></header>
    ${ls.length ? `<div class="marks-layout"><section class="panel marks-panel"><div class="marks-tip">Type a mark and press Enter to move to the next learner. You can also paste a column of marks from a spreadsheet. Saved automatically. <span class="save-state" id="saveState" aria-live="polite"></span></div>
      <div class="table-wrap"><table class="marks-table" data-aid="${a.id}"><thead><tr><th class="idx">#</th><th>Learner</th><th>Mark /${a.max}</th><th>Absent</th><th>%</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <aside class="panel stats-panel" id="markStats" aria-live="polite">${statsHtml(a, c)}</aside></div>
      <div class="toolbar noprint"><a class="btn" href="#/results/c/${c.id}/report">View report</a><a class="btn outline" href="#/results/a/${a.id}/edit">Edit assessment</a></div>`
      : `<div class="empty-state"><h3>No learners in this class</h3><p>Add learners before entering marks.</p><a class="btn" href="#/results/c/${c.id}/learners">Add learners</a></div>`}`, a.title);
}

const ordinal = n => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };

/* ---------- enrolment ---------- */
const genderOf = v => { const t = String(v || "").trim().toLowerCase(); return /^(m|male|boy)$/.test(t) ? "Boy" : /^(f|female|girl)$/.test(t) ? "Girl" : ""; };
function parseLearners(text) {
  return String(text || "").split(/\r?\n/).map((line, i) => {
    const parts = line.split(/[,;\t]/).map(s => s.replace(/\s+/g, " ").trim());
    const name = (parts.shift() || "").replace(/^\s*\d+[.)]\s+/, "").trim();
    if (!name || (i === 0 && /^(full\s*)?(name|learner|student)s?$/i.test(name))) return null;
    const o = { name, gender: "", adm: "", phone: "" };
    parts.forEach(p => { if (!p) return; const g = genderOf(p); if (g) o.gender = g; else if (/^[+\d][\d\s-]{6,}$/.test(p)) o.phone = p; else if (!o.adm) o.adm = p; });
    return o;
  }).filter(Boolean);
}
function enrol(c, o) {
  const name = o.name.replace(/\s+/g, " ").trim();
  if (c.learners.some(l => l.name.toLowerCase() === name.toLowerCase())) return "name";
  if (o.adm && c.learners.some(l => l.adm && l.adm.toLowerCase() === o.adm.toLowerCase())) return "adm";
  c.learners.push({ id: uid(), name, gender: o.gender || "", adm: o.adm || "", phone: o.phone || "", enrolled: nowISO() }); return "ok";
}
const enrolMany = (c, text) => { const r = { added: 0, skipped: 0 }; parseLearners(text).forEach(o => { enrol(c, o) === "ok" ? r.added++ : r.skipped++; }); return r; };
const countGender = ls => ({ boys: ls.filter(l => l.gender === "Boy").length, girls: ls.filter(l => l.gender === "Girl").length });

function learnersPage(c) {
  const ls = sortedLearners(c), g = countGender(ls);
  const sum = `${ls.length} ${ls.length === 1 ? "learner" : "learners"}${g.boys || g.girls ? `: ${g.boys} ${g.boys === 1 ? "boy" : "boys"}, ${g.girls} ${g.girls === 1 ? "girl" : "girls"}` : ""}`;
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [null, "Learners"])}${classMenu(c, "learners")}
    <header class="page-head"><h1>Enrol learners in ${esc(c.name)}</h1><p class="lead">${sum}</p></header>
    <div class="learner-layout"><div class="stack">
      <form class="panel" data-rform="enrol" data-id="${c.id}" novalidate><h3>Enrol one learner</h3>
        <div class="field"><label for="e-name">Full name</label><input id="e-name" name="name" type="text" maxlength="80" autocomplete="off" required></div>
        <div class="field"><label>Gender <span class="muted">(optional)</span></label><div class="choices" role="radiogroup"><label class="choice"><input type="radio" name="gender" value="Boy"><span>Boy</span></label><label class="choice"><input type="radio" name="gender" value="Girl"><span>Girl</span></label></div></div>
        <div class="two-col"><div class="field"><label for="e-adm">Admission number</label><input id="e-adm" name="adm" type="text" maxlength="30" autocomplete="off"></div><div class="field"><label for="e-phone">Guardian phone</label><input id="e-phone" name="phone" type="text" inputmode="tel" maxlength="30" autocomplete="off"></div></div>
        <p class="form-error" role="alert" id="rError"></p><button class="btn" type="submit">${icon("plus")} Enrol learner</button></form>
      <form class="panel" data-rform="learners" data-id="${c.id}"><h3>Enrol many at once</h3><p class="muted">One learner per line. You can add details after the name, separated by commas: gender, admission number, phone.</p>
        <div class="field"><label for="l-names" class="sr">Learners</label><textarea id="l-names" name="names" rows="6" placeholder="Chimwemwe Phiri, Girl, 1021&#10;Alinafe Banda, Boy, 1022"></textarea></div>
        <p class="form-error" role="alert" id="rError2"></p>
        <div class="toolbar"><button class="btn" type="submit">Enrol all</button><button class="btn outline" type="button" data-r="pick-learner-file">Load from file</button><input type="file" id="learnerFile" accept=".csv,.txt,text/csv,text/plain" hidden></div></form></div>
    <section class="panel"><div class="block-head"><h3>Class list</h3>${ls.length ? `<button class="btn small outline" data-r="export-learners" data-id="${c.id}">${icon("download")} Class list CSV</button>` : ""}</div>
      ${ls.length ? `<div class="field slim"><label class="sr" for="learnerFilter">Find a learner</label><input id="learnerFilter" type="search" placeholder="Find a learner" autocomplete="off"></div>
      <div class="table-wrap"><table class="learner-table"><thead><tr><th class="idx">#</th><th>Name</th><th>Gender</th><th>Adm no.</th><th class="hide-m">Guardian phone</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${ls.map((l, i) => `<tr data-q="${esc((l.name + " " + (l.adm || "")).toLowerCase())}"><td class="idx">${i + 1}</td><th scope="row">${esc(l.name)}</th><td>${esc(l.gender || "-")}</td><td>${esc(l.adm || "-")}</td><td class="hide-m">${esc(l.phone || "-")}</td><td class="row-actions"><a class="btn small outline" href="#/results/c/${c.id}/learner/${l.id}">Edit</a><button class="icon-btn" data-r="del-learner" data-class="${c.id}" data-id="${l.id}" aria-label="Remove ${esc(l.name)}">${icon("trash")}</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nobody is enrolled yet. Use the forms to add learners.</p>`}</section></div>`, "Learners");
}
function learnerForm(c, l) {
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [`#/results/c/${c.id}/learners`, "Learners"], [null, l.name])}${classMenu(c, "learners")}
    <header class="page-head"><h1>Edit learner</h1></header>
    <form class="panel narrow" data-rform="learner-edit" data-class="${c.id}" data-id="${l.id}" novalidate>
      <div class="field"><label for="e-name">Full name</label><input id="e-name" name="name" type="text" maxlength="80" value="${esc(l.name)}" required></div>
      <div class="field"><label>Gender</label><div class="choices" role="radiogroup"><label class="choice"><input type="radio" name="gender" value="" ${!l.gender ? "checked" : ""}><span>Not set</span></label><label class="choice"><input type="radio" name="gender" value="Boy" ${l.gender === "Boy" ? "checked" : ""}><span>Boy</span></label><label class="choice"><input type="radio" name="gender" value="Girl" ${l.gender === "Girl" ? "checked" : ""}><span>Girl</span></label></div></div>
      <div class="two-col"><div class="field"><label for="e-adm">Admission number</label><input id="e-adm" name="adm" type="text" maxlength="30" value="${esc(l.adm || "")}"></div><div class="field"><label for="e-phone">Guardian phone</label><input id="e-phone" name="phone" type="text" inputmode="tel" maxlength="30" value="${esc(l.phone || "")}"></div></div>
      <p class="form-error" role="alert" id="rError"></p>
      <div class="toolbar"><button class="btn" type="submit">Save changes</button><a class="btn outline" href="#/results/c/${c.id}/learners">Cancel</a><button class="btn danger" type="button" data-r="del-learner" data-class="${c.id}" data-id="${l.id}">${icon("trash")} Remove</button></div></form>`, "Edit learner");
}

/* ---------- analysis: positions, subjects, things to focus on ---------- */
const chrono = list => [...list].sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.created || "").localeCompare(b.created || ""));
const pct0 = n => n == null ? "-" : Math.round(n) + "%";
const namesOf = (rows, max = 8) => rows.slice(0, max).map(r => r.l.name).join(", ") + (rows.length > max ? ` and ${rows.length - max} more` : "");
function adviceFor(r) {
  if (r.avg == null) return ["No marks recorded yet."];
  const out = [];
  if (r.weak.length) out.push(`${r.avg < 40 ? "Needs urgent support" : "Needs extra practice"} in ${r.weak.slice(0, 3).map(s => `${s.name} (${pct0(s.pct)})`).join(", ")}. Re-teach the basics and give short, regular exercises.`);
  else if (r.avg >= 80) out.push("Excellent results. Give extension tasks and let this learner help classmates.");
  else if (r.low && r.low.pct < r.avg - 8) out.push(`Passing every subject. Revise ${r.low.name} (${pct0(r.low.pct)}) to move up a grade.`);
  else out.push("Steady progress. Keep practising to reach the next grade.");
  if (r.trend === "down") out.push("Marks are falling lately. Talk with the learner and look for problems at school or at home.");
  if (r.trend === "up") out.push("Marks are improving. Keep encouraging.");
  if (r.absent >= 2) out.push(`Missed ${r.absent} assessments. Follow up on attendance.`);
  if (r.missing > 0) out.push(`${r.missing} ${r.missing === 1 ? "mark is" : "marks are"} not recorded yet.`);
  return out;
}
function analyse(c, term, subject) {
  const list = chrono(classAss(c.id).filter(a => (!term || a.term === term) && (!subject || a.subject === subject)));
  const subs = [...new Set(list.map(a => a.subject))].map(n => [n, list.filter(a => a.subject === n)]);
  const rows = sortedLearners(c).map(l => {
    const taken = list.filter(a => typeof a.marks[l.id] === "number");
    const subj = subs.map(([name, as]) => ({ name, pct: learnerOverall(as, l.id) })).filter(s => s.pct != null);
    let trend = null;
    if (taken.length >= 2) { const h = Math.floor(taken.length / 2), p = arr => arr.reduce((s, a) => s + a.marks[l.id] / a.max * 100, 0) / arr.length, d = p(taken.slice(-h)) - p(taken.slice(0, h)); trend = d >= 5 ? "up" : d <= -5 ? "down" : "steady"; }
    const avg = learnerOverall(list, l.id), absent = list.filter(a => a.marks[l.id] === "A").length;
    const sorted = [...subj].sort((a, b) => a.pct - b.pct);
    const r = { l, avg, grade: gradeOf(avg), subj, absent, missing: list.length - taken.length - absent, trend, weak: sorted.filter(s => s.pct < PASS_MARK), low: sorted.length > 1 ? sorted[0] : null, strong: sorted.length && sorted[sorted.length - 1].pct >= PASS_MARK ? sorted[sorted.length - 1] : null };
    r.advice = adviceFor(r); return r;
  });
  const have = rows.filter(r => r.avg != null), vals = have.map(r => r.avg);
  rows.forEach(r => { r.pos = r.avg == null ? null : 1 + vals.filter(x => x > r.avg + 1e-9).length; });
  const subjects = subs.map(([name, as]) => { const ps = rows.map(r => (r.subj.find(s => s.name === name) || {}).pct).filter(v => v != null); return { name, n: as.length, avg: ps.length ? ps.reduce((s, v) => s + v, 0) / ps.length : null, pass: ps.length ? ps.filter(v => v >= PASS_MARK).length / ps.length * 100 : null }; });
  const dist = Object.fromEntries(GRADES.map(g => [g, 0])); have.forEach(r => dist[r.grade]++);
  const A = { c, term, subject, list, rows, subjects, dist, ranked: have.length, classAvg: have.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null, passN: have.filter(r => r.avg >= PASS_MARK).length };
  A.focus = classFocus(A); return A;
}
function classFocus(A) {
  const out = [], rows = A.rows.filter(r => r.avg != null); if (!rows.length) return out;
  const subs = A.subjects.filter(s => s.avg != null).sort((a, b) => a.avg - b.avg), below = subs.filter(s => s.avg < PASS_MARK);
  if (below.length) out.push({ k: "Re-teach", t: below.map(s => `${s.name} (class average ${pct0(s.avg)}, ${pct0(s.pass)} passed)`).join("; ") + "." });
  else if (subs.length > 1) out.push({ k: "Weakest subject", t: `${subs[0].name} has the lowest class average (${pct0(subs[0].avg)}). Plan revision lessons for it.` });
  const hard = A.list.map(a => ({ a, s: markStats(a, A.c.learners) })).filter(x => x.s.n >= 3 && x.s.pass / x.s.n < 0.5);
  if (hard.length) out.push({ k: "Topics to revisit", t: hard.map(x => `${x.a.title} (${x.a.subject}, ${pct0(x.s.pass / x.s.n * 100)} passed)`).join("; ") + "." });
  const need = rows.filter(r => r.avg < PASS_MARK).sort((a, b) => a.avg - b.avg);
  if (need.length) out.push({ k: "Learners needing support", t: namesOf(need) + "." });
  const near = rows.filter(r => r.avg >= PASS_MARK - 10 && r.avg < PASS_MARK);
  if (near.length) out.push({ k: "Close to passing", t: namesOf(near) + ". A little extra help could lift them over " + PASS_MARK + "%." });
  const fall = rows.filter(r => r.trend === "down"); if (fall.length) out.push({ k: "Marks falling", t: namesOf(fall) + ". Check in with them soon." });
  const abs = rows.filter(r => r.absent >= 2); if (abs.length) out.push({ k: "Attendance", t: namesOf(abs) + " missed two or more assessments." });
  const top = rows.filter(r => r.avg >= 80); if (top.length) out.push({ k: "Top performers", t: namesOf(top) + ". Give them enrichment work." });
  const gm = rows.filter(r => r.l.gender === "Boy"), gf = rows.filter(r => r.l.gender === "Girl");
  if (gm.length >= 3 && gf.length >= 3) { const a = gm.reduce((s, r) => s + r.avg, 0) / gm.length, b = gf.reduce((s, r) => s + r.avg, 0) / gf.length; if (Math.abs(a - b) >= 8) out.push({ k: "Gender gap", t: `${a > b ? "Boys" : "Girls"} average ${pct0(Math.max(a, b))} and ${a > b ? "girls" : "boys"} ${pct0(Math.min(a, b))}. Check that everyone is taking part and getting support.` }); }
  const none = A.rows.filter(r => r.avg == null); if (none.length) out.push({ k: "No marks yet", t: namesOf(none) + ". They are not ranked until marks are entered." });
  const inc = A.list.map(a => ({ a, s: markStats(a, A.c.learners) })).filter(x => x.s.n + x.s.absent < x.s.total);
  if (inc.length) out.push({ k: "Marks still missing", t: inc.map(x => `${x.a.title} (${x.s.n + x.s.absent} of ${x.s.total} entered)`).join("; ") + "." });
  return out;
}
function arrange(rows, sort) {
  const r = [...rows], byName = (a, b) => a.l.name.localeCompare(b.l.name);
  if (sort === "name") return r.sort(byName);
  if (sort === "low") return r.sort((a, b) => (a.avg == null) - (b.avg == null) || (a.avg ?? 0) - (b.avg ?? 0) || byName(a, b));
  return r.sort((a, b) => (a.avg == null) - (b.avg == null) || (b.avg ?? 0) - (a.avg ?? 0) || byName(a, b));
}
const reportData = (c, term, subject) => analyse(c, term, subject);
const reportState = { term: "", subject: "", sort: "pos" };
const trendTxt = t => t === "up" ? "Improving" : t === "down" ? "Falling" : t === "steady" ? "Steady" : "-";
const trendMark = t => t === "up" ? `<span class="tr up" title="Improving">&#9650;</span>` : t === "down" ? `<span class="tr down" title="Falling">&#9660;</span>` : t === "steady" ? `<span class="tr" title="Steady">&#9644;</span>` : "";
const GRADE_LABEL = { A: "Excellent, 80% and above", B: "Very good, 70% to 79%", C: "Good, 60% to 69%", D: "Pass, 50% to 59%", E: "Weak, 40% to 49%", F: "Below 40%" };

/* ---------- class menu and screens ---------- */
function classMenu(c, active) {
  const tabs = [["", "Overview", "clip"], ["learners", "Learners", "users"], ["positions", "Positions", "trophy"], ["focus", "Focus", "bulb"], ["report", "Report", "chart"]];
  return `<div class="class-menu noprint"><nav class="cm-tabs" aria-label="Class menu">${tabs.map(([p, l, ic]) => `<a href="#/results/c/${c.id}${p ? "/" + p : ""}" class="${active === p ? "active" : ""}" ${active === p ? 'aria-current="page"' : ""}>${icon(ic)}<span>${l}</span></a>`).join("")}</nav>${db.classes.length > 1 ? `<label class="cm-switch"><span class="sr">Switch class</span><select data-rswitch="${active}">${db.classes.map(x => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>` : ""}</div>`;
}
function filterBar(c, sorts, extra) {
  const all = classAss(c.id), terms = [...new Set(all.map(a => a.term))], subs = [...new Set(all.map(a => a.subject))];
  if (reportState.term && !terms.includes(reportState.term)) reportState.term = ""; if (reportState.subject && !subs.includes(reportState.subject)) reportState.subject = "";
  if (sorts && !sorts.some(s => s[0] === reportState.sort)) reportState.sort = sorts[0][0];
  const sel = (id, label, vals, cur) => `<label class="filter" for="${id}">${label}<select id="${id}" data-rfilter="${id}"><option value="">All</option>${vals.map(v => `<option ${v === cur ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
  return `<div class="toolbar noprint report-tools">${sel("fTerm", "Term", terms, reportState.term)}${sel("fSubject", "Subject", subs, reportState.subject)}${sorts ? `<label class="filter" for="fSort">Arrange<select id="fSort" data-rfilter="fSort">${sorts.map(([v, l]) => `<option value="${v}" ${v === reportState.sort ? "selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}${extra || ""}</div>`;
}
const POS_SORTS = [["pos", "Highest first"], ["low", "Lowest first"], ["name", "Name A to Z"], ["grade", "Grouped by grade"]];
const REP_SORTS = [["pos", "By position"], ["low", "Lowest first"], ["name", "Name A to Z"]];
const pdfBtns = c => `<button class="btn small" data-r="pdf-class" data-id="${c.id}">${icon("download")} Download PDF</button><button class="btn outline small" data-r="pdf-cards" data-id="${c.id}">${icon("download")} Report cards</button>`;
const emptyList = `<div class="empty-state"><h3>No assessments match</h3><p>Change the term or subject, or create an assessment and enter marks first.</p></div>`;

function summaryTiles(A) {
  const top = A.rows.filter(r => r.pos === 1).map(r => r.l.name), need = A.rows.filter(r => r.avg != null && r.avg < PASS_MARK).length;
  return `<div class="tiles"><div><span>Ranked learners</span><strong>${A.ranked}<small> of ${A.rows.length}</small></strong></div><div><span>Class average</span><strong>${pct0(A.classAvg)}</strong></div><div><span>Pass rate</span><strong>${A.ranked ? Math.round(A.passN / A.ranked * 100) + "%" : "-"}</strong></div><div><span>Top of class</span><strong class="sm">${esc(top.length > 2 ? top.slice(0, 2).join(", ") + "..." : top.join(", ") || "-")}</strong></div><div><span>Need support</span><strong>${need}</strong></div></div>`;
}
function positionsBody(c) {
  const A = analyse(c, reportState.term, reportState.subject);
  if (!A.list.length) return emptyList; if (!A.ranked) return `<div class="empty-state"><h3>No marks yet</h3><p>Positions appear as soon as marks are entered.</p></div>`;
  const rows = arrange(A.rows, reportState.sort), pod = A.rows.filter(r => r.pos && r.pos <= 3).sort((a, b) => a.pos - b.pos || a.l.name.localeCompare(b.l.name));
  const podium = `<ol class="podium">${pod.slice(0, 6).map(r => `<li class="p${r.pos}"><span class="medal">${ordinal(r.pos)}</span><strong>${esc(r.l.name)}</strong><span>${pct0(r.avg)} ${gtag(r.grade)}</span></li>`).join("")}</ol>`;
  let main;
  if (reportState.sort === "grade") main = [...GRADES, ""].map(g => { const rs = rows.filter(r => (g ? r.grade === g : r.avg == null)); if (!rs.length) return ""; return `<section class="grade-group"><h3>${g ? gtag(g) + " " + GRADE_LABEL[g] : "No marks yet"} <small>${rs.length} ${rs.length === 1 ? "learner" : "learners"}</small></h3><ul class="chips">${rs.map(r => `<li><strong>${esc(r.l.name)}</strong><small>${r.pos ? ordinal(r.pos) + ", " + pct0(r.avg) : "-"}</small></li>`).join("")}</ul></section>`; }).join("");
  else main = `<div class="table-wrap report-wrap"><table class="report-table pos-table"><thead><tr><th class="mk">Position</th><th>Learner</th><th class="mk">Average</th><th class="mk">Grade</th><th class="mk">Trend</th><th class="hide-m">Best subject</th><th class="hide-m">Needs help in</th><th><span class="sr">Report card</span></th></tr></thead><tbody>${rows.map(r => `<tr><td class="mk strong">${r.pos ? ordinal(r.pos) : "-"}</td><th scope="row">${esc(r.l.name)}</th><td class="mk strong">${pct0(r.avg)}</td><td class="mk">${gtag(r.grade)}</td><td class="mk">${trendMark(r.trend)}</td><td class="hide-m">${r.strong ? esc(r.strong.name) + " " + pct0(r.strong.pct) : "-"}</td><td class="hide-m">${r.weak.length ? esc(r.weak.slice(0, 2).map(s => s.name + " " + pct0(s.pct)).join(", ")) : "-"}</td><td class="mk"><button class="btn small outline" data-r="pdf-learner" data-class="${c.id}" data-id="${r.l.id}">PDF</button></td></tr>`).join("")}</tbody></table></div>`;
  return summaryTiles(A) + podium + main + `<p class="muted small-note">Learners are ranked by their average: total marks earned divided by total marks available, for the assessments they sat. Learners on the same average share a position.</p>`;
}
function positionsPage(c) {
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [null, "Positions"])}${classMenu(c, "positions")}
    <header class="page-head"><h1>Class positions</h1><p class="lead">Learners are placed from the highest average to the lowest. Change the term or subject to rank on that alone.</p></header>
    ${filterBar(c, POS_SORTS, pdfBtns(c) + `<button class="btn outline small" data-r="export-csv" data-id="${c.id}">${icon("download")} CSV</button>`)}
    <div data-rbody="pos" data-class="${c.id}">${positionsBody(c)}</div>`, "Positions");
}
function focusBody(c) {
  const A = analyse(c, reportState.term, reportState.subject);
  if (!A.list.length) return emptyList; if (!A.ranked) return `<div class="empty-state"><h3>No marks yet</h3><p>Focus areas appear once marks are entered.</p></div>`;
  const subj = `<div class="table-wrap report-wrap"><table class="report-table"><thead><tr><th>Subject</th><th class="mk">Assessments</th><th class="mk">Class average</th><th class="mk">Passed</th><th class="bar-col">Average</th></tr></thead><tbody>${[...A.subjects].sort((a, b) => (a.avg ?? 999) - (b.avg ?? 999)).map(s => `<tr><th scope="row">${esc(s.name)}</th><td class="mk">${s.n}</td><td class="mk strong">${pct0(s.avg)}</td><td class="mk">${pct0(s.pass)}</td><td class="bar-col"><span class="hbar"><i class="${s.avg < PASS_MARK ? "bad" : ""}" style="width:${Math.max(2, s.avg || 0)}%"></i></span></td></tr>`).join("")}</tbody></table></div>`;
  const cls = A.focus.map(f => `<li><strong>${esc(f.k)}</strong><span>${esc(f.t)}</span></li>`).join("");
  const lrn = arrange(A.rows, "low").map(r => `<article class="lf ${r.avg != null && r.avg < PASS_MARK ? "warn" : ""}"><header><h4>${esc(r.l.name)}</h4><span>${r.pos ? ordinal(r.pos) + ", " : ""}${pct0(r.avg)} ${gtag(r.grade)} ${trendMark(r.trend)}</span></header><ul>${r.advice.map(a => `<li>${esc(a)}</li>`).join("")}</ul></article>`).join("");
  return summaryTiles(A) + `<section class="panel"><h3>Class focus</h3><ul class="focus-list">${cls || "<li>Nothing urgent. Keep up the good work.</li>"}</ul></section><h2 class="sec">Subjects</h2>${subj}<h2 class="sec">Learner by learner</h2><div class="lf-grid">${lrn}</div>`;
}
function focusPage(c) {
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [null, "Focus"])}${classMenu(c, "focus")}
    <header class="page-head"><h1>Things to focus on</h1><p class="lead">Where the class and each learner need the most help, worked out from the marks.</p></header>
    ${filterBar(c, null, pdfBtns(c))}<div data-rbody="focus" data-class="${c.id}">${focusBody(c)}</div>`, "Focus");
}
function reportBody(c) {
  const A = analyse(c, reportState.term, reportState.subject), list = A.list;
  if (!list.length) return emptyList;
  const rows = arrange(A.rows, reportState.sort === "grade" ? "pos" : reportState.sort), stats = list.map(a => markStats(a, c.learners));
  const cell = (a, l) => { const v = a.marks[l.id]; return v === "A" ? `<td class="mk abs">Abs</td>` : typeof v === "number" ? `<td class="mk ${v / a.max * 100 < PASS_MARK ? "low" : ""}">${num1(v)}</td>` : `<td class="mk none">-</td>`; };
  return `<div class="table-wrap report-wrap"><table class="report-table"><thead><tr><th class="sticky">Learner</th>${list.map(a => `<th class="mk" title="${esc(a.title)}"><span class="rt">${esc(a.title)}</span><small>${esc(a.subject)}, /${a.max}</small></th>`).join("")}<th class="mk">Average</th><th class="mk">Grade</th><th class="mk">Position</th></tr></thead>
    <tbody>${rows.map(r => `<tr><th class="sticky" scope="row">${esc(r.l.name)}</th>${list.map(a => cell(a, r.l)).join("")}<td class="mk strong">${pct0(r.avg)}</td><td class="mk">${gtag(r.grade)}</td><td class="mk">${r.pos ? ordinal(r.pos) : "-"}</td></tr>`).join("")}</tbody>
    <tfoot><tr><th class="sticky">Class average</th>${stats.map(s => `<td class="mk">${pct0(s.avgPct)}</td>`).join("")}<td class="mk strong">${pct0(A.classAvg)}</td><td class="mk">${gtag(gradeOf(A.classAvg))}</td><td class="mk"></td></tr>
    <tr><th class="sticky">Pass rate (${PASS_MARK}%)</th>${stats.map(s => `<td class="mk">${s.n ? Math.round(s.pass / s.n * 100) + "%" : "-"}</td>`).join("")}<td class="mk" colspan="3"></td></tr></tfoot></table></div>
    <p class="muted small-note">Average is total marks earned divided by total marks available, for the assessments the learner sat. Learners with the same average share a position. Grades: A 80+, B 70+, C 60+, D 50+, E 40+, F below 40.</p>`;
}
function reportPage(c) {
  rshow(`${rcrumbs(["#/results", "Results"], [`#/results/c/${c.id}`, c.name], [null, "Report"])}${classMenu(c, "report")}
    <header class="page-head"><h1>Report for ${esc(c.name)}</h1><p class="lead print-only">${esc(gradeName(c.level, c.grade))}</p></header>
    ${filterBar(c, REP_SORTS, pdfBtns(c) + `<button class="btn outline small" data-r="export-csv" data-id="${c.id}">${icon("download")} CSV</button><button class="btn outline small" data-r="print">${icon("print")} Print</button>`)}
    <div data-rbody="report" data-class="${c.id}">${reportBody(c)}</div>`, "Report");
}
function refreshBody() { const box = $("[data-rbody]"); if (!box) return; const c = classById(box.dataset.class), k = box.dataset.rbody; box.innerHTML = k === "pos" ? positionsBody(c) : k === "focus" ? focusBody(c) : reportBody(c); }
function exportCsv(c) {
  const A = analyse(c, reportState.term, reportState.subject), list = A.list, rows = arrange(A.rows, reportState.sort === "grade" ? "pos" : reportState.sort);
  const head = ["Position", "Learner", "Gender", ...list.map(a => `${a.title} (${a.subject}, out of ${a.max})`), "Average %", "Grade", "Needs help in"];
  const body = rows.map(r => [r.pos ?? "", r.l.name, r.l.gender || "", ...list.map(a => { const v = a.marks[r.l.id]; return v === "A" ? "Absent" : v ?? ""; }), r.avg == null ? "" : Math.round(r.avg * 10) / 10, r.grade, r.weak.map(s => `${s.name} ${Math.round(s.pct)}%`).join("; ")]);
  const avgRow = ["", "Class average", "", ...list.map(a => { const s = markStats(a, c.learners); return s.avgPct == null ? "" : Math.round(s.avgPct * 10) / 10 + "%"; }), A.classAvg == null ? "" : Math.round(A.classAvg * 10) / 10, gradeOf(A.classAvg), ""];
  download(`${c.name.replace(/[^\w]+/g, "_")}_results.csv`, "﻿" + [head, ...body, avgRow].map(r => r.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
  toast("Report downloaded");
}
function exportLearnersCsv(c) {
  download(`${c.name.replace(/[^\w]+/g, "_")}_class_list.csv`, "﻿" + [["Name", "Gender", "Admission number", "Guardian phone"], ...sortedLearners(c).map(l => [l.name, l.gender || "", l.adm || "", l.phone || ""])].map(r => r.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
}
/* ---------- PDF export (built in, no libraries, works offline) ---------- */
function PdfDoc() {
  const pages = [], mc = document.createElement("canvas").getContext("2d"); let cur = null;
  const map = { 8217: "'", 8216: "'", 8220: '"', 8221: '"', 8211: "-", 8212: "-", 8230: "...", 8226: "*", 183: ".", 160: " " };
  const enc = s => { let o = ""; for (const ch of String(s)) { const c = ch.codePointAt(0); o += map[c] || (c >= 32 && c < 256 ? ch : c < 32 ? " " : "?"); } return o; };
  const lit = s => enc(s).replace(/[\\()]/g, "\\$&"), col = c => c.map(v => (v / 255).toFixed(3)).join(" ");
  const f = n => Number(n).toFixed(2);
  return {
    width(s, size, bold) { mc.font = `${bold ? "bold " : ""}100px Helvetica, Arial, sans-serif`; return mc.measureText(enc(s)).width * size / 100; },
    page(w, h) { cur = { w, h, ops: [] }; pages.push(cur); }, get count() { return pages.length; }, use(i) { cur = pages[i]; },
    text(x, y, s, size = 10, bold = false, color = [22, 35, 58]) { cur.ops.push(`BT /F${bold ? 2 : 1} ${size} Tf ${col(color)} rg ${f(x)} ${f(cur.h - y)} Td (${lit(s)}) Tj ET`); },
    rect(x, y, w, h, fill) { cur.ops.push(`${col(fill)} rg ${f(x)} ${f(cur.h - y - h)} ${f(w)} ${f(h)} re f`); },
    line(x1, y1, x2, y2, color = [214, 223, 217], lw = 0.6) { cur.ops.push(`${lw} w ${col(color)} RG ${f(x1)} ${f(cur.h - y1)} m ${f(x2)} ${f(cur.h - y2)} l S`); },
    build() {
      const parts = [], offs = []; let len = 0; const push = s => { parts.push(s); len += s.length; };
      const obj = (n, b) => { offs[n] = len; push(`${n} 0 obj\n${b}\nendobj\n`); }, N = pages.length;
      push("%PDF-1.4\n");
      obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
      obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] /Count ${N} >>`);
      obj(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
      obj(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
      pages.forEach((p, i) => { const s = p.ops.join("\n"); obj(5 + i * 2, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w} ${p.h}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`); obj(6 + i * 2, `<< /Length ${s.length} >>\nstream\n${s}\nendstream`); });
      const xref = len, total = 5 + N * 2; let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
      for (let n = 1; n < total; n++) x += String(offs[n]).padStart(10, "0") + " 00000 n \n";
      push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
      const str = parts.join(""), u = new Uint8Array(str.length); for (let i = 0; i < str.length; i++) u[i] = str.charCodeAt(i) & 255; return u;
    }
  };
}
const RGB = { ink: [22, 35, 58], muted: [86, 100, 120], line: [214, 223, 217], zebra: [244, 247, 245], head: [232, 238, 233], navy: [18, 38, 74], bad: [163, 40, 58], gold: [227, 167, 47] };
const GRGB = { A: [31, 122, 69], B: [60, 138, 58], C: [47, 111, 220], D: [176, 122, 28], E: [194, 87, 26], F: [163, 40, 58] };
function pdfWriter(landscape, runTitle) {
  const d = PdfDoc(), W = landscape ? 842 : 595, H = landscape ? 595 : 842, M = 36, CW = W - 2 * M; let y = M;
  const w = {
    d, W, H, M, CW, get y() { return y; }, set y(v) { y = v; },
    newPage() { d.page(W, H); y = M + 20; },
    ensure(h) { if (!d.count || y + h > H - M - 6) w.newPage(); },
    fit(s, size, maxW, bold) { s = String(s ?? ""); if (d.width(s, size, bold) <= maxW) return s; while (s.length > 1 && d.width(s + "...", size, bold) > maxW) s = s.slice(0, -1); return s + "..."; },
    wrap(s, size, maxW, bold, first = 0) {
      const lines = []; let line = "", lim = maxW - first;
      String(s).split(/\s+/).filter(Boolean).forEach(word => {
        let t = line ? line + " " + word : word;
        if (d.width(t, size, bold) <= lim) { line = t; return; }
        if (line) { lines.push(line); lim = maxW; }
        while (d.width(word, size, bold) > lim && word.length > 1) { let k = word.length - 1; while (k > 1 && d.width(word.slice(0, k), size, bold) > lim) k--; lines.push(word.slice(0, k)); word = word.slice(k); lim = maxW; }
        line = word;
      }); if (line) lines.push(line); return lines;
    },
    h(s, size = 13) { w.ensure(size + 22 + 56); y += 8; d.text(M, y + size, s, size, true, RGB.navy); y += size + 4; d.line(M, y, M + CW, y, RGB.gold, 1.2); y += 8; },
    p(s, o = {}) { const size = o.size || 9.5, ind = o.indent || 0; w.wrap(s, size, CW - ind, o.bold).forEach(l => { w.ensure(size * 1.5); d.text(M + ind, y + size, l, size, o.bold, o.color || RGB.ink); y += size * 1.45; }); y += o.gap ?? 3; },
    bullet(k, t, size = 9.5) {
      const kw = k ? d.width(k + ": ", size, true) : 0, lines = w.wrap(t, size, CW - 12, false, kw);
      w.ensure(size * 1.5 * Math.min(lines.length, 2)); d.text(M, y + size, "-", size, true, RGB.gold);
      lines.forEach((l, i) => { if (i) w.ensure(size * 1.5); if (i === 0 && k) { d.text(M + 12, y + size, k + ": ", size, true); d.text(M + 12 + kw, y + size, l, size); } else d.text(M + 12, y + size, l, size); y += size * 1.45; }); y += 2.5;
    },
    table(cols, rows, o = {}) {
      const size = o.size || 8.5, rh = o.rowH || 15, hl = Math.max(...cols.map(c => String(c.h).split("\n").length)), hh = hl * (size + 2) + 6;
      const head = () => { d.rect(M, y, CW, hh, RGB.head); let x = M; cols.forEach(c => { String(c.h).split("\n").forEach((ln, i) => { const t = w.fit(ln, size - (i ? 1 : 0), c.w - 8, !i), tw = d.width(t, size, !i); d.text(c.a === "r" ? x + c.w - 4 - tw : c.a === "c" ? x + (c.w - tw) / 2 : x + 4, y + 3 + (i + 1) * (size + 1.5), t, size - (i ? 1 : 0), !i, i ? RGB.muted : RGB.ink); }); x += c.w; }); y += hh; };
      w.ensure(hh + rh * 2); head();
      rows.forEach((r, ri) => {
        if (y + rh > H - M - 6) { w.newPage(); head(); }
        if (ri % 2) d.rect(M, y, CW, rh, RGB.zebra);
        let x = M; cols.forEach((c, ci) => {
          const cell = r[ci], o2 = cell && typeof cell === "object" ? cell : { t: cell };
          if (o2.bar != null) { d.rect(x + 4, y + 4.5, c.w - 8, 6, RGB.head); d.rect(x + 4, y + 4.5, Math.max(1, (c.w - 8) * Math.min(100, o2.bar) / 100), 6, o2.bar < PASS_MARK ? RGB.bad : GRGB.A); }
          else { const t = w.fit(o2.t ?? "", size, c.w - 8, o2.bold), tw = d.width(t, size, o2.bold); d.text(c.a === "r" ? x + c.w - 4 - tw : c.a === "c" ? x + (c.w - tw) / 2 : x + 4, y + rh - 4.2, t, size, o2.bold, o2.color || RGB.ink); }
          x += c.w;
        });
        d.line(M, y + rh, M + CW, y + rh, RGB.line, 0.4); y += rh;
      }); y += 6;
    },
    finish() {
      const n = d.count, date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
      for (let i = 0; i < n; i++) { d.use(i);
        d.text(M, M - 8, runTitle, 8, false, RGB.muted); const t = date, tw = d.width(t, 8); d.text(W - M - tw, M - 8, t, 8, false, RGB.muted); d.line(M, M - 3, W - M, M - 3);
        d.line(M, H - M + 4, W - M, H - M + 4); d.text(M, H - M + 15, "IPHS School Library. Developed by Dixars.", 8, false, RGB.muted);
        const pg = `Page ${i + 1} of ${n}`; d.text(W - M - d.width(pg, 8), H - M + 15, pg, 8, false, RGB.muted);
      } return d.build();
    }
  };
  return w;
}
const filterText = A => `${A.term || "All terms"}, ${A.subject || "All subjects"}`;
function pdfTitleBand(w, title, lines) {
  const { d, M, CW } = w; w.ensure(70); d.rect(M, w.y, CW, 28 + lines.length * 13 + 12, RGB.navy); d.rect(M, w.y, 5, 28 + lines.length * 13 + 12, RGB.gold);
  d.text(M + 16, w.y + 24, title, 18, true, [255, 255, 255]); lines.forEach((l, i) => d.text(M + 16, w.y + 41 + i * 13, l, 9.5, false, [215, 226, 242]));
  w.y += 28 + lines.length * 13 + 22;
}
function pdfTiles(w, items) {
  const { d, M, CW } = w, gap = 8, tw = (CW - gap * (items.length - 1)) / items.length; w.ensure(54);
  items.forEach(([lab, val], i) => { const x = M + i * (tw + gap); d.rect(x, w.y, tw, 46, RGB.zebra); d.rect(x, w.y, tw, 2.5, RGB.gold); d.text(x + 8, w.y + 17, lab, 8, false, RGB.muted); d.text(x + 8, w.y + 37, w.fit(val, 14, tw - 14, true), 14, true); });
  w.y += 56;
}
function pdfGradeBars(w, A) {
  const { d, M, CW } = w, mx = Math.max(1, ...Object.values(A.dist)), bw = CW * 0.55; w.ensure(6 * 15 + 4);
  GRADES.forEach(g => { d.rect(M, w.y, 22, 12, GRGB[g]); d.text(M + 11 - d.width(g, 8.5, true) / 2, w.y + 9.4, g, 8.5, true, [255, 255, 255]); d.rect(M + 30, w.y + 2, bw, 8, RGB.head); if (A.dist[g]) d.rect(M + 30, w.y + 2, Math.max(2, bw * A.dist[g] / mx), 8, GRGB[g]); d.text(M + 38 + bw, w.y + 9.5, `${A.dist[g]} ${A.dist[g] === 1 ? "learner" : "learners"}, ${(GRADE_LABEL[g].split(", ")[1] || GRADE_LABEL[g])}`, 8.5); w.y += 15; });
  w.y += 4;
}
const teacherName = () => (db.profile && db.profile.full_name) || "";
function classPdf(c) {
  const A = analyse(c, reportState.term, reportState.subject), w = pdfWriter(true, `Learner performance report, ${c.name}`), { d, M, CW } = w;
  w.newPage();
  pdfTitleBand(w, "Learner performance report", [`${c.name} (${gradeName(c.level, c.grade)}), ${A.rows.length} learners`, `${filterText(A)}, ${A.list.length} ${A.list.length === 1 ? "assessment" : "assessments"}${teacherName() ? ", teacher: " + teacherName() : ""}`]);
  if (!A.ranked) { w.p("No marks have been recorded for this selection yet."); return w.finish(); }
  const top = A.rows.filter(r => r.pos === 1).map(r => r.l.name);
  pdfTiles(w, [["Ranked learners", `${A.ranked} of ${A.rows.length}`], ["Class average", pct0(A.classAvg) + " " + gradeOf(A.classAvg)], ["Pass rate", Math.round(A.passN / A.ranked * 100) + "%"], ["Top of class", top.join(", ") || "-"], ["Need support", String(A.rows.filter(r => r.avg != null && r.avg < PASS_MARK).length)]]);
  w.h("Grade distribution"); pdfGradeBars(w, A);
  w.h("Things to focus on (whole class)");
  if (A.focus.length) A.focus.forEach(f => w.bullet(f.k, f.t)); else w.p("Nothing urgent. Keep up the good work.");
  w.h("Class positions");
  const ranked = arrange(A.rows, reportState.sort === "low" ? "low" : reportState.sort === "name" ? "name" : "pos");
  w.table([{ h: "Position", w: 52, a: "c" }, { h: "Learner", w: 170 }, { h: "Average", w: 56, a: "r" }, { h: "Grade", w: 44, a: "c" }, { h: "Trend", w: 56, a: "c" }, { h: "Best subject", w: 150 }, { h: "Needs help in", w: CW - 528 }],
    ranked.map(r => [{ t: r.pos ? ordinal(r.pos) : "-", bold: true }, r.l.name, { t: pct0(r.avg), bold: true }, { t: r.grade || "-", bold: true, color: GRGB[r.grade] }, trendTxt(r.trend), r.strong ? `${r.strong.name} ${pct0(r.strong.pct)}` : "-", r.weak.length ? r.weak.slice(0, 3).map(s => `${s.name} ${pct0(s.pct)}`).join(", ") : "-"]));
  w.h("Subject performance");
  w.table([{ h: "Subject", w: 230 }, { h: "Assessments", w: 80, a: "r" }, { h: "Class average", w: 90, a: "r" }, { h: "Passed", w: 70, a: "r" }, { h: "Average", w: CW - 470 }],
    [...A.subjects].sort((a, b) => (a.avg ?? 999) - (b.avg ?? 999)).map(s => [s.name, String(s.n), { t: pct0(s.avg), bold: true }, pct0(s.pass), { bar: s.avg || 0 }]));
  w.h("Marks for every learner");
  const per = 10, order = arrange(A.rows, "name");
  for (let i = 0; i < A.list.length; i += per) {
    const chunk = A.list.slice(i, i + per), aw = Math.min(64, (CW - 180) / chunk.length);
    w.table([{ h: "Pos", w: 30, a: "c" }, { h: "Learner", w: 150 }, ...chunk.map(a => ({ h: `${a.title}\n${a.subject.slice(0, 12)} /${a.max}`, w: aw, a: "c" }))],
      order.map(r => [r.pos ? ordinal(r.pos) : "-", r.l.name, ...chunk.map(a => { const v = a.marks[r.l.id]; return v === "A" ? { t: "Abs", color: RGB.muted } : typeof v === "number" ? { t: num1(v), color: v / a.max * 100 < PASS_MARK ? RGB.bad : RGB.ink, bold: v / a.max * 100 < PASS_MARK } : { t: "-", color: RGB.muted }; })]), { size: 8 });
  }
  w.h("Focus notes for each learner (weakest first)");
  arrange(A.rows, "low").forEach(r => {
    const lines = r.advice.flatMap(a => w.wrap(a, 9, CW - 24)); w.ensure(18 + lines.length * 12.5 + 6);
    d.rect(M, w.y, 3, 14 + lines.length * 12.5, r.avg != null && r.avg < PASS_MARK ? RGB.bad : GRGB.A);
    d.text(M + 10, w.y + 10, r.l.name, 10, true); const meta = `${r.pos ? ordinal(r.pos) + ", " : ""}${pct0(r.avg)} ${r.grade}${r.trend ? ", " + trendTxt(r.trend).toLowerCase() : ""}`; d.text(M + CW - d.width(meta, 9, true), w.y + 10, meta, 9, true, r.grade ? GRGB[r.grade] : RGB.muted); w.y += 16;
    r.advice.forEach(a => w.wrap(a, 9, CW - 24).forEach(l => { d.text(M + 10, w.y + 8, l, 9); w.y += 12.5; })); w.y += 6;
  });
  w.p(`Grades: A 80% and above, B 70%, C 60%, D 50%, E 40%, F below 40%. Pass mark ${PASS_MARK}%. Average is total marks earned divided by total marks available for the assessments each learner sat. Learners with the same average share a position.`, { size: 8, color: RGB.muted });
  return w.finish();
}
function learnerCard(w, A, r) {
  const { d, M, CW } = w, c = A.c; w.newPage();
  pdfTitleBand(w, r.l.name, [`${c.name} (${gradeName(c.level, c.grade)}), ${filterText(A)}`, `${r.l.gender ? r.l.gender + ", " : ""}${r.l.adm ? "Admission no. " + r.l.adm : "Learner report card"}`]);
  pdfTiles(w, [["Position", r.pos ? `${ordinal(r.pos)} of ${A.ranked}` : "-"], ["Average", pct0(r.avg)], ["Grade", r.grade || "-"], ["Class average", pct0(A.classAvg)], ["Trend", trendTxt(r.trend)]]);
  w.h("Subjects");
  w.table([{ h: "Subject", w: 200 }, { h: "Learner", w: 70, a: "r" }, { h: "Class average", w: 90, a: "r" }, { h: "Grade", w: 50, a: "c" }, { h: "Compared with class", w: CW - 410 }],
    r.subj.map(s => { const cs = A.subjects.find(x => x.name === s.name), diff = cs && cs.avg != null ? s.pct - cs.avg : null; return [s.name, { t: pct0(s.pct), bold: true }, pct0(cs && cs.avg), { t: gradeOf(s.pct), bold: true, color: GRGB[gradeOf(s.pct)] }, diff == null ? "-" : { t: (diff >= 0 ? "+" : "") + Math.round(diff) + " points", color: diff < 0 ? RGB.bad : RGB.ink }]; }));
  w.h("Assessments");
  w.table([{ h: "Assessment", w: 190 }, { h: "Subject", w: 120 }, { h: "Mark", w: 60, a: "r" }, { h: "Out of", w: 50, a: "r" }, { h: "%", w: 50, a: "r" }, { h: "Grade", w: CW - 470, a: "c" }],
    A.list.map(a => { const v = a.marks[r.l.id], p = typeof v === "number" ? v / a.max * 100 : null; return [a.title, a.subject, v === "A" ? "Absent" : typeof v === "number" ? num1(v) : "-", String(a.max), p == null ? "-" : pct0(p), p == null ? "-" : { t: gradeOf(p), bold: true, color: GRGB[gradeOf(p)] }]; }));
  w.h("Things to focus on");
  r.advice.forEach(a => w.bullet("", a));
  if (r.strong) w.bullet("Strongest subject", `${r.strong.name} (${pct0(r.strong.pct)}). Keep it up.`);
  w.ensure(80); w.y += 14; d.text(M, w.y + 10, "Teacher's comment", 9, true); d.line(M, w.y + 34, M + CW, w.y + 34, RGB.ink, 0.5); d.line(M, w.y + 54, M + CW, w.y + 54, RGB.ink, 0.5);
  d.text(M, w.y + 74, "Teacher's signature: ______________________", 9); d.text(M + CW - 190, w.y + 74, "Parent or guardian: ______________", 9); w.y += 90;
}
const pdfName = (c, k) => `${c.name.replace(/[^\w]+/g, "_")}_${k}.pdf`;
function learnerPdf(c, lid) { const A = analyse(c, reportState.term, reportState.subject), r = A.rows.find(x => x.l.id === lid); if (!r) return; const w = pdfWriter(false, `Report card, ${c.name}`); learnerCard(w, A, r); return w.finish(); }
function cardsPdf(c) { const A = analyse(c, reportState.term, reportState.subject), w = pdfWriter(false, `Report cards, ${c.name}`); arrange(A.rows, "name").forEach(r => learnerCard(w, A, r)); return w.finish(); }

/* teacher events */
function rerr(msg, focus) { const e = $("#rError"); if (e) e.textContent = msg; if (focus) focus.focus(); }
function applyMark(a, lid, raw) {
  const t = String(raw).trim().replace(",", ".");
  if (t === "") { delete a.marks[lid]; return true; }
  if (/^(a|ab|abs|absent)$/i.test(t)) { a.marks[lid] = "A"; return true; }
  const n = Number(t); if (!isFinite(n) || n < 0 || n > a.max) return false;
  a.marks[lid] = Math.round(n * 100) / 100; return true;
}
function refreshMarkRow(a, lid) {
  const tr = $(`.marks-table tr[data-l="${lid}"]`); if (!tr) return;
  const [pc, gr] = rowCells(a, lid), inp = $(".mark-input", tr), ab = a.marks[lid] === "A";
  tr.querySelector(".pc").textContent = pc; tr.querySelector(".gr").innerHTML = gr;
  inp.disabled = ab; inp.classList.remove("bad"); if (ab) inp.value = ""; $("[data-abs]", tr).checked = ab;
}
function refreshStats(a) { const c = classById(a.classId), box = $("#markStats"); if (box) box.innerHTML = statsHtml(a, c); const s = $("#saveState"); if (s) s.textContent = "Saved"; }
function markCtx(el) { const t = el.closest(".marks-table"); return t ? assById(t.dataset.aid) : null; }

document.addEventListener("input", e => {
  if (!e.target.classList.contains("mark-input")) return;
  const a = markCtx(e.target); if (!a) return;
  const lid = e.target.dataset.l, old = a.marks[lid];
  if (applyMark(a, lid, e.target.value)) { e.target.classList.remove("bad"); e.target.removeAttribute("aria-invalid"); save(); refreshMarkRow(a, lid); refreshStats(a); }
  else { if (old === undefined) delete a.marks[lid]; else a.marks[lid] = old; e.target.classList.add("bad"); e.target.setAttribute("aria-invalid", "true"); const s = $("#saveState"); if (s) s.textContent = `Enter a number from 0 to ${a.max}`; }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset && t.dataset.abs) { const a = markCtx(t); if (!a) return; if (t.checked) a.marks[t.dataset.abs] = "A"; else delete a.marks[t.dataset.abs]; save(); refreshMarkRow(a, t.dataset.abs); const i = $(`.mark-input[data-l="${t.dataset.abs}"]`); if (i && !t.checked) { i.value = ""; i.focus(); } refreshStats(a); }
  else if (t.id === "learnerFile" && t.files[0]) { const r = new FileReader(); r.onload = () => { const ta = $("#l-names"); ta.value = String(r.result); toast("File loaded. Check the list, then choose Enrol all."); ta.focus(); }; r.readAsText(t.files[0]); t.value = ""; }
  else if (t.dataset && t.dataset.rswitch !== undefined) go(`#/results/c/${t.value}${t.dataset.rswitch ? "/" + t.dataset.rswitch : ""}`);
  else if (false) { const c = classById(t.dataset.class), l = c && c.learners.find(x => x.id === t.dataset.rename), nm = t.value.replace(/\s+/g, " ").trim(); if (!l) return; if (!nm) { t.value = l.name; return toast("A learner needs a name"); } l.name = nm; save(); toast("Name updated"); }
  else if (t.id === "c-level") { const g = $("#c-grade"); g.innerHTML = gradeOptions(t.value, 1); }
  else if (t.dataset && t.dataset.rfilter) { reportState[{ fTerm: "term", fSubject: "subject", fSort: "sort" }[t.id]] = t.value; refreshBody(); }
  else if (t.id === "importFile" && t.files[0]) { const f = t.files[0], r = new FileReader(); r.onload = () => importBackup(String(r.result)); r.readAsText(f); t.value = ""; }
});
document.addEventListener("input", e => { if (e.target.id !== "learnerFilter") return; const q = e.target.value.trim().toLowerCase(); $$(".learner-table tbody tr").forEach(tr => { tr.hidden = !!q && !tr.dataset.q.includes(q); }); });
document.addEventListener("keydown", e => {
  if (!e.target.classList || !e.target.classList.contains("mark-input")) return;
  const dir = e.key === "Enter" ? (e.shiftKey ? -1 : 1) : e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0; if (!dir) return;
  e.preventDefault(); const all = $$(".mark-input:not(:disabled)"), i = all.indexOf(e.target), n = all[i + dir]; if (n) { n.focus(); n.select(); }
});
document.addEventListener("paste", e => {
  if (!e.target.classList || !e.target.classList.contains("mark-input")) return;
  const text = (e.clipboardData || window.clipboardData).getData("text"); if (!/[\r\n]/.test(text.trim())) return;
  e.preventDefault(); const a = markCtx(e.target); if (!a) return;
  const vals = text.replace(/\r/g, "").split("\n").map(l => l.split("\t")[0]); while (vals.length && vals[vals.length - 1].trim() === "") vals.pop();
  const all = $$(".mark-input"), start = all.indexOf(e.target); let ok = 0, bad = 0;
  vals.forEach((v, k) => { const inp = all[start + k]; if (!inp) return; if (applyMark(a, inp.dataset.l, v)) { ok++; const el = $(`.mark-input[data-l="${inp.dataset.l}"]`); if (a.marks[inp.dataset.l] !== "A") el.value = a.marks[inp.dataset.l] ?? ""; refreshMarkRow(a, inp.dataset.l); } else bad++; });
  save(); refreshStats(a); toast(`${ok} ${ok === 1 ? "mark" : "marks"} pasted${bad ? `, ${bad} skipped (not between 0 and ${a.max})` : ""}`);
});
document.addEventListener("click", e => {
  const el = e.target.closest("[data-r]"); if (!el) return;
  const act = el.dataset.r, id = el.dataset.id;
  if (act === "del-class") { const c = classById(id); if (c && confirm(`Delete ${c.name}, its learners and all its marks? This cannot be undone.`)) { db.classes = db.classes.filter(x => x.id !== id); db.assessments = db.assessments.filter(a => a.classId !== id); save(); toast("Class deleted"); go("#/results"); } }
  else if (act === "del-assess") { const a = assById(id); if (a && confirm(`Delete "${a.title}" and its marks? This cannot be undone.`)) { db.assessments = db.assessments.filter(x => x.id !== id); save(); toast("Assessment deleted"); go(`#/results/c/${a.classId}`); } }
  else if (act === "del-learner") { const c = classById(el.dataset.class), l = c && c.learners.find(x => x.id === id); if (l && confirm(`Remove ${l.name} and their marks?`)) { c.learners = c.learners.filter(x => x.id !== id); db.assessments.filter(a => a.classId === c.id).forEach(a => delete a.marks[id]); save(); learnersPage(c); toast("Learner removed"); } }
  else if (act === "export-csv") { const c = classById(id); if (c) exportCsv(c); }
  else if (act === "print") window.print();
  else if (act === "pick-learner-file") $("#learnerFile").click();
  else if (act === "export-learners") { const c = classById(id); if (c) exportLearnersCsv(c); }
  else if (act === "pdf-class" || act === "pdf-cards" || act === "pdf-learner") {
    const c = classById(act === "pdf-learner" ? el.dataset.class : id); if (!c) return;
    try {
      const bytes = act === "pdf-class" ? classPdf(c) : act === "pdf-cards" ? cardsPdf(c) : learnerPdf(c, id); if (!bytes) return;
      const nm = act === "pdf-learner" ? `${c.name}_${(c.learners.find(l => l.id === id) || {}).name || "learner"}`.replace(/[^\w]+/g, "_") + "_report_card.pdf" : pdfName(c, act === "pdf-class" ? "performance_report" : "report_cards");
      download(nm, bytes, "application/pdf"); toast("PDF downloaded");
    } catch (err) { console.error(err); toast("Could not make the PDF"); }
  }
  else if (act === "export-json") { download(`iphs_results_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: "iphs-results", version: 1, exported: nowISO(), classes: db.classes, assessments: db.assessments }, null, 1), "application/json"); toast("Backup downloaded"); }
  else if (act === "import-pick") $("#importFile").click();
});
function importBackup(txt) {
  try {
    const d = JSON.parse(txt);
    if (d.app !== "iphs-results" || !Array.isArray(d.classes) || !Array.isArray(d.assessments)) throw new Error("bad");
    if (!confirm(`Replace the results on this device with the backup (${d.classes.length} classes, ${d.assessments.length} assessments)?`)) return;
    db.classes = d.classes; db.assessments = d.assessments; save(); toast("Backup restored"); resultsHome();
  } catch { toast("That file is not an IPHS results backup"); }
}
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-rform]"); if (!f) return; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.rform;
  if (kind === "class") {
    const name = String(fd.get("name") || "").trim().replace(/\s+/g, " "), level = fd.get("level"), grade = Number(fd.get("grade"));
    if (!name) return rerr("Enter a class name.", $("#c-name"));
    if (db.classes.some(c => c.id !== f.dataset.id && c.name.toLowerCase() === name.toLowerCase())) return rerr("You already have a class with that name.", $("#c-name"));
    db.lastClass = { level, grade };
    if (f.dataset.id) { const c = classById(f.dataset.id); Object.assign(c, { name, level, grade }); save(); toast("Class updated"); go(`#/results/c/${c.id}`); }
    else { const c = { id: uid(), name, level, grade, learners: [], created: nowISO() }; enrolMany(c, fd.get("names")); db.classes.push(c); save(); toast("Class added"); go(`#/results/c/${c.id}`); }
  } else if (kind === "enrol") {
    const c = classById(f.dataset.id), name = String(fd.get("name") || "").trim();
    if (!name) return rerr("Enter the learner's full name.", $("#e-name"));
    const r = enrol(c, { name, gender: fd.get("gender") || "", adm: String(fd.get("adm") || "").trim(), phone: String(fd.get("phone") || "").trim() });
    if (r === "name") return rerr(`${name} is already in this class.`, $("#e-name"));
    if (r === "adm") return rerr("That admission number belongs to another learner.", $("#e-adm"));
    save(); learnersPage(c); toast(`${name} enrolled`); $("#e-name").focus();
  } else if (kind === "learners") {
    const c = classById(f.dataset.id), txt = String(fd.get("names") || "");
    if (!parseLearners(txt).length) { const e = $("#rError2"); if (e) e.textContent = "Type or paste at least one name."; return $("#l-names").focus(); }
    const r = enrolMany(c, txt); save(); learnersPage(c);
    toast(r.added ? `${r.added} ${r.added === 1 ? "learner" : "learners"} enrolled${r.skipped ? `, ${r.skipped} skipped (already enrolled)` : ""}` : "Those learners are already enrolled");
  } else if (kind === "learner-edit") {
    const c = classById(f.dataset.class), l = c && c.learners.find(x => x.id === f.dataset.id), name = String(fd.get("name") || "").replace(/\s+/g, " ").trim(), adm = String(fd.get("adm") || "").trim();
    if (!l) return; if (!name) return rerr("Enter the learner's full name.", $("#e-name"));
    if (c.learners.some(x => x.id !== l.id && x.name.toLowerCase() === name.toLowerCase())) return rerr("Another learner already has that name.", $("#e-name"));
    if (adm && c.learners.some(x => x.id !== l.id && (x.adm || "").toLowerCase() === adm.toLowerCase())) return rerr("That admission number belongs to another learner.", $("#e-adm"));
    Object.assign(l, { name, adm, gender: fd.get("gender") || "", phone: String(fd.get("phone") || "").trim() }); save(); toast("Learner updated"); go(`#/results/c/${c.id}/learners`);
  } else if (kind === "assess") {
    const c = classById(f.dataset.class), title = String(fd.get("title") || "").trim(), max = Number(fd.get("max")), existing = f.dataset.id ? assById(f.dataset.id) : null;
    if (!title) return rerr("Enter a title.", $("#a-title"));
    if (!isFinite(max) || max <= 0) return rerr("Total marks must be a number above 0.", $("#a-max"));
    if (existing) { const over = Object.values(existing.marks).filter(v => typeof v === "number" && v > max).length; if (over) return rerr(`${over} saved ${over === 1 ? "mark is" : "marks are"} higher than ${max}. Correct them first or use a higher total.`, $("#a-max")); }
    const data = { title, subject: fd.get("subject"), type: fd.get("type"), term: fd.get("term"), date: fd.get("date") || "", max };
    db.lastTerm = data.term;
    if (existing) { Object.assign(existing, data); save(); toast("Assessment updated"); go(`#/results/c/${c.id}`); }
    else { const a = { id: uid(), classId: c.id, ...data, marks: {}, created: nowISO() }; db.assessments.push(a); save(); go(`#/results/a/${a.id}/marks`); }
  }
});

/* ---------- about, support, licence, privacy ---------- */
const SUPPORT_EMAIL = "dixarstech@gmail.com", APP_VERSION = "1.0", DEV_YEAR = new Date().getFullYear();
const infoTabs = on => `<nav class="class-menu info-menu" aria-label="About"><div class="cm-tabs">${[["about", "About", "book"], ["support", "Support", "spark"], ["license", "Licence", "clip"], ["privacy", "Privacy", "lock"]].map(([p, l, ic]) => `<a href="#/${p}" class="${on === p ? "active" : ""}" ${on === p ? 'aria-current="page"' : ""}>${icon(ic)}<span>${l}</span></a>`).join("")}</div></nav>`;
const ishow = (on, title, html) => show(`${infoTabs(on)}<article class="doc">${html}</article>`, { title, section: "settings", cls: "info" });
function viewAbout() {
  ishow("about", "About", `<header class="page-head"><h1>About IPHS School Library</h1><p class="lead">A school library and teaching tool that works on a phone, tablet or computer, with or without internet.</p></header>
  <div class="panel"><h3>What it does</h3><ul class="ticks"><li>Read books for Standard 1 to 8 and Form 1 to 4, and have them read aloud.</li><li>Look up any word in the built-in dictionary search.</li><li>Take quizzes and ask questions answered from the library books.</li><li>Teachers can enrol learners, record marks, rank classes and download PDF reports with things to focus on.</li></ul></div>
  <div class="panel"><h3>Developer</h3><p>Designed and built by <strong>Dixars</strong>.</p><p class="muted">Version ${APP_VERSION}</p><p><a class="btn" href="mailto:${SUPPORT_EMAIL}">Email ${SUPPORT_EMAIL}</a></p></div>
  <div class="panel"><h3>Need help or have an idea?</h3><p>Send a problem report or a suggestion from the <a href="#/support">Support page</a>. Read how your information is handled on the <a href="#/privacy">Privacy page</a> and how the app and its books may be used on the <a href="#/license">Licence page</a>.</p></div>`);
}
function viewSupport() {
  const p = db.profile, kinds = [["Problem", "Report a problem"], ["Suggestion", "Suggest an improvement"], ["Question", "Ask for help"], ["Other", "Something else"]];
  ishow("support", "Support", `<header class="page-head"><h1>Support, reports and suggestions</h1><p class="lead">Tell the developer what went wrong or what would make the app better.</p></header>
  <form class="panel narrow" data-sform novalidate>
    <div class="field"><label for="s-kind">What is this about?</label><select id="s-kind" name="kind">${kinds.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
    <div class="field"><label for="s-sub">Short summary</label><input id="s-sub" name="subject" type="text" maxlength="100" autocomplete="off"></div>
    <div class="field"><label for="s-msg">Details</label><textarea id="s-msg" name="message" rows="7" placeholder="What happened, or what would you like to see? Which page were you on?"></textarea></div>
    <label class="chk"><input type="checkbox" name="device" checked><span>Add my device and app details to help find the problem (no learner names or marks are added)</span></label>
    <p class="form-error" role="alert" id="sError"></p>
    <div class="toolbar"><button class="btn" type="submit">${icon("send")} Open email to send</button><button class="btn outline" type="button" data-r="copy-email">Copy email address</button></div>
    <p class="muted small-note">This opens your email app with the message ready to send to ${SUPPORT_EMAIL}. Nothing is sent until you press send there. If no email app opens, write to ${SUPPORT_EMAIL} yourself.</p></form>`);
}
function viewLicense() {
  ishow("license", "Licence", `<header class="page-head"><h1>Licence and credits</h1><p class="lead">How this app and its books may be used.</p></header>
  <div class="panel"><h3>The app</h3><p>IPHS School Library is copyright &copy; ${DEV_YEAR} Dixars. All rights reserved.</p><p>Schools, teachers and learners may use the app for teaching and learning free of charge. You may not sell it, rent it, or share it as your own work, and you may not remove the developer credit, without written permission from Dixars. To ask for permission, write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p></div>
  <div class="panel"><h3>Books and notes</h3><p>The teaching notes, past papers and question collections in the library were written by teachers and other authors. Copyright in each remains with its original author or publisher. They are included for classroom use. If you are an author and want a book credited, changed or removed, please <a href="mailto:${SUPPORT_EMAIL}?subject=Library%20content">contact us</a>.</p></div>
  <div class="panel"><h3>Other things the app uses</h3><ul class="ticks"><li>Bitter and Atkinson Hyperlegible fonts, shown through Google Fonts under the SIL Open Font Licence.</li><li>Dictionary definitions from the Free Dictionary API (dictionaryapi.dev), when you are online.</li><li>Your device's own voices for reading aloud.</li></ul></div>
  <div class="panel"><h3>No warranty</h3><p>The app is provided as it is. Marks, rankings and advice are worked out from what a teacher enters and are a guide, not an official school record. Keep your own backups.</p></div>`);
}
function viewPrivacy() {
  ishow("privacy", "Privacy", `<header class="page-head"><h1>Privacy and data protection</h1><p class="lead">Your information stays on your device unless you choose to share it.</p></header>
  <div class="panel"><h3>What is stored</h3><p>On this device only: your profile (name, role, age, gender), bookmarks, reading progress and quiz scores. Teachers also store classes, learner names, gender, admission numbers, guardian phone numbers and marks. This data lives in this browser. The app has no account system and no server that receives it.</p></div>
  <div class="panel"><h3>Online account (optional)</h3><p>If you create an account, your email, name, role and the same data as above (profile, progress, bookmarks and, for teachers, classes and learner results) are stored in a private database provided by Supabase. Each account can read only its own rows. Passwords are never visible to the app or to the school. Sign out and clear this device on shared phones, and use <strong>Delete my online data</strong> on the account page to remove what is stored online. Without an account, nothing is sent.</p></div>
  <div class="panel"><h3>What leaves your device</h3><ul class="ticks"><li><strong>Dictionary:</strong> when online, the word you look up is sent to dictionaryapi.dev.</li><li><strong>Fonts:</strong> your browser may fetch fonts from Google Fonts when you are online.</li><li><strong>Online AI mode (optional):</strong> if you turn it on and enter an AI service address, your question and the book excerpts used to answer it are sent to that service. Offline mode sends nothing.</li><li><strong>Support emails:</strong> only what you choose to send from your own email app.</li><li><strong>Backups and PDFs:</strong> files you download are yours. They contain learner names and marks, so keep them safe.</li></ul></div>
  <div class="panel"><h3>Learners' information</h3><p>Teachers who record learners' details are responsible for them. Collect only what you need, keep the device locked, share reports only with the learner, parents or guardians and school staff who should see them, and follow your school's policy and the data protection rules that apply where you work. Shared phones and computers: log out of the device or remove the data when you finish.</p></div>
  <div class="panel"><h3>Your choices</h3><ul class="ticks"><li>Remove one learner or a whole class from the Results pages at any time.</li><li>Delete everything stored by the app with <strong>Delete my data</strong> in <a href="#/settings">Settings</a>. Clearing the browser's site data does the same.</li><li>Download a backup before deleting if you want to keep your results.</li></ul></div>
  <div class="panel"><h3>Questions</h3><p>Write to <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>. This page may change as the app grows, and the current version is always the one in the app.</p></div>`);
}
function supportMail(fd) {
  const kind = fd.get("kind"), sub = String(fd.get("subject") || "").trim(), msg = String(fd.get("message") || "").trim();
  let body = msg;
  if (fd.get("device")) body += `\n\n---\nApp: IPHS School Library ${APP_VERSION}\nPage: ${location.hash || "#/"}\nRole: ${db.profile ? db.profile.role : "none"}\nScreen: ${innerWidth}x${innerHeight}\nBrowser: ${navigator.userAgent}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${kind}] ${sub || "IPHS School Library"}`)}&body=${encodeURIComponent(body)}`;
}
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-sform]"); if (!f) return; e.preventDefault();
  const fd = new FormData(f), err = $("#sError");
  if (!String(fd.get("message") || "").trim()) { err.textContent = "Write a few words about the problem or idea."; return $("#s-msg").focus(); }
  err.textContent = ""; location.href = supportMail(fd); toast("Opening your email app");
});
document.addEventListener("click", e => { if (e.target.closest('[data-r="copy-email"]')) { (navigator.clipboard ? navigator.clipboard.writeText(SUPPORT_EMAIL) : Promise.reject()).then(() => toast("Email address copied"), () => toast(SUPPORT_EMAIL)); } });

/* ---------- online account and sync (Supabase) ---------- */
const SUPABASE_URL = "https://blphzrlezmyudpdtueja.supabase.co";
const SUPABASE_KEY = "sb_publishable_AsX9QMi7WiX11YMC0ngqyA_Qx-9YiPC";   // publishable key: safe to ship, the database rules protect the data
const CLOUD_ON = !!(SUPABASE_URL && SUPABASE_KEY);
const CKEY = "iphs.cloud.v1";
const cloud = Object.assign({ session: null, isTeacher: false, remoteTs: 0, dirty: false, lastSync: null }, (() => { try { return JSON.parse(localStorage.getItem(CKEY)) || {}; } catch { return {}; } })());
cloud.status = ""; let acctTab = "signin", applying = false, syncing = false, syncTimer = null;
const csave = () => { try { const { status, ...keep } = cloud; localStorage.setItem(CKEY, JSON.stringify(keep)); } catch { } };

function cloudError(j, status) {
  const m = String((j && (j.msg || j.error_description || j.message || j.error)) || "");
  if (/invalid login/i.test(m)) return "The email or password is wrong.";
  if (/already (been )?registered/i.test(m)) return "That email already has an account. Sign in instead.";
  if (/password/i.test(m) && /(short|least|weak|characters)/i.test(m)) return "Use a password of at least 6 characters.";
  if (/(valid|invalid).*email|email.*(valid|invalid)/i.test(m)) return "Enter a valid email address.";
  if (/not confirmed/i.test(m)) return "Confirm your email first. Check your inbox.";
  if (/rate limit|too many|only request this after/i.test(m)) return "Too many tries. Wait a minute and try again.";
  if (/expired|invalid.*(token|link)/i.test(m)) return "That link has expired. Ask for a new one.";
  return m || `The server replied with HTTP ${status}.`;
}
async function sb(path, { method = "GET", body, token, headers = {} } = {}) {
  const h = { apikey: SUPABASE_KEY, "Content-Type": "application/json", ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(SUPABASE_URL + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal });
    const text = await r.text(); let j = null; try { j = text ? JSON.parse(text) : null; } catch { }
    if (!r.ok) { const e = new Error(cloudError(j, r.status)); e.status = r.status; throw e; }
    return j;
  } catch (e) {
    if (e.status) throw e;
    const n = new Error(e.name === "AbortError" ? "The server took too long to reply." : "No internet connection."); n.offline = true; throw n;
  } finally { clearTimeout(timer); }
}
function setSession(s) {
  cloud.session = s ? { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600), user: { id: s.user.id, email: s.user.email, name: (s.user.user_metadata || {}).full_name || "" } } : null;
  csave();
}
function signedOut(msg) { cloud.session = null; cloud.isTeacher = false; cloud.remoteTs = 0; cloud.dirty = false; cloud.lastSync = null; cloud.status = ""; clearTimeout(syncTimer); csave(); if (msg) toast(msg); }
async function cloudToken() {
  const s = cloud.session; if (!s) throw new Error("Not signed in.");
  if (s.expires_at - 60 < Date.now() / 1000) {
    try { setSession(await sb("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh_token } })); }
    catch (e) { if (e.status === 400 || e.status === 401) { signedOut("Your login expired. Sign in again to keep syncing."); if (location.hash.startsWith("#/account")) route(); } throw e; }
  }
  return cloud.session.access_token;
}
async function cloudSignUp(email, password, name) {
  const r = await sb(`/auth/v1/signup?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, { method: "POST", body: { email, password, data: { full_name: name } } });
  if (r && r.access_token) { setSession(r); return "in"; } return "confirm";
}
async function cloudSignIn(email, password) { setSession(await sb("/auth/v1/token?grant_type=password", { method: "POST", body: { email, password } })); }
async function cloudSignOut() { try { const t = cloud.session && cloud.session.access_token; if (t) await sb("/auth/v1/logout", { method: "POST", token: t }); } catch { } signedOut(); }
async function cloudRecover(email) { await sb(`/auth/v1/recover?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, { method: "POST", body: { email } }); }

/* what is synced: everything except this device's settings (theme, AI address, access codes) */
const syncData = () => { const { settings, ...rest } = db; return JSON.parse(JSON.stringify(rest)); };
const hasData = d => !!(d.profile || (d.classes && d.classes.length) || ["bookmarks", "favorites", "reading", "done"].some(k => d[k] && Object.keys(d[k]).length) || (d.scores && d.scores.length));
function mergeState(local, remote) {
  const byId = (a, b, f) => { const m = new Map(); (b || []).forEach(x => m.set(x.id, x)); (a || []).forEach(x => m.set(x.id, f ? f(m.get(x.id), x) : x)); return [...m.values()]; };
  const m = { ...defaults(), ...remote, ...local };
  m.profile = local.profile || remote.profile || null;
  ["bookmarks", "favorites", "reading", "done"].forEach(k => { m[k] = { ...(remote[k] || {}), ...(local[k] || {}) }; });
  const seen = new Set(); m.scores = [...(local.scores || []), ...(remote.scores || [])].filter(s => { const k = JSON.stringify(s); return seen.has(k) ? false : (seen.add(k), true); });
  m.classes = byId(local.classes, remote.classes, (r, l) => r ? { ...r, ...l, learners: byId(l.learners, r.learners) } : l);
  m.assessments = byId(local.assessments, remote.assessments, (r, l) => r ? { ...r, ...l, marks: { ...(r.marks || {}), ...(l.marks || {}) } } : l);
  return m;
}
function applyState(data) { applying = true; db = { ...defaults(), ...data, settings: db.settings }; save(); applying = false; navRole = null; }
async function pullProfile() {
  const t = await cloudToken(), rows = await sb(`/rest/v1/iphs_profiles?select=full_name,role,is_teacher&id=eq.${cloud.session.user.id}`, { token: t });
  cloud.isTeacher = !!(rows && rows[0] && rows[0].is_teacher); csave(); return rows && rows[0];
}
async function pushProfile() {
  if (!db.profile) return; const t = await cloudToken();
  await sb(`/rest/v1/iphs_profiles?id=eq.${cloud.session.user.id}`, { method: "PATCH", token: t, headers: { Prefer: "return=minimal" }, body: { full_name: db.profile.full_name, role: db.profile.role === "Teacher" ? "Teacher" : "Student" } });
}
async function syncNow() {
  if (!CLOUD_ON || !cloud.session || syncing) return;
  if (!navigator.onLine) { cloud.status = "Waiting for internet"; return paintCloud(); }
  syncing = true; cloud.status = "Syncing..."; paintCloud(); let changed = false;
  try {
    const t = await cloudToken(), id = cloud.session.user.id;
    const rows = await sb(`/rest/v1/iphs_app_state?select=data,updated_at&user_id=eq.${id}`, { token: t }), row = rows && rows[0], remoteTs = row ? Date.parse(row.updated_at) || 0 : 0;
    const local = syncData(); let push = false;
    if (!row) push = hasData(local);
    else if (remoteTs === cloud.remoteTs) push = cloud.dirty;
    else if (cloud.dirty || (cloud.remoteTs === 0 && hasData(local))) { applyState(mergeState(local, row.data || {})); push = true; changed = true; }
    else { applyState(row.data || {}); cloud.remoteTs = remoteTs; changed = true; }
    if (push) {
      const now = new Date().toISOString();
      await sb("/rest/v1/iphs_app_state", { method: "POST", token: t, headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: { user_id: id, data: syncData(), updated_at: now } });
      cloud.remoteTs = Date.parse(now); cloud.dirty = false;
    }
    cloud.lastSync = new Date().toISOString(); cloud.status = "Up to date"; csave();
    await pullProfile().catch(() => { }); if (push) pushProfile().catch(() => { });
  } catch (e) { cloud.status = e.offline ? "Waiting for internet" : "Could not sync: " + e.message; }
  finally { syncing = false; paintCloud(); if (changed) route(); }
}
onSaved = () => { if (applying || !cloud.session) return; cloud.dirty = true; csave(); clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 4000); };
addEventListener("online", () => syncNow());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncNow(); });

const canUseAi = () => !CLOUD_ON || cloud.isTeacher;
const ago = iso => { if (!iso) return "Not yet"; const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000)); return s < 60 ? "Just now" : s < 3600 ? Math.round(s / 60) + " minutes ago" : s < 86400 ? Math.round(s / 3600) + " hours ago" : new Date(iso).toLocaleDateString(); };
function paintCloud() { const s = $("#cloudStatus"); if (s) { s.textContent = cloud.status || ""; const l = $("#cloudLast"); if (l) l.textContent = ago(cloud.lastSync); } }

function cloudPanel() {
  if (!CLOUD_ON) return "";
  return cloud.session
    ? `<section class="panel setting"><div><h3>Online account</h3><p class="muted">Signed in as ${esc(cloud.session.user.email)}. Your progress is saved online.</p></div><a class="btn outline" href="#/account">My account</a></section>`
    : `<section class="panel setting"><div><h3>Online account</h3><p class="muted">Sign in to keep your progress and results safe and use them on any phone.</p></div><a class="btn" href="#/account">Sign in</a></section>`;
}
function viewAccount(sub) {
  if (!CLOUD_ON) return show(`<div class="empty-state"><h3>Accounts are not set up</h3><p>This copy of the app works on this device only.</p></div>`, { title: "Account" });
  if (sub === "reset" && cloud.session) return show(`<header class="page-head"><h1>Choose a new password</h1></header><form class="panel narrow" data-cform="newpass" novalidate><div class="field"><label for="c-pass">New password</label><input id="c-pass" name="password" type="password" autocomplete="new-password" minlength="6" required></div><p class="form-error" role="alert" id="cError"></p><button class="btn" type="submit">Save password</button></form>`, { title: "New password", section: "settings" });
  if (!cloud.session) {
    const up = acctTab === "signup";
    return show(`<header class="page-head"><h1>${up ? "Create an account" : "Sign in"}</h1><p class="lead">An account keeps your progress${isTeacher() ? ", classes and results" : ""} safe online, so you can use them on any phone.</p></header>
      <form class="panel narrow" data-cform="${up ? "signup" : "signin"}" novalidate>
        <div class="seg" role="group" aria-label="Account"><button type="button" class="${!up ? "on" : ""}" data-act="acct-tab" data-v="signin" aria-pressed="${!up}">Sign in</button><button type="button" class="${up ? "on" : ""}" data-act="acct-tab" data-v="signup" aria-pressed="${up}">Create account</button></div>
        ${up ? `<div class="field"><label for="c-name">Full name</label><input id="c-name" name="name" autocomplete="name" value="${esc(db.profile ? db.profile.full_name : "")}" required></div>` : ""}
        <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" required></div>
        <div class="field"><label for="c-pass">Password</label><input id="c-pass" name="password" type="password" autocomplete="${up ? "new-password" : "current-password"}" minlength="6" required></div>
        <p class="form-error" role="alert" id="cError"></p>
        <div class="toolbar"><button class="btn" type="submit">${up ? "Create account" : "Sign in"}</button>${up ? "" : `<button class="btn outline" type="button" data-act="acct-forgot">Forgot password</button>`}</div>
        <p class="muted small-note">${up && db.profile ? "Your progress on this device will be saved to the new account. " : ""}You can also use the app without an account. Then your data stays only on this device. <a href="#/privacy">How your information is handled</a></p></form>`, { title: up ? "Create account" : "Sign in", section: "settings" });
  }
  const u = cloud.session.user, p = db.profile;
  const kind = cloud.isTeacher ? "Verified teacher" : p && p.role === "Teacher" ? "Teacher, waiting for approval" : "Student";
  show(`<header class="page-head"><h1>My account</h1></header>
    <section class="panel narrow"><dl class="kv"><div><dt>Email</dt><dd>${esc(u.email)}</dd></div><div><dt>Name</dt><dd>${esc((p && p.full_name) || u.name || "-")}</dd></div><div><dt>Account type</dt><dd>${kind}</dd></div><div><dt>Last saved online</dt><dd id="cloudLast">${ago(cloud.lastSync)}</dd></div><div><dt>Status</dt><dd id="cloudStatus" aria-live="polite">${esc(cloud.status || "")}</dd></div></dl>
      ${p ? "" : `<div class="notice">You have no profile on this device yet. <a href="#/register">Create your profile</a>.</div>`}
      ${p && p.role === "Teacher" && !cloud.isTeacher ? `<p class="muted small-note">Results work for every teacher profile. Gemini AI also needs the school to approve your account. Ask the administrator to approve ${esc(u.email)}.</p>` : ""}
      <div class="toolbar"><button class="btn" data-act="acct-sync">Save now</button><button class="btn outline" data-act="acct-out">Sign out</button></div></section>
    <section class="panel narrow"><h3>Shared phone?</h3><p class="muted">Sign out and remove your data from this device. It stays safe in your online account.</p><button class="btn outline" data-act="acct-out-clear">Sign out and clear this device</button></section>
    <section class="panel narrow"><h3>Delete my online data</h3><p class="muted">Removes everything saved online for this account: progress, bookmarks, classes and results. Data on this device stays. To delete the sign-in itself, email ${SUPPORT_EMAIL}.</p><button class="btn danger" data-act="acct-wipe">${icon("trash")} Delete my online data</button></section>`, { title: "My account", section: "settings" });
  syncNow();
}
document.addEventListener("submit", async e => {
  const f = e.target.closest("[data-cform]"); if (!f) return; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.cform, err = $("#cError"), btn = $("button[type=submit]", f), say = m => { err.textContent = m; };
  const email = String(fd.get("email") || "").trim(), password = String(fd.get("password") || ""), name = String(fd.get("name") || "").trim();
  say("");
  if (kind !== "newpass" && !/^\S+@\S+\.\S+$/.test(email)) return say("Enter a valid email address.");
  if (password.length < 6) return say("Use a password of at least 6 characters.");
  if (kind === "signup" && !name) return say("Enter your full name.");
  btn.disabled = true;
  try {
    if (kind === "signup") {
      const r = await cloudSignUp(email, password, name);
      if (r === "confirm") { acctTab = "signin"; wTab = "signin"; wMsg = "Check your email and tap the link to confirm. Then sign in here."; toast("Check your email to confirm your account."); return $("#welcome") ? wDraw() : route(); }
    } else if (kind === "signin") await cloudSignIn(email, password);
    else {
      await sb("/auth/v1/user", { method: "PUT", token: await cloudToken(), body: { password } }); toast("Password changed"); return go("#/account");
    }
    toast(kind === "signup" ? "Account created" : "Signed in");
    const fromWelcome = !!$("#welcome"); if (fromWelcome) { wClose(); wst.guest = false; wsave(); }
    await syncNow(); go(db.profile ? (fromWelcome ? "#/" : "#/account") : "#/register"); if (fromWelcome) route();
  } catch (er) { say(er.message); } finally { btn.disabled = false; }
});
document.addEventListener("click", async e => {
  const el = e.target.closest("[data-act]"); if (!el) return; const act = el.dataset.act;
  if (act === "acct-tab") { acctTab = el.dataset.v; route(); }
  else if (act === "acct-sync") { cloud.dirty = true; syncNow(); }
  else if (act === "acct-out") { await cloudOutFlow(false); }
  else if (act === "acct-out-clear") { if (confirm("Remove your data from this device and sign out? Make sure it has been saved online first.")) { cloud.dirty && navigator.onLine && await syncNow(); await cloudOutFlow(true); } }
  else if (act === "acct-wipe") { if (confirm("Delete everything saved online for this account? This cannot be undone.")) { try { await sb(`/rest/v1/iphs_app_state?user_id=eq.${cloud.session.user.id}`, { method: "DELETE", token: await cloudToken() }); cloud.remoteTs = 0; cloud.dirty = true; csave(); toast("Online data deleted"); } catch (er) { toast(er.message); } } }
  else if (act === "acct-forgot") {
    const email = String($("#c-email").value || "").trim(), err = $("#cError");
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Type your email above first."; return $("#c-email").focus(); }
    try { await cloudRecover(email); err.textContent = ""; toast("If that email has an account, a reset link is on its way."); } catch (er) { err.textContent = er.message; }
  }
});
async function cloudOutFlow(clear) {
  await cloudSignOut();
  if (clear) { applying = true; db = defaults(); save(); applying = false; navRole = null; toast("Signed out. This device is cleared."); go("#/"); } else { toast("Signed out"); go("#/"); }
  route();
}
async function handleAuthHash() {
  const h = location.hash; if (!/^#(access_token|error)=/.test(h)) return false;
  const q = new URLSearchParams(h.slice(1)); history.replaceState(null, "", location.pathname + location.search + "#/account");
  if (q.get("error")) { toast(cloudError({ error_description: q.get("error_description") || "" }, 400)); return true; }
  try {
    const user = await sb("/auth/v1/user", { token: q.get("access_token") });
    setSession({ access_token: q.get("access_token"), refresh_token: q.get("refresh_token"), expires_in: Number(q.get("expires_in")) || 3600, user });
    if (q.get("type") === "recovery") { location.hash = "#/account/reset"; } else { toast("Email confirmed. You are signed in."); syncNow(); }
  } catch (er) { toast(er.message); }
  return true;
}

/* ---------- first-run tour and sign-in screen ---------- */
const WKEY = "iphs.welcome.v1";
const wst = (() => { try { return JSON.parse(localStorage.getItem(WKEY)) || {}; } catch { return {}; } })();
const wsave = () => { try { localStorage.setItem(WKEY, JSON.stringify(wst)); } catch { } };
const ART = [
  `<svg viewBox="0 0 240 170" role="img" aria-label="Books on a shelf"><rect x="14" y="128" width="212" height="14" rx="3" fill="#a96a2f"/><rect x="14" y="140" width="212" height="6" rx="3" fill="#7d4d20"/><rect x="30" y="58" width="26" height="70" rx="3" fill="#1f5c3b"/><rect x="36" y="70" width="14" height="4" fill="#e3a72f"/><rect x="58" y="42" width="24" height="86" rx="3" fill="#e3a72f"/><rect x="63" y="56" width="14" height="4" fill="#12264a"/><rect x="84" y="66" width="28" height="62" rx="3" fill="#2f6fdc"/><rect x="90" y="78" width="16" height="4" fill="#fff"/><g transform="rotate(14 130 128)"><rect x="118" y="50" width="24" height="78" rx="3" fill="#a3283a"/><rect x="123" y="64" width="14" height="4" fill="#fff"/></g><rect x="156" y="52" width="26" height="76" rx="3" fill="#12264a"/><rect x="162" y="66" width="14" height="4" fill="#e3a72f"/><rect x="184" y="72" width="26" height="56" rx="3" fill="#5cc08c"/><path d="M120 28l5 10 11 1-8 8 2 11-10-6-10 6 2-11-8-8 11-1z" fill="#e3a72f"/></svg>`,
  `<svg viewBox="0 0 240 170" role="img" aria-label="Book that reads aloud"><path d="M40 52c26-8 52-6 80 8v82c-28-14-54-16-80-8z" fill="#fff" stroke="#12264a" stroke-width="4" stroke-linejoin="round"/><path d="M200 52c-26-8-52-6-80 8v82c28-14 54-16 80-8z" fill="#f1f5f2" stroke="#12264a" stroke-width="4" stroke-linejoin="round"/><g stroke="#1f5c3b" stroke-width="4" stroke-linecap="round"><path d="M58 76h42M58 92h42M58 108h30"/></g><g stroke="#8a98ad" stroke-width="4" stroke-linecap="round"><path d="M140 76h42M140 92h42M140 108h30"/></g><g fill="none" stroke="#e3a72f" stroke-width="6" stroke-linecap="round"><path d="M150 24c10 8 10 22 0 30"/><path d="M164 14c18 14 18 36 0 50"/></g><circle cx="132" cy="39" r="9" fill="#e3a72f"/><text x="44" y="44" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#12264a">Aa</text></svg>`,
  `<svg viewBox="0 0 240 170" role="img" aria-label="Quiz scores growing"><rect x="22" y="104" width="30" height="40" rx="4" fill="#5cc08c"/><rect x="62" y="82" width="30" height="62" rx="4" fill="#2f9a63"/><rect x="102" y="58" width="30" height="86" rx="4" fill="#1f5c3b"/><rect x="142" y="36" width="30" height="108" rx="4" fill="#12264a"/><path d="M16 144h168" stroke="#566478" stroke-width="3" stroke-linecap="round"/><path d="M157 12l5 10 11 1-8 8 2 11-10-6-10 6 2-11-8-8 11-1z" fill="#e3a72f"/><rect x="156" y="84" width="72" height="50" rx="12" fill="#e3a72f"/><path d="M168 134l-6 18 20-14z" fill="#e3a72f"/><text x="192" y="118" text-anchor="middle" font-family="Georgia,serif" font-size="32" font-weight="700" fill="#12264a">?</text></svg>`,
  `<svg viewBox="0 0 240 170" role="img" aria-label="Class results report"><rect x="50" y="14" width="140" height="146" rx="10" fill="#fff" stroke="#12264a" stroke-width="4"/><rect x="92" y="6" width="56" height="20" rx="6" fill="#12264a"/><g font-family="system-ui,sans-serif" font-size="12" font-weight="700"><rect x="64" y="40" width="112" height="22" rx="5" fill="#e1f3e8"/><circle cx="78" cy="51" r="8" fill="#e3a72f"/><text x="78" y="55" text-anchor="middle" fill="#12264a">1</text><rect x="92" y="47" width="48" height="8" rx="4" fill="#1f5c3b"/><text x="164" y="55" text-anchor="end" fill="#1f5c3b">A</text><rect x="64" y="68" width="112" height="22" rx="5" fill="#f1f5f2"/><circle cx="78" cy="79" r="8" fill="#c5cfdb"/><text x="78" y="83" text-anchor="middle" fill="#12264a">2</text><rect x="92" y="75" width="38" height="8" rx="4" fill="#2f9a63"/><text x="164" y="83" text-anchor="end" fill="#2f9a63">B</text><rect x="64" y="96" width="112" height="22" rx="5" fill="#f1f5f2"/><circle cx="78" cy="107" r="8" fill="#d9a066"/><text x="78" y="111" text-anchor="middle" fill="#12264a">3</text><rect x="92" y="103" width="28" height="8" rx="4" fill="#5cc08c"/><text x="164" y="111" text-anchor="end" fill="#566478">C</text></g><rect x="64" y="128" width="112" height="22" rx="11" fill="#a3283a"/><text x="120" y="143" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" font-weight="800" fill="#fff">PDF report</text></svg>`
];
const SLIDES = [
  ["Your school library, in your pocket", "Read the books for every class, even when there is no internet."],
  ["Listen and look up words", "Tap read aloud to hear a chapter. Tap any word to see what it means."],
  ["Ask, practise and see progress", "Ask the library a question, take quizzes and watch your scores grow."],
  ["Built for teachers too", "Enrol learners, enter marks, see class positions and print PDF reports that say what each learner should focus on."]
];
let wStep = 0, wTab = "signin", wMsg = "";
function wClose() { const w = $("#welcome"); if (w) w.remove(); document.body.classList.remove("noscroll"); }
function wDraw() {
  let w = $("#welcome"); if (!w) { w = document.createElement("div"); w.id = "welcome"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-label", "Welcome"); document.body.appendChild(w); document.body.classList.add("noscroll"); }
  if (wStep < SLIDES.length) {
    const [t, d] = SLIDES[wStep], last = wStep === SLIDES.length - 1;
    w.innerHTML = `<div class="w-top"><span class="w-brand"><b>IPHS</b> School Library</span><button class="w-skip" data-w="skip-tour">Skip</button></div>
      <div class="w-art" data-w="swipe">${ART[wStep]}</div>
      <div class="w-card"><div class="w-dots" aria-hidden="true">${SLIDES.map((_, i) => `<i class="${i === wStep ? "on" : ""}"></i>`).join("")}</div>
      <h1 class="w-h">${t}</h1><p class="w-p">${d}</p><p class="w-count">Screen ${wStep + 1} of ${SLIDES.length}</p>
      <div class="w-btns">${wStep ? `<button class="btn outline" data-w="back">Back</button>` : ""}<button class="btn w-main" data-w="next">${last ? (CLOUD_ON ? "Continue" : "Start reading") : "Next"}</button></div></div>`;
  } else {
    const up = wTab === "signup";
    w.innerHTML = `<div class="w-hero"><span class="w-brand"><b>IPHS</b> School Library</span><svg viewBox="0 0 240 70" aria-hidden="true"><path d="M0 40c40-26 80 22 120-2s80-20 120 4v28H0z" fill="var(--bg)"/><circle cx="196" cy="22" r="9" fill="#e3a72f"/></svg></div>
      <form class="w-auth" data-cform="${up ? "signup" : "signin"}" novalidate>
        <h1 class="w-h">${up ? "Create your account" : "Welcome back"}</h1>
        <p class="w-p">${up ? "Save your progress online and use it on any phone." : "Sign in to open your progress. Teachers get results, classes and reports."}</p>
        <div class="seg" role="group" aria-label="Account"><button type="button" class="${!up ? "on" : ""}" data-w="tab" data-v="signin" aria-pressed="${!up}">Sign in</button><button type="button" class="${up ? "on" : ""}" data-w="tab" data-v="signup" aria-pressed="${up}">Create account</button></div>
        ${up ? `<div class="field"><label for="c-name">Full name</label><input id="c-name" name="name" autocomplete="name" required></div>` : ""}
        <div class="field"><label for="c-email">Email address</label><input id="c-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" placeholder="name@example.com" required></div>
        <div class="field"><label for="c-pass">Password</label><input id="c-pass" name="password" type="password" autocomplete="${up ? "new-password" : "current-password"}" minlength="6" placeholder="At least 6 characters" required></div>
        <p class="form-error" role="alert" id="cError">${esc(wMsg)}</p>
        <button class="btn w-main" type="submit">${up ? "Create account" : "Sign in"}</button>
        ${up ? "" : `<button class="w-link" type="button" data-act="acct-forgot">Forgot password?</button>`}
        <button class="w-link" type="button" data-w="guest">Continue without an account</button>
      </form>`;
    wMsg = "";
  }
}
function maybeWelcome() {
  if (location.hash.startsWith("#/account/reset")) return;
  const needTour = !wst.tour, needAuth = CLOUD_ON && !cloud.session && !wst.guest;
  if (!needTour && !needAuth) return;
  wStep = needTour ? 0 : SLIDES.length; wDraw();
}
function wFinishTour() { wst.tour = true; wsave(); if (CLOUD_ON && !cloud.session && !wst.guest) { wStep = SLIDES.length; wDraw(); } else wClose(); }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-w]"); if (!b || !$("#welcome")) return; const a = b.dataset.w;
  if (a === "next") { wStep < SLIDES.length - 1 ? (wStep++, wDraw()) : wFinishTour(); }
  else if (a === "back") { wStep--; wDraw(); }
  else if (a === "skip-tour") wFinishTour();
  else if (a === "tab") { wTab = b.dataset.v; wDraw(); }
  else if (a === "guest") { wst.guest = true; wsave(); wClose(); }
});
(() => { let x0 = null; const w = () => $("#welcome");
  document.addEventListener("touchstart", e => { x0 = w() && wStep < SLIDES.length ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) < 60) return; if (dx < 0) { wStep < SLIDES.length - 1 ? (wStep++, wDraw()) : wFinishTour(); } else if (wStep > 0) { wStep--; wDraw(); } }, { passive: true }); })();

/* ---------- router ---------- */
function route() {
  closeDrawer();
  cleanups.forEach(fn => { try { fn(); } catch { } }); cleanups = [];
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [a, b, c, d] = parts;
  scrollTo(0, 0);
  setTimeout(refreshInstall, 0);
  try {
    switch (a) {
      case undefined: case "home": return viewHome();
      case "register": return viewRegister();
      case "profile": return viewProfile();
      case "library": return b ? (d ? viewSubject(b, Number(c), d) : viewLibrary(b, Number(c))) : viewLibrary();
      case "book": return viewBook(b);
      case "search": return viewSearch(b || "");
      case "progress": return viewProgress();
      case "settings": return viewSettings();
      case "account": return viewAccount(b);
      case "results": return viewResults(parts.slice(1));
      case "about": return viewAbout();
      case "support": return viewSupport();
      case "license": return viewLicense();
      case "privacy": return viewPrivacy();
      case "ask": return viewAsk();
      case "quiz": return viewQuiz(b, Number(c), d);
      default: return show(`<div class="empty-state"><h3>Page not found</h3><p>That page does not exist.</p><a class="btn" href="#/">Go home</a></div>`, { title: "Not found" });
    }
  } catch (e) {
    console.error(e);
    show(`<div class="empty-state"><h3>Something went wrong</h3><p>${esc(e.message)}</p><a class="btn" href="#/">Go home</a></div>`, { title: "Error" });
  }
}

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const act = el.dataset.act, id = Number(el.dataset.id);
  if (act === "fav" || act === "fav-reader") {
    if (!bookById(id)) return;
    if (db.favorites[id]) { delete db.favorites[id]; toast("Removed from favourites"); } else { db.favorites[id] = nowISO(); toast("Added to favourites"); }
    save();
    if (act === "fav") { const on = !!db.favorites[id]; el.classList.toggle("on", on); el.setAttribute("aria-pressed", on); el.setAttribute("aria-label", on ? "Remove from favourites" : "Add to favourites"); }
    else window.__readerRefresh?.();
  } else if (act === "bookmark") {
    if (db.bookmarks[id]) { delete db.bookmarks[id]; toast("Bookmark removed"); } else { db.bookmarks[id] = nowISO(); toast("Book bookmarked"); }
    save(); window.__readerRefresh?.();
  } else if (act === "done") {
    if (db.done[id]) { delete db.done[id]; toast("Marked as not read"); } else { db.done[id] = nowISO(); toast("Book marked as read"); }
    save(); window.__readerRefresh?.();
  } else if (act === "guide-view") {
    db.guideView = el.dataset.v; save(); const w = $("#guideWrap");
    if (w) { $("#guide").innerHTML = guideHtml(w.dataset.level, Number(w.dataset.grade), db.guideView); $$(".subj-hint").forEach(p => { p.textContent = p.dataset[db.guideView] || ""; }); $$("[data-act=guide-view]", w).forEach(b => { const on = b.dataset.v === db.guideView; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); }
  } else if (act === "install") installApp();
  else if (act === "ai-via" && isTeacher()) { db.settings.aiVia = el.dataset.v; db.settings.apiUrl = ""; db.settings.apiModel = ""; session.apiKey = ""; save(); viewSettings(); }
  else if (act === "ai-test" && isTeacher()) testAi(el);
  else if (act === "install-dismiss") { barDismissed = true; try { sessionStorage.setItem("iphs.installBar", "1"); } catch { } refreshInstall(); }
  else if (act === "libview") { db.settings.libView = el.dataset.v; save(); route(); }
  else if (act === "tts-open") ttsOpen();
  else if (act === "tts-toggle") tts.playing ? ttsPause() : ttsPlayFrom(tts.i);
  else if (act === "tts-prev") ttsStep(-1);
  else if (act === "tts-next") ttsStep(1);
  else if (act === "tts-close") ttsClose();
  else if (act === "say") sayWord(el.dataset.word, el.dataset.src);
  else if (act === "dict-close") closeDictSheet();
  else if (act === "theme") setTheme(el.dataset.v), viewSettings();
  else if (act === "mode") { db.settings.mode = el.dataset.v; save(); viewSettings(); }
  else if (act === "suggest") { ask(el.dataset.q); }
  else if (act === "answer") answerQuiz(el.dataset.k);
  else if (act === "quiz-next") nextQuiz();
  else if (act === "quiz-again") { const z = session.quiz; viewQuiz(z.level, z.grade, z.c); }
  else if (act === "reset") {
    if (confirm("Delete your profile, bookmarks, reading progress, quiz scores, classes and learner results from this device? This cannot be undone.")) {
      try { localStorage.removeItem(KEY); } catch { } const theme = db.settings.theme; db = defaults(); db.settings.theme = theme; save(); session.chat = []; renderChrome(""); toast("Your data was deleted"); go("#/");
    }
  }
});
document.addEventListener("click", e => { const sh = $("#dictSheet"); if (sh && !sh.hidden && (e.target === sh || e.target.closest("#dictSheetBody a"))) closeDictSheet(); });
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-form]"); if (!f) return; e.preventDefault();
  const fd = new FormData(f), kind = f.dataset.form;
  if (kind === "search") go(`#/search/${encodeURIComponent(String(fd.get("q") || "").trim())}`);
  else if (kind === "ask") { const t = $("#question"); const q = t.value; t.value = ""; ask(q); }
  else if (kind === "ai") {
    if (!isTeacher()) return;
    const key = String(fd.get("key") || "").trim();
    db.settings.apiUrl = String(fd.get("url") || "").trim(); db.settings.apiModel = String(fd.get("model") || "").trim(); session.apiKey = key;
    db.settings.proxyCode = aiVia() === "proxy" && fd.get("remember") ? key : "";
    save(); toast("AI settings saved");
  } else if (kind === "register") {
    const name = String(fd.get("name") || "").trim(), age = Number(fd.get("age")), gender = fd.get("gender"), err = $("#formError");
    if (!name) { err.textContent = "Enter your full name."; return $("#f-name").focus(); }
    if (!Number.isInteger(age) || age < 1 || age > 99) { err.textContent = "Enter your age as a whole number from 1 to 99."; return $("#f-age").focus(); }
    if (!gender) { err.textContent = "Choose a gender."; return; }
    const prev = db.profile || {};
    db.profile = { full_name: name, role: fd.get("role"), sector: fd.get("sector"), age, gender, created: prev.created || nowISO() }; save();
    toast(prev.created ? "Profile updated" : "Profile created. Welcome!"); go(prev.created ? "#/profile" : "#/");
  }
});
document.addEventListener("change", e => {
  if (e.target.id === "ttsRate") { db.settings.ttsRate = Number(e.target.value); save(); if (tts.playing) ttsPlayFrom(tts.i); }
  else if (e.target.id === "ttsVoice") { db.settings.ttsVoice = e.target.value; save(); if (tts.playing) ttsPlayFrom(tts.i); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDictSheet(); if (e.key === "Enter" && !e.shiftKey && e.target.id === "question") { e.preventDefault(); e.target.form.requestSubmit(); } });

/* ---------- install to home screen ---------- */
let deferredInstall = null;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const canInstallHere = /^https?:$/.test(location.protocol);
function installInner() {
  if (isStandalone()) return `<div class="setting nopad"><div><h3>Install app</h3><p class="muted">You are using the installed app.</p></div></div>`;
  if (!canInstallHere) return `<div class="setting nopad"><div><h3>Install app</h3><p class="muted">To add this library to your home screen, the files must be opened from a web address (https). Upload this folder to a web host, then open the link on your phone.</p></div></div>`;
  if (deferredInstall) return `<div class="setting nopad"><div><h3>Install app</h3><p class="muted">Add IPHS School Library to your home screen. It opens full screen and works without internet.</p></div><button class="btn" data-act="install">${icon("download")}Install app</button></div>`;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="setting nopad"><div><h3>Install app</h3><p class="muted">${ios ? "In Safari, tap the Share button, then choose Add to Home Screen." : "Open your browser menu and choose Install app or Add to Home screen."}</p></div></div>`;
}
const iosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
let barDismissed = false; try { barDismissed = sessionStorage.getItem("iphs.installBar") === "1"; } catch { }
let promptWaited = false; setTimeout(() => { promptWaited = true; refreshInstall(); }, 3500);
function installBarHtml() {
  if (isStandalone() || barDismissed || !canInstallHere) return "";
  const close = `<button class="icon-btn on-dark" data-act="install-dismiss" aria-label="Hide this message">${icon("close")}</button>`;
  if (deferredInstall) return `<div class="ib-text"><strong>Install IPHS School Library</strong><span>Add it to your home screen and app menu. It opens full screen and works without internet.</span></div><button class="btn gold" data-act="install">${icon("download")}Install</button>${close}`;
  if (iosDevice) return `<div class="ib-text"><strong>Install IPHS School Library</strong><span>In Safari, tap the Share button, then Add to Home Screen.</span></div>${close}`;
  if (promptWaited) return `<div class="ib-text"><strong>Install IPHS School Library</strong><span>Open your browser menu and choose Install app or Add to Home screen.</span></div>${close}`;
  return "";
}
function refreshInstall() {
  const a = $("#installSlot"); if (a) a.innerHTML = installInner();
  const h = $("#installHome"); if (h) h.innerHTML = "";
  const b = $("#installBar"); if (b) { const t = installBarHtml(); b.innerHTML = t; b.hidden = !t; }
}
async function installApp() {
  if (!deferredInstall) return;
  deferredInstall.prompt(); const r = await deferredInstall.userChoice.catch(() => ({})); deferredInstall = null; refreshInstall();
  if (r.outcome === "accepted") toast("Installing the app");
}
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredInstall = e; refreshInstall(); });
addEventListener("appinstalled", () => { deferredInstall = null; refreshInstall(); toast("App installed"); });
if ("serviceWorker" in navigator && canInstallHere) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));


/* ---------- menu drawer ---------- */
function drawerHtml() {
  const h = location.hash.replace(/^#/, "") || "/", on = p => (p === "/" ? h === "/" || h === "" : h === p || h.startsWith(p + "/")) ? ' class="active" aria-current="page"' : "";
  const link = (p, label, ic, sub) => `<a href="#${p}"${on(p)}>${icon(ic)}<span>${label}</span></a>`;
  let out = `<div class="dr-group"><h4>Library</h4>${link("/", "Home", "home")}${link("/library", "Library", "book")}${link("/search", "Search and dictionary", "search")}${link("/ask", "Ask AI", "spark")}${link("/progress", "My progress", "chart")}</div>`;
  if (isTeacher()) {
    out += `<div class="dr-group"><h4>Teacher tools</h4>${link("/results", "All classes", "clip")}${db.classes.map(c => `<a class="sub" href="#/results/c/${c.id}"${on("/results/c/" + c.id)}><span>${esc(c.name)}</span><small>${c.learners.length}</small></a>`).join("")}${link("/results/new", "Add a class", "plus")}</div>`;
  }
  out += `<div class="dr-group"><h4>Account</h4>${link("/profile", db.profile ? "My profile" : "Create profile", "users")}${CLOUD_ON ? link("/account", cloud.session ? "My account" : "Sign in", "users") : ""}${link("/settings", "Settings", "gear")}</div><div class="dr-group"><h4>About</h4>${link("/about", "About the app", "book")}${link("/support", "Support and suggestions", "spark")}${link("/license", "Licence", "clip")}${link("/privacy", "Privacy", "lock")}</div>`;
  return out;
}
function openDrawer() { $("#drawerNav").innerHTML = drawerHtml(); $("#drawer").hidden = false; $("#drawerScrim").hidden = false; $("#menuBtn").setAttribute("aria-expanded", "true"); document.body.classList.add("noscroll"); $("#drawerClose").focus(); }
function closeDrawer() { const d = $("#drawer"); if (!d || d.hidden) return; d.hidden = true; $("#drawerScrim").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); document.body.classList.remove("noscroll"); }
$("#menuBtn").innerHTML = icon("menu"); $("#drawerClose").innerHTML = icon("close");
$("#menuBtn").addEventListener("click", () => $("#drawer").hidden ? openDrawer() : closeDrawer());
$("#drawerClose").addEventListener("click", () => { closeDrawer(); $("#menuBtn").focus(); });
$("#drawerScrim").addEventListener("click", closeDrawer);
$("#drawerNav").addEventListener("click", e => { if (e.target.closest("a")) closeDrawer(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#drawer").hidden) { closeDrawer(); $("#menuBtn").focus(); } });

/* ---------- fixed scale: no pinch, double-tap or keyboard zoom ---------- */
["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, e => e.preventDefault()));
document.addEventListener("touchmove", e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener("wheel", e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "_", "0"].includes(e.key)) e.preventDefault(); });
let lastTouchEnd = 0;
document.addEventListener("touchend", e => { const n = Date.now(); if (n - lastTouchEnd < 320 && !e.target.closest("input,textarea,select")) e.preventDefault(); lastTouchEnd = n; }, { passive: false });
function fitScreen() { document.documentElement.style.setProperty("--vh", innerHeight * 0.01 + "px"); }
fitScreen(); addEventListener("resize", fitScreen); addEventListener("orientationchange", fitScreen);

/* ---------- start ---------- */
buildNav(); applyTheme();
(CLOUD_ON ? handleAuthHash() : Promise.resolve(false)).then(() => { if (cloud.session) { syncNow(); wClose(); } maybeWelcome(); });
$("#themeBtn").addEventListener("click", () => setTheme(currentTheme() === "dark" ? "light" : "dark"));
addEventListener("hashchange", route);
route();
})();
