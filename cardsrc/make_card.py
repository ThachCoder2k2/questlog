"""Builds the live card.html: base.html (the card as it was) + Today | Week | Study (v4.css, v4.js) + the themes
(themes.js, theme_lcd.css, theme_cal.css). Nothing personal is built in: the learning roads (learn.json) and your progress
(study.json) are read by the app at run time and passed in as QL_ENV.learn / QL_ENV.study.

  python3 cardsrc/make_card.py            # writes ../card.html
  python3 cardsrc/make_card.py --out X    # writes X instead (for a test)
"""
import json
import pathlib

import sys
HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "base.html"
OUT = pathlib.Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE.parent / "card.html"
html = SRC.read_text()


def patch(old, new, where="replace"):
    global html
    n = html.count(old)
    assert n == 1, f"anchor found {n}x: {old[:70]!r}"
    html = html.replace(old, new if where == "replace" else (new + old if where == "before" else old + new))


# ================================================================ CSS
CSS = (HERE / "v4.css").read_text()
patch("  @media (prefers-reduced-motion: reduce) {", CSS, "before")

# ================================================================ glyphs
GLYPHS = r'''  Object.assign(G, {
    work: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2" y="5" width="12" height="8.5" rx="1.5"/><path d="M6 5V3.4h4V5M2 8.8h12"/></svg>',
    me:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="5.2" r="2.6"/><path d="M3 14c.6-2.8 2.6-4.3 5-4.3s4.4 1.5 5 4.3"/></svg>',
    learn:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M8 4.2C6.6 3 4.6 2.6 2 2.8v9.6c2.6-.2 4.6.2 6 1.4 1.4-1.2 3.4-1.6 6-1.4V2.8c-2.6-.2-4.6.2-6 1.4z"/><path d="M8 4.2v9.6"/></svg>',
    flag: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 14.5V2"/><path d="M3.5 2.5h9l-2 3 2 3h-9" fill="currentColor" fill-opacity=".25"/></svg>',
    lock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3.2" y="7" width="9.6" height="7" rx="1.6"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/><circle cx="8" cy="10.5" r=".9" fill="currentColor" stroke="none"/></svg>',
    clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.6"/></svg>',
    play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.2v9.6L12.6 8z"/></svg>',
    cal:  '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="22" height="20" rx="3"/><path d="M5 13h22M11 4v6M21 4v6"/><path d="M11.5 20l3 3 6-6"/></svg>',
    book: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M16 8.5C13.2 6.2 9.3 5.4 4 5.8v19c5.3-.4 9.2.4 12 2.7 2.8-2.3 6.7-3.1 12-2.7v-19c-5.3-.4-9.2.4-12 2.7z"/><path d="M16 8.5v19"/><path d="M19.5 12.5h5M19.5 16.5h5"/></svg>'
  });
'''
patch("  const U = (n) => ", GLYPHS, "before")

