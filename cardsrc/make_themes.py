#!/usr/bin/env python3
"""The card's themes: whole worlds, not recolours. Each theme is its own CSS (theme_*.css, written with $T for its
html[data-theme] scope) plus the shared pieces here: drawn pictograms as CSS masks, the theme list (picked with O),
and the sound-pack switch in sfx(). make_card.py calls apply()."""
import json, pathlib, urllib.parse

THEMES = [   # key, label in the picker, swatches
    ("tablet", "Default", ["#020A12", "#2AB4E0", "#FBE46A"]),
    ("lcd", "Pocket LCD", ["#AEB89C", "#16201A", "#E0442B"]),
    ("calendar", "Tear-off calendar", ["#F6F5F0", "#D21F2B", "#E2A93B"]),
    ("board", "Departure board", ["#0E1013", "#FFB547", "#F2F2F2"]),
    ("soft", "Soft cards", ["#F5ECE3", "#FF5B2E", "#2B2622"]),
    ("mac", "Standard", ["#F2F2F7", "#0A6FE6", "#1D1D1F"]),
]
FILES = {"lcd": "theme_lcd.css", "calendar": "theme_cal.css", "board": "theme_board.css", "soft": "theme_soft.css", "mac": "theme_mac.css"}
CORE = ("tablet", "lcd", "calendar")   # always built; the others only when their files exist (and, with only=, when asked for)
JS = {"board": "theme_board.js", "soft": "theme_soft.js", "mac": "theme_mac.js"}   # a world's own script: THEME_EXT.<key> = {...}


def included(here, only=None):
    """The theme keys this build carries, in picker order."""
    return [k for k, _, _ in THEMES if k in CORE or ((here / FILES[k]).exists() and (only is None or k in only))]


def theme_js(here, only=None):
    """The worlds' own scripts, appended after themes.js (same scope: they register on THEME_EXT)."""
    return "".join((here / JS[k]).read_text() for k in included(here, only) if k in JS and (here / JS[k]).exists())

# pictograms: 24x24, one stroke weight, round caps; drawn once, coloured by each world through currentColor
PICT = {
    "recall": "<path d='M20 12a8 8 0 1 1-2.4-5.7'/><path d='M20 3.5v5h-5'/>",
    "lesson": "<path d='M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3zM21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z'/>",
    "boss": "<path d='M20 4 10.5 13.5M20 4h-4.5M20 4v4.5M7 12l5 5M9.5 14.5 4 20'/>",
    "star": "<path d='M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z'/>",
    "puzzle": "<path d='M4 8h4a2.2 2.2 0 1 1 4 0h4v4a2.2 2.2 0 1 1 0 4v4H4z'/>",
    "pad": "<path d='M7 8h10a4 4 0 0 1 4 4v1.5a3.5 3.5 0 0 1-6.2 2.2L13.6 14h-3.2l-1.2 1.7A3.5 3.5 0 0 1 3 13.5V12a4 4 0 0 1 4-4z'/><path d='M7.5 10.5v3M6 12h3M15.5 11.5h.01M17.5 13h.01'/>",
    "lock": "<rect x='5' y='11' width='14' height='10' rx='1.5'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>",
    "back": "<path d='M9 7 4 12l5 5'/><path d='M4 12h10a6 6 0 0 1 6 6v1'/>",
    "pin": "<path d='M12 21s-6.5-6.4-6.5-11a6.5 6.5 0 0 1 13 0c0 4.6-6.5 11-6.5 11z'/><circle cx='12' cy='10' r='2.3'/>",
    "road": "<path d='M4 20c4-1 5-5 8-8s5-6 8-8'/><circle cx='4' cy='20' r='1.6'/><circle cx='20' cy='4' r='1.6'/>",
    "add": "<path d='M12 5v14M5 12h14'/>",
    "goal": "<path d='M5 21V4M5 4h11l-2 4 2 4H5'/>",
    "sun": "<circle cx='12' cy='12' r='4.5'/><path d='M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1'/>",
    "moon": "<path d='M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'/>",
}
ALIAS = {"main": "star", "side": "puzzle", "fun": "pad"}   # row kinds share the emoji meanings: main ⭐, side 🧩, fun 🎮

def url(paths):
    svg = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.3' "
           "stroke-linecap='round' stroke-linejoin='round'>" + paths + "</svg>")
    return 'url("data:image/svg+xml,' + urllib.parse.quote(svg, safe="/:=' ") + '")'

# the sound-pack switch: the active world picks sounds/<pack>/<name>.wav; a hook lets a world add its moment to Done
SFX_OLD = '''    lastSfx[name] = now;
    if (inApp) { window.webkit.messageHandlers.ql.postMessage({ action: "sfx", name }); return; }
    try { const a = new Audio("sounds/" + name + ".wav"); a.volume = 0.6; a.play().catch(() => {}); } catch (e) { /* preview only */ }'''
SFX_NEW = '''    lastSfx[name] = now;
    if (window.QL_SFX_HOOK) { try { window.QL_SFX_HOOK(name); } catch (e) { /* a theme's moment never blocks the sound */ } }
    const pack = window.QL_SFX_PACK ? window.QL_SFX_PACK() : "", file = pack ? pack + "/" + name : name;
    if (inApp) { window.webkit.messageHandlers.ql.postMessage({ action: "sfx", name: file }); return; }
    try { const a = new Audio("sounds/" + file + ".wav"); a.volume = 0.6; a.play().catch(() => {}); } catch (e) { /* preview only */ }'''

def apply(h, here, only=None):
    """Adds the theme CSS, the theme list and the sound-pack switch to the built card; returns the new html."""
    keep = included(here, only)
    assert 'id="ql-themes"' not in h, "already themed"
    shared = [
        "  .tnum, .tbig, .tband { display: none; }",
        "  .qsprite { position: absolute; width: 0; height: 0; overflow: hidden; }",
        "  html[data-theme] .qpic { display: inline-block; flex: none; width: 1em; height: 1em; background: currentColor;"
        " -webkit-mask: var(--qp) center / contain no-repeat; mask: var(--qp) center / contain no-repeat; }",
    ]
    for k, p in PICT.items():
        shared.append('  html[data-theme] [data-pict="%s"], html[data-theme] .emo[data-emo="%s"] { --qp: %s; }' % (k, k, url(p)))
    for k, v in ALIAS.items():
        shared.append('  html[data-theme] [data-pict="%s"] { --qp: %s; }' % (k, url(PICT[v])))
    css = ["/* ===== themes: shared pieces ===== */"] + shared
    for key, fname in FILES.items():
        if key not in keep:
            continue
        body = (here / fname).read_text().replace("$T", 'html[data-theme="%s"]' % key)
        css.append("\n".join("  " + line if line.strip() else line for line in body.splitlines()))
    style = '<style id="ql-themes">\n' + "\n".join(css) + "\n</style>"
    h = h.replace("</head>", style + "\n</head>", 1)
    h = h.replace("<script>", "<script>window.QL_THEMES = %s;</script>\n<script>" % json.dumps([[k, l, s] for k, l, s in THEMES if k in keep]), 1)
    assert SFX_OLD in h, "sfx() changed"
    return h.replace(SFX_OLD, SFX_NEW, 1)
