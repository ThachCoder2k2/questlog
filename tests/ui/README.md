# UI robot

Drives the card the way a hand does, in a real `WKWebView` (the engine the app uses), over every theme, in the corner card
and the full card:

```bash
python3 tests/ui/run_ui.py                       # all themes, compact + full + a short compact card
python3 tests/ui/run_ui.py --themes lcd,soft --modes full
python3 tests/ui/run_ui.py --shots /tmp/shots    # also a PNG per run
QLUI_STEPS=1 python3 tests/ui/run_ui.py --themes mac --modes compact   # print every step with its timing
```

It needs only the Xcode command line tools (it compiles `host.swift`, a stand-in for `questcard`'s window). The card is fed
made-up quests, a made-up week and a made-up road: no personal data.

It sends real mouse events through the window (`NSEvent`), not just DOM events, and its web view has the app's own click
handling, including the band at the top of the corner card that drags the window: a click that the band takes never reaches the
page, exactly as in the app. That is how two bugs were found that DOM-level clicks cannot show: in the full card, clicking the
theme list counted as clicking the backdrop and shrank the card; in the corner card, the tabs and the theme button sat in the
drag band, so the mouse could not press them.

What it checks (about 65 checks per theme and mode):

- real clicks: the theme button, a theme row (the card keeps its size), the tabs, Expand / Minimize, a row, its checkbox and
  track mark, the footer keys, the status menu and its items, the detail pane's buttons, the Roads sub-tab and a road, a lesson dot,
  a Recall grade button, Claim and a goal card; the header still drags the corner card and is not a handle in the full card;
- the theme button, every picker row and every footer key can be clicked (nothing covers or clips them), the picker fits in the
  window even when the corner card is short, and it closes by click, by Esc and by Enter;
- previewing a theme does not move the corner window; keys still work right after the picker closes;
- M (corner card ⇄ full card), the tabs by click and by Q / E;
- Today: ↑ ↓, Space (status menu) and Esc, D and D again, T;
- Study: Recall (start, show, grade, back), the sub-tabs, a road's map and out again;
- Week: select a goal, claim it with one line, take it back (and the messages sent to the host);
- no script errors; every step's cost (`sync` ms) and the longest gap between frames (`gap` ms) are printed when slow.

`wrap.js` records real stacks for errors thrown inside callbacks. WebKit also reports a bare `Script error.` about once per
page load, with no file, line or stack, and nothing in the page throws: the run counts it as a note, not a failure.