# ================================================================ data: real week 47 + learning tracks
REAL = r'''
  /* ---------- live data: the learning roads (learn.json) and your progress (study.json) are passed in by the app ---------- */
  const ENV0 = window.QL_ENV || {};
  const LEARN = (ENV0.learn && Array.isArray(ENV0.learn.tracks)) ? ENV0.learn : { tracks: [] };
  const HAS_LEARN = LEARN.tracks.length > 0;
  const DEMO = null, DEMO_STATE = null;
  const isoDay = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const STUDY_TODAY = isoDay(new Date());
  /* which road's lesson belongs to a day. One thread at a time: learn.json "active" lists the roads that run (else the ones marked focus),
     "days" the weekdays that have a lesson (else every day); a "rhythm" entry may still pick the road for a weekday. Several active roads take turns. */
  const QLP = (() => {
    const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const roads = (LEARN.tracks || []).filter(t => (t.kind || "road") === "road");
    const act = Array.isArray(LEARN.active) && LEARN.active.length ? roads.filter(t => LEARN.active.includes(t.id)) : roads.filter(t => t.status === "focus");
    const days = Array.isArray(LEARN.days) ? LEARN.days : null;
    const dayOf = (iso) => { const p = iso.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
    return {
      active: act.map(t => t.id),
      isActive: (id) => act.some(t => t.id === id),
      roadFor: (iso) => {   // the road for this day, or null on a day without a lesson
        const d = dayOf(iso), dn = DN[d.getDay()];
        if (days && !days.includes(dn)) return null;
        const raw = (LEARN.rhythm || {})[dn];
        if (Array.isArray(raw) && !raw.length) return null;
        const ids = (raw || []).filter(id => act.some(t => t.id === id));
        if (ids.length) return ids[0];
        return act.length ? act[Math.floor(d.getTime() / 864e5) % act.length].id : null;
      } };
  })();
  /* a new day: last night's pins become today's locked lessons (only when they were pinned yesterday); yesterday's open lessons are let go */
  const STUDY0 = (() => {
    const s = ENV0.study && typeof ENV0.study === "object" ? JSON.parse(JSON.stringify(ENV0.study)) : null;
    if (!s) return null;
    s.pins = Array.isArray(s.pins) ? s.pins : []; s.todays = Array.isArray(s.todays) ? s.todays : [];
    if (s.day !== STUDY_TODAY) {   // a new day: what was pinned (whenever it was pinned) is today's lesson; yesterday's open lessons are let go (the road never moved past them)
      s.todays = s.pins.map(p => { const q = Object.assign({}, p, { done: false, light: false }); delete q.line; return q; });
      s.pins = []; s.day = STUDY_TODAY;
    }
    const kind0 = (window.QL_DATA || {}).kind;
    if (!s.todays.length && (kind0 === "morning" || kind0 === "midday")) {   // nothing pinned: today's lesson comes by itself, the next one on the road that belongs to today
      const id = QLP.roadFor(STUDY_TODAY), t = id && (LEARN.tracks || []).find(x => x.id === id), p = t && (s.pos || {})[id] || [0, 0];
      const ms = t && (t.milestones || [])[p[0]];
      if (ms && p[1] <= (ms.sessions || []).length) s.todays.push({ t: id, m: p[0], s: p[1], done: false, light: false });
    }
    return s;
  })();
  /* today's locked lessons and Recall sit on top of the Today list as local rows: Done never writes them to Notion */
  (() => {
    const data = window.QL_DATA;
    if (!HAS_LEARN || !STUDY0 || !data || !Array.isArray(data.sections) || !data.sections.length || !["morning", "midday", "evening"].includes(data.kind)) return;
    const items = data.sections[0].items = data.sections[0].items || [];
    const track = (id) => LEARN.tracks.find(t => t.id === id);
    const lessonOf = (t, m, s) => {
      const ms = (t.milestones || [])[m]; if (!ms) return {};
      const raw = (ms.sessions || [])[s];
      if (raw === undefined) return { title: "Boss · " + ms.name };   // the boss v4.js adds at the end of a milestone
      return typeof raw === "number" ? ((t.sessions || [])[raw - 1] || {}) : raw;
    };
    const add = [];
    STUDY0.todays.forEach(x => { const t = track(x.t); if (!t) return; const s0 = lessonOf(t, x.m, x.s);
      add.push({ type: "main", lesson: true, lessonTrack: t.id, localId: "local:lesson-" + t.id, title: "Study · " + t.short + ": " + (s0.title || ""), date: STUDY_TODAY,
        questline: t.name, energy: "🐸 Mobs", start: s0.min || "", status: x.done ? "✅ Cleared" : "📜 To Do", tags: ["🔒 can't skip"] }); });
    const due = (STUDY0.cards || []).filter(c => !c.parked && c.due <= STUDY_TODAY).length;
    if (due) add.unshift({ type: "main", lesson: true, recall: true, localId: "local:recall", title: "Study · Recall: " + Math.min(due, LEARN.recall_cap || 20) + (Math.min(due, LEARN.recall_cap || 20) === 1 ? " card" : " cards"), date: STUDY_TODAY,
      questline: "Study", energy: "🐸 Mobs", start: "Answer the first card in your head", status: "📜 To Do", tags: ["🔒 can't skip"] });
    items.unshift(...add);
  })();

'''
patch("  const params = new URLSearchParams(location.search);", REAL, "before")
patch('  const urgent = kind === "urgent";   // a deadline alert: compact only, with Start / Done / Snooze\n',
      '  const WEEK = urgent ? null : (D.week || null);   // the Week tab\'s data (prototype)\n', "after")

