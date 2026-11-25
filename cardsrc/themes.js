
  /* ----- v15 themes: whole worlds (Pocket LCD, Tear-off calendar). Keys, data and behaviour stay; a theme brings its
     own words, pictograms, numerals, layout, motion and sounds. Everything added here is inert in the default theme. ----- */
  /* the later worlds (theme_<key>.js, appended after this file) register here; each entry may have:
       words    { "Done": "Board", ... }   the footer and action labels it renames
       decorate()                        after every change while it is on (batched per frame); add only nodes its CSS shows
       detail(r, pane)                   when a Today row is opened in the detail pane
       onSfx(name)                       with every sound ("done" is the moment to stage)
       onEnter()                         when it is switched on, and once at start if it is the theme
       sounds   true                     it has sounds/<key>/*.wav
     THEME_HELP has the shared readers: rowInfo(r), itemInfo(it), sessInfo(x), recallMin(), now(), two(n), segs(txt), TH() */
  const THEME_EXT = {}, THEME_HELP = {};
  {
    const root = document.documentElement;
    const TH = () => root.dataset.theme || "";
    const WORDS = {
      lcd: { "Done": "Clear", "Light": "Lite", "Close": "Off", "Not done yet": "Undo", "Minimize": "Mini", "Open in Notion": "Notion", "Pin for tomorrow": "Pin", "Details": "Open" },
      calendar: { "Done": "Tear off", "Not done yet": "Put back", "Pin for tomorrow": "Pin" },
    };
    const EMO = { "⭐": "star", "🧩": "puzzle", "🎮": "pad", "🔒": "lock", "↩": "back" };
    const SEG = { 0: "ABCDEF", 1: "BC", 2: "ABGED", 3: "ABGCD", 4: "FGBC", 5: "AFGCD", 6: "AFGEDC", 7: "ABC", 8: "ABCDEFG", 9: "ABCDFG", "-": "G" };
    const POLY = { A: "8,7 13,2 47,2 52,7 47,12 13,12", B: "54,9 59,14 59,43 54,48 49,43 49,14", C: "54,52 59,57 59,86 54,91 49,86 49,57",
      D: "8,93 13,88 47,88 52,93 47,98 13,98", E: "6,52 11,57 11,86 6,91 1,86 1,57", F: "6,9 11,14 11,43 6,48 1,43 1,14", G: "8,50 13,45 47,45 52,50 47,55 13,55" };
    const sym = (id, segs) => '<symbol id="' + id + '" viewBox="0 0 60 100">' + segs.split("").map(s => '<polygon points="' + POLY[s] + '"/>').join("") + "</symbol>";
    document.body.insertAdjacentHTML("beforeend", '<svg class="qsprite" aria-hidden="true"><defs>' +
      Object.keys(SEG).map(k => sym("qs" + (k === "-" ? "m" : k), SEG[k])).join("") + "</defs></svg>");
    const segs = (txt) => {   // seven-segment digits: every cell shows its ghost 8 under the lit segments
      const ch = String(txt).split("");
      return '<svg class="seg" viewBox="0 0 ' + (ch.length * 74 - 14) + ' 100" aria-hidden="true">' + ch.map((c, i) =>
        '<use class="gh" href="#qs8" x="' + i * 74 + '" width="60" height="100"/><use class="l" href="#qs' + (c === "-" ? "m" : c) + '" x="' + i * 74 + '" width="60" height="100"/>').join("") + "</svg>";
    };
    const two = (n) => n ? String(Math.min(99, n)).padStart(2, "0") : "--";
    const DAYS_L = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const now = () => { const d = new Date(); return { d, wd: DAYS_L[d.getDay()], my: MONTHS[d.getMonth()] + " " + d.getFullYear(), day: d.getDate(), mon: MONTHS[d.getMonth()].slice(0, 3) }; };

    /* what a row is and how long it takes (minutes known only for Recall and lessons) */
    const sessInfo = (x) => { const t = ST[x.track], s = sessAt(t, x.m, x.s) || {}; return { pict: s.boss ? "boss" : "lesson", min: x.light ? 10 : (s.minutes || 0), road: t.name, boss: !!s.boss }; };
    const recallMin = () => { const n = recallLeft(); return n ? Math.max(1, Math.round(n * 25 / 60)) : 0; };
    const rowInfo = (r) => {
      const it = r.it || {};
      if (it.recall) return { pict: "recall", min: r.done ? 0 : recallMin(), road: "Recall" };
      if (it.lesson) { const x = SS.todays.find(z => ST[z.track].id === it.lessonTrack); if (x) return sessInfo(x); return { pict: "lesson", min: 0, road: "Study" }; }
      return { pict: ["main", "side", "fun"].includes(it.type) ? it.type : "side", min: 0, road: it.questline || "" };
    };
    const itemInfo = (it) => {
      if (it.kind === "recall") return { pict: "recall", min: recallMin() };
      if (it.kind === "today" || it.kind === "pin") return sessInfo(it.x);
      if (it.kind === "next") return sessInfo({ track: it.ti, m: it.m, s: it.s });
      if (it.kind === "parked") return { pict: "lock", min: 0, none: true };
      if (it.kind === "pick") { const t = ST[it.ti]; return sessInfo({ track: it.ti, m: t.pos.m, s: t.pos.s }); }
      if (it.kind === "slot") return { pict: "pin", min: 0, none: true };
      if (it.kind === "add") return { pict: "add", min: 0, none: true };
      return { pict: ST[it.ti] && ST[it.ti].kind === "side" ? "side" : "road", min: 0, none: true };
    };
    const setPict = (node, p) => { if (node && node.dataset.pict !== p) node.dataset.pict = p; };
    const setNum = (node, n, none) => {   // none: no number cell at all (roads, Add); otherwise "--" when the minutes are unknown
      const v = none ? "" : two(n);
      let b = node.querySelector(":scope > .tnum");
      if (b && b.dataset.v === v) return;
      if (!b) { b = document.createElement("span"); b.className = "tnum"; node.appendChild(b); }
      b.dataset.v = v; b.innerHTML = v ? "<b>" + (n ? v : "—") + "</b>" + segs(v) : "";
    };

    /* the big number for the selected Today item: minutes in Pocket LCD, the sheet's numeral in Tear-off calendar */
    const tbig = (r) => {
      const map = detail.querySelector(".dmap"); if (!map) return;
      const f = rowInfo(r), n = now(), box = document.createElement("div");
      box.className = "tbig" + (f.min ? "" : " nomin"); box.dataset.pict = f.pict;
      const cells = Array.from({ length: 18 }, (_, i) => '<i class="' + (i < (f.min ? Math.max(1, Math.round(Math.min(90, f.min) / 5)) : 0) ? "on" : "") + '"></i>').join("");
      box.innerHTML =
        '<div class="tb-band"><span>' + n.wd + "</span><small>" + n.my + "</small></div>" +
        '<div class="tb-road"><i class="qpic" data-pict="' + f.pict + '"></i><span></span><em class="tb-boss' + (f.boss ? " on" : "") + '"><i class="qpic" data-pict="boss"></i>Boss</em></div>' +
        '<div class="tb-num">' + segs(two(f.min)) + "<b>" + (f.min ? f.min : n.day) + '</b><span class="tb-side"><span class="tb-min">min</span><span class="tb-mon">' + n.mon + '</span><span class="tb-road2"></span><em class="tb-boss' + (f.boss ? " on" : "") + '"><i class="qpic" data-pict="boss"></i>Boss</em></span></div>' +
        '<div class="tb-bar">' + cells + "</div>" +
        '<div class="tb-date"><small>' + n.wd.slice(0, 3) + "</small><b>" + n.day + "</b></div>";
      box.querySelector(".tb-road span").textContent = f.road || "";
      box.querySelector(".tb-road2").textContent = f.min ? (f.road || "") : "";
      map.appendChild(box);
    };
    const wgs0 = weekGoalSection;
    weekGoalSection = (r) => { wgs0(r); try { tbig(r); const X = THEME_EXT[TH()]; if (X && X.detail) X.detail(r, detail); } catch (e) { /* decoration only */ } };

    /* the band of printed pictograms (Pocket LCD): lit when true right now, ghost otherwise */
    const band = () => {
      const tabs = document.querySelector(".tabs"); if (!tabs) return;
      let b = tabs.querySelector(".tband"); if (!b) { b = document.createElement("span"); b.className = "tband"; b.setAttribute("aria-hidden", "true"); tabs.appendChild(b); }
      const todays = openTodays(), lit = { day: 1, lesson: todays.length > 0, recall: recallLeft() > 0,
        boss: todays.some(x => sessInfo(x).boss), pin: SS.pins.length > 0 };
      const n = now(), day = kind === "evening" ? "moon" : "sun", key = JSON.stringify(lit) + day + n.day;
      if (b.dataset.k === key) return; b.dataset.k = key;
      b.innerHTML = [["day", day], ["lesson", "lesson"], ["recall", "recall"], ["boss", "boss"], ["pin", "pin"]]
        .map(([k, p]) => '<i class="qpic' + (lit[k] ? "" : " g") + '" data-pict="' + p + '"></i>').join("") +
        '<b class="tclear">Clear</b><b class="tdate">' + n.wd.slice(0, 3) + " " + n.day + "/" + (n.d.getMonth() + 1) + "</b>";
    };

    const words = () => {
      const W = WORDS[TH()] || (THEME_EXT[TH()] && THEME_EXT[TH()].words) || null;
      document.querySelectorAll(".ft .kp > span, .dact > span").forEach(s => {
        const cur = s.textContent;
        if (s.dataset.w1 !== undefined && cur !== s.dataset.w1) { delete s.dataset.w0; delete s.dataset.w1; }
        if (W && W[cur] !== undefined) { s.dataset.w0 = cur; s.dataset.w1 = W[cur]; s.textContent = W[cur]; }
        else if (!W && s.dataset.w0 !== undefined && cur === s.dataset.w1) { s.textContent = s.dataset.w0; delete s.dataset.w0; delete s.dataset.w1; }
      });
    };

    const decorate = () => {
      rows.forEach(r => { if (!r.el) return; const f = rowInfo(r); setPict(r.el, f.pict); setNum(r.el, f.min, false); });
      sItems.forEach(it => { if (!it.el) return; const f = itemInfo(it); setPict(it.el, f.pict); setNum(it.el, f.min, f.none); });
      document.querySelectorAll(".wcb .q").forEach(q => setPict(q, q.classList.contains("lesson-plate") ? "lesson" : "goal"));
      document.querySelectorAll(".sh").forEach(h => { const t = (h.textContent || "").trim().toLowerCase(); const v = t.startsWith("tomorrow") ? "tomorrow" : t.startsWith("today") ? "today" : ""; if (h.dataset.sec !== v) h.dataset.sec = v; });
      document.querySelectorAll(".emo:not([data-emo])").forEach(e => { const k = EMO[(e.textContent || "").replace(/[\uFE0E\uFE0F]/g, "").trim()]; e.dataset.emo = k || ""; });
      const sp = [...document.querySelectorAll(".sidepane")].find(x => !x.hidden && !x.classList.contains("ttear"));   // the calendar's stack: one page edge per step still open
      if (sp) { const left = tab === "learn" ? openTodays().length + (recallLeft() > 0 ? 1 : 0) : rows.filter(r => !r.done).length, v = String(Math.min(6, left)); if (sp.dataset.left !== v) sp.dataset.left = v; }
      const today = dayLabel(todayIso());
      document.querySelectorAll(".giver .loc").forEach(l => { const v = l.textContent.trim() === today ? "1" : ""; if (l.dataset.today !== v) l.dataset.today = v; });
      band(); words();
      const X = THEME_EXT[TH()]; if (X && X.decorate) X.decorate();
    };
    Object.assign(THEME_HELP, { rowInfo, itemInfo, sessInfo, recallMin, now, two, segs, TH });
    let queued = false;
    const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; try { decorate(); } catch (e) { /* decoration only */ } }); };
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(later).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    later();

    /* sounds: each world plays its own pack (sounds/<theme>/<name>.wav) */
    window.QL_SFX_PACK = () => ({ lcd: "lcd", calendar: "calendar" })[TH()] || (THEME_EXT[TH()] && THEME_EXT[TH()].sounds ? TH() : "");

    /* Pocket LCD powers on with a segment test: every ghost lights for half a second, then only the truth stays lit */
    const lcdTest = () => {
      const X = THEME_EXT[TH()]; if (X && X.onEnter) { try { X.onEnter(); } catch (e) { /* decoration only */ } }
      if (TH() !== "lcd") return; document.body.classList.add("ltest"); setTimeout(() => document.body.classList.remove("ltest"), 520); };
    let lastTheme = TH(), enterDue = false;
    new MutationObserver(() => { if (TH() !== lastTheme) { lastTheme = TH(); if (window.QL_PREVIEW) enterDue = true; else lcdTest(); } }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.QL_THEME_ENTERED = (play) => { const d = enterDue; enterDue = false; if (play && d) lcdTest(); };   // the picker closed: a kept theme does its entrance once; a cancelled preview does not
    if (document.body.classList.contains("go")) lcdTest();
    else new MutationObserver((m, o) => { if (document.body.classList.contains("go")) { o.disconnect(); lcdTest(); } }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    /* the one authored moment per world, on Done: the LCD flashes CLEAR; the calendar tears the sheet off */
    const tear = () => {   // a copy of the sheet tears off and falls; the real one underneath already shows the new state
      const sp = [...document.querySelectorAll(".sidepane")].find(x => !x.hidden && x.offsetWidth && !x.classList.contains("ttear")); if (!sp) return;
      const r = sp.getBoundingClientRect(), sheet = sp.cloneNode(true);
      sheet.classList.add("ttear"); sheet.removeAttribute("id"); sheet.setAttribute("aria-hidden", "true");
      [["position", "fixed"], ["left", r.left + "px"], ["top", r.top + "px"], ["width", r.width + "px"], ["height", r.height + "px"], ["margin", "0"], ["z-index", "60"]]
        .forEach(([k, v]) => sheet.style.setProperty(k, v, "important"));   // the full-screen layout pins the side pane with !important
      document.body.appendChild(sheet);
      sheet.addEventListener("animationend", () => sheet.remove(), { once: true });
      setTimeout(() => sheet.remove(), 1400);
    };
    const flashClear = () => { document.body.classList.remove("lcd-clear"); void document.body.offsetWidth; document.body.classList.add("lcd-clear"); setTimeout(() => document.body.classList.remove("lcd-clear"), 900); };
    window.QL_SFX_HOOK = (name) => {
      const X = THEME_EXT[TH()]; if (X && X.onSfx) X.onSfx(name);
      if (name !== "done") return;
      if (TH() === "calendar" && !matchMedia("(prefers-reduced-motion: reduce)").matches) tear();
      else if (TH() === "lcd") flashClear();
    };
  }
