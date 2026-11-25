  /* ---------- Week (one column per area) and Study (every subject is a road: start → milestones → goal) ---------- */
  const W = WEEK;
  /* the Week's columns are the areas in the card's data (D.week.areas, else the order they first appear in the goals); "Learning" also holds the lesson plate */
  const AREA_LOOK = [{ glyph: "work", color: "#5AB8FF" }, { glyph: "work", color: "#4FD8C4" }, { glyph: "learn", color: "#9BE38B" }, { glyph: "me", color: "#B9A2F2" }];
  const AREAS = ((W && (W.areas || [...new Set((W.goals || []).map(g => g.area))])) || []).map((key, i) =>
    Object.assign({ key }, key === "Learning" ? { glyph: "learn", color: "#9BE38B" } : AREA_LOOK[i % AREA_LOOK.length]));
  const KIND = {   // [claim question, placeholder, result label]
    learn: ["What did you learn?", "One line", "What I learned"],
    work:  ["What did you add?", "One line: what is now done or sent", "What I added"],
    build: ["What did you make?", "One line: what you made", "What I made"],
    life:  ["What did you decide?", "One line: what you decided", "What I decided"] };
  const wToday = (W && W.today) || todayIso();
  const tomorrowIso = nextDayIso(wToday);
  const dayN = (iso) => { const d = parseIso(iso); return d ? DAYS[d.getDay()] : ""; };
  const rowOfQ = (q) => { const id = pageId(q); return id ? rows.find(x => x.id === id) : null; };
  const qDone = (q) => { const r = rowOfQ(q); return r ? r.done : !!q.done; };          // a Today row wins: tick it there, the week follows
  const qDate = (q) => { const r = rowOfQ(q); return (r && r.now.date) || q.date || ""; };
  const byDate = (a, b) => qDate(a) < qDate(b) ? -1 : qDate(a) > qDate(b) ? 1 : 0;
  const gState = (g) => {
    const qs = g.quests || [], done = qs.filter(qDone).length, total = qs.length;
    const open = qs.filter(q => !qDone(q)).sort(byDate), late = open.filter(q => qDate(q) < wToday);
    let key = "ok", label = "On track";
    if (g.status === "accomplished") { key = "won"; label = "Accomplished"; }
    else if (g.status === "moved") { key = "moved"; label = "Next week"; }
    else if (total && done === total) { key = "ready"; label = "Claim it"; }
    else if (late.length) { key = "behind"; label = "Waiting"; }
    return { key, label, done, total, late };
  };
  const nextFrame = (fn) => { let ran = false; const run = () => { if (!ran) { ran = true; fn(); } }; requestAnimationFrame(run); setTimeout(run, 60); };   // rAF stalls in a hidden window
  const openUrl = (url) => { if (!url) return; if (!inApp) { toast("Preview: would open " + url.replace(/^https?:\/\//, "").slice(0, 46)); return; } post({ action: "open", url }); };
  const PIN = (c) => '<svg viewBox="0 0 22 30"><path d="M11 29s9-9.6 9-17A9 9 0 0 0 2 12c0 7.4 9 17 9 17z" fill="' + c + '" stroke="#2A2208" stroke-width="1.2"/><circle cx="11" cy="11.5" r="3.6" fill="#2A2208"/></svg>';
  const PIN_SM = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 15.5s5.4-5.6 5.4-9.9A5.4 5.4 0 0 0 2.6 5.6C2.6 9.9 8 15.5 8 15.5z"/><circle cx="8" cy="5.8" r="2" fill="#0B2F3C"/></svg>';
  const EMB = {
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="12" cy="12" r="2.4"/><circle cx="19" cy="7" r="2"/><circle cx="19" cy="17" r="2"/><path d="M7 7.9l3 2.8M7 16.1l3-2.8M14 10.7l3-2.8M14 13.3l3 2.8"/></svg>',
    cv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2.2v2M12 19.8v2"/></svg>',
    godot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="19" height="10.5" rx="5.2"/><path d="M7.5 10v4.5M5.2 12.2h4.6"/><circle cx="15.6" cy="11" r="1.1" fill="currentColor"/><circle cx="18" cy="13.4" r="1.1" fill="currentColor"/></svg>',
    semi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="7" y="7" width="10" height="10" rx="1.4"/><rect x="10" y="10" width="4" height="4"/><path d="M9.5 3.8V7M12 3.8V7M14.5 3.8V7M9.5 17v3.2M12 17v3.2M14.5 17v3.2M3.8 9.5H7M3.8 12H7M3.8 14.5H7M17 9.5h3.2M17 12h3.2M17 14.5h3.2"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><path d="M7.8 14.6l2.8-2.8 2.1 2.1 3.6-3.7"/><path d="M13.8 10.2h2.5v2.5"/></svg>',
    backend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="3.5" width="16" height="5.5" rx="1.4"/><rect x="4" y="9.25" width="16" height="5.5" rx="1.4"/><rect x="4" y="15" width="16" height="5.5" rx="1.4"/><path d="M7.5 6.25h.01M7.5 12h.01M7.5 17.75h.01" stroke-width="2.4"/></svg>',
    devops: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-1.8-2.6-3.4-4-5.3-4a4 4 0 0 0 0 8c1.9 0 3.5-1.4 5.3-4zm0 0c1.8 2.6 3.4 4 5.3 4a4 4 0 0 0 0-8c-1.9 0-3.5 1.4-5.3 4z"/></svg>',
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5.5v13M5.5 12h13"/></svg>' };

  const wkb = el("div", "wkb"); body.after(wkb);
  const lnb = el("div", "lnb"); wkb.after(lnb);
  const smap = el("div", "smap"); side.appendChild(smap);
  const badgeW = el("span", "badge dot"); badgeW.hidden = true; tabEls.week.appendChild(badgeW);
  const badgeL = el("span", "badge dot"); badgeL.hidden = true; tabEls.learn.appendChild(badgeL);

  /* ----- Study state: roads (long, with milestones) and side quests (a few steps); up to 3 pins for tomorrow; today's locked lessons ----- */
  const ST = (LEARN && LEARN.tracks) || [];
  ST.forEach(t => {
    t.kind = t.kind || "road";
    t.milestones = (t.milestones || []).map(m => Object.assign({}, m, { sessions: (m.sessions || []).map(x =>
      typeof x === "number" ? Object.assign({}, (t.sessions || [])[x - 1] || { title: "Lesson " + x }) : Object.assign({}, x)) }));
    if (t.kind === "road") t.milestones.forEach(m => {   // every milestone ends in a boss: build it without a tutorial
      if (!m.sessions.some(x => x.boss)) m.sessions.push({ title: "Boss · " + m.name, resource: "No tutorial", minutes: 60, done: m.reached_when, boss: true });
    });
    t.pos = { m: 0, s: 0 };
  });
  const MAX_PINS = LEARN.max_pins || 3;
  const SS = { sel: Math.max(0, ST.findIndex(t => t.status === "focus")), li: 0, focus: "list", stop: -1, pins: [], todays: [], log: null, logs: [], drop: false };
  if (DEMO_STATE) {   // a SAMPLE state for screenshots, not your data
    ST.forEach(t => { const p = DEMO_STATE.pos[t.id]; if (p) { t.pos.m = Math.min(p[0], t.milestones.length - 1); t.pos.s = Math.min(p[1], ((t.milestones[t.pos.m] || {}).sessions || []).length - 1); } });
    (DEMO_STATE.today || []).forEach(id => { const ti = ST.findIndex(t => t.id === id); if (ti >= 0) SS.todays.push({ track: ti, m: ST[ti].pos.m, s: ST[ti].pos.s, done: false }); });
    if (SS.todays.length) SS.sel = SS.todays[0].track;
  }
  const sessAt = (t, m, s) => ((t.milestones[m] || {}).sessions || [])[s] || null;
  /* ----- Recall: a lesson's question comes back when you are about to forget it (FSRS-4.5 default weights), your own line is the answer.
     A daily budget (20 cards, ~10 min): over it, the cards you most likely still know come first and the rest wait. Forgotten 4 times: rewrite it or park it.
     Target 90%; when the last 30 days average more than 15 cards a day it drops to 85% (about a quarter fewer reviews). ----- */
  const FW = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
  const RC_RET = LEARN.recall_retention || 0.9, RC_CAP = LEARN.recall_cap || 20, RC_LEECH = LEARN.recall_leech || 4, RC_VALVE = LEARN.recall_valve || [15, 0.85];
  SS.recallDays = [];   // cards answered per day (the real build keeps this history)
  const target = () => { const h = SS.recallDays.slice(-30); return h.length >= 30 && h.reduce((x, y) => x + y, 0) / 30 > RC_VALVE[0] ? RC_VALVE[1] : RC_RET; };
  const fR = (t, S) => Math.pow(1 + 19 / 81 * t / S, -0.5);                                     // chance you still have it after t days
  const fIvl = (S) => Math.max(1, Math.min(3650, Math.round(S * 81 / 19 * (Math.pow(target(), -2) - 1))));   // days until that chance falls to RC_RET
  const fD0 = (G) => Math.min(10, Math.max(1, FW[4] - (G - 3) * FW[5]));
  const fDn = (D, G) => Math.min(10, Math.max(1, FW[7] * fD0(3) + (1 - FW[7]) * (D - FW[6] * (G - 3))));
  const fSok = (D, S, r, G) => S * (Math.exp(FW[8]) * (11 - D) * Math.pow(S, -FW[9]) * (Math.exp(FW[10] * (1 - r)) - 1) * (G === 2 ? FW[15] : 1) + 1);
  const fSfail = (D, S, r) => Math.min(S, FW[11] * Math.pow(D, -FW[12]) * (Math.pow(S + 1, FW[13]) - 1) * Math.exp(FW[14] * (1 - r)));
  const addDays = (iso, n) => { const d = parseIso(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const daysFrom = (a, b) => Math.round((parseIso(b) - parseIso(a)) / 864e5);
  SS.cards = []; SS.deck = null; SS.mode = "road"; SS.sub = "plan";
  const cardFor = (ti, m, s, a, S, due) => {   // a lesson's answer is its first "Good": the first review comes ~4 days later
    const x = sessAt(ST[ti], m, s) || {}; S = S || FW[2];
    return { track: ti, m, s, q: x.recall || "The key idea of “" + (x.title || "") + "”?", a, S, D: fD0(3), lapses: 0, parked: false,
      due: due || addDays(wToday, fIvl(S)), last: due ? addDays(due, -fIvl(S)) : wToday };
  };
  if (DEMO_STATE && DEMO_STATE.cards) DEMO_STATE.cards.forEach(c => { const ti = ST.findIndex(t => t.id === c[0]); if (ti >= 0) SS.cards.push(cardFor(ti, c[1], c[2], c[3], [FW[2], 9, 24][c[5]] || FW[2], addDays(wToday, c[4]))); });
  if (DEMO_STATE && DEMO_STATE.behind) {   // SAMPLE: back from two weeks off: one card for every lesson walked, many of them late
    let k = 0;
    ST.forEach((t, ti) => t.milestones.forEach((m, mi) => m.sessions.forEach((x, si) => {
      if (x.boss || mi > t.pos.m || (mi === t.pos.m && si >= t.pos.s)) return;
      SS.cards.push(cardFor(ti, mi, si, x.done || x.title, [4, 9, 20, 45][k % 4], addDays(wToday, -((k * 5) % 15)))); k++;
    })));
  }
  const riskOf = (c) => fR(Math.max(0, daysFrom(c.last, wToday)), c.S);
  const allDue = () => SS.cards.filter(c => !c.parked && c.due <= wToday);
  const dueCards = () => allDue().sort((a, b) => riskOf(b) - riskOf(a)).slice(0, RC_CAP);   // easiest first: cheap to keep, and the session starts with wins
  const behind = () => allDue().length > RC_CAP;
  const recallLeft = () => SS.deck ? SS.deck.q.length - SS.deck.i : dueCards().length;
  const pinOf = (ti) => SS.pins.find(p => p.track === ti) || null;
  const todayOf = (ti) => SS.todays.find(x => x.track === ti && !x.done) || null;
  const isPinned = (ti, m, s) => SS.pins.some(p => p.track === ti && p.m === m && p.s === s);
  const isToday = (ti, m, s) => SS.todays.some(x => !x.done && x.track === ti && x.m === m && x.s === s);
  const openTodays = () => SS.todays.filter(x => !x.done);
  const todayOpen = () => openTodays().length > 0;
  const itemTitle = (x) => { const t = ST[x.track]; return t.short + ": " + ((sessAt(t, x.m, x.s) || {}).title || ""); };
  const advance = (t) => {   // the road moves one lesson on; returns the milestone just reached, if any
    t.pos.s++;
    const m = t.milestones[t.pos.m];
    if (m && t.pos.s >= m.sessions.length) { t.pos.m++; t.pos.s = 0; return m; }
    return null;
  };

  /* ===================== Week ===================== */
  let gCards = [], gsel = null, claimFor = null, claimSave = null, wdesc = null;
  const CLOCK_G = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="5.6"/><path d="M8 5.2v3l2 1.3"/></svg>';
  const markGlyph = (mk, key) => {
    mk.className = "mk g-" + key; mk.textContent = "";
    if (key === "won") mk.innerHTML = G.check; else if (key === "ready") mk.innerHTML = G.spark;
    else if (key === "behind") mk.innerHTML = CLOCK_G; else if (key === "moved") mk.innerHTML = G.next;
  };
  const lessonPlate = () => {   // the Learning column's first line: what is pinned for tomorrow (or a reminder to pin)
    const q = el("div", "q pick lesson-plate"), n = SS.pins.length;
    const art = el("span", "qart"); art.style.background = "linear-gradient(160deg, #0E3A4A, #03121A)"; art.innerHTML = '<span style="display:grid;place-items:center;width:100%;height:100%;color:#8FE6FF">' + PIN_SM + "</span>"; q.appendChild(art);
    const mid = el("div"); mid.appendChild(put(el("div", "t"), !n ? "Pin tomorrow's lesson" : n === 1 ? dayN(tomorrowIso) + " · " + itemTitle(SS.pins[0]) : dayN(tomorrowIso) + " · " + n + " lessons pinned")); q.appendChild(mid);
    q.appendChild(el("span", "mk"));
    q.title = "Study tab"; q.addEventListener("click", (e) => { e.stopPropagation(); setTab("learn"); });
    return q;
  };
  const renderWeek = (still) => {
    wkb.textContent = ""; gCards = [];
    wkb.classList.toggle("still", !!still);
    const cols = el("div", "wcols");
    const areas = AREAS.filter(a => W.goals.some(g => g.area === a.key));
    cols.style.setProperty("--n", areas.length);
    let i = 0;
    areas.forEach((a, ci) => {
      const col = el("div", "wcol"); col.style.setProperty("--ac", a.color);
      const gs = W.goals.filter(g => g.area === a.key), live = gs.filter(g => gState(g).key !== "moved");
      const sh = el("div", "sh"); sh.appendChild(svgEl(G[a.glyph])); sh.appendChild(el("span", null, a.key)); sh.appendChild(el("i", "ln"));
      col.appendChild(sh);
      const cb = el("div", "wcb");
      if (a.key === "Learning" && ST.length) cb.appendChild(lessonPlate());
      gs.forEach((g, ri) => {
        const st = gState(g), q = el("div", "q pick wq " + st.key + (st.key === "moved" ? " gmoved" : "")); q.style.setProperty("--i", i++);
        const tile = ART.tile((g.quests || [])[0] || { title: g.title }), art = el("span", "qart"); art.style.background = tile.bg; art.innerHTML = tile.svg; q.appendChild(art);
        const mid = el("div"); mid.appendChild(put(el("div", "t"), g.title)); q.appendChild(mid);
        const mk = el("span"); markGlyph(mk, st.key); q.appendChild(mk);
        cb.appendChild(q);
        const gc = { g, el: q, ci, ri }; gCards.push(gc);
        q.addEventListener("click", (e) => { e.stopPropagation(); gSelect(gc); });
        q.addEventListener("mousemove", (e) => { if (gsel === gc || claimFor || performance.now() - goAt < 600 || !(e.movementX || e.movementY)) return; gSelect(gc); });
      });
      col.appendChild(cb); cols.appendChild(col); fadeIf(cb);
    });
    wkb.appendChild(cols);
    wdesc = el("div", "desc wdesc"); wkb.appendChild(wdesc);
  };
  const fillWDesc = () => {
    if (!wdesc) return;
    wdesc.textContent = ""; claimSave = null;
    const g = gsel && gsel.g; if (!g) return;
    const st = gState(g), kd = KIND[g.kind] || KIND.work;
    const dm = el("div", "dm");
    dm.appendChild(el("span", "st " + (st.key === "won" ? "done" : st.key === "behind" ? "delay" : st.key === "ready" ? "go" : ""), st.label));
    const bd = el("div", "body"); bd.appendChild(put(el("div", "dt"), g.title));
    const lb = el("div", "lb"); lb.appendChild(el("i")); bd.appendChild(lb);
    const sync = el("div", "sync");
    if (claimFor === g) {
      lb.appendChild(el("span", null, kd[0]));
      const inp = el("input", "line"); inp.type = "text"; inp.placeholder = kd[1]; inp.maxLength = 200; inp.value = g.result || ""; bd.appendChild(inp);
      claimSave = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } gClaim(g, v); };
      inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); claimSave(); } else if (e.key === "Escape") { e.preventDefault(); closeClaim(); } });
      setTimeout(() => inp.focus(), 30);

    } else if (st.key === "won") {
      lb.appendChild(el("span", null, kd[2])); bd.appendChild(put(el("div", "tx one"), g.result || "—"));
    } else {
      lb.appendChild(el("span", null, "Done when")); bd.appendChild(put(el("div", "tx one"), g.when || "—"));
      if (st.key === "behind") { sync.textContent = "Open since " + dayN(qDate(st.late[0])); }
      else if (st.key === "ready") { }
      else sync.textContent = "";
    }
    wdesc.append(dm, bd, sync);
  };
  const reveal = (elm) => {
    const cb = elm.closest(".wcb, .slist");
    if (cb) { const t = elm.offsetTop, b = t + elm.offsetHeight;
      if (t - 14 < cb.scrollTop) cb.scrollTop = Math.max(0, t - 18); else if (b + 12 > cb.scrollTop + cb.clientHeight) cb.scrollTop = b + 14 - cb.clientHeight; }
    const col = elm.closest(".wcol"), cols = col && col.parentNode;
    if (cols && cols.scrollWidth > cols.clientWidth + 2) cols.scrollTo({ left: col.offsetLeft - 16, behavior: "smooth" });
  };
  const gSelect = (gc, opts = {}) => {
    if (!gc || (gc === gsel && !opts.force)) return;
    if (gsel && gsel !== gc && opts.sound !== false) sfx("move");
    if (gsel) gsel.el.classList.remove("sel");
    if (claimFor && gc.g !== claimFor) claimFor = null;
    gsel = gc; gc.el.classList.add("sel"); reveal(gc.el);
    fillWDesc(); updateButtons();
  };
  const gNav = (dx, dy) => {
    if (!gCards.length) return;
    if (!gsel) { gSelect(gCards[0]); return; }
    const m = []; gCards.forEach(c => { (m[c.ci] = m[c.ci] || []).push(c); });
    if (dy) { const col = m[gsel.ci], n = col[col.indexOf(gsel) + dy]; if (n) gSelect(n); return; }
    let ci = gsel.ci + dx;
    while (ci >= 0 && ci < m.length && !(m[ci] && m[ci].length)) ci += dx;
    if (ci < 0 || ci >= m.length || !m[ci]) return;
    gSelect(m[ci][Math.min(gsel.ri, m[ci].length - 1)]);
  };
  const refreshWeek = () => {
    const id = gsel && gsel.g.id;
    renderWeek(true);
    const gc = gCards.find(x => x.g.id === id) || gCards[0];
    gsel = null; if (gc) gSelect(gc, { sound: false, force: true });
    tabHeader(); updateButtons();
  };
  const openClaim = (g) => {
    if (leaving || performance.now() - goAt < 800) return;
    const st = gState(g);
    if (st.key === "won" || st.key === "moved") { g.status = "planned"; sfx("undo", 0); post({ action: "goal", id: g.id, status: "Planned", title: g.title }); refreshWeek(); return; }
    claimFor = g; sfx("select", 0); fillWDesc(); updateButtons();
  };
  const closeClaim = () => { if (!claimFor) return; claimFor = null; sfx("cancel", 0); fillWDesc(); updateButtons(); };
  const gClaim = (g, result) => {
    g.status = "accomplished"; g.result = result; claimFor = null; sfx("done", 0);
    post({ action: "goal", id: g.id, status: "Accomplished", result, title: g.title });
    refreshWeek();
    if (gsel) { gsel.el.classList.remove("flash"); void gsel.el.offsetWidth; gsel.el.classList.add("flash"); }
    toast("Goal accomplished");
  };

  /* ===================== Study ===================== */
  let sItems = [], stops = [], capEl = null;
  const KIND_G = {   // side quests: what kind of thing it is
    book: G.learn,
    video: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M6.8 6.2v3.6L9.8 8z" fill="currentColor"/></svg>',
    course: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M1.5 6L8 3l6.5 3L8 9z"/><path d="M4.5 7.5v3c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5v-3"/></svg>',
    lab: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.8" y="3" width="12.4" height="10" rx="1.5"/><path d="M4.5 6.5l2 1.5-2 1.5M8 10h3.5"/></svg>',
    event: G.flag };
  const BOSS_G = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12.6 3.4L6 10M12.6 3.4h-2.1M12.6 3.4v2.1M4 8.6l3.4 3.4M5.4 10.6L3 13"/></svg>';
  const KIND_NAME = { book: "Reading", video: "Video", course: "Course", lab: "Hands-on", event: "Event" };
  const RECALL_G = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.3 6.4A5.5 5.5 0 1 0 13.1 10"/><path d="M13.7 2.6v3.9H9.8"/></svg>';
  const emblemOf = (t) => t.kind === "side" ? (KIND_G[t.type] || G.learn) : (EMB[t.id] || G.learn);
  const suggested = () => { const ids = (LEARN.rhythm || {})[dayN(tomorrowIso)] || []; const i = ST.findIndex(t => t.id === ids[0]); return i >= 0 ? i : Math.max(0, ST.findIndex(t => t.status === "focus")); };
  const itemTrack = (it) => !it ? SS.sel : it.kind === "slot" ? suggested() : (it.kind === "recall" || it.kind === "add") ? SS.sel : it.ti;
  const recallLabel = (n) => "Recall · ~" + Math.max(1, Math.round(n * 25 / 60)) + " min";   // time, not a count of cards
  const picksFor = (busy) => {   // tonight's suggestions from the weekly rhythm: next lessons not pinned yet (1 while today is open or Recall waits)
    if (SS.pins.length >= Math.min(2, MAX_PINS) || (behind() && SS.pins.length)) return [];   // suggestions stop at 2 subjects; a 3rd is still yours to add
    const ids = (LEARN.rhythm || {})[dayN(tomorrowIso)] || [];
    return ids.map(id => ST.findIndex(t => t.id === id))
      .filter(ti => ti >= 0 && !pinOf(ti) && sessAt(ST[ti], ST[ti].pos.m, ST[ti].pos.s) && !isToday(ti, ST[ti].pos.m, ST[ti].pos.s))
      .slice(0, busy || behind() ? 1 : MAX_PINS - SS.pins.length);
  };
  const lineEl = (cls, glyph, title, tc, pre) => {   // one plate of the hub: a tile and a title, nothing else
    const q = el("div", "q pick " + cls); if (tc) q.style.setProperty("--tc", tc);
    const art = el("span", "qart"); art.innerHTML = glyph; q.appendChild(art);
    const mid = el("div"), tt = put(el("div", "t"), title); if (pre) tt.prepend(el("span", "pre", pre)); mid.appendChild(tt); q.appendChild(mid);
    q.appendChild(el("span", "mk")); return q;
  };
  const fadeIf = (box) => {   // a soft fade at the bottom only while more of the list is hidden below
    if (!box) return;
    const upd = () => box.classList.toggle("more", box.scrollHeight - box.scrollTop - box.clientHeight > 4);
    nextFrame(upd); box.addEventListener("scroll", upd, { passive: true });
  };
  const shHead = (glyph, label) => { const sh = el("div", "sh"); sh.appendChild(svgEl(glyph)); sh.appendChild(el("span", null, label)); sh.appendChild(el("i", "ln")); return sh; };
  const markTrack = (q, ti) => {
    const mk = q.querySelector(".mk"), t = ST[ti];
    if (todayOf(ti) || pinOf(ti)) { mk.classList.add("pin"); if (todayOf(ti)) mk.classList.add("pin-today"); mk.innerHTML = PIN_SM; }
    else if (t.pos.m >= t.milestones.length) { mk.classList.add("g-won"); mk.innerHTML = G.check; }
  };
  const SUBS = [["plan", "Plan"], ["roads", "Roads"], ["side", "Side quests"]];
  const setSub = (k, sound = true) => {   // Tab / shift-Tab, like a game's second row of tabs: Plan (today + tomorrow) · Roads · Side quests
    if (k === SS.sub || !SUBS.some(x => x[0] === k)) return;
    SS.sub = k; SS.focus = "list"; SS.li = 0; SS.stop = -1; SS.log = null;
    renderStudyList(false);
    const first = sItems[0]; SS.sel = itemTrack(first); SS.mode = first && first.kind === "recall" ? "recall" : "road";
    markSel(); lnb.classList.remove("in"); void lnb.offsetWidth; lnb.classList.add("in");
    if (full || gOpen) renderMap();
    if (sound) sfx("move");
    tabHeader(); updateButtons();
  };
  const stepSub = (d) => { const i = SUBS.findIndex(x => x[0] === SS.sub); setSub(SUBS[(i + d + SUBS.length) % SUBS.length][0]); };
  const renderStudyList = (still) => {   // one sub-list at a time; Plan holds only what is due today and tomorrow
    lnb.textContent = ""; sItems = [];
    lnb.classList.toggle("still", !!still);
    const strip = el("div", "ssub");
    SUBS.forEach(([k, label]) => { const x = el("span", k === SS.sub ? "on" : null, label); x.addEventListener("click", (e) => { e.stopPropagation(); setSub(k); }); strip.appendChild(x); });
    strip.appendChild(el("span", "key", "tab")); lnb.appendChild(strip);
    const list = el("div", "slist");
    let i = 0;
    const add = (it) => {
      it.el.style.setProperty("--i", i++); list.appendChild(it.el); sItems.push(it);
      it.el.addEventListener("click", (e) => { e.stopPropagation(); selectItem(sItems.indexOf(it)); });
      it.el.addEventListener("dblclick", (e) => { e.stopPropagation(); openItem(); });
    };
    const day = dayN(tomorrowIso);
    if (SS.sub === "plan") {
      const todays = openTodays(), rc = recallLeft();
      if (todays.length || rc) {   // Recall first, then the lessons pinned last night
        list.appendChild(shHead(G.lock, "Today"));
        if (rc) add({ kind: "recall", ti: null, el: lineEl("lslot s-recall", RECALL_G, recallLabel(rc)) });
        todays.forEach(x => add({ kind: "today", x, ti: x.track, el: lineEl("lslot s-today" + (x.light ? " light" : ""), PIN_SM, itemTitle(x), null, x.light ? "Light" : null) }));
      }
      list.appendChild(shHead(PIN_SM, "Tomorrow"));
      SS.pins.forEach(x => add({ kind: "pin", x, ti: x.track, el: lineEl("lslot s-pinned", PIN_SM, itemTitle(x)) }));
      const picks = picksFor(todays.length || rc);
      picks.forEach(ti => { const t = ST[ti]; add({ kind: "pick", ti, el: lineEl("lslot s-pick", PIN_SM, t.short + ": " + ((sessAt(t, t.pos.m, t.pos.s) || {}).title || ""), null, day + "'s pick") }); });
      if (!SS.pins.length && !picks.length) add({ kind: "slot", ti: null, el: lineEl("lslot s-none", PIN_SM, "Pick a lesson for " + day) });
    } else {
      const side = SS.sub === "side";
      ST.forEach((t, ti) => {
        if ((t.kind === "side") !== side) return;
        const q = lineEl(side ? "sq side" : "sq", side ? (KIND_G[t.type] || G.learn) : (EMB[t.id] || G.learn), t.name, t.color); markTrack(q, ti); add({ kind: "track", ti, el: q });
      });
      if (side) add({ kind: "add", ti: null, el: lineEl("add", EMB.add, "Add") });
    }
    lnb.appendChild(list); fadeIf(list);
    markSel();
  };
  const openItem = () => {   // Enter / →: open what is under the cursor
    const it = sItems[SS.li];
    if (it && it.kind === "slot") return setSub("roads");
    if (it && it.kind === "add") return toast(inApp ? "New roads go in learn.json" : "Preview: would add a road or a side quest");
    focusMap();
  };
  const markSel = () => sItems.forEach((x, i) => x.el.classList.toggle("sel", i === SS.li));
  const selectItem = (i, opts = {}) => {
    if (i < 0 || i >= sItems.length) return;
    if (i !== SS.li && opts.sound !== false) sfx("move");
    if (SS.focus === "map") { SS.focus = "list"; smap.classList.add("away"); }
    SS.li = i; SS.sel = itemTrack(sItems[i]); SS.mode = sItems[i].kind === "recall" ? "recall" : "road"; SS.stop = -1; SS.log = null;
    markSel(); reveal(sItems[i].el);
    if (full || gOpen) renderMap();
    updateButtons();
  };
  const stopsOf = (t) => {   // the whole road, bottom to top: each milestone's lessons, then the milestone
    const out = [];
    t.milestones.forEach((m, mi) => { m.sessions.forEach((s, si) => out.push({ kind: "s", m: mi, s: si })); out.push({ kind: "m", m: mi }); });
    return out;
  };
  const lessonState = (t, m, s) => (m < t.pos.m || (m === t.pos.m && s < t.pos.s)) ? "done" : (m === t.pos.m && s === t.pos.s) ? "next" : "ahead";
  const homeStop = (t) => {   // the cursor lands on today's lesson, else the pinned one, else the next one
    const x = todayOf(SS.sel) || pinOf(SS.sel) || { m: t.pos.m, s: t.pos.s };
    const i = stops.findIndex(z => z.kind === "s" && z.m === x.m && z.s === x.s);
    return i >= 0 ? i : stops.length - 1;
  };
  const renderMap = () => {
    if (SS.mode === "recall") return renderDeck();
    const t = ST[SS.sel]; smap.textContent = ""; capEl = null; if (!t) return;
    smap.style.setProperty("--tc", t.color);
    const head = el("div", "shead"), em = el("span", "semb"); em.innerHTML = emblemOf(t); head.appendChild(em);
    const tt = el("div"); tt.appendChild(put(el("div", "stitle"), t.name));
    const last = t.milestones[t.milestones.length - 1];
    tt.appendChild(put(el("div", "sgoal"), t.kind === "side" ? "Side quest · " + (KIND_NAME[t.type] || "Learning") : "Goal · " + (last ? last.name : t.end_goal || ""))); head.appendChild(tt);
    smap.appendChild(head);
    const area = el("div", "sarea"); smap.appendChild(area);
    capEl = el("div", "desc scap"); smap.appendChild(capEl);
    stops = stopsOf(t);
    if (SS.stop < 0 || SS.stop >= stops.length) SS.stop = homeStop(t);
    smap.classList.toggle("away", SS.focus !== "map");
    nextFrame(() => { drawRoad(area, t); placeScur(); fillCap(); });
  };
  const drawRoad = (area, t) => {
    area.textContent = "";
    const Wd = area.clientWidth, Hd = area.clientHeight; if (Wd < 60 || Hd < 60) return;
    const ms = t.milestones, n = ms.length, pad = 26, step = (Hd - pad * 2) / Math.max(1, n);
    const xf = (i) => (i === 0 || i === n) ? .5 : (i % 2 ? .3 : .7);
    const P = []; for (let i = 0; i <= n; i++) P.push([Math.round(Wd * xf(i)), Math.round(Hd - pad - i * step)]);
    const ctrl = (i) => [P[i], [P[i][0], P[i][1] - step * .55], [P[i + 1][0], P[i + 1][1] + step * .55], P[i + 1]];
    const bez = (c, u) => { const v = 1 - u; return [0, 1].map(k => v * v * v * c[0][k] + 3 * v * v * u * c[1][k] + 3 * v * u * u * c[2][k] + u * u * u * c[3][k]); };
    const dOf = (i) => { const c = ctrl(i); return "M" + c[0] + " C" + c[1] + " " + c[2] + " " + c[3]; };
    let lit = "", cur = "", ahead = "";
    for (let i = 0; i < n; i++) { if (i < t.pos.m) lit += dOf(i); else if (i === t.pos.m) cur += dOf(i); else ahead += dOf(i); }
    area.insertAdjacentHTML("beforeend", '<svg class="road" viewBox="0 0 ' + Wd + " " + Hd + '">'
      + '<path d="' + ahead + '" fill="none" stroke="#33677C" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.5 8"/>'
      + '<path d="' + cur + '" fill="none" stroke="#2C7F99" stroke-width="3.5" stroke-linecap="round"/>'
      + '<path d="' + lit + '" fill="none" stroke="#9FF5D8" stroke-width="9" stroke-linecap="round" opacity=".12"/>'
      + '<path d="' + lit + '" fill="none" stroke="#9FF5D8" stroke-width="3.5" stroke-linecap="round"/></svg>');
    const s0 = el("div", "sstart", "START"); s0.style.left = P[0][0] + "px"; s0.style.top = (P[0][1] + 16) + "px"; area.appendChild(s0);
    const marker = (x, y, today) => {
      const p = el("div", "spin" + (today ? " today" : "") + (SS.drop && !today ? " drop" : "")); p.style.left = x + "px"; p.style.top = y + "px";
      p.innerHTML = PIN(today ? "#FF8A5C" : "#8FE6FF"); p.appendChild(el("b", null, today ? "Today" : dayN(tomorrowIso))); area.appendChild(p);
    };
    ms.forEach((m, mi) => {   // every lesson stays on the road (ahead ones as outlines), so the whole way to the goal is visible
      const k = m.sessions.length, c0 = ctrl(mi);
      let len = 0, prev = bez(c0, 0); for (let j = 1; j <= 24; j++) { const p = bez(c0, j / 24); len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; }
      const uBoss = Math.max(0.5, Math.min(0.8, 1 - 64 / Math.max(1, len)));   // the boss keeps ~64px of road before its milestone, even on a short stretch
      m.sessions.forEach((x, si) => {
        const hasBoss = !!(m.sessions[k - 1] || {}).boss, nl = hasBoss ? k - 1 : k;   // lessons spread over the first two thirds; the boss waits just before its milestone
        const u = x.boss ? uBoss : hasBoss ? 0.08 + (uBoss - 0.2) * (si + 0.5) / Math.max(1, nl) : (si + 1) / (k + 1);
        const [px, py] = bez(ctrl(mi), u), ls = lessonState(t, mi, si);
        const d = el("div", "sdot " + ls + (x.boss ? " boss" : "")); d.style.left = px + "px"; d.style.top = py + "px"; if (x.boss) d.innerHTML = BOSS_G; area.appendChild(d);
        const st = stops.find(z => z.kind === "s" && z.m === mi && z.s === si); if (st) { st.x = px; st.y = py; st.r = x.boss ? 19 : 13; }
        d.addEventListener("click", (e) => { e.stopPropagation(); focusMap(stops.indexOf(st)); });
        if (isToday(SS.sel, mi, si)) marker(px, py, true);
        else if (isPinned(SS.sel, mi, si)) marker(px, py, false);
        else if (ls === "next") { const h = el("div", "shere"); h.style.left = px + "px"; h.style.top = py + "px"; area.appendChild(h); }
      });
      const i = mi + 1, x = P[i][0], y = P[i][1], goal = mi === n - 1;
      const stc = mi < t.pos.m ? "done" : mi === t.pos.m ? "here" : "ahead";   // milestone labels sit outside the bends, away from the lessons
      const node = el("div", "mnode " + stc + (goal ? " goal" : "")); node.style.left = x + "px"; node.style.top = y + "px";
      const emn = el("span", "em"); emn.innerHTML = stc === "done" ? G.check : goal ? G.flag : ""; node.appendChild(emn); area.appendChild(node);
      const lab = el("div", "mlab " + (xf(i) < .5 ? "l" : "r") + " " + stc + (goal ? " goal" : ""), m.name); lab.style.left = x + "px"; lab.style.top = y + "px"; area.appendChild(lab);
      const st = stops.find(z => z.kind === "m" && z.m === mi); if (st) { st.x = x; st.y = y; st.r = goal ? 33 : 27; }
      node.addEventListener("click", (e) => { e.stopPropagation(); focusMap(stops.indexOf(st)); });
    });
    area.appendChild(el("div", "scur"));
    SS.drop = false;
  };
  const placeScur = () => {
    const c = smap.querySelector(".scur"), st = stops[SS.stop];
    if (!c) return;
    if (!st || st.x == null) { c.style.display = "none"; return; }
    c.style.display = ""; c.style.left = st.x + "px"; c.style.top = st.y + "px"; c.style.setProperty("--r", (st.r || 14) + "px");
  };
  const fillCap = () => {
    if (!capEl) return;
    if (SS.mode === "recall") return fillDeckCap();
    const t = ST[SS.sel], st = stops[SS.stop]; capEl.textContent = ""; if (!t || !st) return;
    const dm = el("div", "dm"), bd = el("div", "body"), sync = el("div", "sync");
    if (st.kind === "s") {
      const s = sessAt(t, st.m, st.s) || {}, ls = lessonState(t, st.m, st.s), done = ls === "done", next = ls === "next";
      const today = isToday(SS.sel, st.m, st.s), pinned = isPinned(SS.sel, st.m, st.s);
      const lx = today ? SS.todays.find(z => !z.done && z.track === SS.sel && z.m === st.m && z.s === st.s) : null, light = !!(lx && lx.light);
      dm.appendChild(el("span", "st" + (done ? " done" : today ? " today" : pinned ? " go" : next ? " live" : "") + (s.boss && !done && !today && !pinned ? " boss" : ""),
        done ? "Done" : today ? "Today" : pinned ? "Tomorrow" : s.boss ? "Boss" : next ? "Next" : "Later"));
      if (light) dm.appendChild(el("span", null, "Light")); else if (s.minutes) dm.appendChild(el("span", null, s.minutes + " min"));
      const logging = today && SS.log && SS.log.track === SS.sel && SS.log.m === st.m && SS.log.s === st.s, ask = s.recall && !s.boss && !light;
      bd.appendChild(put(el("div", "dt"), logging && ask ? s.recall : (s.title || "—")));   // while you answer, the lesson's question is the title
      const lb = el("div", "lb"); lb.appendChild(el("i")); bd.appendChild(lb);
      if (logging) {
        lb.appendChild(el("span", null, light ? "What did you do?" : s.boss ? "What did you have to look up?" : ask ? "From memory" : "From memory"));
        const inp = el("input", "line"); inp.type = "text"; inp.placeholder = s.boss ? "One line" : "One line"; inp.maxLength = 200; bd.appendChild(inp);
        inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); const v = inp.value.trim(); if (v) finishLesson(v); } else if (e.key === "Escape") { e.preventDefault(); SS.log = false; fillCap(); updateButtons(); } });
        setTimeout(() => inp.focus(), 30);

      } else {
        const guess = today && ask;   // a pretest: guess the answer before the lesson
        lb.appendChild(el("span", null, light ? "Light version" : s.boss ? "No tutorial" : guess ? "Question" : s.done ? "Done when" : "Material"));
        bd.appendChild(put(el("div", "tx one"), light ? (s.min || "Ten minutes, then one line") : s.boss ? (s.done || "—") : guess ? s.recall : (s.done || s.resource || "—")));
        if (today) { }
        else if (pinned) { sync.textContent = "Pinned for " + dayN(tomorrowIso); sync.classList.add("ok"); }
        else if (next) { if (SS.pins.length >= MAX_PINS) { sync.textContent = "Tomorrow is full"; sync.classList.add("wait"); } }   // the next lesson needs no line; P is in the footer
        else if (!done) sync.textContent = "Locked";
      }
    } else {
      const m = t.milestones[st.m], goal = st.m === t.milestones.length - 1, reached = st.m < t.pos.m, here = st.m === t.pos.m;
      dm.appendChild(el("span", "st" + (reached ? " done" : here ? " live" : ""), reached ? "Reached" : goal ? "Goal" : here ? "Next milestone" : "Ahead"));
      bd.appendChild(put(el("div", "dt"), m.name));
      const lb = el("div", "lb"); lb.appendChild(el("i")); lb.appendChild(el("span", null, "Reached when")); bd.appendChild(lb);
      bd.appendChild(put(el("div", "tx one"), m.reached_when || "—"));
    }
    capEl.append(dm, bd, sync);
  };
  const GRADES = ["Forgot", "Shaky", "Got it"];
  const nextRecallDay = () => { const d = SS.cards.filter(c => !c.parked && c.due > wToday).map(c => c.due).sort()[0]; return d ? dayLabel(d) : ""; };
  const renderDeck = () => {   // one card at a time: the question; you answer in your head; then your own words; then how well you had it
    smap.textContent = ""; capEl = null; smap.style.setProperty("--tc", "#6EDAFF");
    if (!SS.deck) SS.deck = { q: dueCards(), i: 0, shown: false, pick: -1, again: new Set(), hist: [], rewrite: null, rwSel: -1, draft: null };
    const D = SS.deck, c = D.q[D.i], end = D.i >= D.q.length;
    const head = el("div", "shead"), em = el("span", "semb"); em.innerHTML = RECALL_G; head.appendChild(em);
    const tt = el("div"); tt.appendChild(put(el("div", "stitle"), "Recall")); tt.appendChild(put(el("div", "sgoal"), "From past lessons")); head.appendChild(tt);
    smap.appendChild(head);
    const area = el("div", "sarea rdeck"); area.setAttribute("role", "region"); area.setAttribute("aria-label", "Recall card"); smap.appendChild(area);
    if (end) {   // a short end screen: the deck stays open so the last answer can still be taken back
      const n = new Set(D.q).size, card = el("div", "rcard rdone");
      const rr = el("div", "rroad"); rr.innerHTML = G.check; rr.appendChild(el("span", null, "Recall")); card.appendChild(rr);
      card.appendChild(put(el("div", "rq"), "All answered"));
      const nx = nextRecallDay(); if (nx) { const a = el("div", "ra"); a.appendChild(el("span", "lbl", "Next Recall")); a.appendChild(put(el("div", "rat"), nx)); card.appendChild(a); }
      area.appendChild(card);
    } else if (c) {
      const t = ST[c.track], card = el("div", "rcard"); card.style.setProperty("--rc", t.color);
      const rr = el("div", "rroad"); rr.innerHTML = emblemOf(t); rr.appendChild(el("span", null, t.short)); card.appendChild(rr);
      card.appendChild(put(el("div", "rq"), c.q));
      if (D.shown) { const a = el("div", "ra"); a.appendChild(el("span", "lbl", "Your answer")); a.appendChild(put(el("div", "rat"), c.a)); card.appendChild(a); }
      area.appendChild(card);
      if (D.q.length <= 8) { const pips = el("div", "rpips"); D.q.forEach((z, k) => pips.appendChild(el("i", k < D.i ? "on" : k === D.i ? "now" : ""))); area.appendChild(pips); }
    }
    capEl = el("div", "desc scap"); capEl.setAttribute("aria-live", "polite"); smap.appendChild(capEl);
    smap.classList.toggle("away", SS.focus !== "map");
    fillDeckCap();
  };
  const fillDeckCap = () => {
    if (!capEl || !SS.deck) return;
    const D = SS.deck, c = D.q[D.i]; capEl.textContent = "";
    const dm = el("div", "dm"), bd = el("div", "body"), sync = el("div", "sync");
    if (!c) {
      dm.appendChild(el("span", "st done", "Done"));
      capEl.append(dm, bd, sync); return;
    }
    if (D.rewrite === c) {   // forgotten 4 times: rewrite it simpler (Enter), keep it as it is (Esc), or, as a deliberate choice, park it
      bd.appendChild(put(el("div", "dt"), "Forgotten 4 times"));
      const lb = el("div", "lb"); lb.appendChild(el("i")); lb.appendChild(el("span", null, "Rewrite it shorter")); bd.appendChild(lb);
      const inp = el("input", "line"); inp.type = "text"; inp.value = D.draft != null ? D.draft : c.a; inp.maxLength = 200; inp.setAttribute("aria-label", "Rewrite your answer"); bd.appendChild(inp);
      inp.addEventListener("input", () => { D.draft = inp.value; });
      inp.addEventListener("keydown", e => {
        e.stopPropagation();
        if (e.key === "Enter") { e.preventDefault(); const v = inp.value.trim(); if (v) rewriteCard("save", v); else toast("Write a line, or Esc"); }
        else if (e.key === "Escape") { e.preventDefault(); rewriteCard("keep"); }
        else if (e.key === "ArrowDown") { e.preventDefault(); D.rwSel = 0; inp.blur(); fillDeckCap(); updateButtons(); }
      });
      const row = el("div", "rgrades rwrow");
      [["Keep", "keep"], ["Park", "park"]].forEach(([label, how], k) => {
        const b = el("div", "rg" + (k === D.rwSel ? " sel" : "") + (how === "park" ? " park" : "")); b.setAttribute("role", "button"); b.appendChild(el("span", null, label));
        b.addEventListener("click", (e) => { e.stopPropagation(); rewriteCard(how); }); row.appendChild(b);
      });
      bd.appendChild(row);
      if (D.rwSel < 0) setTimeout(() => { inp.focus(); if (D.draft == null) inp.select(); }, 30);
      sync.textContent = D.rwSel < 0 ? "↓ Keep or Park" : ""; sync.classList.add("wait");
    }
    else if (!D.shown) { }
    else {
      const row = el("div", "rgrades");
      GRADES.forEach((g, k) => {
        const b = el("div", "rg" + (k === D.pick ? " sel" : "")); b.setAttribute("role", "button"); b.appendChild(el("b", null, String(k + 1))); b.appendChild(el("span", null, g));
        b.addEventListener("click", (e) => { e.stopPropagation(); gradeCard(k); }); row.appendChild(b);
      });
      bd.appendChild(row);
    }
    capEl.append(dm, bd, sync);
  };
  const nudgeGrades = () => {   // Enter with nothing chosen: point at the choices instead of guessing one
    const r = capEl && capEl.querySelector(".rgrades"), s = capEl && capEl.querySelector(".sync"); if (!r) return;
    r.classList.remove("ask"); void r.offsetWidth; r.classList.add("ask");
    if (s) { s.textContent = "Pick 1, 2 or 3"; s.classList.add("wait"); }
  };
  const deckAct = () => {
    const D = SS.deck; if (!D) return;
    if (D.i >= D.q.length) return finishDeck();
    if (D.rewrite) {
      if (D.rwSel === 0) return rewriteCard("keep");
      if (D.rwSel === 1) return rewriteCard("park");
      const inp = smap.querySelector(".scap input.line"), v = inp && inp.value.trim();
      if (v) rewriteCard("save", v); else toast("Write a line, or Esc");
      return;
    }
    if (!D.shown) { D.shown = true; D.pick = -1; sfx("select", 0); renderDeck(); updateButtons(); return; }
    if (D.pick < 0) { nudgeGrades(); return; }   // nothing is preselected, so a quick second Enter can't grade by accident
    gradeCard(D.pick);
  };
  const gradeCard = (g) => {   // 0 forgot · 1 shaky · 2 got it  (FSRS: Again · Hard · Good)
    const D = SS.deck, c = D && D.q[D.i]; if (!c || !D.shown || D.rewrite) return;
    const h = { kind: "grade", c, i: D.i, prev: { S: c.S, D: c.D, due: c.due, last: c.last, lapses: c.lapses }, pushed: false };
    if (!D.again.has(c)) {   // a card is scheduled once a day; a forgotten one comes back once more before you finish
      const G = [1, 2, 3][g], r = riskOf(c);
      c.S = G > 1 ? fSok(c.D, c.S, r, G) : fSfail(c.D, c.S, r); c.D = fDn(c.D, G); c.last = wToday; c.due = addDays(wToday, fIvl(c.S));
      post({ action: "recall", grade: GRADES[g], q: c.q, due: c.due });
      if (G === 1) {
        c.lapses = (c.lapses || 0) + 1;
        if (c.lapses >= RC_LEECH) { D.hist.push(h); D.rewrite = c; D.rwSel = -1; D.draft = null; sfx("select", 0); fillDeckCap(); updateButtons(); return; }
        D.again.add(c); D.q.push(c); h.pushed = true;
      }
    }
    D.hist.push(h);
    sfx(g === 2 ? "done" : "select", 0);   // an honest Forgot gets no buzz
    nextCard();
  };
  const rewriteCard = (how, v) => {   // save: simpler words, back tomorrow · keep: as it is · park: it stops coming back (⌫ brings it back)
    const D = SS.deck, c = D && D.rewrite; if (!c) return;
    D.hist.push({ kind: "rw", c, i: D.i, prev: { a: c.a, lapses: c.lapses, S: c.S, D: c.D, last: c.last, due: c.due, parked: c.parked } });
    if (how === "save") { c.a = v; c.lapses = 0; c.S = FW[2]; c.D = fD0(3); c.last = wToday; c.due = addDays(wToday, 1); }
    else if (how === "park") { c.parked = true; toast("Parked · ⌫ to undo"); }
    post({ action: "recall", grade: how === "save" ? "rewritten" : how === "park" ? "parked" : "kept", q: c.q });
    nextCard();
  };
  const undoLast = () => {   // ⌫: take back the last answer (or rewrite, keep, park); that card comes back up
    const D = SS.deck, h = D && D.hist && D.hist.pop(); if (!h) return;
    const c = h.c; Object.assign(c, h.prev);
    if (h.pushed) { const k = D.q.lastIndexOf(c); if (k > h.i) D.q.splice(k, 1); D.again.delete(c); }
    D.i = h.i; D.shown = true; D.pick = -1; D.draft = null; D.rwSel = -1; D.rewrite = h.kind === "rw" ? c : null;
    post({ action: "recall", grade: "undo", q: c.q });
    sfx("undo", 0); renderDeck(); refreshRecallLine(); tabHeader(); updateButtons();
  };
  const refreshRecallLine = () => { const line = sItems.find(z => z.kind === "recall"); if (line) { const n = recallLeft(); line.el.querySelector(".t").textContent = n > 0 ? recallLabel(n) : "Recall · done"; } };
  const nextCard = () => {
    const D = SS.deck; D.i++; D.shown = false; D.pick = -1; D.rewrite = null; D.rwSel = -1; D.draft = null;
    renderDeck(); refreshRecallLine(); tabHeader(); updateButtons();
  };
  const finishDeck = (quiet) => {
    const n = new Set(SS.deck.q).size; SS.deck = null; SS.mode = "road"; SS.focus = "list"; SS.recallDays.push(n);
    const rr = rows.find(r => r.it.recall && !r.done); if (rr) apply(rr, { status: STATUS.done, date: rr.now.date }, false);
    if (quiet) return;
    renderStudyList(true);
    let ni = sItems.findIndex(z => z.kind === "today"); if (ni < 0) ni = sItems.findIndex(z => z.kind === "pin" || z.kind === "pick" || z.kind === "slot");
    SS.li = Math.max(0, ni); SS.sel = itemTrack(sItems[SS.li]); SS.stop = -1; markSel();
    if (full || gOpen) renderMap();
    tabHeader(); updateButtons();
    stampMsg("Recall done");
  };
  const openRecall = () => {
    if (tab !== "learn") setTab("learn");
    if (SS.sub !== "plan") setSub("plan", false);
    const i = sItems.findIndex(z => z.kind === "recall"); if (i < 0) return;
    selectItem(i, { sound: false }); focusMap();
  };
  const focusMap = (i) => {
    if (!full && !gOpen) { openMap(); }
    if (SS.focus !== "map") { SS.focus = "map"; smap.classList.remove("away"); }
    if (i != null && i >= 0 && i !== SS.stop) { SS.stop = i; sfx("move"); }
    placeScur(); fillCap(); updateButtons();
  };
  const focusList = () => {
    if (!full && gOpen) { closeMap(); return; }
    if (SS.focus === "list") return;
    SS.focus = "list"; SS.log = false; smap.classList.add("away"); sfx("cancel", 0); fillCap(); updateButtons();
  };
  const stepStop = (d) => { const n = SS.stop + d; if (n < 0 || n >= stops.length) return; SS.stop = n; sfx("move"); placeScur(); fillCap(); updateButtons(); };
  const openMap = () => {   // the corner card: the road opens beside it, like a quest's details
    if (full) { focusMap(); return; }
    if (!gOpen) {
      gOpen = true; positionDetail();
      post({ action: "expand", width: STAGE_W });
      side.hidden = false; side.classList.remove("in"); void side.offsetWidth; side.classList.add("in");
      document.body.classList.add("detail-open");
    }
    SS.focus = "map"; renderMap(); sfx("select", 0); updateButtons();
  };
  const closeMap = (sound = true) => {
    if (!gOpen || full) return;
    gOpen = false; side.hidden = true; SS.focus = "list"; SS.log = false;
    document.body.classList.remove("detail-open");
    post({ action: "expand", width: CARD_W });
    if (sound) sfx("cancel", 0);
    updateButtons();
  };
  const todayAt = () => {   // today's open lesson under the cursor: its row in Plan, or its stop on the map
    const it = sItems[SS.li] || {}, onMap = SS.focus === "map" && (full || gOpen);
    if (SS.mode === "recall") return null;
    if (!onMap) return it.kind === "today" && !it.x.done ? it.x : null;
    const st = stops[SS.stop]; if (!st || st.kind !== "s") return null;
    return SS.todays.find(z => !z.done && z.track === SS.sel && z.m === st.m && z.s === st.s) || null;
  };
  const lightIt = () => {   // L: on a bad day, today's lesson becomes its 10-minute version; nothing is skipped, the road waits
    const x = todayAt(); if (!x || leaving) return;
    x.light = !x.light; sfx(x.light ? "select" : "undo", 0);
    afterPin();
  };
  const pinIt = () => {   // P: pin the next lesson of this road or side quest for tomorrow (up to 3); P again takes it back
    if (leaving) return;
    if (SS.mode === "recall") return;
    const it = sItems[SS.li], onMap = SS.focus === "map" && (full || gOpen);
    if (!onMap && it && it.kind === "add") return;
    if (!onMap && it && it.kind === "pin") { SS.pins = SS.pins.filter(p => p !== it.x); sfx("undo", 0); afterPin(); return; }
    if (!onMap && it && it.kind === "today") { toast("Already today's"); return; }
    const ti = onMap ? SS.sel : itemTrack(it), t = ST[ti]; if (!t) return;
    const m = t.pos.m, s = t.pos.s;
    if (onMap) {
      const st = stops[SS.stop], ls = st && st.kind === "s" ? lessonState(t, st.m, st.s) : "";
      if (ls === "done") { toast("Already done"); return; }
      if (ls !== "next") { toast("Only the next lesson"); return; }
    }
    if (!sessAt(t, m, s)) { toast("Finished"); return; }
    if (isToday(ti, m, s)) { toast("Already today's"); return; }
    const had = pinOf(ti);
    if (had) { SS.pins = SS.pins.filter(p => p !== had); sfx("undo", 0); }
    else if (SS.pins.length >= MAX_PINS) { toast("Max " + MAX_PINS + " a day"); return; }
    else {
      SS.pins.push({ track: ti, m, s }); SS.drop = true; sfx("done", 0);
      if (behind() && SS.pins.length > 1) setTimeout(() => toast("Recall behind · 1 is enough"), 0);
      post({ action: "lesson", status: "pinned", date: tomorrowIso, track: t.id, title: sessAt(t, m, s).title });
    }
    afterPin();
  };
  const afterPin = () => {   // re-draw the hub, keeping the cursor on the same line where it still exists
    const was = sItems[SS.li] || {};
    renderStudyList(true);
    let ni = sItems.findIndex(z => z.kind === was.kind && z.ti === was.ti && (was.kind !== "pin" || z.x === was.x));
    if (ni < 0 && (was.kind === "slot" || was.kind === "pick")) ni = sItems.findIndex(z => z.kind === "pin" && z.ti === SS.sel);
    if (ni < 0) ni = sItems.findIndex(z => (z.kind === "pick" || z.kind === "pin" || z.kind === "track") && z.ti === SS.sel);
    SS.li = Math.max(0, ni); markSel();
    if (full || gOpen) renderMap();
    tabHeader(); updateButtons();
  };
  const lessonLog = () => {   // D: one line for today's lesson (the one under the cursor, else the first open one), then the road moves on
    const it = sItems[SS.li];
    const x = (it && it.kind === "today") ? it.x : (todayOf(SS.sel) || openTodays()[0]);
    if (!x) return false;
    if (tab === "learn" && SS.sub !== "plan") setSub("plan", false);
    SS.log = x;
    if (tab === "learn") {
      SS.sel = x.track; SS.stop = -1; SS.mode = "road";
      const li = sItems.findIndex(z => z.kind === "today" && z.x === x); if (li >= 0) { SS.li = li; markSel(); }
      SS.focus = "map";
      if (!full && !gOpen) openMap(); else { smap.classList.remove("away"); renderMap(); }
    }
    updateButtons();
    return true;
  };
  const stampMsg = (title, sub) => {
    const host = tab === "learn" ? (full || gOpen ? smap : cardEl) : cardEl;
    const s = el("div", "mstamp", title); if (sub) s.appendChild(el("small", null, sub)); host.appendChild(s);
    setTimeout(() => s.remove(), 1900);
  };
  const finishLesson = (line) => {
    const x = SS.log; if (!x || x.done) return;
    const t = ST[x.track]; x.done = true; x.line = line; SS.log = null;
    const reached = (!x.light && t.pos.m === x.m && t.pos.s === x.s) ? advance(t) : null;   // a 10-minute day keeps the promise; the road waits for the full lesson
    SS.logs.unshift({ date: wToday, track: x.track, m: x.m, s: x.s, line, light: !!x.light });
    const xs = sessAt(t, x.m, x.s) || {};
    if (!xs.boss && !x.light) SS.cards.push(cardFor(x.track, x.m, x.s, line));   // its question comes back in a few days, your line as the answer
    const lr = rows.find(r => r.it.lesson && r.it.lessonTrack === t.id && !r.done); if (lr) apply(lr, { status: STATUS.done, date: lr.now.date }, false);
    sfx("done", 0); post({ action: "lesson", status: x.light ? "light" : "done", track: t.id, line });
    const finished = t.pos.m >= t.milestones.length;
    SS.stop = -1;
    if (tab === "learn") { afterPin(); }   // redraw first, so the stamp lands on the new map
    else { if (detailRow) renderDetail(detailRow); tabHeader(); updateButtons(); }
    if (reached) stampMsg(finished ? (t.kind === "side" ? "Side quest done" : "Road complete") : "Milestone reached", finished ? t.name : reached.name);
  };

  /* ----- header band: the same band, each tab's words ----- */
  const kiconEl = document.getElementById("kicon"), eyebrowEl = document.getElementById("eyebrow"), titleEl = document.getElementById("title");
  let subEl = document.getElementById("subtitle");
  const subWasThere = !!subEl;
  if (!subEl) { subEl = el("div", "subtitle"); subEl.id = "subtitle"; subEl.hidden = true; titleEl.after(subEl); }
  const saved = { icon: kiconEl.innerHTML, eyebrow: [...eyebrowEl.childNodes], title: [...titleEl.childNodes], sub: [...subEl.childNodes], stamp: true };
  const setHeader = (icon, eyebrow, title, sub) => {
    kiconEl.innerHTML = icon; eyebrowEl.replaceChildren(document.createTextNode(eyebrow)); titleEl.replaceChildren(document.createTextNode(title));
    subEl.hidden = !sub; subEl.replaceChildren(document.createTextNode(sub || ""));
  };
  const tabHeader = () => {
    if (tab === "today") {
      kiconEl.innerHTML = saved.icon; eyebrowEl.replaceChildren(...saved.eyebrow); titleEl.replaceChildren(...saved.title); subEl.replaceChildren(...saved.sub);
      subEl.hidden = !subWasThere; stamp.hidden = saved.stamp; return;
    }
    stamp.hidden = true;
    if (tab === "week") {
      const live = W.goals.filter(g => gState(g).key !== "moved"), by = (k) => live.find(g => gState(g).key === k);
      const g = by("behind") || by("ready") || by("ok"), when = W.label + " · " + dayLabel(wToday);   // the header is the next action, not a score
      if (!g) setHeader(G.cal, when, "Week done", "");
      else if (gState(g).key === "ready") setHeader(G.cal, when, "Claim: " + (g.short || g.title), "");
      else { const q = (g.quests || []).filter(z => !qDone(z)).sort(byDate)[0]; setHeader(G.cal, when, "Next: " + (g.short || g.title), q ? (q.title || "") : (g.when || "")); }
      return;
    }
    const td = openTodays(), pn = SS.pins, rc = recallLeft(), day = dayN(tomorrowIso), when = dayLabel(wToday);
    if (rc) setHeader(G.book, when, "Recall", "~" + Math.max(1, Math.round(rc * 25 / 60)) + " min");
    else if (td.length) setHeader(G.book, when, "Next: " + ST[td[0].track].short, ((sessAt(ST[td[0].track], td[0].m, td[0].s) || {}).title || "") + (td[0].light ? " · light" : ""));
    else if (pn.length) setHeader(G.book, when, day + ": " + pn.map(x => ST[x.track].short).join(" · "), "");
    else setHeader(G.book, when, "Pick " + day + "'s lesson", behind() ? "Recall behind · 1 is enough" : "");
  };

  /* ----- tabs ----- */
  const TAB_ORDER = ["today", "week", "learn"];
  const setTab = (t, sound = true) => {
    if (urgent || t === tab || leaving || !tabEls[t] || tabEls[t].hidden) return;
    closeMenu(false);
    if (t !== "today" && !full && detailRow) closeDetail(false);
    if (tab === "learn" && gOpen) closeMap(false);
    if (tab === "learn" && SS.deck && SS.deck.i >= SS.deck.q.length) finishDeck(true);   // an answered deck closes when you leave the tab
    claimFor = null; SS.log = false;
    if (tab === "today") saved.stamp = stamp.hidden;
    tab = t;
    document.body.classList.toggle("tab-week", t === "week");
    document.body.classList.toggle("tab-learn", t === "learn");
    Object.entries(tabEls).forEach(([k, e]) => e.classList.toggle("on", k === t));
    kTrack.querySelector("i").textContent = t === "learn" ? "P" : "T";
    if (t === "week") {
      const keep = gsel && gsel.g.id;
      renderWeek(false); wkb.classList.remove("in"); void wkb.offsetWidth; wkb.classList.add("in");
      const pick = gCards.find(x => x.g.id === keep) || gCards.find(x => gState(x.g).key === "behind") || gCards.find(x => gState(x.g).key === "ready") || gCards[0];
      gsel = null; if (pick) gSelect(pick, { sound: false, force: true });
    } else if (t === "learn") {
      SS.focus = "list"; SS.stop = -1; SS.li = 0; SS.sub = "plan";
      renderStudyList(false); SS.sel = itemTrack(sItems[0]); SS.mode = (sItems[0] || {}).kind === "recall" ? "recall" : "road"; lnb.classList.remove("in"); void lnb.offsetWidth; lnb.classList.add("in");
      if (full) renderMap();
    } else if (full) { const r = detailRow || (sel && sel.id ? sel : pickable[0]); if (r) { detailRow = r; renderDetail(r); } }
    tabHeader();
    if (sound) sfx("select", 0);
    updateButtons();
    nextFrame(() => { report("resize"); placeCursor(); edge(); });
  };
  const stepTab = (dir) => { const order = TAB_ORDER.filter(k => !tabEls[k].hidden), n = order[order.indexOf(tab) + dir]; if (n) setTab(n); };
  Object.entries(tabEls).forEach(([k, e]) => e.addEventListener("click", () => setTab(k)));
  keyQ.addEventListener("click", () => stepTab(-1));
  keyE.addEventListener("click", () => stepTab(1));
  window.addEventListener("resize", () => { if (tab === "learn" && (full || gOpen)) nextFrame(renderMap); });

  /* ----- hooks into the card's footer, keys, layout and quest detail ----- */
  weekButtons = () => {
    kOpen.disabled = false;
    if (W) {
      const n = W.goals.filter(g => gState(g).key === "behind").length; badgeW.hidden = true; badgeW.title = n === 1 ? "A goal is waiting" : n + " goals are waiting";
      badgeL.hidden = SS.pins.length > 0 && !todayOpen() && !recallLeft(); badgeL.title = recallLeft() ? "Recall is waiting" : todayOpen() ? "Today's lesson isn't done" : "Tomorrow's lesson isn't pinned";
    }
    if (tab === "today") { kTrack.querySelector("i").textContent = "T"; kOpen.hidden = false; return; }
    kAct.hidden = true; kSnooze.hidden = true;
    if (tab === "week") {
      kTrack.hidden = true; kOpen.hidden = false;
      const g = gsel && gsel.g, st = g ? gState(g) : null;
      kDone.hidden = !g || !!claimFor; kDone.disabled = !g;
      setLabel(kDone, !st ? "Claim" : (st.key === "won" || st.key === "moved") ? "Undo" : "Claim");
      setLabel(kOpen, claimFor ? "Save" : "Open in Notion");
      kMode.hidden = !!claimFor; kBoard.hidden = !!claimFor || !full;
      setLabel(kClose, claimFor ? "Cancel" : "Close");
      return;
    }
    const it = sItems[SS.li] || {}, t = ST[SS.sel], onMap = SS.focus === "map" && (full || gOpen), st = onMap ? stops[SS.stop] : null;
    lnb.classList.toggle("away", onMap); lnb.classList.toggle("deck", onMap && SS.mode === "recall");   // one bright cursor: the side that has focus
    kBoard.hidden = true;   // the Notion board means nothing on this tab
    if (SS.mode === "recall") {
      const D = SS.deck, rw = !!(D && D.rewrite), end = !!(D && D.i >= D.q.length), undo = !!(D && D.hist && D.hist.length);
      kTrack.hidden = !onMap || !undo || (rw && D.rwSel < 0); setLabel(kTrack, "Undo"); kTrack.querySelector("i").textContent = "⌫";
      kDone.hidden = true; kOpen.hidden = false;
      setLabel(kOpen, !onMap ? "Start" : end ? "Close" : rw ? (D.rwSel === 1 ? "Park" : D.rwSel === 0 ? "Keep" : "Save") : D && D.shown ? "Choose" : "Show");
      kMode.hidden = rw || (gOpen && !full);
      setLabel(kClose, rw ? "Keep" : onMap ? "Back" : "Close");
      return;
    }
    kTrack.querySelector("i").textContent = "P";
    const pinnedHere = onMap ? !!(st && st.kind === "s" && isPinned(SS.sel, st.m, st.s)) : (it.kind === "pin" || (it.kind === "track" && !!pinOf(it.ti)));
    const canPin = onMap ? !!(st && st.kind === "s" && (pinnedHere || (lessonState(t, st.m, st.s) === "next" && !isToday(SS.sel, st.m, st.s))))
      : it.kind !== "today" && it.kind !== "add" && (pinnedHere || !!(t && sessAt(t, t.pos.m, t.pos.s)));
    kTrack.hidden = !!SS.log || !t || !canPin;
    setLabel(kTrack, pinnedHere ? "Unpin" : "Pin for tomorrow");
    const tx = todayAt();
    if (tx && !SS.log) { kTrack.hidden = false; setLabel(kTrack, tx.light ? "Full" : "Light"); kTrack.querySelector("i").textContent = "L"; }
    kDone.hidden = !todayOpen() || !!SS.log; setLabel(kDone, "Done");
    setLabel(kOpen, SS.log ? "Save" : !onMap ? (it.kind === "slot" ? "Roads" : it.kind === "add" ? "Add" : t && t.kind === "side" ? "Steps" : "Road") : st && st.kind === "s" ? "Open lesson" : (t && t.kind === "side" ? "Steps" : "Road"));
    kMode.hidden = !!SS.log || (gOpen && !full);
    const sx = onMap && st && st.kind === "s" ? (sessAt(t, st.m, st.s) || {}) : null;   // Enter on the map opens the material; a milestone or a boss without a link has nothing to open
    kOpen.hidden = !SS.log && onMap && (!sx || !sx.url);
    if (!SS.log && sx && sx.url) setLabel(kOpen, sx.boss ? "Open project" : "Open lesson");
    setLabel(kClose, SS.log ? "Cancel" : onMap ? "Back" : "Close");
  };
  const wrapBtn = (b, fn) => { const orig = b.onclick; b.onclick = (e) => (tab === "today" ? orig && orig(e) : fn(e)); };
  wrapBtn(kTrack, () => tab === "learn" && (SS.mode === "recall" ? undoLast() : todayAt() ? lightIt() : pinIt()));
  wrapBtn(kDone, () => tab === "week" ? (gsel && openClaim(gsel.g)) : lessonLog());
  wrapBtn(kOpen, () => {
    if (tab === "week") return claimFor ? (claimSave && claimSave()) : gsel && openUrl("https://app.notion.com/p/" + gsel.g.id);
    if (SS.log) { const inp = smap.querySelector("input.line"); if (inp && inp.value.trim()) finishLesson(inp.value.trim()); return; }
    if (SS.mode === "recall" && SS.focus === "map" && (full || gOpen)) return deckAct();
    if (SS.focus !== "map" || (!full && !gOpen)) return openItem();
    const st = stops[SS.stop], t = ST[SS.sel]; if (st && st.kind === "s") openUrl((sessAt(t, st.m, st.s) || {}).url);
  });
  wrapBtn(kClose, () => {
    if (tab === "week") return claimFor ? closeClaim() : leave("close");
    if (SS.mode === "recall" && SS.deck) {
      if (SS.deck.rewrite) return rewriteCard("keep");
      if (SS.deck.i >= SS.deck.q.length && SS.focus === "map") return finishDeck();
    }
    if (SS.log) { SS.log = false; fillCap(); updateButtons(); return; }
    return SS.focus === "map" ? focusList() : leave("close");
  });
  weekLayout = (on) => {
    gOpen = false; SS.focus = "list";
    if (!on) { claimFor = null; SS.log = false; }
    if (tab === "learn") nextFrame(() => { if (on) renderMap(); smap.classList.add("away"); });
  };
  weekKey = (e) => {
    const k = e.key;
    if (e.target && e.target.closest && e.target.closest("input, textarea")) return true;   // typing a line
    if (urgent || menuRow) return false;
    if (k === "q" || k === "Q" || k === "e" || k === "E") {
      if (!touched) return false;
      e.preventDefault(); if (!e.repeat) stepTab(k === "q" || k === "Q" ? -1 : 1); return true;
    }
    if (tab === "today") return false;
    if (e.repeat && !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "j", "k"].includes(k)) { e.preventDefault(); return true; }
    if (k === "Escape") { e.preventDefault(); flash("kClose"); kClose.onclick(); return true; }
    if (!touched) return true;
    if (tab === "week") {
      if (k === "ArrowDown" || k === "j") { e.preventDefault(); gNav(0, 1); return true; }
      if (k === "ArrowUp" || k === "k") { e.preventDefault(); gNav(0, -1); return true; }
      if (k === "ArrowRight") { e.preventDefault(); gNav(1, 0); return true; }
      if (k === "ArrowLeft") { e.preventDefault(); gNav(-1, 0); return true; }
      if (k === "d" || k === "D") { e.preventDefault(); flash("kDone"); if (gsel) openClaim(gsel.g); return true; }
      if (k === "Enter") { e.preventDefault(); flash("kOpen"); kOpen.onclick(); return true; }
    } else {
      const onMap = SS.focus === "map" && (full || gOpen);
      if (k === "Tab") { e.preventDefault(); if (!e.repeat && !(SS.deck && SS.deck.rewrite)) stepSub(e.shiftKey ? -1 : 1); return true; }
      if (k === "p" || k === "P") { e.preventDefault(); flash("kTrack"); pinIt(); return true; }
      if (k === "l" || k === "L") { e.preventDefault(); if (todayAt()) { flash("kTrack"); lightIt(); } return true; }
      if (k === "d" || k === "D") { e.preventDefault(); flash("kDone"); lessonLog(); return true; }
      if (onMap && SS.mode === "recall") {   // Recall: Enter shows your words; 1 2 3 (or ← → then Enter) say how well you had it; ⌫ takes the last answer back
        const D = SS.deck, end = !!(D && D.i >= D.q.length);
        if (k === "Backspace") { e.preventDefault(); undoLast(); return true; }
        if (D && D.rewrite) {   // the choice row under the rewrite box (the box handles its own keys)
          if (k === "ArrowUp") { e.preventDefault(); D.rwSel = -1; fillDeckCap(); updateButtons(); return true; }
          if (k === "ArrowLeft" || k === "ArrowRight") { e.preventDefault(); D.rwSel = D.rwSel === 1 ? 0 : 1; sfx("move"); fillDeckCap(); updateButtons(); return true; }
          if (k === "Enter" || k === " ") { e.preventDefault(); deckAct(); return true; }
          e.preventDefault(); return true;
        }
        if (k === "Enter" || k === " ") { e.preventDefault(); flash("kOpen"); deckAct(); return true; }
        if (end && k === "ArrowLeft") { e.preventDefault(); finishDeck(); return true; }
        if (!end && (k === "1" || k === "2" || k === "3")) { e.preventDefault(); if (!D.shown) toast("Enter first"); else gradeCard(+k - 1); return true; }
        if (D && D.shown && !end && (k === "ArrowLeft" || k === "ArrowRight")) {
          e.preventDefault(); const n = D.pick < 0 ? 1 : Math.max(0, Math.min(2, D.pick + (k === "ArrowRight" ? 1 : -1)));
          if (n !== D.pick) { D.pick = n; sfx("move"); fillDeckCap(); } return true;
        }
        if (k === "ArrowLeft") { e.preventDefault(); focusList(); return true; }
        if (k === "ArrowUp" || k === "ArrowDown" || k === "j" || k === "k") { e.preventDefault(); return true; }
      }
      if (onMap) {
        if (k === "ArrowUp" || k === "k") { e.preventDefault(); stepStop(1); return true; }
        if (k === "ArrowDown" || k === "j") { e.preventDefault(); stepStop(-1); return true; }
        if (k === "ArrowLeft" || k === "Backspace") { e.preventDefault(); focusList(); return true; }
        if (k === "Enter") { e.preventDefault(); flash("kOpen"); kOpen.onclick(); return true; }
      } else {
        if (k === "ArrowDown" || k === "j") { e.preventDefault(); selectItem(SS.li + 1); return true; }
        if (k === "ArrowUp" || k === "k") { e.preventDefault(); selectItem(SS.li - 1); return true; }
        if (k === "ArrowRight" || k === "Enter") { e.preventDefault(); flash("kOpen"); openItem(); return true; }
      }
    }
    if (k === "t" || k === "T" || k === " " || k === "s" || k === "S" || k === "Backspace") { e.preventDefault(); return true; }   // quest-only keys
    return false;   // M and B fall through to the card's own keys
  };
  weekGoalSection = (r) => {   // Today tab: today's lesson (can't be skipped), or the quest's week goal
    if (r.it.recall) {   // today's Recall: questions from past lessons
      const s = section(G.lock, "Study recall"), box = el("div", "wgoal"), n = r.done ? 0 : recallLeft();
      box.appendChild(el("div", "wgt", n ? "~" + Math.max(1, Math.round(n * 25 / 60)) + " min" : "Done"));
      box.addEventListener("click", (e) => { e.stopPropagation(); if (n) openRecall(); else setTab("learn"); });
      s.appendChild(box); detail.appendChild(s); return;
    }
    if (r.it.lesson) {   // a locked lesson: one line of what you learned closes it
      const x = SS.todays.find(z => ST[z.track].id === r.it.lessonTrack) || null, xs = x ? (sessAt(ST[x.track], x.m, x.s) || {}) : {};
      const s = section(G.lock, "Study lesson"), box = el("div", "wgoal");
      if (x && SS.log === x && !x.done) {
        box.appendChild(el("div", "wgt", xs.boss ? "What did you have to look up?" : xs.recall || "What did you learn?"));
        if (xs.recall && !xs.boss) box.appendChild(el("div", "wgm", "From memory"));
        const inp = el("input", "line"); inp.type = "text"; inp.placeholder = "One line"; inp.maxLength = 200; box.appendChild(inp);
        inp.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); const v = inp.value.trim(); if (v) finishLesson(v); } else if (e.key === "Escape") { e.preventDefault(); SS.log = null; renderDetail(r); } });
        setTimeout(() => inp.focus(), 30);
      } else {
        box.appendChild(el("div", "wgt", r.done ? "Done" : "Locked"));
        box.appendChild(el("div", "wgm", r.done ? ((x && x.line) || "") : xs.boss ? (xs.done || "No tutorial") : xs.recall ? xs.recall : "Done → one line"));
        box.addEventListener("click", (e) => { e.stopPropagation(); setTab("learn"); });
      }
      s.appendChild(box); detail.appendChild(s); return;
    }
    const g = goalOf(r.it); if (!g) return;
    const st = gState(g), s = section(G.goal, "This week's goal"), box = el("div", "wgoal");
    box.appendChild(put(el("div", "wgt"), g.title));
    box.appendChild(el("div", "wgm", st.label + " · " + g.area));
    box.addEventListener("click", (e) => { e.stopPropagation(); setTab("week"); const gc = gCards.find(x => x.g === g); if (gc) gSelect(gc, { sound: false }); });
    s.appendChild(box); detail.appendChild(s);
  };
  lessonDone = (r) => {   // ✓ on a lesson row asks for one line first; ✓ on Recall opens the cards
    if (r.it.recall) { if (!recallLeft()) return false; openRecall(); return true; }
    const x = SS.todays.find(z => ST[z.track].id === r.it.lessonTrack && !z.done);
    if (!x) return false;
    SS.log = x;
    if (!detailRow || detailRow !== r) openDetail(r); else renderDetail(r);
    if (full) renderDetail(r);
    updateButtons(); return true;
  };
  if (W && detailRow) renderDetail(detailRow);

  // preview only (?test=study): run a scripted session and write what happened into <pre id="qltest">, for headless checks
  if (params.get("test") === "study" && !window.QL_DATA) setTimeout(() => {
    const out = {}, key = (k, t) => (t || document.body).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const lines = () => SS.sub + ": " + sItems.slice(0, 8).map(z => ({ recall: "[R] ", today: "[T] ", pin: "[P] ", pick: "[?] ", slot: "[_] ", add: "[+] " }[z.kind] || "") + z.el.querySelector(".t").textContent.slice(0, 34)).join(" | ");
    const head = () => eyebrowEl.textContent + " | " + titleEl.textContent + " / " + subEl.textContent;
    const stampTx = () => { const a = document.querySelectorAll(".mstamp"); return a.length ? a[a.length - 1].textContent : ""; };
    const pick = (name) => { const z = sItems.find(z => z.kind === "track" && ST[z.ti].name.includes(name)); selectItem(sItems.indexOf(z), { sound: false }); };
    const later = (fn) => setTimeout(fn, 200);
    document.querySelector(".stage .hd").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    setTab("learn", false);
    out.start = lines(); out.startHead = head(); out.firstMode = SS.mode;
    out.strip = [...lnb.querySelectorAll(".ssub span")].map(s => (s.classList.contains("on") ? "*" : "") + s.textContent).join(" ");
    key("Tab"); out.roads = lines();
    pick("AI engineering"); key("p"); pick("Game dev"); key("p");
    key("Tab"); out.side = lines();
    pick("SLAM"); key("p");
    selectItem(sItems.findIndex(z => z.kind === "add"), { sound: false }); key("Enter"); out.addKey = toastEl.textContent;
    key("Tab"); out.after3 = lines(); out.head3 = head();
    key("Tab"); pick("Money"); key("p"); out.fourth = toastEl.textContent;
    key("Tab"); key("Tab");
    selectItem(sItems.findIndex(z => z.kind === "pin" && ST[z.ti].id === "godot"), { sound: false }); key("p");
    out.afterUnpin = lines();
    selectItem(sItems.findIndex(z => z.kind === "recall"), { sound: false }); key("Enter");
    out.deckLen = SS.deck ? SS.deck.q.length : 0;
    key("Enter"); key("3"); key("Enter"); key("1"); key("Enter"); key("ArrowLeft"); key("Enter"); key("Enter"); key("3"); key("Enter"); key("3");
    out.endScreen = (smap.querySelector(".rdone .rq") || {}).textContent; key("Enter");
    out.deckDone = !SS.deck; out.afterRecall = lines(); out.headR = head();
    selectItem(sItems.findIndex(z => z.kind === "today" && ST[z.ti].id === "cv"), { sound: false });
    later(() => {
      out.todayCap = (smap.querySelector(".scap .lb span") || {}).textContent + " / " + (smap.querySelector(".scap .sync") || {}).textContent;
      key("Tab"); key("d");   // D from Roads goes back to Plan and asks today's question
      later(() => {
        out.dFromRoads = SS.sub + " / " + (smap.querySelector(".scap .dt") || {}).textContent;
        const cin = smap.querySelector("input.line"); if (cin) { cin.value = "E has 9 entries up to scale, so 8 equations"; key("Enter", cin); }
        out.headAfterVision = head();
        setTab("today", false);
        const row = rows.find(r => r.it.lesson && r.it.lessonTrack === "s-szeliski");
        row.ck.click(); const tin = detail.querySelector(".wgoal input.line");
        if (tin) { tin.value = "two-frame SfM pipeline"; key("Enter", tin); }
        out.rowsDone = rows.filter(r => r.it.lesson).map(r => (r.it.recall ? "recall" : r.it.lessonTrack) + ":" + r.done).join(", ");
        setTab("learn", false); out.final = lines(); out.finalHead = head();
        const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
      });
    });
  }, 1500);
  // preview only (?test=behind): back from two weeks off
  if (params.get("test") === "behind" && !window.QL_DATA) setTimeout(() => {
    const out = {}, key = (k) => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const lines = () => SS.sub + ": " + sItems.slice(0, 5).map(z => z.kind + " " + z.el.querySelector(".t").textContent.slice(0, 40)).join(" | ");
    document.querySelector(".stage .hd").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    setTab("learn", false);
    out.waiting = allDue().length; out.today = dueCards().length; out.lines = lines(); out.head = titleEl.textContent + " / " + subEl.textContent;
    selectItem(sItems.findIndex(z => z.kind === "pick"), { sound: false }); pinIt(); out.afterPick = lines();
    key("Tab"); key("Tab"); selectItem(sItems.findIndex(z => z.kind === "track" && ST[z.ti].id === "s-szeliski"), { sound: false }); pinIt(); out.pins = SS.pins.length;
    setTimeout(() => { out.nudge = toastEl.textContent; const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); }, 100);
  }, 1500);
  // preview only (?test=recall): the hardened Recall keys
  if (params.get("test") === "recall" && !window.QL_DATA) setTimeout(() => {
    const out = {}, key = (k, t) => (t || document.body).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const cap = () => [...smap.querySelectorAll(".scap .dt, .scap .lb span, .scap .sync")].map(x => x.textContent).filter(Boolean).join(" / ");
    document.querySelector(".stage .hd").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    setTab("learn", false); openRecall();
    const D = SS.deck, c1 = D.q[0], due1 = c1.due;
    key("1"); out.before = toastEl.textContent + " · i=" + D.i;
    key("Enter"); key("Enter"); out.doubleEnter = "i=" + D.i + " · " + cap();
    key("3"); out.graded = "i=" + D.i + " · due " + c1.due;
    key("Backspace"); out.undo = "i=" + D.i + " · shown " + D.shown + " · due restored " + (c1.due === due1);
    key("3");
    const c2 = D.q[1]; c2.lapses = RC_LEECH - 1;
    key("Enter"); key("1"); out.rewrite = cap() + " · footer " + kOpen.textContent.trim() + "/" + kClose.textContent.trim();
    key("Escape", smap.querySelector(".scap input.line")); out.kept = toastEl.textContent + " · parked " + c2.parked + " · i=" + D.i;
    key("Backspace"); out.backToRewrite = !!D.rewrite + " · i=" + D.i;
    key("ArrowDown", smap.querySelector(".scap input.line")); key("ArrowRight"); out.parkSel = cap() + " · footer " + kOpen.textContent.trim();
    key("Enter"); out.parked = c2.parked + " · " + toastEl.textContent;
    key("Backspace"); out.unparked = "parked " + c2.parked + " · rewrite " + !!D.rewrite;
    const inp = smap.querySelector(".scap input.line"); inp.value = ""; key("Enter", inp); out.empty = toastEl.textContent;
    const inp2 = smap.querySelector(".scap input.line"); inp2.value = "Only in active frames"; key("Enter", inp2); out.saved = c2.a + " · due " + c2.due + " · lapses " + c2.lapses;
    let guard = 0; while (SS.deck && SS.deck.i < SS.deck.q.length && guard++ < 12) { key("Enter"); key("3"); }
    out.end = (smap.querySelector(".rdone .rq") || {}).textContent + " · next " + (smap.querySelector(".rdone .rat") || {}).textContent + " · footer " + kOpen.textContent.trim() + "/" + kTrack.textContent.trim();
    key("Backspace"); out.undoFromEnd = "i=" + SS.deck.i + " of " + SS.deck.q.length;
    key("3"); key("Enter"); out.closed = !SS.deck + " · " + ((document.querySelector(".mstamp") || {}).textContent || "") + " · days " + SS.recallDays.join(",");
    const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }, 1500);
  // preview only (?test=light / ?test=week): the light-day valve, the boss on the map, the Week's words
  if (params.get("test") === "light" && !window.QL_DATA) setTimeout(() => {
    const out = {}, key = (k, t) => (t || document.body).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const done = () => { const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); };
    document.querySelector(".stage .hd").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    setTab("learn", false);
    const cvi = ST.findIndex(t => t.id === "cv"), cards0 = SS.cards.length, pos0 = JSON.stringify(ST[cvi].pos);
    selectItem(sItems.findIndex(z => z.kind === "today" && z.ti === cvi), { sound: false });
    out.footer0 = kTrack.textContent.trim();
    key("l");
    setTimeout(() => {
      const row = sItems.find(z => z.kind === "today" && z.ti === cvi);
      out.row = row ? row.el.querySelector(".t").textContent : "-";
      out.cap = [...smap.querySelectorAll(".scap .dm span, .scap .lb span, .scap .tx, .scap .sync")].map(x => x.textContent).join(" / ");
      out.head = titleEl.textContent + " / " + subEl.textContent; out.footer1 = kTrack.textContent.trim(); out.toast = toastEl.textContent;
      key("d");
      setTimeout(() => {
        out.prompt = (smap.querySelector(".scap .lb span") || {}).textContent;
        const inp = smap.querySelector("input.line"); if (inp) { inp.value = "Watched 15 min, wrote one line"; key("Enter", inp); }
        out.after = toastEl.textContent + " · road unchanged " + (JSON.stringify(ST[cvi].pos) === pos0) + " · new cards " + (SS.cards.length - cards0);
        out.rowDone = rows.filter(r => r.it.lesson && r.it.lessonTrack === "cv").map(r => r.done).join(",");
        setSub("roads", false); selectItem(sItems.findIndex(z => z.kind === "track" && z.ti === cvi), { sound: false });
        setTimeout(() => { const b = smap.querySelectorAll(".sdot.boss"); out.boss = b.length + " bosses · " + (b[0] ? b[0].offsetWidth + "px" : "-") + " · icon " + !!(b[0] && b[0].querySelector("svg")); done(); }, 250);
      }, 250);
    }, 250);
  }, 1500);
  if (params.get("test") === "week" && !window.QL_DATA) setTimeout(() => {
    const out = {};
    document.querySelector(".stage .hd").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    setTab("week", false);
    out.head = titleEl.textContent + " / " + subEl.textContent;
    out.badge = badgeW.className + " · text '" + badgeW.textContent + "' · " + badgeW.title + " · hidden " + badgeW.hidden;
    out.marker = document.querySelectorAll(".wcb .mk.g-behind svg").length + " clock markers · " + document.querySelectorAll(".wcb .mk b").length + " '!' marks";
    out.tag = (document.querySelector(".wdesc .dm .st") || {}).textContent;
    const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }, 1500);
  // preview only (?test=boxes): what each description box says, for headless checks
  if (params.get("test") === "boxes" && !window.QL_DATA) setTimeout(() => {
    const out = {}, txt = (root) => [...root.querySelectorAll(".dm span, .dt, .lb span, .tx, .sync")].map(x => x.textContent.trim()).filter(Boolean).join(" | ");
    const done = () => { const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); };
    document.querySelector(".stage .hd").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    setTab("learn", false);
    const ti = sItems.findIndex(z => z.kind === "today"); selectItem(ti, { sound: false });
    setTimeout(() => {
      out.today = txt(capEl);
      const pk = sItems.findIndex(z => z.kind === "pick"); selectItem(pk, { sound: false });
      setTimeout(() => {
        out.pick = txt(capEl);
        focusMap(); const mi = stops.findIndex(z => z.kind === "m" && z.m === ST[SS.sel].pos.m); SS.stop = mi; fillCap(); out.milestone = txt(capEl);
        const later = stops.findIndex((z, k) => z.kind === "s" && lessonState(ST[SS.sel], z.m, z.s) === "ahead" && !(sessAt(ST[SS.sel], z.m, z.s) || {}).boss); SS.stop = later; fillCap(); out.later = txt(capEl);
        focusList(); openRecall(); out.recall = txt(capEl); SS.deck.shown = true; renderDeck(); out.reveal = txt(capEl);
        setTab("week", false); out.week = txt(wdesc) + " · badge hidden " + badgeW.hidden;
        done();
      }, 250);
    }, 250);
  }, 1500);
  // preview only (?test=theme): the theme picker
  if (params.get("test") === "theme" && !window.QL_DATA) setTimeout(() => {
    const out = {}, key = (k) => window.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const th = () => document.documentElement.dataset.theme || "tablet";
    out.start = th(); key("o"); out.open = !document.querySelector(".thm").hidden;
    key("ArrowDown"); out.preview = th(); key("Escape"); out.afterEsc = th() + " · open " + !document.querySelector(".thm").hidden;
    key("o"); key("ArrowDown"); key("ArrowDown"); key("Enter"); out.kept = th();
    let saved = null; try { saved = localStorage.getItem("ql.theme"); } catch (e) {} out.saved = saved;
    out.button = !!document.querySelector(".tabs .thb");
    try { localStorage.removeItem("ql.theme"); } catch (e) {}
    const pre = el("pre"); pre.id = "qltest"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }, 1500);
  const runDemo = () => {   // preview only: open a state for screenshots
    if (DEMO === "claim") { if (tab !== "week") setTab("week", false); const gc = gCards.find(x => gState(x.g).key === "ready"); if (gc) { gSelect(gc, { sound: false }); openClaim(gc.g); } }
    else if (DEMO === "pinned") {   // two pins: the road the rhythm suggests, and a side quest
      if (tab !== "learn") setTab("learn", false);
      const pk = sItems.findIndex(z => z.kind === "pick"); if (pk >= 0) { selectItem(pk, { sound: false }); pinIt(); }
      setSub("side", false); const sq = sItems.findIndex(z => z.kind === "track" && ST[z.ti].id === "s-szeliski"); if (sq >= 0) { selectItem(sq, { sound: false }); pinIt(); }
      setSub("plan", false); selectItem(sItems.findIndex(z => z.kind === "pin" && ST[z.ti].id === "s-szeliski"), { sound: false });
    }
    else if (DEMO === "map") { if (tab !== "learn") setTab("learn", false); focusMap(); }
    else if (DEMO === "leech") { if (tab !== "learn") setTab("learn", false); openRecall(); const D = SS.deck; if (D) { D.q[0].lapses = RC_LEECH - 1; D.shown = true; gradeCard(0); renderDeck(); updateButtons(); } }
    else if (DEMO === "behind") { if (tab !== "learn") setTab("learn", false); }
    else if (DEMO === "recalldone") { if (tab !== "learn") setTab("learn", false); openRecall(); let g = 0; while (SS.deck && SS.deck.i < SS.deck.q.length && g++ < 30) { SS.deck.shown = true; gradeCard(2); } }
    else if (DEMO === "light") { if (tab !== "learn") setTab("learn", false); const i = sItems.findIndex(z => z.kind === "today" && ST[z.ti].id === "cv"); if (i >= 0) { selectItem(i, { sound: false }); lightIt(); } }
    else if (DEMO === "themes") { if (window.QL_THEME) window.QL_THEME.open(); }
    else if (DEMO === "side") { if (tab !== "learn") setTab("learn", false); setSub("side", false); }
    else if (DEMO === "recall") { if (tab !== "learn") setTab("learn", false); openRecall(); if (SS.deck) { SS.deck.shown = true; renderDeck(); updateButtons(); } }
    else if (DEMO === "boss") {   // the Backend road, cursor on its first boss
      if (tab !== "learn") setTab("learn", false);
      setSub(ST.some(t => t.id === params.get("road") && t.kind === "side") ? "side" : "roads", false);
      const i = sItems.findIndex(z => z.kind === "track" && ST[z.ti].id === (params.get("road") || "backend")); if (i < 0) return;
      selectItem(i, { sound: false }); focusMap();
      setTimeout(() => { const bi = stops.findIndex(z => z.kind === "s" && (sessAt(ST[SS.sel], z.m, z.s) || {}).boss); if (bi >= 0) { SS.stop = bi; placeScur(); fillCap(); updateButtons(); } }, 150);
    }
  };


  /* ----- themes: O opens the list; ↑↓ previews live; Enter keeps; Esc goes back to the theme you had ----- */
  {
    const THEMES = window.QL_THEMES || [["tablet", "Tablet", []]], root = document.documentElement, KEY = "ql.theme";
    const load = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
    let freezeT = 0;
    const apply = (k) => {
      if ((root.dataset.theme || "tablet") === (k || "tablet")) return;
      root.classList.add("qlfreeze");   // a theme switch must not start hundreds of colour and position transitions at once: they are what made it stutter
      if (!k || k === "tablet") delete root.dataset.theme; else root.dataset.theme = k;
      if (tab === "learn" && (full || gOpen)) nextFrame(renderMap);
      cancelAnimationFrame(freezeT); freezeT = requestAnimationFrame(() => { freezeT = requestAnimationFrame(() => root.classList.remove("qlfreeze")); });
    };
    const holdWindow = (on) => {   // the corner card's window follows the card's height: while the list is open it keeps one height (the list must fit), and the window moves once, not on every preview
      if (full) { window.QL_HOLD_H = 0; return; }
      window.QL_HOLD_H = on ? Math.max(Math.ceil(cardEl.getBoundingClientRect().height), Math.ceil(panel.offsetHeight) + 48) : 0;
      report("resize");
    };
    let cur = params.get("theme") || load() || "tablet", before = cur, ti = 0;
    if (!THEMES.some(t => t[0] === cur)) cur = "tablet";
    apply(cur);
    const ov = el("div", "thm"), panel = el("div", "tp"); ov.hidden = true; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Theme");
    panel.appendChild(el("div", "tt", "Theme"));
    const rowsT = THEMES.map(([k, label, sw], i) => {
      const r = el("div", "tr"); r.setAttribute("role", "option"); r.appendChild(el("span", null, label));
      const s = el("span", "sw"); sw.forEach(c => { const d = el("i"); d.style.background = c; s.appendChild(d); }); r.appendChild(s);
      r.addEventListener("click", (e) => { e.stopPropagation(); pickT(i); keepT(); });   // hover only highlights: a live preview moved the rows under the pointer
      panel.appendChild(r); return r;
    });
    panel.appendChild(el("div", "th", "↑↓  Enter  Esc"));
    panel.addEventListener("click", (e) => {   // a click in the gap between two rows counts for the nearest one
      if (e.target.closest(".tr")) return;
      const n = rowsT.findIndex(x => { const b = x.getBoundingClientRect(); return e.clientY >= b.top - 6 && e.clientY <= b.bottom + 6; });
      if (n >= 0) { e.stopPropagation(); pickT(n); keepT(); }
    });
    ov.appendChild(panel); document.body.appendChild(ov);
    let applyT = 0;
    const pickT = (i) => {   // the highlight moves at once; the whole card is re-skinned once the arrows pause (re-skinning costs ~100 ms: not once per key repeat)
      const n = (i + rowsT.length) % rowsT.length; if (n !== ti) sfx("move"); ti = n;
      rowsT.forEach((r, j) => { r.classList.toggle("sel", j === ti); r.setAttribute("aria-selected", j === ti); });
      const k = THEMES[ti][0]; clearTimeout(applyT); applyT = setTimeout(() => apply(k), 70);
    };
    const openT = () => { before = cur; window.QL_PREVIEW = true; ov.hidden = false; holdWindow(true); ti = -1; pickT(Math.max(0, THEMES.findIndex(t => t[0] === cur))); };
    const closeT = (play) => { window.QL_PREVIEW = false; ov.hidden = true; if (window.QL_THEME_ENTERED) window.QL_THEME_ENTERED(play); holdWindow(false); };
    const keepT = () => { cur = THEMES[ti][0]; clearTimeout(applyT); apply(cur); closeT(true); try { localStorage.setItem(KEY, cur); } catch (e) {} post({ action: "theme", name: cur }); sfx("select", 0); };
    const backT = () => { clearTimeout(applyT); apply(before); cur = before; closeT(false); sfx("cancel", 0); };
    ov.addEventListener("click", (e) => { if (e.target === ov) backT(); });
    window.addEventListener("keydown", (e) => {
      if (e.target && e.target.closest && e.target.closest("input, textarea")) return;
      if (!ov.hidden) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.key === "ArrowDown" || e.key === "j") pickT(ti + 1);
        else if (e.key === "ArrowUp" || e.key === "k") pickT(ti - 1);
        else if (e.key === "Enter" || e.key === " ") keepT();
        else if (e.key === "Escape" || e.key === "o" || e.key === "O") backT();
        return;
      }
      if ((e.key === "o" || e.key === "O") && !e.metaKey && !e.ctrlKey && !e.altKey && !urgent) { e.preventDefault(); e.stopImmediatePropagation(); openT(); }
    }, true);
    const tb = document.querySelector(".tabs");
    if (tb) {
      const b = el("span", "thb"); b.title = "Theme (O)"; b.setAttribute("role", "button"); b.setAttribute("aria-label", "Theme");
      b.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1.8a6.2 6.2 0 1 0 0 12.4c1 0 1.5-.6 1.5-1.3 0-.9-.8-1.2-.8-2 0-.7.6-1.2 1.4-1.2h1.6a2.5 2.5 0 0 0 2.5-2.5C14.2 4.3 11.4 1.8 8 1.8z"/><circle cx="4.9" cy="7.4" r=".9" fill="currentColor"/><circle cx="7.3" cy="4.7" r=".9" fill="currentColor"/><circle cx="10.6" cy="5.4" r=".9" fill="currentColor"/></svg>';
      b.addEventListener("click", (e) => { e.stopPropagation(); openT(); }); tb.appendChild(b);
    }
    window.QL_THEME = { open: openT, list: THEMES.map(t => t[0]), get: () => cur };
  }