# ================================================================ tab bar: Today | Week | Learning
OLD_TABS = '''  const tabs = el("div", "tabs");
  [["morning", "Morning"], ["midday", "Midday"], ["evening", "Evening"], ["weekly", "Weekly"]].forEach(([k, label]) => {
    const t = el("span", "tab" + (k === kind ? " on" : ""));
    if (k === kind) { t.appendChild(el("span", "key", "L")); t.appendChild(el("span", null, label)); t.appendChild(el("span", "key", "R")); }
    else t.textContent = label;
    tabs.appendChild(t);
  });
  cardEl.insertBefore(tabs, hd);
'''
NEW_TABS = '''  // Three tabs, stepped with Q / E (the game's L / R): Today = this report's quests, Week = goals per area, Learning = tomorrow's lesson.
  const tabs = el("div", "tabs");
  const tabEls = {};
  const keyQ = el("span", "key", "Q"); keyQ.title = "Previous tab (Q)"; tabs.appendChild(keyQ);
  [["today", "Today"], ["week", "Week"], ["learn", "Study"]].forEach(([k, label]) => {
    const t = el("span", "tab" + (k === "today" ? " on" : ""));
    t.dataset.tab = k; t.appendChild(el("span", null, label));
    tabs.appendChild(t); tabEls[k] = t;
  });
  const keyE = el("span", "key", "E"); keyE.title = "Next tab (E)"; tabs.appendChild(keyE);
  if (!WEEK) tabEls.week.hidden = true;   // the Week tab waits for week goals in the card's data (D.week)
  if (!HAS_LEARN) tabEls.learn.hidden = true;
  if (!WEEK && !HAS_LEARN) { keyQ.hidden = true; keyE.hidden = true; }
  cardEl.insertBefore(tabs, hd);
'''
patch(OLD_TABS, NEW_TABS)

# ================================================================ early hooks (before the rows are built)
EARLY = r'''  /* ---------- tab hooks: set up before the rows, so a quest row can show its week goal ---------- */
  let tab = "today", gOpen = false;
  let weekKey = () => false, weekButtons = () => {}, weekLayout = () => {}, weekGoalSection = () => {}, lessonDone = () => false;
  const goalIdx = {};   // quest page id -> its week goal
  if (WEEK) (WEEK.goals || []).forEach(g => (g.quests || []).forEach(q => { const id = pageId(q); if (id) goalIdx[id] = g; }));
  const goalOf = (it) => goalIdx[pageId(it)] || null;
  const goalChip = (g) => { const s = el("span", "wgc"); s.innerHTML = G.goal; s.appendChild(put(el("span"), g.short || g.title)); s.title = "Week goal: " + g.title; return s; };

'''
patch("  const rows = [];   // {it, el, mk, id, sec, orig: {status, date}, now: {status, date}, done, sync}", EARLY, "before")
patch("    if (!day && !tags.length && !tracking) { if (tg) tg.remove(); return; }",
      "    const wg = goalOf(it);\n    if (!day && !tags.length && !tracking && !wg) { if (tg) tg.remove(); return; }")
patch('    if (tracking) tg.appendChild(el("span", "live", "tracking"));', '\n    if (wg) tg.appendChild(goalChip(wg));', "after")
patch('      if (type !== "side") { q.appendChild(el("span", "qtag " + type, type === "main" ? "Main" : "Fun")); q.classList.add("has-tag"); }',
      '      if (type !== "side") { q.appendChild(el("span", "qtag " + (it.lesson ? "learn" : type), it.lesson ? (it.recall ? "Recall" : "Learn") : type === "main" ? "Main" : "Fun")); q.classList.add("has-tag"); }')
patch('     .filter(c => c.key !== "week" || monday !== tomorrow);',
      '     .filter(c => c.key !== "week" || monday !== tomorrow)\n     .filter(c => !(r.it.lesson && (c.key === "move" || c.key === "week")));   // a locked lesson can\'t be delayed')
patch('    if (it.goal) { const s = section(G.goal, "Questline goal");', "    weekGoalSection(r);\n", "before")
patch("    if (urgent) { doneRow(r); return; }\n    apply(r, doneTarget(r));",
      "    if (urgent) { doneRow(r); return; }\n    if (!r.done && r.it.lesson && lessonDone(r)) return;   // a lesson is done by writing what was learned\n    apply(r, doneTarget(r));")
patch('    else { apply(r, m.c.target); if (m.c.warn) toast("Past its deadline: due " + dayLabel(dueDay(r))); }',
      '    else if (m.c.key === "done" && r.it.lesson && lessonDone(r)) return;\n    else { apply(r, m.c.target); if (m.c.warn) toast("Past its deadline: due " + dayLabel(dueDay(r))); }')
patch('    setLabel(kClose, m || (d && !full) ? "Back" : "Close");\n  }',
      '    setLabel(kClose, m || (d && !full) ? "Back" : "Close");\n    weekButtons();\n  }')
patch('    if (notify) { post({ action: "layout", mode: on ? "full" : "compact" }); sfx(on ? "select" : "cancel", 0); }', "    weekLayout(on);\n", "before")
patch("    if (detailRow) positionDetail();", "    if (detailRow || gOpen) positionDetail();")
patch("    if (e.metaKey || e.ctrlKey || e.altKey) return;\n    const k = e.key;",
      "    if (e.metaKey || e.ctrlKey || e.altKey) return;\n    if (weekKey(e)) return;\n    const k = e.key;")
