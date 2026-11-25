#!/usr/bin/env python3
"""UI robot over every theme, in the corner card and the full card, in a real WKWebView (tests/ui/host.swift).
  python3 tests/ui/run_ui.py [--themes lcd,soft] [--modes compact,full] [--shots DIR]
It builds the card from cardsrc/ into a temp file, feeds it made-up quests (no personal data), drives it with robot.js and
prints every failed check plus every slow step. Exit code 1 if any check failed."""
import argparse, json, pathlib, re, subprocess, sys, tempfile
HERE = pathlib.Path(__file__).resolve().parent; REPO = HERE.parent.parent
ap = argparse.ArgumentParser(); ap.add_argument("--themes"); ap.add_argument("--modes", default="compact,full"); ap.add_argument("--shots")
ap.add_argument("--card", help="a built card.html (default: build one from cardsrc/)"); ap.add_argument("--slow-sync", type=int, default=70); ap.add_argument("--slow-gap", type=int, default=90)
a = ap.parse_args()
tmp = pathlib.Path(tempfile.mkdtemp(prefix="qlui-"))
host = tmp / "host"
import os
if os.environ.get("QLUI_HOST"): host = pathlib.Path(os.environ["QLUI_HOST"])   # a prebuilt host (to try a variant)
else:
    r = subprocess.run(["swiftc", "-O", str(HERE / "host.swift"), "-o", str(host), "-framework", "Cocoa", "-framework", "WebKit"], capture_output=True, text=True)
    if r.returncode: print(r.stderr); sys.exit(2)
card = tmp / "card.html"
if a.card: card.write_text(pathlib.Path(a.card).read_text())
else:
    r = subprocess.run([sys.executable, str(REPO / "cardsrc/make_card.py"), "--out", str(card)], capture_output=True, text=True)
    if r.returncode: print(r.stdout, r.stderr); sys.exit(2)
html = card.read_text()
order = json.loads(re.search(r"window\.QL_THEMES = (\[.*?\]);</script>", html).group(1)); keys = [k for k, _, _ in order]
if a.themes: keys = [k for k in keys if k in a.themes.split(",")]
H = lambda n: "%032x" % n
def quest(n, typ, title, status="📜 To Do", **kw):
    q = {"type": typ, "title": title, "status": status, "date": "2026-11-25", "url": "https://app.notion.com/p/" + H(n), "start": "Open the file and write one line"}; q.update(kw); return q
def card_json(mode):
    small = "small" in mode; mode = mode.split("-")[0]
    items = [quest(1, "main", "Write the outline of the report", energy="🐉 Boss", questline="Report"), quest(2, "main", "Fix the failing import in the build", questline="Build", tags=["↩︎ from Mon"]),
             quest(3, "side", "Reply to the two open questions", questline="Report"), quest(4, "side", "Tidy the notes folder", status="✅ Cleared", done=True),
             quest(5, "fun", "Read one chapter of the novel", questline="Reading"), quest(6, "fun", "Play one round", status="⏸ Delay")]
    if small: items = items[:2]   # a short card: the corner window is as short as it gets
    wq = lambda n, title, done=False: {"type": "main", "title": title, "url": "https://app.notion.com/p/" + H(100 + n), "status": "✅ Cleared" if done else "📜 To Do", "date": "2026-11-24", **({"done": True} if done else {})}
    week = {"label": "Week 48", "start": "2026-11-23", "end": "2026-11-29", "today": "2026-11-25", "next": "Week 49", "areas": ["Office", "Home"], "goals": [
        {"id": H(201), "area": "Office", "kind": "work", "short": "Report", "title": "Report: outline and first draft", "when": "The draft is in the shared folder", "status": "planned", "result": "", "quests": [wq(1, "Write the outline", True), wq(2, "Write the draft", True)]},
        {"id": H(202), "area": "Office", "kind": "learn", "short": "Build", "title": "Build: green on the main branch", "when": "The pipeline passes", "status": "planned", "result": "", "quests": [wq(3, "Fix the import", True), wq(4, "Fix the test")]},
        {"id": H(203), "area": "Home", "kind": "life", "short": "Notes", "title": "Notes: one folder, one rule", "when": "Everything has a place", "status": "accomplished", "result": "Done", "quests": [wq(5, "Tidy the folder", True)]}]}
    return {"kind": "midday", "eyebrow": "Midday check · Wed 25/11", "title": "4 quests today", "subtitle": "Start with the star.", "display": mode, "progress": {"done": 1, "total": 6},
            "week": week, "sections": [{"heading": "Today", "items": items}], "url": "https://app.notion.com/p/" + H(99), "timeoutSec": 1800}
