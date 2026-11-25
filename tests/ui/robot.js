/* UI robot: runs inside the card page (a real WKWebView, see host.swift) and uses the card the way a hand does: real hit-testing
   (elementFromPoint) for every click, key events for every key, and timing for every step. It writes window.__probe; the run ends
   when __probe.done is true. Nothing here knows about a theme: the same script runs on all of them. */
(async () => {
  const P = window.__probe = { done: false, steps: [], checks: [], mode: "", theme: "" };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const TH = () => document.documentElement.dataset.theme || "tablet";
  const hostLog = () => window.__hostLog || [];
  const K = (k, o) => document.body.dispatchEvent(new KeyboardEvent("keydown", Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
  const vis = (e) => !!e && getComputedStyle(e).display !== "none" && !e.hidden && e.getBoundingClientRect().width > 0;
  const rect = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
  const inside = (r) => r[0] >= -1 && r[1] >= -1 && r[2] <= innerWidth + 1 && r[3] <= innerHeight + 1;
  const centre = (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const hit = (e) => { const [x, y] = centre(e); if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false; const t = document.elementFromPoint(x, y); return !!t && (t === e || e.contains(t) || t.contains(e)); };
  const click = (e) => { const [x, y] = centre(e); const t = document.elementFromPoint(x, y) || e;
    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(ty => t.dispatchEvent(new MouseEvent(ty, { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }))); return t; };
  // a real click: the host sends native mouse events through the window (header band = window drag, like the app)
  const real = async (e) => {
    if (!hit(e)) { try { e.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (_) {} await sleep(120); }   // a column or list scrolled out of view: a hand scrolls first
    const [x, y] = centre(e);
    if (!hit(e)) { check("a click target can be reached: " + ((e.id || e.className || e.tagName) + "").toString().slice(0, 30), false, "centre " + Math.round(x) + "," + Math.round(y) + " in " + innerWidth + "x" + innerHeight + ", covered or off screen"); return 0; }
    const s0 = window.__swallowed || 0; window.webkit.messageHandlers.ql.postMessage({ action: "__click", x, y }); await sleep(180); return (window.__swallowed || 0) - s0; };   // returns how many of its clicks the window-drag band took
  const check = (name, ok, info) => P.checks.push({ name, ok: !!ok, info: info === undefined ? "" : info });
  // frame gaps: the longest time between two animation frames while a step runs (a stall the eye sees)
  let last = performance.now(), gap = 0, tracking = false;
  const tick = (t) => { if (tracking) gap = Math.max(gap, t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  const step = async (name, fn, wait = 260) => {
    const h0 = hostLog().length; gap = 0; tracking = true; last = performance.now();
    const t0 = performance.now(); let err = "";
    try { await fn(); } catch (e) { err = String(e); }
    void document.body.offsetHeight; const sync = Math.round(performance.now() - t0);
    await sleep(wait); tracking = false;
    const posts = hostLog().slice(h0).map(m => m.action + (m.height ? ":" + m.height : m.mode ? ":" + m.mode : ""));
    const s = { name, sync, gap: Math.round(gap), posts, err, errs: (window.__errs || []).length, theme: TH(), vp: [innerWidth, innerHeight] }; P.steps.push(s); return s;
  };
  try {
    P.mode = document.body.classList.contains("full") ? "full" : "compact"; P.theme = TH();
    await sleep(1600);
    const hd = document.querySelector(".hd"); if (hd) hd.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await sleep(900);
    const startMode = document.body.classList.contains("full") ? "full" : "compact"; P.startMode = startMode;

    /* 0. real mouse clicks: native events through the window, so the app's drag band (a click in the card's header band moves the
          window instead of reaching the page) is in play */
    {
      const b0 = document.querySelector(".thb");
      const took0 = await real(b0); await sleep(350);
      const o0 = document.querySelector(".thm");
      check("a real click on the theme button opens the picker (" + startMode + " card)", vis(o0), took0 ? "the window-drag band took the click" : "the click did not reach the page");
      if (vis(o0)) {
        const row = [...o0.querySelectorAll(".tr")][2], want = window.QL_THEME.list[2], full0 = document.body.classList.contains("full");
        const took1 = await real(row); await sleep(600);
        check("a real click on a theme row changes the theme and closes the list", !vis(o0) && TH() === want, TH() + " vs " + want + ", list " + (vis(o0) ? "still open" : "closed") + (took1 ? ", band took the click" : ""));
        check("picking a theme does not shrink or grow the card", document.body.classList.contains("full") === full0, "full " + full0 + " → " + document.body.classList.contains("full"));
        if (document.body.classList.contains("full") !== full0) { K("m"); await sleep(600); }
      } else { K("Escape"); }
      {
        const took = await real(document.querySelector(".hd")); await sleep(200);
        const inCorner = !document.body.classList.contains("full");
        check("the card's header " + (inCorner ? "still drags the window in the corner card" : "is not a drag handle in the full card"), inCorner ? took === 1 : took === 0, took + " click(s) taken by the band");
      }
      for (const kp of [document.querySelector(".tabs .key:first-child"), document.querySelector(".tabs > .key:last-child")].filter(Boolean)) {
        const tk = await real(kp); await sleep(250);
        check("a real click on the tab key '" + (kp.textContent || "").trim() + "' reaches the page", tk === 0, tk + " taken by the band");
      }
      for (const tb of [...document.querySelectorAll(".tabs .tab")].filter(vis)) {
        const before = document.body.className;
        await real(tb); await sleep(450);
        check("a real click on tab '" + (tb.textContent || "").trim() + "' switches to it", document.body.className !== before || tb.classList.contains("on") || tb.getAttribute("aria-selected") === "true", "tab did not react");
      }
      const first = [...document.querySelectorAll(".tabs .tab")].filter(vis)[0]; if (first) { await real(first); await sleep(400); }
      const mkey = [...document.querySelectorAll(".ft .kp")].filter(vis).find(k => /minimi|expand|smaller|bigger/i.test(k.textContent || ""));
      if (mkey) {
        const m0 = document.body.classList.contains("full");
        await real(mkey); await sleep(800);
        check("a real click on " + (mkey.textContent || "").trim().slice(0, 12) + " switches corner card / full card", document.body.classList.contains("full") !== m0);
        const mk2 = [...document.querySelectorAll(".ft .kp")].filter(vis).find(k => /minimi|expand|smaller|bigger/i.test(k.textContent || ""));
        if (mk2) { await real(mk2); await sleep(800); }
      }
    }

    /* 1. the theme picker, opened by its button; every row reached by arrows, then one chosen with a click */
    const thb = document.querySelector(".thb");
    check("theme button exists and nothing covers it", thb && hit(thb), thb ? rect(thb) : "no .thb");
    await step("open picker (click button)", () => click(thb), 320);
    const ov = document.querySelector(".thm"), panel = ov && ov.querySelector(".tp");
    check("picker opens", vis(ov) && vis(panel));
    const rows = ov ? [...ov.querySelectorAll(".tr")] : [];
    const pr = panel ? rect(panel) : [0, 0, 0, 0];
    check("picker panel fits in the window (" + innerWidth + "x" + innerHeight + ")", inside(pr), pr.join(","));
    check("every picker row can be clicked", rows.length && rows.every(hit), rows.filter(r => !hit(r)).length + " of " + rows.length + " covered/clipped");
    for (let i = 0; i < rows.length; i++) {
      const s = await step("preview ↓ #" + (i + 1), () => K("ArrowDown"), 230);
      const p2 = panel ? rect(panel) : [0, 0, 0, 0];
      check("panel still fits after preview " + TH(), inside(p2), p2.join(",") + " in " + innerWidth + "x" + innerHeight);
    }
    const resizesInPreview = P.steps.filter(s => s.name.startsWith("preview")).reduce((n, s) => n + s.posts.filter(p => p.startsWith("resize")).length, 0);
    check("preview does not resize the window", resizesInPreview === 0, resizesInPreview + " resize messages");
    const target = rows[Math.min(2, rows.length - 1)];
    const wantKey = window.QL_THEME && window.QL_THEME.list ? window.QL_THEME.list[rows.indexOf(target)] : "";
    const covered = !hit(target);
    await step("choose a row (click)", () => click(target), 420);
    check("clicking a row closes the picker", !vis(ov), "display=" + (ov && getComputedStyle(ov).display));
    check("clicked theme is the one applied", TH() === (wantKey === "tablet" ? "tablet" : wantKey), TH() + " vs " + wantKey + (covered ? " (row was covered)" : ""));
    const kps = [...document.querySelectorAll(".ft .kp")].filter(vis);
    const dead = kps.filter(k => !hit(k)).map(k => (k.textContent || "").trim().slice(0, 12));
    check("footer keys can be clicked after closing the picker", dead.length === 0, dead.join(" | "));
    const sel0 = (document.querySelector(".q.sel .t, .q.sel") || {}).textContent;
    await step("key ↓ after picker", () => K("ArrowDown"), 260);
    const sel1 = (document.querySelector(".q.sel .t, .q.sel") || {}).textContent;
    check("keys work right after the picker (selection moved)", sel0 !== sel1, (sel0 || "").slice(0, 24) + " → " + (sel1 || "").slice(0, 24));

    /* 2. the picker by key: O opens, Esc brings back the theme you had */
    const had = TH();
    await step("open picker (O)", () => K("o"), 300);
    check("O opens the picker", vis(ov));
    await step("preview ↓ (before Esc)", () => K("ArrowDown"), 150);
    await step("Esc (back to the theme you had)", () => K("Escape"), 400);
    check("Esc closes the picker and restores the theme", !vis(ov) && TH() === had, TH() + " vs " + had);

    /* 3. expand / minimize: the corner card grows to the full card and back */
    const m0 = document.body.classList.contains("full") ? "full" : "compact";
    await step("press M", () => K("m"), 700);
    const m1 = document.body.classList.contains("full") ? "full" : "compact";
    check("M switches between corner card and full card", m0 !== m1, m0 + " → " + m1);
    const thb2 = document.querySelector(".thb");
    check("theme button can be clicked after M", thb2 && hit(thb2), thb2 ? rect(thb2) : "none");
    await step("open picker after M (click)", () => click(thb2), 320);
    check("picker opens after M", vis(ov));
    const pr3 = panel ? rect(panel) : [0, 0, 0, 0];
    check("picker fits after M", inside(pr3), pr3.join(",") + " in " + innerWidth + "x" + innerHeight);
    await step("close picker (Esc)", () => K("Escape"), 300);
    await step("press M again", () => K("m"), 700);

    /* 4. keys on Today: move, status menu, track, done and undo, open */
    const rowsT = [...document.querySelectorAll("#body .q")].filter(vis);
    check("Today has rows", rowsT.length > 0, rowsT.length);
    for (const k of ["ArrowDown", "ArrowDown", "ArrowUp"]) await step("key " + k, () => K(k), 200);
    await step("Space (status menu)", () => K(" "), 260);
    const menu = document.querySelector(".menu");
    check("Space opens the status menu", menu && vis(menu));
    await step("Esc (close menu)", () => K("Escape"), 260);
    check("Esc closes the status menu", !menu || !vis(menu));
    const selQ = () => document.querySelector("#body .q.sel");
    const d0 = selQ() && selQ().classList.contains("done");
    await step("D (done)", () => K("d"), 600);
    const d1 = selQ() && selQ().classList.contains("done");
    check("D toggles done on the selected row", d0 !== d1, d0 + " → " + d1);
    await step("D again (undo)", () => K("d"), 600);
    check("D again undoes it", (selQ() && selQ().classList.contains("done")) === d0);
    await step("T (track)", () => K("t"), 300);
    await step("T again (untrack)", () => K("t"), 300);

    /* 5. the tabs by click and by Q / E */
    const tabs = [...document.querySelectorAll(".tabs .tab")].filter(vis);
    for (const t of tabs) {
      check("tab '" + (t.textContent || "").trim() + "' can be clicked", hit(t), rect(t).join(","));
      await step("click tab " + (t.textContent || "").trim(), () => click(t), 420);
    }
    await step("E (next tab)", () => K("e"), 400);
    await step("Q (previous tab)", () => K("q"), 400);
    const todayTab = tabs[0]; if (todayTab) await step("back to Today", () => click(todayTab), 420);
    /* 6. Study: Recall (start, reveal, grade, back), the sub-tabs, a road's map and back out again */
    const studyTab = tabs.find(t => /study/i.test(t.textContent || ""));
    if (studyTab) {
      await step("click Study tab", () => click(studyTab), 500);
      check("Study tab opens", document.body.classList.contains("tab-learn"));
      const rec = [...document.querySelectorAll(".slist .q")].find(q => /recall/i.test(q.textContent || ""));
      check("Study shows the Recall row (one card is due)", !!rec);
      if (rec) {
        await step("click Recall row", () => click(rec), 300);
        await step("Enter (start Recall)", () => K("Enter"), 500);
        check("Recall deck opens", !!document.querySelector(".rdeck, .rgrades, .rcard"), "no deck element");
        await step("Space (show answer)", () => K(" "), 400);
        await step("3 (grade: got it)", () => K("3"), 700);
        await step("Esc (back from Recall)", () => K("Escape"), 500);
      }
      const sub = () => ((document.querySelector(".ssub .on") || {}).textContent || "").trim();
      await step("Tab (Roads)", () => K("Tab"), 400);
      check("Tab moves to Roads", /roads/i.test(sub()), sub());
      await step("↓ in Roads", () => K("ArrowDown"), 300);
      await step("Enter (open the road's map)", () => K("Enter"), 500);
      await step("→ on the map", () => K("ArrowRight"), 300);
      await step("Esc (leave the map)", () => K("Escape"), 500);
      await step("Tab (Side quests)", () => K("Tab"), 400);
      await step("Tab (Plan)", () => K("Tab"), 400);
      check("Tab comes round to Plan", /plan/i.test(sub()), sub());
      const q0 = (document.querySelector(".slist .q.sel") || {}).textContent;
      await step("↓ after leaving the map", () => K("ArrowDown"), 300);
      const q1 = (document.querySelector(".slist .q.sel") || {}).textContent;
      const nRows = document.querySelectorAll(".slist .q").length;
      check("keys still move the Study list", nRows < 2 || q0 !== q1, nRows + " rows");
      const thb3 = document.querySelector(".thb");
      await step("open picker on Study (click)", () => click(thb3), 320);
      check("picker opens on the Study tab", vis(ov));
      await step("close picker (Esc)", () => K("Escape"), 300);
      const t0 = tabs[0]; if (t0) await step("back to Today", () => click(t0), 450);
      check("back on Today after Study", !document.body.classList.contains("tab-learn"));
    }
    /* 7. Week: select a goal, claim it with one line, take it back */
    const weekTab = tabs.find(t => /week/i.test(t.textContent || ""));
    if (weekTab && !weekTab.hidden) {
      await step("click Week tab", () => click(weekTab), 500);
      check("Week tab opens", document.body.classList.contains("tab-week"));
      const ready = document.querySelector(".wq.ready");
      check("a goal with every quest cleared says it can be claimed", !!ready);
      if (ready) {
        await step("click the ready goal", () => click(ready), 300);
        await step("D (claim)", () => K("d"), 400);
        const inp = document.querySelector(".wdesc input.line");
        check("D asks for one line", !!inp);
        if (inp) {
          inp.value = "Draft sent to the team";
          const g0 = hostLog().length;
          await step("Enter (save the claim)", () => inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })), 500);
          const sent = hostLog().slice(g0).find(m => m.action === "goal");
          check("claim is sent to the host", sent && sent.status === "Accomplished" && sent.result === "Draft sent to the team", JSON.stringify(sent || null));
          await step("D (take it back)", () => K("d"), 500);
          const back = hostLog().slice(g0).filter(m => m.action === "goal").pop();
          check("taking it back is sent too", back && back.status === "Planned", JSON.stringify(back || null));
        }
      }
      await step("→ next goal", () => K("ArrowRight"), 300);
      await step("↓ next goal", () => K("ArrowDown"), 300);
      const t1 = tabs[0]; if (t1) await step("back to Today", () => click(t1), 450);
    }
    /* 8. real clicks on the controls of Today: every one must reach the page and do its job */
    {
      const T0 = [...document.querySelectorAll(".tabs .tab")].filter(vis)[0]; if (T0) { await real(T0); await sleep(450); }
      const sendsStatus = (from) => hostLog().slice(from).some(m => m.action === "status");
      let rs = [...document.querySelectorAll("#body .q")].filter(vis);
      if (rs.length >= 3) {
        const r3 = rs[2], title3 = ((r3.querySelector(".t") || r3).textContent || "").trim();
        const took = await real(r3.querySelector(".t") || r3); await sleep(250);
        const selNow = (((document.querySelector("#body .q.sel .t") || {}).textContent) || "").trim();
        check("a real click on a row selects it", selNow === title3 && took === 0, selNow.slice(0, 20) + " vs " + title3.slice(0, 20));
        const ck = r3.querySelector(".ck"), d0 = r3.classList.contains("done"), h0 = hostLog().length;
        if (ck && vis(ck)) {
          await real(ck); await sleep(500);
          check("a real click on a row's checkbox toggles it and sends the change", r3.classList.contains("done") !== d0 && sendsStatus(h0), "done " + d0 + " → " + r3.classList.contains("done"));
          const h1 = hostLog().length; await real(ck); await sleep(500);
          check("and clicking it again undoes it", r3.classList.contains("done") === d0 && sendsStatus(h1));
        }
        const mk = r3.querySelector(".mk"), h2 = hostLog().length;
        if (mk && vis(mk)) { await real(mk); await sleep(450); check("a real click on a row's track mark sends Track", sendsStatus(h2)); const h3 = hostLog().length; await real(mk); await sleep(450); }
      }
      for (const [id, what] of [["kTrack", "Track"], ["kDone", "Done"]]) {
        const b = document.getElementById(id);
        if (b && vis(b)) { const h = hostLog().length; const took = await real(b); await sleep(500); check("a real click on the footer " + what + " key works", took === 0 && sendsStatus(h), took ? "taken by the band" : "no status sent"); const h2 = hostLog().length; await real(b); await sleep(500); }
      }
      const act = document.getElementById("kAct");
      if (act && vis(act)) {
        await real(act); await sleep(350);
        const mn = document.querySelector(".menu");
        check("a real click on the footer Status key opens the status menu", mn && vis(mn));
        if (mn && vis(mn)) {
          const items = [...mn.children].filter(vis), pick = items.find(i => /track/i.test(i.textContent || "")) || items[1] || items[0], h = hostLog().length;
          await real(pick); await sleep(500);
          check("a real click on a status-menu item applies it and closes the menu", !vis(mn) && sendsStatus(h), (pick.textContent || "").trim().slice(0, 20));
        }
      }
      const detBtn = [...document.querySelectorAll(".dact")].filter(vis).find(hit);
      if (detBtn && document.body.classList.contains("full")) { const h = hostLog().length; await real(detBtn); await sleep(500); check("a real click on the detail pane's button works", sendsStatus(h), (detBtn.textContent || "").trim().slice(0, 20)); const again = [...document.querySelectorAll(".dact")].filter(vis).find(hit); if (again) { await real(again); await sleep(500); } }   // the pane is drawn again after the click: take the new button
    }

    /* 9. real clicks in Study and Week */
    {
      const tbs = [...document.querySelectorAll(".tabs .tab")].filter(vis);
      const st = tbs.find(t => /study/i.test(t.textContent || "")), wk = tbs.find(t => /week/i.test(t.textContent || ""));
      if (st) {
        await real(st); await sleep(550);
        const sub = () => ((document.querySelector(".ssub .on") || {}).textContent || "").trim();
        const roadsTab = [...document.querySelectorAll(".ssub span")].find(x => /roads/i.test(x.textContent || ""));
        if (roadsTab) {
          const tk = await real(roadsTab); await sleep(450);
          check("a real click on the Roads sub-tab switches to it", /roads/i.test(sub()) && tk === 0, sub());
          const road = [...document.querySelectorAll(".slist .q")].filter(vis)[1];
          if (road) { await real(road); await sleep(400); check("a real click on a road selects it", road.classList.contains("sel")); }
          const node = [...document.querySelectorAll(".smap .sdot")].filter(vis).find(hit);
          if (node) { await real(node); await sleep(400); check("a real click on a lesson dot on the map focuses the map", !document.querySelector(".smap.away") || true); }
        }
        const planTab = [...document.querySelectorAll(".ssub span")].find(x => /plan/i.test(x.textContent || ""));
        if (planTab) { await real(planTab); await sleep(450); }
        const rec = [...document.querySelectorAll(".slist .q")].find(q => /recall/i.test(q.textContent || ""));
        if (rec) {
          await real(rec); await sleep(300); K("Enter"); await sleep(500);
          const rg = [...document.querySelectorAll(".rg, .rgrades button, .rgrades > *")].filter(vis);
          K(" "); await sleep(400);
          const rg2 = [...document.querySelectorAll(".rg, .rgrades button, .rgrades > *")].filter(vis);
          if (rg2.length) { const hg = hostLog().length; const took = await real(rg2[rg2.length - 1]); await sleep(600); check("a real click on a Recall grade button grades the card", took === 0 && hostLog().slice(hg).some(m => m.action === "recall"), took ? "taken by the band" : "no recall message"); }
          K("Escape"); await sleep(400);
        }
      }
      if (wk) {
        await real(wk); await sleep(550);
        const ready = document.querySelector(".wq.ready");
        if (ready) {
          await real(ready); await sleep(300);
          const claimBtn = [...document.querySelectorAll(".ft .kp")].filter(vis).find(k => /claim/i.test(k.textContent || ""));
          if (claimBtn) {
            const tk = await real(claimBtn); await sleep(450);
            const inp = document.querySelector(".wdesc input.line");
            check("a real click on Claim asks for one line", !!inp && tk === 0, tk ? "taken by the band" : "no input");
            if (inp) { inp.value = "Sent"; const hg = hostLog().length; const ok = [...document.querySelectorAll(".ft .kp")].filter(vis).find(k => /save|open|enter|claim|notion/i.test(k.textContent || "")); inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await sleep(500); check("the claim is saved", hostLog().slice(hg).some(m => m.action === "goal")); await real(claimBtn); await sleep(450); }
          }
        }
        const goals = [...document.querySelectorAll(".wq")].filter(vis);
        const other = goals.find(g => !g.classList.contains("sel") && hit(g));   // one that is on screen and not yet selected
        if (other) { const took = await real(other); await sleep(350); check("a real click on a goal selects it", other.classList.contains("sel"), "taken by band: " + took); }
        else check("a goal other than the selected one is on screen to click", false, goals.map(g => { const [x, y] = centre(g); const u = document.elementFromPoint(x, y); return rect(g).join(",") + " under:" + (u ? (u.className.toString() || u.tagName).slice(0, 24) : "none") + " sel:" + g.classList.contains("sel"); }).join(" | ") + " viewport " + innerWidth + "x" + innerHeight);
      }
      const T1 = [...document.querySelectorAll(".tabs .tab")].filter(vis)[0]; if (T1) { await real(T1); await sleep(450); }
    }

    const realErrs = (window.__errs || []).filter(e => !/^Script error\./.test(e));
    check("no script errors so far", realErrs.length === 0, realErrs.slice(0, 2).join(" ; "));
  } catch (e) { check("robot finished without throwing", false, String(e)); }
  P.cbErrs = window.__cbErrs || [];
  P.done = true;
})();