patch("Esc closes (the menu first). Drag the header to move. All UI text is English.",
      "Esc closes (the menu first). Q / E step through the Today, Week and Study tabs. Drag the header to move. All UI text is English.")

RESTORE = r'''  /* ----- your progress (study.json, passed in by the app): road positions, pins, today's lessons, Recall cards, history ----- */
  if (STUDY0) {
    const tix = (id) => ST.findIndex(t => t.id === id);
    ST.forEach(t => { const p = (STUDY0.pos || {})[t.id]; if (Array.isArray(p)) { t.pos.m = Math.max(0, Math.min(p[0] | 0, t.milestones.length)); t.pos.s = Math.max(0, p[1] | 0); } });
    const back = (x) => { const ti = tix(x.t); if (ti < 0) return null; const y = Object.assign({}, x, { track: ti }); delete y.t; return y; };
    SS.pins = (STUDY0.pins || []).map(back).filter(Boolean);
    SS.todays = (STUDY0.todays || []).map(back).filter(Boolean);
    SS.cards = (STUDY0.cards || []).map(back).filter(Boolean);
    SS.logs = (STUDY0.logs || []).map(l => { const y = Object.assign({}, l, { track: tix(l.t) }); delete y.t; return y; });
    SS.recallDays = Array.isArray(STUDY0.recallDays) ? STUDY0.recallDays : [];
    if (SS.todays.length) SS.sel = SS.todays[0].track;
  }
'''
SAVE = r'''
  /* ----- save your progress after every key or click: the app writes study.json ----- */
  {
    let last = "";
    const ref = (x) => { const y = Object.assign({}, x, { t: ST[x.track] ? ST[x.track].id : null }); delete y.track; return y; };
    const snap = () => ({ v: 1, day: wToday, pos: Object.fromEntries(ST.map(t => [t.id, [t.pos.m, t.pos.s]])),
      pins: SS.pins.map(ref), todays: SS.todays.map(ref), cards: SS.cards.map(ref), logs: SS.logs.map(ref), recallDays: SS.recallDays });
    const save = () => {
      if (!HAS_LEARN || !window.QL_DATA) return;   // the preview never writes
      let j; try { j = JSON.stringify(snap()); } catch (e) { return; }
      if (j === last) return; last = j; post({ action: "study", state: JSON.parse(j) });
    };
    ["keydown", "click"].forEach(ev => document.addEventListener(ev, () => setTimeout(save, 0), true));
    setTimeout(save, 0);   // a new day's roll-over is saved at once
  }
'''
V4 = (HERE / "v4.js").read_text()
assert V4.count("  const riskOf = (c) => fR(") == 1
V4 = V4.replace("  const riskOf = (c) => fR(", RESTORE + "  const riskOf = (c) => fR(")
V4 = V4.replace('let cur = params.get("theme") || load() || "tablet"', 'let cur = params.get("theme") || (window.QL_ENV || {}).theme || load() || "tablet"')
import make_themes
ONLY = set(sys.argv[sys.argv.index("--themes") + 1].split(",")) if "--themes" in sys.argv else None   # --themes board: build just that new world (with the core ones)
LATE = V4 + (HERE / "themes.js").read_text() + make_themes.theme_js(HERE, ONLY) + SAVE
patch("  // first selection: the first unfinished Main quest, like the game's cursor on the next objective", LATE, "before")
patch("  if (full) setFull(true, false);\n",
      '  { const t0 = params.get("tab") || D.tab || (kind === "evening" && HAS_LEARN && !(STUDY0 && STUDY0.pins.length) ? "learn" : ""); if ((t0 === "week" && WEEK) || (t0 === "learn" && HAS_LEARN)) setTab(t0, false); }   // the 22:00 card opens on Study until the next lesson is pinned\n'
      + '  if (WEEK && DEMO && !window.QL_DATA) setTimeout(runDemo, 1200);\n', "after")


# ================================================================ local rows (lessons, Recall): no Notion writes
patch("      const id = pageId(it);", "      const id = it.localId || pageId(it);")
patch("    const msg = { action: \"status\", id: r.id, status, title: r.it.title || \"\", revert };\n    if (dateTouched && date) msg.date = date;\n    post(msg);",
      "    const msg = { action: \"status\", id: r.id, status, title: r.it.title || \"\", revert };\n    if (dateTouched && date) msg.date = date;\n"
      "    if (String(r.id).startsWith(\"local:\")) setTimeout(() => window.QL_STATUS && window.QL_STATUS(r.id, \"local\", \"\"), 0);   // a lesson lives in study.json, not in Notion\n    else post(msg);")

import make_themes
html = make_themes.apply(html, HERE, ONLY)
OUT.write_text(html)
print("wrote", OUT, len(html), "bytes")
