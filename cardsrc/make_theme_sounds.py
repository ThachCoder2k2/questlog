#!/usr/bin/env python3
"""Theme sound packs, synthesised (no samples): sounds/lcd (piezo beeps), sounds/calendar (paper), sounds/board (split flaps
and a terminal chime), sounds/soft (pops and a small marimba), sounds/mac (quiet system ticks)."""
import math, random, struct, wave, pathlib
SOUNDS = pathlib.Path(__file__).resolve().parent.parent / "sounds"
SR = 44100
random.seed(15)
def write(path, x, gain=1.0):
    peak = max(1e-9, max(abs(v) for v in x))
    x = [v / peak * gain for v in x]
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v)) * 32000)) for v in x))
def silence(ms): return [0.0] * int(SR * ms / 1000)
def env(n, a_ms=2, r_ms=8):
    a, r = max(1, int(SR * a_ms / 1000)), max(1, int(SR * r_ms / 1000))
    return [min(1, i / a, (n - i) / r) for i in range(n)]
def lowpass(x, fc):
    a = 1 - math.exp(-2 * math.pi * fc / SR); y, out = 0.0, []
    for v in x: y += a * (v - y); out.append(y)
    return out
def highpass(x, fc): lp = lowpass(x, fc); return [v - l for v, l in zip(x, lp)]
def band(x, lo, hi): return lowpass(highpass(x, lo), hi)
# ---------- Pocket LCD: a piezo buzzer (square waves, softened a little) ----------
def beep(f, ms, duty=.5):
    n = int(SR * ms / 1000); e = env(n)
    return [(1 if (i * f / SR) % 1 < duty else -1) * e[i] for i in range(n)]
def seq(*parts):
    out = []
    for p in parts: out += p
    return lowpass(out, 6500)
C7, E7, G7, C8, A6, G6 = 2093, 2637, 3136, 4186, 1760, 1568
LCD = {
    "move": seq(beep(2400, 22)),
    "scroll": seq(beep(2000, 13)),
    "select": seq(beep(C7, 34), beep(G7, 46)),
    "cancel": seq(beep(G6, 40), beep(1046, 60)),
    "done": seq(beep(C7, 55), beep(E7, 55), beep(G7, 55), beep(C8, 120)),
    "track": seq(beep(E7, 30), silence(30), beep(E7, 30)),
    "untrack": seq(beep(A6, 30), silence(30), beep(A6, 30)),
    "undo": seq(beep(G7, 45), beep(C7, 45)),
    "open": seq(beep(1500, 18), beep(2000, 18), beep(2600, 18), beep(3200, 30)),
    "close": seq(beep(3200, 18), beep(2600, 18), beep(2000, 18), beep(1500, 30)),
    "alert": seq(beep(3000, 70), silence(70), beep(3000, 70), silence(70), beep(3000, 70)),
}
# ---------- Tear-off calendar: paper and a desk ----------
def noise(ms): return [random.uniform(-1, 1) for _ in range(int(SR * ms / 1000))]
def shape(x, attack_ms, decay_ms):
    n = len(x); a = max(1, int(SR * attack_ms / 1000)); d = SR * decay_ms / 1000
    return [v * min(1, i / a) * math.exp(-max(0, i - a) / d) for i, v in enumerate(x)]
def thud(f, ms, decay_ms):
    n = int(SR * ms / 1000)
    return [math.sin(2 * math.pi * f * i / SR * (1 - .25 * i / n)) * math.exp(-i / (SR * decay_ms / 1000)) * min(1, i / 40) for i in range(n)]
def mix(*xs):
    n = max(len(x) for x in xs); return [sum(x[i] if i < len(x) else 0 for x in xs) for i in range(n)]
