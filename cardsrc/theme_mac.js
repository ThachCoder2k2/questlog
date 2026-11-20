{
  /* Standard (Mac): words, the minutes shown plainly, and the traffic lights (real buttons for Close and Minimize) */
  const lights = () => {
    const stage = document.getElementById("stage");
    if (!stage || stage.querySelector(":scope > .mac-x")) return;
    const x = document.createElement("div");
    x.className = "mac-x"; x.setAttribute("role", "group"); x.setAttribute("aria-label", "Window");
    x.innerHTML = '<button type="button" class="mac-c" tabindex="-1" aria-label="Close" title="Close (esc)"></button>' +
      '<button type="button" class="mac-m" tabindex="-1" aria-label="Minimize" title="Minimize (M)"></button><span class="mac-z"></span>';
    x.querySelector(".mac-c").addEventListener("click", () => document.getElementById("kClose").click());
    x.querySelector(".mac-m").addEventListener("click", () => document.getElementById("kMode").click());
    stage.appendChild(x);
  };
  /* the card's own words for "done" become the Mac word; put back whenever another theme is on */
  const onToday = () => !document.body.classList.contains("tab-week") && !document.body.classList.contains("tab-learn");   // there "Undo" takes a done step back; elsewhere it undoes a claim or a pin
  const SWAPS = [[".mi .lbl", { "Clear": "Mark Done" }], [".dstat > span", { "Cleared": "Done" }], ["#kDone > span", { "Undo": "Mark Not Done" }, onToday]];
  const restore = () => document.querySelectorAll("[data-m0]").forEach(n => { if (n.textContent === n.dataset.m1) n.textContent = n.dataset.m0; delete n.dataset.m0; delete n.dataset.m1; });
  new MutationObserver(() => { if (document.documentElement.dataset.theme !== "mac") restore(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  THEME_EXT.mac = {
    sounds: true,
    words: { "Done": "Mark Done", "Not done yet": "Mark Not Done", "Pin for tomorrow": "Pin for Tomorrow" },
    decorate() {
      lights();
      SWAPS.forEach(([sel, map, when]) => document.querySelectorAll(sel).forEach(n => {
        const t = n.textContent;
        if (n.dataset.m0 !== undefined && t !== n.dataset.m1) { delete n.dataset.m0; delete n.dataset.m1; }   // the card wrote new text here
        if (n.dataset.m0 === undefined && map[t] !== undefined && (!when || when())) { n.dataset.m0 = t; n.dataset.m1 = map[t]; n.textContent = map[t]; }
      }));
      document.querySelectorAll(".tnum[data-v] > b").forEach(b => {   // "01" reads as "1 min"
        const v = b.parentNode.dataset.v, t = /^0\d$/.test(v) ? v.slice(1) : null;
        if (t !== null && b.textContent !== t) b.textContent = t;
      });
    },
  };
}
