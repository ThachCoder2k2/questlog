  /* ----- Soft cards: plain roomy cards; the one bright colour is always a key you can press. Mostly CSS; this file adds the
     date heading, the "55 min" cell on each row, and the staged Done moment (the card squashes, a check draws, it slides out,
     the next card rises). Every node it adds is .soft-x: hidden in the other themes and removed when this one is left. ----- */
  {
    const SOFT_ROOT = document.documentElement;
    const CHECK = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="soft-disc" cx="60" cy="60" r="52"/><path class="soft-tick" d="M36 62l16 16 32-36"/></svg>';
    const mk = (tag, cls) => { const n = document.createElement(tag); n.className = "soft-x " + cls; return n; };
    const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* the date, said once, large, top left (the other themes keep their own date) */
    const dateHead = () => {
      const tabs = document.querySelector(".tabs"); if (!tabs) return;
      const n = THEME_HELP.now(), month = n.d.toLocaleDateString("en-GB", { month: "long" }), key = n.wd + n.day + month;
      let d = tabs.querySelector(":scope > .soft-date");
      if (!d) { d = mk("span", "soft-date"); d.setAttribute("aria-hidden", "true"); tabs.appendChild(d); }
      if (d.dataset.k !== key) { d.dataset.k = key; d.innerHTML = "<b>" + n.wd + "</b> " + n.day + " " + month; }
    };

    /* "55 min" on every row that has minutes (the shared cell holds "55", "01" or "--"); the small card also says it on the tag line */
    const minutes = () => {
      document.querySelectorAll(".q").forEach(q => {
        const t = q.querySelector(":scope > .tnum"), v = t ? t.dataset.v : "";
        const label = v && v !== "--" ? parseInt(v, 10) + " min" : "";
        let m = q.querySelector(":scope > .soft-min");
        if (!m && label) { m = mk("span", "soft-min"); q.appendChild(m); }
        if (m && m.dataset.v !== label) { m.dataset.v = label; m.textContent = label; }
        const tg = q.querySelector(":scope > div > .tg");
        let g = tg && tg.querySelector(":scope > .soft-tgmin");
        if (tg && label) { if (!g) { g = mk("span", "soft-tgmin"); tg.insertBefore(g, tg.firstChild); } if (g.textContent !== label) g.textContent = label; }
        else if (g) g.remove();
      });
    };

    /* each boss stone sits clear of its milestone ring (the map puts it ~38px from the ring's centre); the map cursor follows it */
    const bossStones = () => {
      document.querySelectorAll(".sarea").forEach(area => {
        const nodes = [...area.querySelectorAll(".mnode")].map(n => ({ x: parseFloat(n.style.left), y: parseFloat(n.style.top), r: n.classList.contains("goal") ? 32 : 24 }));
        const shift = (x, y) => {
          let best = null; nodes.forEach(n => { const d = Math.hypot(x - n.x, y - n.y); if (!best || d < best.d) best = { n, d }; });
          if (!best || !best.d) return "";
          const need = best.n.r + 17 + 9; if (best.d >= need) return "";
          const k = (need - best.d) / best.d; return Math.round((x - best.n.x) * k) + "px " + Math.round((y - best.n.y) * k) + "px";
        };
        const put = (el, v) => { if ((el.dataset.o || "") !== v) { el.dataset.o = v; if (v) el.style.setProperty("--soft-shift", v); else el.style.removeProperty("--soft-shift"); } };   // a variable only Soft reads: the other worlds keep the stone where the map put it
        const bosses = [...area.querySelectorAll(".sdot.boss")];
        bosses.forEach(b => put(b, shift(parseFloat(b.style.left), parseFloat(b.style.top))));
        const c = area.querySelector(".scur");
        if (c) { const x = parseFloat(c.style.left), y = parseFloat(c.style.top);
          put(c, bosses.some(b => Math.abs(parseFloat(b.style.left) - x) < 1.5 && Math.abs(parseFloat(b.style.top) - y) < 1.5) ? shift(x, y) : ""); }
      });
    };

    /* the theme list's key hint as keycaps (the shared line stays in the DOM; only this theme hides it) */
    const pickerKeys = () => {
      document.querySelectorAll(".thm .tp").forEach(tp => {
        if (tp.querySelector(":scope > .soft-keys")) return;
        const k = mk("div", "soft-keys"); k.innerHTML = "<span><kbd>\u2191\u2193</kbd>Move</span><span><kbd>Enter</kbd>Choose</span><span><kbd>Esc</kbd>Close</span>"; tp.appendChild(k);
      });
    };

    /* Done: a copy of the card squashes, a check draws on it, it slides out; the real card underneath (already in its new state) rises */
    const doneMoment = () => {
      if (calm()) return;
      const sp = [...document.querySelectorAll(".sidepane")].find(x => !x.hidden && x.offsetWidth && getComputedStyle(x).display !== "none");
      if (!sp) return;
      const r = sp.getBoundingClientRect(), g = mk("div", "soft-ghost"), today = !!sp.querySelector(".detail") && getComputedStyle(sp.querySelector(".detail")).display !== "none";
      [["left", r.left], ["top", r.top], ["width", r.width], ["height", r.height]].forEach(([k, v]) => g.style.setProperty(k, v + "px", "important"));
      g.setAttribute("aria-hidden", "true");
      if (today) {
        const copy = sp.cloneNode(true); copy.removeAttribute("id"); copy.classList.add("soft-copy");
        copy.querySelectorAll(".in").forEach(n => n.classList.remove("in")); copy.classList.remove("in");
        g.appendChild(copy); g.classList.add("soft-slide");
      } else g.classList.add("soft-pop");
      const c = mk("div", "soft-check"); c.innerHTML = CHECK; g.appendChild(c);
      document.body.appendChild(g);
      document.body.classList.remove("soft-rise"); void document.body.offsetWidth; document.body.classList.add("soft-rise");
      const bye = () => { g.remove(); document.body.classList.remove("soft-rise"); };
      g.addEventListener("animationend", (e) => { if (e.target === g) bye(); });
      setTimeout(bye, 1700);
    };

    /* leaving the theme takes every added node with it */
    new MutationObserver(() => {
      if (THEME_HELP.TH() === "soft") return;
      document.querySelectorAll(".soft-x").forEach(n => n.remove());
      document.querySelectorAll(".sdot[data-o], .scur[data-o]").forEach(n => { n.style.removeProperty("--soft-shift"); delete n.dataset.o; });
    })
      .observe(SOFT_ROOT, { attributes: true, attributeFilter: ["data-theme"] });

    THEME_EXT.soft = {
      sounds: true,
      words: { "Pin for tomorrow": "Pin", "Minimize": "Smaller", "Expand": "Bigger", "Not done yet": "Undo" },
      decorate() { dateHead(); minutes(); pickerKeys(); bossStones(); },
      onSfx(name) { if (name === "done") doneMoment(); },
      onEnter() { if (typeof tab !== "undefined" && tab === "learn") window.dispatchEvent(new Event("resize")); },   // the road map measures its area: draw it again in the new frame
    };
  }