def flick(ms, lo=2200, hi=7000): return shape(band(noise(ms), lo, hi), 2, ms / 4)
def rip(ms):
    x = band(noise(ms), 1400, 7000); n = len(x); out = []; g = 0.0
    for i, v in enumerate(x):
        if random.random() < .0035: g = random.uniform(.5, 1.0)   # fibres giving way, one burst at a time
        g *= .9965; t = i / n
        out.append(v * (.25 + g) * min(1, t / .08) * (1 - t) ** .6)
    return out
def swish(ms, rising=False):
    x = noise(ms); n = len(x); out = lowpass(x, 3200)
    return [v * (math.sin(math.pi * (i / n)) ** (1.5 if not rising else .8)) * ((i / n) if rising else 1) for i, v in enumerate(highpass(out, 500))]
def ding(ms):
    n = int(SR * ms / 1000)
    return [(math.sin(2 * math.pi * 1760 * i / SR) + .45 * math.sin(2 * math.pi * 2637 * i / SR)) * math.exp(-i / (SR * .18)) * min(1, i / 60) for i in range(n)]
CAL = {
    "move": flick(34),
    "scroll": flick(22, 3000, 8000),
    "select": mix(thud(150, 80, 22), [v * .25 for v in flick(20, 1500, 5000)]),
    "cancel": mix(thud(110, 90, 26), [v * .2 for v in flick(26, 900, 3000)]),
    "done": rip(420),
    "track": mix(shape(band(noise(10), 3000, 9000), 0.3, 2), thud(900, 14, 3)),
    "untrack": shape(band(noise(70), 600, 2500), 4, 18),
    "undo": swish(170, rising=True),
    "open": swish(260),
    "close": thud(95, 110, 30),
    "alert": ding(320) + silence(80) + ding(420),
}
# ---------- Departure board: split-flap leaves and the terminal chime ----------
def flap(gain=1.0, body=1400):
    return [v * gain for v in mix(shape(band(noise(7), 1800, 9000), .2, 1.3), [v * .7 for v in thud(body, 14, 2.6)])]
def gap(ms): return silence(ms)
def cascade(n, first_ms, last_ms, body=1400):
    out = []
    for i in range(n):
        out += flap(.6 + .4 * random.random(), body + random.uniform(-120, 120))
        out += gap(first_ms + (last_ms - first_ms) * i / max(1, n - 1))
    return out
def bell(f, ms, decay=.42):
    n = int(SR * ms / 1000)
    return [(math.sin(2 * math.pi * f * i / SR) + .32 * math.sin(2 * math.pi * f * 2.76 * i / SR) * math.exp(-i / (SR * .06))
             + .12 * math.sin(2 * math.pi * f * 5.4 * i / SR) * math.exp(-i / (SR * .03))) * math.exp(-i / (SR * decay)) * min(1, i / 90) for i in range(n)]
def chime(*notes, step=230, ring=700):
    out = []
    for k, f in enumerate(notes):
        out = mix(out, silence(k * step) + bell(f, ring))
    return out
BOARD = {
    "move": flap(),
    "scroll": flap(.55, 1700),
    "select": flap() + gap(28) + flap(.8),
    "cancel": flap(1.0, 900),
    "done": cascade(12, 18, 46),
    "track": flap() + gap(20) + flap(.7, 2100),
    "untrack": flap(.7, 2100) + gap(20) + flap(1.0, 1000),
    "undo": cascade(4, 34, 22, 1100),
    "open": chime(880, 1109, 659, step=210, ring=760),
    "close": chime(1109, 740, step=170, ring=520),
    "alert": chime(880, 1109, 1319, 880, step=200, ring=620),
}
# ---------- Soft cards: rounded pops and a small marimba ----------
def blip(f0, f1, ms, decay_ms):
    n = int(SR * ms / 1000); ph = 0.0; out = []
    for i in range(n):
        f = f0 + (f1 - f0) * min(1, i / (SR * .04)); ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * math.exp(-i / (SR * decay_ms / 1000)) * min(1, i / 30))
    return out