def sess(n, m): return {"title": "Lesson %d: %s" % (n, m), "resource": "A video", "url": "https://example.com/%d" % n, "minutes": 45, "done": "A file that runs", "min": "Open it and run one cell", "recall": "Why does it work?", "setup": "Python 3"}
LEARN = {"target_hours": 6, "start": "2026-11-19", "max_pins": 3, "recall_cap": 20, "recall_retention": 0.9, "recall_leech": 4, "recall_valve": [15, 0.85],
         "rhythm": {d: ["ai"] if i % 2 == 0 else ["cv"] for i, d in enumerate(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])},
         "tracks": [{"id": i, "name": n, "short": s, "color": c, "status": "focus", "kind": "road", "goal": "g", "project": "p", "end_goal": "e", "total": 8, "weeks": 4,
                     "sessions": [sess(k, s) for k in range(1, 4)], "milestones": [{"name": "Basics", "reached_when": "It runs", "sessions": [1, 2, 3]}, {"name": "Next", "reached_when": "It ships", "sessions": [1, 2]}]}
                    for i, n, s, c in (("ai", "AI engineering", "AI", "#8FE6FF"), ("cv", "Vision", "Vision", "#9BE38B"))]}
def study():
    return {"v": 1, "day": "2026-11-24", "pos": {"ai": [0, 1], "cv": [0, 0]}, "pins": [{"t": "cv", "m": 0, "s": 0}], "todays": [],
            "cards": [{"t": "ai", "m": 0, "s": 0, "q": "Why does it work?", "a": "Because", "S": 3.7, "D": 5.0, "lapses": 0, "parked": False, "due": "2026-11-25", "last": "2026-11-21"}], "logs": [], "recallDays": []}
bad = 0; slow = []; rows = []; notes = []
for k in keys:
    for mode in a.modes.split(","):
        data = card_json(mode); env = {"notion": True, "queue": True, "maxHeight": 860, "mode": mode.split("-")[0], "learn": LEARN, "study": study(), "theme": k}
        pre = "<script>%s</script><script>window.QL_DATA=%s;window.QL_ENV=%s;</script>" % ((HERE / "wrap.js").read_text(), json.dumps(data), json.dumps(env))
        post = "<script>setTimeout(() => window.QL_GO && window.QL_GO(), 200);</script><script>%s</script>" % (HERE / "robot.js").read_text()
        page = tmp / ("%s-%s.html" % (k, mode)); page.write_text(html.replace("<head>", "<head>" + pre, 1).replace("</body>", post + "</body>", 1))
        if os.environ.get("QLUI_KEEP"): print("page:", page)
        shot = str(pathlib.Path(a.shots) / ("%s-%s.png" % (k, mode))) if a.shots else "-"
        if a.shots: pathlib.Path(a.shots).mkdir(parents=True, exist_ok=True)
        r = subprocess.run([str(host), str(page), mode.split("-")[0], "90", shot], capture_output=True, text=True, timeout=180)
        m = re.search(r"^RESULT (.*)$", r.stdout, re.M)
        if not m: print(f"[{k}/{mode}] host gave no result: {r.stdout[-200:]} {r.stderr[-200:]}"); bad += 1; continue
        res = json.loads(m.group(1)); probe = res.get("probe") or {}
        fails = [c for c in probe.get("checks", []) if not c["ok"]]; errs = res.get("errs") or []
        bare = [e for e in errs if e.startswith("Script error.")]; errs = [e for e in errs if not e.startswith("Script error.")]   # WebKit's detail-less error, see README
        if bare: notes.append(f"{k}/{mode}: {len(bare)} bare 'Script error.'")
        if res.get("timedOut"): fails.append({"name": "the robot did not finish in time", "info": ""})
        if errs: fails.append({"name": "script errors", "info": " ; ".join(errs[:3])})
        for ce in (probe.get('cbErrs') or [])[:3]: print(f"      caught in a callback [{k}/{mode}]: {ce}")
        if os.environ.get("QLUI_STEPS"):
            for s in probe.get("steps", []): print(f"    [{k}/{mode}] {s['name'][:34]:34s} sync {s['sync']:4d} gap {s['gap']:4d} vp {s['vp']} {s['posts']}")
        for s in probe.get("steps", []):
            if s["sync"] > a.slow_sync or s["gap"] > a.slow_gap or s.get("err"): slow.append((k, mode, s))
        n_ok = len(probe.get("checks", [])) - len([c for c in fails if c in probe.get("checks", [])])
        rows.append((k, mode, n_ok, len(fails)))
        for c in fails: print(f"FAIL [{k}/{mode}] {c['name']}  {c['info']}")
        first = next((s for s in probe.get('steps', []) if s.get('errs')), None)
        if first: print(f"      first script error appears at step: {first['name']}")
        bad += len(fails)
print("\nchecks per theme/mode (passed / failed):")
for k, mode, ok, nf in rows: print(f"  {k:9s} {mode:8s} {ok:3d} / {nf}")
print("\nslow steps (sync ms > %d or frame gap ms > %d):" % (a.slow_sync, a.slow_gap))
for k, mode, s in sorted(slow, key=lambda x: -max(x[2]["sync"], x[2]["gap"]))[:25]:
    print(f"  {k:9s} {mode:8s} {s['name'][:34]:34s} sync {s['sync']:4d}  gap {s['gap']:4d}  posts {s['posts']} {s.get('err','')}")
for n in notes: print("note:", n)
print("\n%d failed check(s)" % bad); sys.exit(1 if bad else 0)
