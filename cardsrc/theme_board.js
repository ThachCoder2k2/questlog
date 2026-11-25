
  /* ----- Departure board: a gate board and a boarding pass. Short fields (road, minutes, status, the clock) are split-flap
     cells that flip when they change; titles stay plain type. Done flaps the status to DONE and tears the stub off the pass. ----- */
  {
    const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DRUM = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.:/&";   // the order of the leaves on a flap drum
    const MON3 = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const FLIP = 90, STEP = 80, STAGGER = 36;                    // ms: one leaf, one step on the drum, one cell to the next (keep FLIP = --fd in the CSS)
    const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

    /* ---------- the flap engine: a field is a row of cells; a cell shows one character and flips to the next ---------- */
    const field = (cls, n) => {
      const f = mk("span", "board-x board-fl " + cls); f.setAttribute("aria-hidden", "true");
      f._n = n; f._c = [];
      for (let i = 0; i < n; i++) { const c = mk("i"); c.dataset.c = " "; c.dataset.o = " "; f.appendChild(c); f._c.push(c); }
      return f;
    };
    const setCell = (c, ch) => { c.dataset.c = ch; c.dataset.o = ch; if (c.firstChild) c.textContent = ""; };
    const flipCell = (c, ch) => {   // one leaf: the old character folds down, the new one is underneath
      const old = c.dataset.c; if (old === ch) return;
      c.textContent = ""; c.dataset.o = old; c.dataset.c = ch;
      const s = mk("s"); s.dataset.o = old; s.dataset.c = ch; c.appendChild(s);
      setTimeout(() => { if (c.firstChild === s) { s.remove(); c.dataset.o = c.dataset.c; } }, FLIP + 20);
    };
    const drum = (a, b, max) => {   // the characters a drum shows on its way from a to b (spread evenly, ends on b)
      const ia = DRUM.indexOf(a), ib = DRUM.indexOf(b); if (ia < 0 || ib < 0) return [b];
      const d = (ib - ia + DRUM.length) % DRUM.length, n = Math.min(max, d), out = [];
      for (let k = 1; k <= n; k++) out.push(DRUM[(ia + Math.round(d * k / n)) % DRUM.length]);
      return out;
    };
    const flapTo = (f, text, o = {}) => {
      const t = String(text).toUpperCase().padEnd(f._n, " ").slice(0, f._n), anim = !RM() && !o.now;
      const sg = o.stagger != null ? o.stagger : STAGGER, sp = o.step || STEP, ns = o.steps || 3;
      f.dataset.v = text; f._tok = (f._tok || 0) + 1; const tok = f._tok; let last = 0;
      f._c.forEach((c, i) => {
        const to = t[i];
        if (c.dataset.c === to && !o.force) return;
        if (!anim) { setCell(c, to); return; }
        drum(c.dataset.c, to, ns).forEach((ch, k) => {
          const at = (o.delay || 0) + i * sg + k * sp; last = Math.max(last, at + FLIP);
          setTimeout(() => { if (f._tok === tok) flipCell(c, ch); }, at);
        });
        setTimeout(() => { if (f._tok === tok && c.dataset.c !== to) setCell(c, to); }, (o.delay || 0) + i * sg + ns * sp + FLIP + 60);
      });
      if (o.kind !== undefined) {
        if (!anim || o.kind !== "done") f.dataset.k = o.kind;                    // a clear lights up at the end of the cascade; everything else at once
        else setTimeout(() => { if (f._tok === tok) f.dataset.k = o.kind; }, last);
      }
    };
    const upd = (parent, cls, n, text, kind) => {
      let f = parent.querySelector(":scope > ." + cls);
      if (!f) { f = field(cls, n); parent.appendChild(f); flapTo(f, text, { now: true, kind }); return; }
      if (f.dataset.v !== text) flapTo(f, text, { kind });
    };
    let introAt = 0;
    const intro = () => {   // when the card opens: minutes, status and the clock settle row by row in under 400 ms; roads and titles are readable throughout
      if (RM() || performance.now() - introAt < 300) return; introAt = performance.now();
      const fs = [...document.querySelectorAll(".board-fl:not(.bf-rd)")].filter(f => f.getClientRects().length && f.dataset.v !== undefined);
      fs.forEach((f, i) => { f._tok = (f._tok || 0) + 1; f._c.forEach(c => setCell(c, " ")); flapTo(f, f.dataset.v, { delay: Math.min(120, Math.floor(i / 3) * 18), force: true, stagger: 16, step: 45, steps: 2 }); });
    };

    /* ---------- what a row says: road, minutes, status ---------- */
    const split = (r) => {
      const it = r.it || {}, title = it.title || ""; let m;
      if (it.recall || /^Study · Recall/.test(title)) return { road: "Recall", pre: "Study · " };
      if ((m = /^Study · ([^:]{1,24}):\s*/.exec(title))) return { road: m[1], pre: m[1].length <= 8 ? m[0] : "" };
      if ((m = /^([^:]{1,24}):\s+/.exec(title))) { const p = m[1]; return p.length <= 8 ? { road: p, pre: m[0] } : { road: p.split(/\s+/)[0], pre: "" }; }
      const ql = String(it.questline || "").trim();
      return { road: (ql ? ql : title).split(/\s+/)[0] || "", pre: "" };
    };
    const wrapTitle = (t, sp) => {   // the road moves into its own cell: its words fade out of the title, the first letter is capitalised
      if (!t || !sp.pre) return;
      if (t.firstElementChild && t.firstElementChild.classList.contains("board-pre")) return;
      const full = t.textContent; if (!full.startsWith(sp.pre)) return;
      const rest = full.slice(sp.pre.length); if (!rest) return;
      t.textContent = "";
      t.append(mk("span", "board-pre", ""), mk("span", "board-c", ""), document.createTextNode(rest.slice(1)));
      t.firstChild.textContent = sp.pre; t.childNodes[1].textContent = rest.charAt(0);
    };
    const live = (r) => !!(r.now && r.now.status === STATUS.grinding);
    const locked = (r) => !!((r.it || {}).lesson || /🔒|can.t skip/i.test(((r.it || {}).tags || []).join(" ")));
    const carried = (r) => { const d = parseIso((r.now && r.now.date) || (r.it || {}).date); return d && isoOf(d) < todayIso() ? d : null; };
    const dueTime = (r) => {   // "Due Today 17:00" on the alert card
      const it = r.it || {}, m = /Due\b[^0-9]*(\d{1,2}:\d{2})/i.exec((it.tags || []).join(" "));
      if (m) return m[1].padStart(5, "0");
      const d = it.due ? new Date(it.due) : null; return d && !isNaN(d) ? String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "";
    };
    const statusOf = (r, isNext) => {
      if (r.done) return ["DONE", "done"];
      if (live(r)) return ["NOW", "now"];
      if (kind === "urgent") { const t = dueTime(r); if (t) return ["DUE " + t, "from"]; }
      if (isNext) return ["NEXT", "next"];
      if (r.now && r.now.status === STATUS.delay) return ["DELAYED", "from"];
      if (locked(r)) return ["LOCKED", "locked"];
      const d = carried(r); if (d) return ["FROM " + MON3[d.getDay()], "from"];
      if (/rolls to tomorrow/i.test(((r.it || {}).tags || []).join(" "))) return ["TOMORROW", "open"];
      if (r.sec > 0) return ["PLANNED", "open"];
      return ["OPEN", "open"];
    };
    const slotText = (r) => {
      const head = String(((D.sections || [])[r.sec] || {}).heading || "");
      const d = carried(r), tags = ((r.it || {}).tags || []).join(" ");
      const base = /^tomorrow/i.test(head) ? "Tomorrow" : /rolls to tomorrow/i.test(tags) ? "Rolls to tomorrow" : d ? "From " + MON3[d.getDay()].charAt(0) + MON3[d.getDay()].slice(1).toLowerCase() : "Today";
      return base + (locked(r) ? ", locked" : "");
    };

    /* ---------- the sign across the top: pictogram, the tab's name, the date and a flap clock ---------- */
    const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
    const head = () => {
      const tabs = document.querySelector(".stage > .tabs"); if (!tabs) return;
      let h = tabs.querySelector(".board-head");
      if (!h) {
        h = mk("div", "board-x board-head",
          '<span class="bh-pict"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span>' +
          '<span class="bh-name"></span><span class="bh-clock"><span class="bh-date"></span><span class="bh-dot"></span></span>');
        h.querySelector(".bh-clock").appendChild(field("bh-time", 5));
        tabs.appendChild(h); flapTo(h.querySelector(".bh-time"), hhmm(), { now: true });
      }
      const on = tabs.querySelector(".tab.on"), name = on ? (on.querySelector(":scope > span") || on).textContent.trim() : "";
      const nm = h.querySelector(".bh-name"); if (nm.textContent !== name) nm.textContent = name;
      const n = THEME_HELP.now(), dt = MON3[n.d.getDay()] + " " + n.day + " " + n.mon.toUpperCase(), de = h.querySelector(".bh-date");
      if (de.textContent !== dt) de.textContent = dt;
    };
    const tick = () => { if (document.documentElement.dataset.theme !== "board") return; const f = document.querySelector(".bh-time"), t = hhmm(); if (f && f.dataset.v !== t) flapTo(f, t); };
    setInterval(tick, 15000);

    /* ---------- column captions above the Today board ---------- */
    const cols = () => {
      const body = document.getElementById("body"), lists = body && body.querySelector(":scope > .lists"); if (!lists) return;
      if (body.querySelector(":scope > .board-cols")) return;
      body.insertBefore(mk("div", "board-x board-cols", "<span></span><span>Road</span><span>Step</span><span>Min</span><span>Status</span><span></span>"), lists);
    };

    /* ---------- the three lists ---------- */
    const todayRow = (r, isNext) => {
      const q = r.el, info = THEME_HELP.rowInfo(r), sp = split(r), [word, k] = statusOf(r, isNext);
      upd(q, "bf-rd", 8, sp.road.toUpperCase().slice(0, 8), "road");
      upd(q, "bf-mn", 2, info.min ? THEME_HELP.two(info.min) : "--", info.min ? "min" : "none");
      upd(q, "bf-st", kind === "urgent" ? 9 : 8, word, k);
      wrapTitle(q.querySelector(".t"), sp);
    };
    const WK = { ok: ["ON TRACK", "open"], behind: ["WAITING", "from"], ready: ["CLAIM IT", "now"], won: ["DONE", "done"], moved: ["NEXT WK", "open"] };
    const weekRow = (q) => {
      const key = ["ok", "behind", "ready", "won", "moved"].find(k => q.classList.contains(k)); if (!key) return;
      upd(q, "bf-st", 8, WK[key][0], WK[key][1]);
    };
    const WLAB = { "Waiting": "behind", "On track": "ok", "Claim it": "ready", "Accomplished": "won", "Next week": "moved" };
    const weekDesc = (st) => { const k = WLAB[st.textContent.trim()]; if (k) upd(st, "bf-wd", 8, WK[k][0], WK[k][1]); };
    const studyRow = (it) => {
      const f = THEME_HELP.itemInfo(it), q = it.el;
      if (it.kind === "slot" || it.kind === "add" || f.none) return;
      upd(q, "bf-mn", 2, f.min ? THEME_HELP.two(f.min) : "--", f.min ? "min" : "none");
      const day = it.kind === "next" ? ((q.querySelector(".pre") || {}).textContent || "LATER").trim().toUpperCase() : "";   // a later lesson says which day it is for
      upd(q, "bf-st", 8, it.kind === "pin" ? "PINNED" : it.kind === "pick" ? "PICK" : it.kind === "next" ? day : "TODAY", it.kind === "today" || it.kind === "recall" ? "next" : "open");
    };

    const build = () => {
      head(); cols();
      const nextRow = rows.find(x => x.el && !x.done && !live(x) && x.sec === 0);
      rows.forEach(r => { if (r.el) todayRow(r, r === nextRow); });
      document.querySelectorAll(".wcb .q.wq").forEach(weekRow);
      document.querySelectorAll(".wdesc .dm > .st").forEach(weekDesc);
      sItems.forEach(it => { if (it.el) studyRow(it); });
    };

    /* ---------- the pass: the selected step prints; the stub tears off on Done ---------- */
    let lastPass = "";
    const detailPass = (r, pane) => {
      const map = pane.querySelector(".dmap"); if (!map) return;
      const sp = split(r), f = THEME_HELP.rowInfo(r);
      wrapTitle(pane.querySelector(".dtitle"), sp);
      const dt = pane.querySelector(".dtitle"), pre = dt && dt.querySelector(".board-pre");   // the longer the title, the smaller the type, so it keeps to two or three lines
      const len = dt ? dt.textContent.length - (pre ? pre.textContent.length : 0) : 0;
      pane.dataset.tl = len <= 24 ? "s" : len <= 32 ? "m" : len <= 44 ? "l" : "x";
      const giver = pane.querySelector(".giver > span:nth-child(2)"), road = (giver && giver.textContent.trim()) || f.road || sp.road;
      const a = mk("div", "board-x board-road", "<small>Road</small><b></b>"); a.lastChild.textContent = road;
      const b = mk("div", "board-x board-meta", '<div class="bm-min"><small>Min</small><b></b></div><div class="bm-slot"><small>Slot</small><b></b></div>');
      const mb = b.querySelector(".bm-min b"); mb.textContent = f.min ? String(f.min) : "--"; if (!f.min) mb.dataset.none = "1";
      b.querySelector(".bm-slot b").textContent = slotText(r);
      map.append(a, b);
      pane.querySelectorAll(".dsh > span:nth-child(2)").forEach(s => { if (s.textContent.trim() === "Study lesson") s.textContent = "Guess first"; });
      const key = (r.id || (r.it && r.it.title) || "") + "";
      pane.style.setProperty("--bs", String(hash(key) % 23));
      if (key !== lastPass) { lastPass = key; pane.classList.remove("board-print"); void pane.offsetWidth; pane.classList.add("board-print"); }
    };
    const tear = () => {
      if (RM()) return;
      const st = [...document.querySelectorAll(".sidepane .dacts")].find(x => x.getClientRects().length && x.querySelector(".dact.done")); if (!st) return;
      const rc = st.getBoundingClientRect(), c = st.cloneNode(true);
      c.classList.add("board-x", "board-torn"); c.setAttribute("aria-hidden", "true");
      [["position", "fixed"], ["left", rc.left + "px"], ["top", rc.top + "px"], ["width", rc.width + "px"], ["height", rc.height + "px"], ["margin", "0"], ["z-index", "70"], ["bottom", "auto"]]
        .forEach(([k, v]) => c.style.setProperty(k, v, "important"));
      document.body.appendChild(c);
      c.addEventListener("animationend", () => c.remove(), { once: true });
      setTimeout(() => c.remove(), 1300);
    };

    THEME_EXT.board = {
      words: { "Board": "Notion board", "Open board": "Notion board", "Not done yet": "Undo" },
      sounds: true,
      decorate() {
        build();
        const pane = document.querySelector(".sidepane .detail");   // the fade above the stub only when the pass scrolls under it
        if (pane) { const ov = pane.scrollHeight > pane.clientHeight + 1 ? "1" : ""; if ((pane.dataset.ov || "") !== ov) { if (ov) pane.dataset.ov = ov; else delete pane.dataset.ov; } }
      },
      detail(r, pane) { detailPass(r, pane); },
      onSfx(name) { if (name === "done") tear(); },
      onEnter() { build(); requestAnimationFrame(() => requestAnimationFrame(intro)); },
    };
  }