def mallet(f, ms=320):
    n = int(SR * ms / 1000)
    return [(math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (SR * .16)) + .5 * math.sin(2 * math.pi * f * 4 * i / SR) * math.exp(-i / (SR * .018)))
            * min(1, i / 25) for i in range(n)]
def notes(*fs, step=95, ms=320):
    out = []
    for k, f in enumerate(fs):
        out = mix(out, silence(k * step) + mallet(f, ms))
    return out
SOFT = {
    "move": [v * .55 for v in blip(1250, 950, 26, 9)],
    "scroll": [v * .4 for v in blip(1400, 1100, 18, 6)],
    "select": blip(620, 940, 70, 26),
    "cancel": blip(700, 420, 80, 28),
    "done": notes(659, 988, step=105, ms=420),
    "track": blip(880, 1180, 40, 12) + silence(28) + blip(880, 1180, 40, 12),
    "untrack": blip(760, 560, 40, 12) + silence(28) + blip(760, 560, 40, 12),
    "undo": blip(420, 760, 90, 30),
    "open": notes(523, 659, 784, step=80, ms=300),
    "close": notes(784, 523, step=90, ms=260),
    "alert": notes(784, 988, 784, 988, step=150, ms=300),
}
# ---------- Standard: quiet system ticks ----------
def tock(f, ms, decay_ms):
    n = int(SR * ms / 1000)
    return mix([math.sin(2 * math.pi * f * i / SR) * math.exp(-i / (SR * decay_ms / 1000)) * min(1, i / 12) for i in range(n)],
               [v * .25 for v in shape(band(noise(4), 2500, 9000), .1, .6)])
def glass(f, ms=420):
    n = int(SR * ms / 1000)
    return [(math.sin(2 * math.pi * f * i / SR) + .35 * math.sin(2 * math.pi * f * 2.41 * i / SR) * math.exp(-i / (SR * .05)))
            * math.exp(-i / (SR * .11)) * min(1, i / 18) for i in range(n)]
def boop(f, ms=170):
    n = int(SR * ms / 1000)
    return [(math.sin(2 * math.pi * f * i / SR) + .2 * math.sin(2 * math.pi * f * 1.5 * i / SR)) * math.sin(math.pi * i / n) ** .6 for i in range(n)]
MAC = {
    "move": [v * .35 for v in tock(1900, 14, 3)],
    "scroll": [v * .25 for v in tock(2200, 10, 2)],
    "select": tock(1150, 40, 9),
    "cancel": tock(760, 44, 10),
    "done": glass(1975),
    "track": tock(1500, 26, 6) + silence(34) + tock(1500, 26, 6),
    "untrack": tock(1100, 26, 6) + silence(34) + tock(900, 26, 6),
    "undo": tock(900, 30, 7) + silence(16) + tock(1300, 30, 7),
    "open": [v * .7 for v in tock(1300, 34, 8)],
    "close": [v * .7 for v in tock(820, 38, 9)],
    "alert": boop(880) + silence(90) + boop(1175),
}
for key, pack, gain in (("board", BOARD, .55), ("soft", SOFT, .5), ("mac", MAC, .42)):
    (SOUNDS / key).mkdir(exist_ok=True)
    for name, x in pack.items(): write(SOUNDS / key / (name + ".wav"), x, gain if name not in ("move", "scroll") else gain * .8)
for name, x in LCD.items(): (SOUNDS / "lcd").mkdir(exist_ok=True); write(SOUNDS / "lcd" / (name + ".wav"), x, .32)
for name, x in CAL.items(): (SOUNDS / "calendar").mkdir(exist_ok=True); write(SOUNDS / "calendar" / (name + ".wav"), x, .6 if name not in ("select", "cancel", "close") else .7)
print("lcd:", len(LCD), "calendar:", len(CAL), "board:", len(BOARD), "soft:", len(SOFT), "mac:", len(MAC))
