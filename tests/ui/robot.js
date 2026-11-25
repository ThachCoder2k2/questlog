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
    const realErrs = (window.__errs || []).filter(e => !/^Script error\./.test(e));
    check("no script errors so far", realErrs.length === 0, realErrs.slice(0, 2).join(" ; "));
  } catch (e) { check("robot finished without throwing", false, String(e)); }
  P.cbErrs = window.__cbErrs || [];
  P.done = true;
})();
